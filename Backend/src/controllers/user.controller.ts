import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { errorHandler } from '../utils/errors';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, role } = req.query;
      const result = await this.userService.getUsers({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        role: role as any,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.params;
      const user = await this.userService.getUserById(user_id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get internal user ID from auth0_id
      const user = await this.userService.getUserByAuth0Id(req.user.auth0_id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, phone, role } = req.body;
      const user = await this.userService.createUser({
        email,
        name,
        phone,
        role,
      });
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get internal user ID
      const internalUser = await this.userService.getUserByAuth0Id(req.user.auth0_id);
      const { name, phone, address } = req.body;
      const user = await this.userService.updateUser(internalUser.id, {
        name,
        phone,
        address,
      });
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  updateUserAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.params;
      const { name, email, phone, role, address } = req.body;
      const user = await this.userService.updateUserAdmin(user_id, {
        name,
        email,
        phone,
        role,
        address,
      });
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.params;
      await this.userService.deleteUser(user_id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

