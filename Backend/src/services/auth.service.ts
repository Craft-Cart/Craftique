import axios from 'axios';
import { config } from '../config/env';
import { UserRepository } from '../repositories/user.repository';
import { ConflictError, AuthenticationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { randomBytes } from 'crypto';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(email: string, password: string) {
    try {
      // Authenticate with Auth0
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

      const { access_token, refresh_token, expires_in } = response.data;

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
          name: userInfo.data.name || userInfo.data.email.split('@')[0],
          role: userInfo.data['https://yourstore.com/role'] || 'customer',
          permissions: userInfo.data['https://yourstore.com/permissions'] || [],
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
      logger.error('Login failed', { error: error.message, email });
      
      if (error.response?.status === 401) {
        throw new AuthenticationError('Invalid email or password');
      }
      
      throw new AuthenticationError('Authentication failed');
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
      const user = await this.userRepository.create({
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

      // Get user from database
      const user = await this.userRepository.findByAuth0Id((decoded as any).sub);
      
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      return {
        valid: true,
        user,
        token_claims: decoded,
      };
    } catch (error: any) {
      logger.error('Token verification failed', { error: error.message });
      throw new AuthenticationError('Invalid token');
    }
  }

  private async getAuth0ManagementToken(): Promise<string> {
    // This should be cached in production
    const response = await axios.post(
      `https://${config.auth0.domain}/oauth/token`,
      {
        client_id: config.auth0.clientId,
        client_secret: config.auth0.clientSecret,
        audience: `https://${config.auth0.domain}/api/v2/`,
        grant_type: 'client_credentials',
      }
    );

    return response.data.access_token;
  }
}

