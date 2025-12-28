import axios from 'axios';
import { config } from '../config/env';
import { UserRepository } from '../repositories/user.repository';
import { ConflictError, AuthenticationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';

export class AuthService {
  private userRepository: UserRepository;
  private managementTokenCache: { token: string; expiresAt: number } | null = null;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Validate and normalize role string to UserRole enum
   */
  private normalizeRole(role: string | undefined | null): UserRole {
    if (!role) return UserRole.customer;
    
    const normalized = role.toLowerCase().trim();
    const validRoles: UserRole[] = [UserRole.customer, UserRole.moderator, UserRole.admin];
    
    // Check if normalized role is a valid enum value
    if (validRoles.includes(normalized as UserRole)) {
      return normalized as UserRole;
    }
    
    // Default to customer if invalid
    return UserRole.customer;
  }

  async login(email: string, password: string) {
    try {
      // Authenticate with Auth0
      // NOTE: Password grant is deprecated by Auth0 but still supported for legacy applications
      // For new implementations, consider using OAuth Authorization Code flow instead
      // This endpoint is kept for API clients and backward compatibility
      const response = await axios.post(
        `https://${config.auth0.domain}/oauth/token`,
        {
          client_id: config.auth0.clientId,
          client_secret: config.auth0.clientSecret,
          audience: config.auth0.audience,
          grant_type: 'password', // ⚠️ Deprecated - consider migrating to OAuth flow
          username: email,
          password: password,
          scope: 'openid profile email',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { access_token, refresh_token, expires_in, id_token } = response.data;

      // Get user info from Auth0
      const userInfo = await axios.get(
        `https://${config.auth0.domain}/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const auth0Id = userInfo.data.sub;

      // Get role from JWT token claims first (most reliable if Auth0 is configured)
      // Then fallback to Management API
      let roleString: string | undefined = undefined;
      let permissions: string[] = [];
      
       // First, try to decode access_token or id_token to get roles from JWT claims
       const jwt = require('jsonwebtoken');

       // Log for debugging
       logger.info('Starting login role retrieval');
      
      // Try access_token first (might have custom claims)
      try {
        const decodedAccessToken = jwt.decode(access_token);
        if (decodedAccessToken) {
          roleString = decodedAccessToken['https://craftique-api/roles']?.[0] ||
                       decodedAccessToken['https://yourstore.com/role'] ||
                       decodedAccessToken['https://auth0.com/roles']?.[0] ||
                       decodedAccessToken.role;
          permissions = decodedAccessToken['https://yourstore.com/permissions'] || 
                       decodedAccessToken['https://auth0.com/permissions'] ||
                       decodedAccessToken.permissions || 
                       [];
        }
      } catch (e) {
        // Continue to try id_token
      }
      
      // Try id_token if access_token didn't have role
      if (!roleString && id_token) {
        try {
          const decodedIdToken = jwt.decode(id_token);
          if (decodedIdToken) {
            roleString = decodedIdToken['https://craftique-api/roles']?.[0] ||
                         decodedIdToken['https://yourstore.com/role'] ||
                         decodedIdToken['https://auth0.com/roles']?.[0] ||
                         decodedIdToken.role;
            permissions = decodedIdToken['https://yourstore.com/permissions'] || 
                         decodedIdToken['https://auth0.com/permissions'] ||
                         decodedIdToken.permissions || 
                         permissions;
          }
        } catch (e) {
          // Continue to Management API
        }
      }
      
      // If role not found in token, try Management API
      if (!roleString) {
        try {
          const managementToken = await this.getAuth0ManagementToken();
          const userDetails = await axios.get(
            `https://${config.auth0.domain}/api/v2/users/${encodeURIComponent(auth0Id)}`,
            {
              headers: {
                Authorization: `Bearer ${managementToken}`,
              },
            }
          );

          // Check app_metadata first (preferred for roles)
          const appMetadata = userDetails.data.app_metadata || {};
          const userMetadata = userDetails.data.user_metadata || {};
          
          roleString = appMetadata.role || 
                      userMetadata.role || 
                      appMetadata['https://yourstore.com/role'] ||
                      userMetadata['https://yourstore.com/role'];
          
          if (!permissions.length) {
            permissions = appMetadata.permissions || 
                         userMetadata.permissions ||
                         appMetadata['https://yourstore.com/permissions'] ||
                         userMetadata['https://yourstore.com/permissions'] ||
                         [];
          }

          // Also check if role is in Auth0 roles (if using Auth0's built-in roles)
          if (userDetails.data.roles && userDetails.data.roles.length > 0) {
            // Map Auth0 roles to our roles
            const auth0Role = userDetails.data.roles[0].toLowerCase();
            if (['admin', 'moderator', 'customer'].includes(auth0Role)) {
              roleString = auth0Role;
            }
          }
          
          logger.info('Retrieved role from Management API', { auth0Id, role: roleString });
        } catch (metadataError: any) {
          logger.warn('Failed to get user metadata from Management API', {
            error: metadataError.message,
            status: metadataError.response?.status,
            auth0Id,
          });
          // Role will remain undefined and default to 'customer'
        }
      } else {
        logger.info('Retrieved role from JWT token', { auth0Id, role: roleString });
      }

      // Normalize role to UserRole enum
      const role = this.normalizeRole(roleString);
      logger.info('Normalized role', { auth0Id, original: roleString, normalized: role });

      // Find or create user in database using upsert to avoid duplicate creation
      // This handles cases where user was created by register() or verifyToken()
      const user = await this.userRepository.upsertByAuth0Id(
        auth0Id,
        {
          auth0_id: auth0Id,
          email: userInfo.data.email,
          email_verified: userInfo.data.email_verified || false,
          name: userInfo.data.name || userInfo.data.email.split('@')[0],
          role: role,
          permissions: permissions,
        },
        {
          last_login: new Date(),
          // Update role and permissions from Auth0 token if they changed
          role: role,
          permissions: permissions,
          email_verified: userInfo.data.email_verified || false,
          name: userInfo.data.name || undefined,
        }
      );

      return {
        access_token,
        refresh_token,
        token_type: 'Bearer',
        expires_in,
        user,
      };
    } catch (error: any) {
      logger.error('Login failed', { 
        error: error.message, 
        email,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      
      if (error.response?.status === 401) {
        throw new AuthenticationError('Invalid email or password');
      }
      
      if (error.response?.status === 403) {
        throw new AuthenticationError('Access forbidden. Password grant might be disabled in Auth0. Check Auth0 application settings.');
      }
      
      throw new AuthenticationError(`Authentication failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  async register(email: string, password: string, name: string, phone?: string) {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Create user in Auth0
      const response = await axios.post(
        `https://${config.auth0.domain}/api/v2/users`,
        {
          email,
          password,
          name,
          phone_number: phone,
          connection: 'Username-Password-Authentication',
          email_verified: false,
        },
        {
          headers: {
            'Authorization': `Bearer ${await this.getAuth0ManagementToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const auth0UserId = response.data.user_id;

      // Create user in database
      await this.userRepository.create({
        auth0_id: auth0UserId,
        email,
        email_verified: false,
        name,
        phone,
        role: 'customer',
        permissions: [],
      });

      // Login the user
      return this.login(email, password);
    } catch (error: any) {
      logger.error('Registration failed', { error: error.message, email });
      
      if (error.response?.status === 409) {
        throw new ConflictError('User with this email already exists');
      }
      
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const response = await axios.post(
        `https://${config.auth0.domain}/oauth/token`,
        {
          grant_type: 'refresh_token',
          client_id: config.auth0.clientId,
          client_secret: config.auth0.clientSecret,
          refresh_token: refreshToken,
        }
      );

      return {
        access_token: response.data.access_token,
        token_type: 'Bearer',
        expires_in: response.data.expires_in,
      };
    } catch (error: any) {
      logger.error('Token refresh failed', { error: error.message });
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    try {
      await axios.post(
        `https://${config.auth0.domain}/dbconnections/change_password`,
        {
          client_id: config.auth0.clientId,
          email,
          connection: 'Username-Password-Authentication',
        }
      );

      return { message: 'Password reset email sent' };
    } catch (error: any) {
      logger.error('Password reset request failed', { error: error.message, email });
      // Don't reveal if email exists or not
      return { message: 'If the email exists, a password reset link has been sent' };
    }
  }

  async verifyToken(token: string) {
    try {
      const jwt = require('jsonwebtoken');
      const jwksClient = require('jwks-rsa');

      const client = jwksClient({
        jwksUri: `https://${config.auth0.domain}/.well-known/jwks.json`,
      });

      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(
          token,
          (header: any, callback: any) => {
            client.getSigningKey(header.kid, (err: any, key: any) => {
              if (err) return callback(err);
              callback(null, key.getPublicKey());
            });
          },
          {
            audience: config.auth0.audience,
            issuer: config.auth0.issuer,
            algorithms: ['RS256'],
          },
          (err: any, decoded: any) => {
            if (err) reject(err);
            else resolve(decoded);
          }
        );
      });

      const decodedToken = decoded as any;
      const auth0Id = decodedToken.sub;

      // Log token claims for debugging
      logger.info('Decoded token claims', { claims: decodedToken });

      // Get role from JWT token claims first (most reliable if Auth0 is configured)
      // Then fallback to Management API
      let roleString: string | undefined = undefined;
      let permissions: string[] = [];

      // First, try to get role from decoded token (from verifyToken)
      roleString = decodedToken['https://craftique-api/roles']?.[0] ||
                   decodedToken['https://yourstore.com/role'] ||
                   decodedToken['https://auth0.com/roles']?.[0] ||
                   decodedToken.role;

      permissions = decodedToken['https://craftique-api/permissions'] ||
                    decodedToken['https://yourstore.com/permissions'] ||
                    decodedToken.permissions || [];

      // If role not found in token, try Management API
      if (!roleString) {
        try {
          const managementToken = await this.getAuth0ManagementToken();
          const userDetails = await axios.get(
            `https://${config.auth0.domain}/api/v2/users/${encodeURIComponent(auth0Id)}`,
            {
              headers: {
                Authorization: `Bearer ${managementToken}`,
              },
            }
          );

          // Check app_metadata first (preferred for roles)
          const appMetadata = userDetails.data.app_metadata || {};
          const userMetadata = userDetails.data.user_metadata || {};

          roleString = appMetadata.role ||
                       userMetadata.role ||
                       appMetadata['https://yourstore.com/role'] ||
                       userMetadata['https://yourstore.com/role'];

          if (!permissions.length) {
            permissions = appMetadata.permissions ||
                          userMetadata.permissions ||
                          appMetadata['https://yourstore.com/permissions'] ||
                          userMetadata['https://yourstore.com/permissions'] ||
                          [];
          }

          // Also check if role is in Auth0 roles (if using Auth0's built-in roles)
          if (userDetails.data.roles && userDetails.data.roles.length > 0) {
            // Map Auth0 roles to our roles
            const auth0Role = userDetails.data.roles[0].toLowerCase();
            if (['admin', 'moderator', 'customer'].includes(auth0Role)) {
              roleString = auth0Role;
            }
          }

          logger.info('Retrieved role from Management API', { auth0Id, role: roleString });
        } catch (metadataError: any) {
          logger.warn('Failed to get user metadata from Management API', {
            error: metadataError.message,
            status: metadataError.response?.status,
            auth0Id,
          });
          // Role will remain undefined and default to 'customer'
        }
      } else {
        logger.info('Retrieved role from JWT token', { auth0Id, role: roleString });
      }

      // Normalize role to UserRole enum
      const role = this.normalizeRole(roleString);

      // Get user from database or create if doesn't exist (auto-sync)
      // Use upsert to handle race conditions gracefully
      let user = await this.userRepository.findByAuth0Id(auth0Id);

      if (!user) {
        // Auto-create user if they don't exist (from frontend Auth0 login)
        // Get user info from Auth0 to populate user data
        try {
          const userInfo = await axios.get(
            `https://${config.auth0.domain}/userinfo`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          logger.info('User info from Auth0', { userInfo: userInfo.data });

          // Use upsert to avoid race condition - creates if doesn't exist, updates if exists
          user = await this.userRepository.upsertByAuth0Id(
            auth0Id,
            {
              auth0_id: auth0Id,
              email: userInfo.data.email,
              email_verified: userInfo.data.email_verified || false,
              name: userInfo.data.name || userInfo.data.email?.split('@')[0] || 'User',
              role: role,
              permissions: permissions,
            },
            {
              last_login: new Date(),
              // Update role and permissions from Auth0 token if they changed
              role: role,
              permissions: permissions,
              email_verified: userInfo.data.email_verified || false,
              name: userInfo.data.name || undefined,
            }
          );

          logger.info('Synced user from Auth0 token', { auth0Id, email: userInfo.data.email });
        } catch (syncError: any) {
          logger.error('Failed to sync user from token', { 
            error: syncError.message, 
            auth0Id 
          });
          throw new AuthenticationError('User not found and could not be synced');
        }
      } else {
        // Update last login and sync role/permissions for existing users
        await this.userRepository.update(user.id, {
          last_login: new Date(),
          role: role,
          permissions: permissions,
        });
      }

      return {
        valid: true,
        user,
        token_claims: decodedToken,
      };
    } catch (error: any) {
      logger.error('Token verification failed', { error: error.message });
      throw new AuthenticationError('Invalid token');
    }
  }

  // Social login methods
  async getSocialAuthUrl(provider: string, redirectUri?: string) {
    const baseUrl = redirectUri || `${config.apiBaseUrl}/auth/callback`;
    
    const authUrls = {
      google: `https://${config.auth0.domain}/authorize?` +
        `response_type=code&` +
        `client_id=${config.auth0.clientId}&` +
        `redirect_uri=${encodeURIComponent(baseUrl)}&` +
        `scope=openid profile email&` +
        `connection=google-oauth2&` +
        `state=${this.generateState()}`,
      
      facebook: `https://${config.auth0.domain}/authorize?` +
        `response_type=code&` +
        `client_id=${config.auth0.clientId}&` +
        `redirect_uri=${encodeURIComponent(baseUrl)}&` +
        `scope=openid profile email&` +
        `connection=facebook&` +
        `state=${this.generateState()}`,
    };

    const authUrl = authUrls[provider as keyof typeof authUrls];
    if (!authUrl) {
      throw new Error(`Unsupported social provider: ${provider}`);
    }

    return {
      auth_url: authUrl,
      provider,
    };
  }

  async handleSocialCallback(provider: string, code: string, _state: string) {
    try {
      // Exchange authorization code for tokens
      const tokenResponse = await axios.post(
        `https://${config.auth0.domain}/oauth/token`,
        {
          grant_type: 'authorization_code',
          client_id: config.auth0.clientId,
          client_secret: config.auth0.clientSecret,
          code,
          redirect_uri: `${config.apiBaseUrl}/auth/callback`,
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Get user info from Auth0
      const userInfo = await axios.get(
        `https://${config.auth0.domain}/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      // Find or create user in database
      let user = await this.userRepository.findByAuth0Id(userInfo.data.sub);
      
      if (!user) {
        // Create user if doesn't exist
        user = await this.userRepository.create({
          auth0_id: userInfo.data.sub,
          email: userInfo.data.email,
          email_verified: userInfo.data.email_verified || false,
          name: userInfo.data.name || userInfo.data.nickname || userInfo.data.email.split('@')[0],
          role: 'customer',
          permissions: [],
        });
      } else {
        // Update last login
        await this.userRepository.updateLastLogin(user.id);
      }

      return {
        access_token,
        refresh_token,
        token_type: 'Bearer',
        expires_in,
        user,
      };
    } catch (error: any) {
      logger.error('Social callback failed', { error: error.message, provider });
      throw new AuthenticationError('Social authentication failed');
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const response = await axios.post(
        `https://${config.auth0.domain}/dbconnections/change_password`,
        {
          client_id: config.auth0.clientId,
          email: token, // In a real implementation, this would be user's email
          password: newPassword,
          connection: 'Username-Password-Authentication',
        }
      );

      console.log('Password reset response:', response.data);
      return { message: 'Password reset successfully' };
    } catch (error: any) {
      logger.error('Password reset failed', { error: error.message });
      throw new AuthenticationError('Password reset failed');
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private async getAuth0ManagementToken(): Promise<string> {
    // Check if cached token is still valid (tokens typically expire in 24 hours)
    // Use 23 hours as expiration to be safe
    const now = Date.now();
    const expirationBuffer = 23 * 60 * 60 * 1000; // 23 hours in milliseconds

    if (
      this.managementTokenCache &&
      now < this.managementTokenCache.expiresAt - expirationBuffer
    ) {
      return this.managementTokenCache.token;
    }

    // Fetch new token
    const response = await axios.post(
      `https://${config.auth0.domain}/oauth/token`,
      {
        client_id: config.auth0.clientId,
        client_secret: config.auth0.clientSecret,
        audience: `https://${config.auth0.domain}/api/v2/`,
        grant_type: 'client_credentials',
      }
    );

    const token = response.data.access_token;
    const expiresIn = response.data.expires_in || 86400; // Default to 24 hours if not provided

    // Cache the token
    this.managementTokenCache = {
      token,
      expiresAt: now + expiresIn * 1000, // Convert seconds to milliseconds
    };

    logger.info('Refreshed Auth0 Management API token');
    return token;
  }
}

