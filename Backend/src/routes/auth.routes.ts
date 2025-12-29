import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  socialLoginSchema,
  logoutSchema,
} from '../validators/schemas';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refresh);
router.post('/password/forgot', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/password/reset', validateBody(resetPasswordSchema), authController.resetPassword);
router.get('/verify', authController.verify);

// Social login routes
router.post('/social/login', validateBody(socialLoginSchema), authController.socialLogin);
router.get('/social/callback', authController.socialCallback);

// Protected routes
router.post('/logout', validateBody(logoutSchema), authController.logout);

export default router;

