import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
} from '../validators/schemas';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refresh);
router.post('/password/forgot', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/password/reset', authController.resetPassword);
router.get('/verify', authController.verify);

// Social login routes
router.post('/social/login', authController.socialLogin);
router.get('/social/callback', authController.socialCallback);

// Protected routes
router.post('/logout', authController.logout);

export default router;

