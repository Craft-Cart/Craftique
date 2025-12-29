import { Request, Response, NextFunction } from 'express';
import { WishlistService } from '../services/wishlist.service';

export class WishlistController {
  private wishlistService: WishlistService;

  constructor() {
    this.wishlistService = new WishlistService();
  }

  getWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const wishlist = await this.wishlistService.getWishlist(userId);
      res.json(wishlist);
    } catch (error) {
      next(error);
    }
  };

  addToWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { item_id } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const wishlistItem = await this.wishlistService.addToWishlist(userId, item_id);
      res.status(201).json(wishlistItem);
    } catch (error) {
      next(error);
    }
  };

  removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { wishlist_id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.wishlistService.removeFromWishlist(userId, wishlist_id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}