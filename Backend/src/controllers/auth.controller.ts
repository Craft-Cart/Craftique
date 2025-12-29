import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { setAuthCookie, clearAuthCookies } from '../middleware/cookies';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AuthController] login - Request received');
      const { email, password } = req.body;
      console.log('[AuthController] login - Attempting login for email:', email);
      const result = await this.authService.login(email, password);

      console.log('[AuthController] login - Login successful for user:', result.user.id);
      setAuthCookie(res, result.access_token, result.refresh_token);

      res.json({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        token_type: result.token_type,
        expires_in: result.expires_in,
        user: result.user,
      });
    } catch (error) {
      console.error('[AuthController] login - Error:', error);
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AuthController] register - Request received');
      const { email, password, name, phone } = req.body;
      console.log('[AuthController] register - Registering user with email:', email);
      const result = await this.authService.register(email, password, name, phone);

      console.log('[AuthController] register - Registration successful for user:', result.user.id);
      setAuthCookie(res, result.access_token, result.refresh_token);

      res.status(201).json({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        token_type: result.token_type,
        expires_in: result.expires_in,
        user: result.user,
      });
    } catch (error) {
      console.error('[AuthController] register - Error:', error);
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AuthController] refresh - Request received');
      const refreshToken = req.body.refresh_token || req.cookies?.refresh_token;
      if (!refreshToken) {
        console.log('[AuthController] refresh - Refresh token missing');
        res.status(400).json({ error: 'Refresh token required' });
        return;
      }

      console.log('[AuthController] refresh - Refreshing access token');
      const result = await this.authService.refreshToken(refreshToken);

      console.log('[AuthController] refresh - Token refreshed successfully');
      setAuthCookie(res, result.access_token);

      res.json(result);
    } catch (error) {
      console.error('[AuthController] refresh - Error:', error);
      next(error);
    }
  };

  logout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AuthController] logout - Request received');
      clearAuthCookies(res);
      console.log('[AuthController] logout - Logout successful');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('[AuthController] logout - Error:', error);
      next(error);
    }
  };

  verify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AuthController] verify - Request received');
      const token = req.cookies?.access_token || req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        console.log('[AuthController] verify - Token missing');
        res.status(401).json({ error: 'Token required' });
        return;
      }

      console.log('[AuthController] verify - Verifying token');
      const result = await this.authService.verifyToken(token);
      console.log('[AuthController] verify - Token verified for user:', result.user.id);
      res.json(result);
    } catch (error) {
      console.error('[AuthController] verify - Error:', error);
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AuthController] forgotPassword - Request received');
      const { email } = req.body;
      console.log('[AuthController] forgotPassword - Processing forgot password for email:', email);
      const result = await this.authService.forgotPassword(email);
      console.log('[AuthController] forgotPassword - Password reset email sent');
      res.json(result);
    } catch (error) {
      console.error('[AuthController] forgotPassword - Error:', error);
      next(error);
    }
  };

  // Social login endpoints
  socialLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AuthController] socialLogin - Request received');
      const { provider, redirect_uri } = req.body;
      console.log('[AuthController] socialLogin - Getting social auth URL for provider:', provider);
      const result = await this.authService.getSocialAuthUrl(provider, redirect_uri);
      console.log('[AuthController] socialLogin - Social auth URL generated');
      res.json(result);
    } catch (error) {
      console.error('[AuthController] socialLogin - Error:', error);
      next(error);
    }
  };

  socialCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AuthController] socialCallback - Request received');
      const { provider, code, state } = req.query;
      console.log('[AuthController] socialCallback - Handling social callback for provider:', provider);
      const result = await this.authService.handleSocialCallback(
        provider as string,
        code as string,
        state as string
      );
      console.log('[AuthController] socialCallback - Social callback successful for user:', result.user?.id);
      res.json(result);
    } catch (error) {
      console.error('[AuthController] socialCallback - Error:', error);
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[AuthController] resetPassword - Request received');
      const { token, new_password } = req.body;
      console.log('[AuthController] resetPassword - Processing password reset');
      const result = await this.authService.resetPassword(token, new_password);
      console.log('[AuthController] resetPassword - Password reset successful');
      res.json(result);
    } catch (error) {
      console.error('[AuthController] resetPassword - Error:', error);
      next(error);
    }
  };
}

