import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

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
      return res.json(result);
    } catch (error) {
      return next(error);
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
      return res.json(user);
    } catch (error) {
      return next(error);
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
      return res.status(201).json(user);
    } catch (error) {
      return next(error);
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
      return res.json(user);
    } catch (error) {
      return next(error);
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

  getModerators = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.userService.getUsers({ role: 'moderator' });
      res.json(result.users);
    } catch (error) {
      next(error);
    }
  };

  createModerator = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name } = req.body;
      const user = await this.userService.createUser({
        email,
        name,
        role: 'moderator',
      });
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  updateModerator = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moderator_id } = req.params;
      // Update permissions logic would go here
      const user = await this.userService.getUserById(moderator_id);
      return res.json(user);
    } catch (error) {
      return next(error);
    }
  };

  deleteModerator = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moderator_id } = req.params;
      // Change role to customer instead of deleting
      await this.userService.updateUserAdmin(moderator_id, { role: 'customer' });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getAdmins = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.userService.getUsers({ role: 'admin' });
      res.json(result.users);
    } catch (error) {
      next(error);
    }
  };

  createAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name } = req.body;
      const user = await this.userService.createUser({
        email,
        name,
        role: 'admin',
      });
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  deleteAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { admin_id } = req.params;
      // Change role to customer instead of deleting
      await this.userService.updateUserAdmin(admin_id, { role: 'customer' });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

