import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller';
import { verifyJWT } from '../middleware/auth';

const router = Router();
const wishlistController = new WishlistController();

// All routes require authentication
router.use(verifyJWT);

router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addToWishlist);
router.delete('/:wishlist_id', wishlistController.removeFromWishlist);

export default router;