import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { verifyJWT, requireRole } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createUserSchema,
  updateUserSchema,
  updateUserAdminSchema,
  userParamsSchema,
  userQuerySchema,
} from '../validators/schemas';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(verifyJWT);

// Current user routes
router.get('/me', userController.getCurrentUser);
router.put('/me', validateBody(updateUserSchema), userController.updateUser);

// Admin/Moderator routes
router.get(
  '/',
  requireRole('admin', 'moderator'),
  validateQuery(userQuerySchema),
  userController.getUsers
);
router.post(
  '/',
  requireRole('admin'),
  validateBody(createUserSchema),
  userController.createUser
);

// User by ID routes
router.get(
  '/:user_id',
  requireRole('admin', 'moderator'),
  validateParams(userParamsSchema),
  userController.getUserById
);
router.put(
  '/:user_id',
  requireRole('admin'),
  validateParams(userParamsSchema),
  validateBody(updateUserAdminSchema),
  userController.updateUserAdmin
);
router.delete(
  '/:user_id',
  requireRole('admin'),
  validateParams(userParamsSchema),
  userController.deleteUser
);

export default router;

