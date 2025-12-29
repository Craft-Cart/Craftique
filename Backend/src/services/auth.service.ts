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
      console.log('[AuthService] login - Logging in user:', email);
      const response = await axios.post(
        `https://${config.auth0.domain}/oauth/token`,
        {
          client_id: config.auth0.clientId,
          client_secret: config.auth0.clientSecret,
          audience: config.auth0.audience,
          grant_type: 'password',
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

      const userInfo = await axios.get(
        `https://${config.auth0.domain}/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const auth0Id = userInfo.data.sub;

      let roleString: string | undefined = undefined;
      let permissions: string[] = [];

       const jwt = require('jsonwebtoken');

       logger.info('Starting login role retrieval');

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
      }

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
        }
      }

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

          if (userDetails.data.roles && userDetails.data.roles.length > 0) {
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
        }
      } else {
        logger.info('Retrieved role from JWT token', { auth0Id, role: roleString });
      }

      const role = this.normalizeRole(roleString);
      logger.info('Normalized role', { auth0Id, original: roleString, normalized: role });

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
          role: role,
          permissions: permissions,
          email_verified: userInfo.data.email_verified || false,
          name: userInfo.data.name || undefined,
        }
      );

      console.log('[AuthService] login - Login successful for user:', user.id);
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
      console.log('[AuthService] register - Registering user:', email);
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        console.log('[AuthService] register - User already exists');
        throw new ConflictError('User with this email already exists');
      }

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

      await this.userRepository.create({
        auth0_id: auth0UserId,
        email,
        email_verified: false,
        name,
        phone,
        role: 'customer',
        permissions: [],
      });

      console.log('[AuthService] register - User registered successfully');
      return this.login(email, password);
    } catch (error: any) {
      console.error('[AuthService] register - Registration failed:', error);
      logger.error('Registration failed', { error: error.message, email });

      if (error.response?.status === 409) {
        throw new ConflictError('User with this email already exists');
      }

      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      console.log('[AuthService] refreshToken - Refreshing token');
      const response = await axios.post(
        `https://${config.auth0.domain}/oauth/token`,
        {
          grant_type: 'refresh_token',
          client_id: config.auth0.clientId,
          client_secret: config.auth0.clientSecret,
          refresh_token: refreshToken,
        }
      );

      console.log('[AuthService] refreshToken - Token refreshed successfully');
      return {
        access_token: response.data.access_token,
        token_type: 'Bearer',
        expires_in: response.data.expires_in,
      };
    } catch (error: any) {
      console.error('[AuthService] refreshToken - Error:', error);
      logger.error('Token refresh failed', { error: error.message });
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    try {
      console.log('[AuthService] forgotPassword - Requesting password reset for email:', email);
      await axios.post(
        `https://${config.auth0.domain}/dbconnections/change_password`,
        {
          client_id: config.auth0.clientId,
          email,
          connection: 'Username-Password-Authentication',
        }
      );

      console.log('[AuthService] forgotPassword - Password reset email sent');
      return { message: 'Password reset email sent' };
    } catch (error: any) {
      console.error('[AuthService] forgotPassword - Error:', error);
      logger.error('Password reset request failed', { error: error.message, email });
      return { message: 'If the email exists, a password reset link has been sent' };
    }
  }

  async verifyToken(token: string) {
    try {
      console.log('[AuthService] verifyToken - Verifying token');
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

      logger.info('Decoded token claims', { claims: decodedToken });

      let roleString: string | undefined = undefined;
      let permissions: string[] = [];

      roleString = decodedToken['https://craftique-api/roles']?.[0] ||
                   decodedToken['https://yourstore.com/role'] ||
                   decodedToken['https://auth0.com/roles']?.[0] ||
                   decodedToken.role;

      permissions = decodedToken['https://craftique-api/permissions'] ||
                   decodedToken['https://yourstore.com/permissions'] ||
                   decodedToken.permissions || [];

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

          if (userDetails.data.roles && userDetails.data.roles.length > 0) {
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
        }
      } else {
        logger.info('Retrieved role from JWT token', { auth0Id, role: roleString });
      }

      const role = this.normalizeRole(roleString);

      let user = await this.userRepository.findByAuth0Id(auth0Id);

      if (!user) {
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
        await this.userRepository.update(user.id, {
          last_login: new Date(),
          role: role,
          permissions: permissions,
        });
      }

      console.log('[AuthService] verifyToken - Token verified for user:', user.id);
      return {
        valid: true,
        user,
        token_claims: decodedToken,
      };
    } catch (error: any) {
      console.error('[AuthService] verifyToken - Error:', error);
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

