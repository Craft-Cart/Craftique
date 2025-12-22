import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/schemas';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refresh);
router.post('/password/forgot', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.get('/verify', authController.verify);

// Protected routes
router.post('/logout', authController.logout);

export default router;

