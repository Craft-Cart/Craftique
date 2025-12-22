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

router.get('/', userController.getModerators);
router.post('/', validateBody(createUserSchema), userController.createModerator);
router.put(
  '/:moderator_id',
  validateParams(userParamsSchema),
  validateBody(createUserSchema.partial()),
  userController.updateModerator
);
router.delete(
  '/:moderator_id',
  validateParams(userParamsSchema),
  userController.deleteModerator
);

export default router;

