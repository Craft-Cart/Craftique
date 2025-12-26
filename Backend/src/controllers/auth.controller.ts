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
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      // Set tokens in HttpOnly cookies
      setAuthCookie(res, result.access_token, result.refresh_token);

      res.json({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        token_type: result.token_type,
        expires_in: result.expires_in,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name, phone } = req.body;
      const result = await this.authService.register(email, password, name, phone);

      // Set tokens in HttpOnly cookies
      setAuthCookie(res, result.access_token, result.refresh_token);

      res.status(201).json({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        token_type: result.token_type,
        expires_in: result.expires_in,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.body.refresh_token || req.cookies?.refresh_token;
      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token required' });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      // Update access token cookie
      setAuthCookie(res, result.access_token);

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  logout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      clearAuthCookies(res);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };

  verify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.access_token || req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        res.status(401).json({ error: 'Token required' });
        return;
      }

      const result = await this.authService.verifyToken(token);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const result = await this.authService.forgotPassword(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  // Social login endpoints
  socialLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { provider, redirect_uri } = req.body;
      const result = await this.authService.getSocialAuthUrl(provider, redirect_uri);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  socialCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { provider, code, state } = req.query;
      const result = await this.authService.handleSocialCallback(
        provider as string,
        code as string,
        state as string
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, new_password } = req.body;
      const result = await this.authService.resetPassword(token, new_password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

