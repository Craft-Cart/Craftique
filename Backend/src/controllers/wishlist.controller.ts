import { Request, Response, NextFunction } from 'express';
import { WishlistService } from '../services/wishlist.service';

export class WishlistController {
  private wishlistService: WishlistService;

  constructor() {
    this.wishlistService = new WishlistService();
  }

  getWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[WishlistController] getWishlist - Request received');
      const userId = req.user?.id;
      if (!userId) {
        console.log('[WishlistController] getWishlist - Unauthorized: User ID missing');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const wishlist = await this.wishlistService.getWishlist(userId);
      console.log('[WishlistController] getWishlist - Retrieved', wishlist.length, 'wishlist items');
      res.json(wishlist);
    } catch (error) {
      console.error('[WishlistController] getWishlist - Error:', error);
      next(error);
    }
  };

  addToWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[WishlistController] addToWishlist - Request received');
      const userId = req.user?.id;
      const { item_id } = req.body;
      console.log('[WishlistController] addToWishlist - Adding item to wishlist:', item_id);

      if (!userId) {
        console.log('[WishlistController] addToWishlist - Unauthorized: User ID missing');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const wishlistItem = await this.wishlistService.addToWishlist(userId, item_id);
      console.log('[WishlistController] addToWishlist - Item added to wishlist');
      res.status(201).json(wishlistItem);
    } catch (error) {
      console.error('[WishlistController] addToWishlist - Error:', error);
      next(error);
    }
  };

  removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[WishlistController] removeFromWishlist - Request received');
      const userId = req.user?.id;
      const { wishlist_id } = req.params;
      console.log('[WishlistController] removeFromWishlist - Removing item from wishlist:', wishlist_id);

      if (!userId) {
        console.log('[WishlistController] removeFromWishlist - Unauthorized: User ID missing');
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.wishlistService.removeFromWishlist(userId, wishlist_id);
      console.log('[WishlistController] removeFromWishlist - Item removed from wishlist');
      res.status(204).send();
    } catch (error) {
      console.error('[WishlistController] removeFromWishlist - Error:', error);
      next(error);
    }
  };
}