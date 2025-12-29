import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller';
import { verifyJWT } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { addToWishlistSchema, wishlistParamsSchema } from '../validators/schemas';

const router = Router();
const wishlistController = new WishlistController();

// All routes require authentication
router.use(verifyJWT);

router.get('/', wishlistController.getWishlist);
router.post('/', validateBody(addToWishlistSchema), wishlistController.addToWishlist);
router.delete('/:wishlist_id', validateParams(wishlistParamsSchema), wishlistController.removeFromWishlist);

export default router;