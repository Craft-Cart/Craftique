import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { verifyJWT, requireRole } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import {
  createUserSchema,
  userParamsSchema,
} from '../validators/schemas';

const router = Router();
const userController = new UserController();

// All routes require admin role
router.use(verifyJWT);
router.use(requireRole('admin'));

router.get('/', userController.getAdmins);
router.post('/', validateBody(createUserSchema), userController.createAdmin);
router.delete(
  '/:admin_id',
  validateParams(userParamsSchema),
  userController.deleteAdmin
);

export default router;

