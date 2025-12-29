import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] getUsers - Request received');
      const { page, limit, role } = req.query;
      console.log('[UserController] getUsers - Query params:', { page, limit, role });
      const result = await this.userService.getUsers({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        role: role as any,
      });
      console.log('[UserController] getUsers - Retrieved', result.users?.length || 0, 'users');
      return res.json(result);
    } catch (error) {
      console.error('[UserController] getUsers - Error:', error);
      return next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] getUserById - Request received');
      const { user_id } = req.params;
      console.log('[UserController] getUserById - Fetching user with ID:', user_id);
      const user = await this.userService.getUserById(user_id);
      console.log('[UserController] getUserById - User retrieved:', user.name);
      res.json(user);
    } catch (error) {
      console.error('[UserController] getUserById - Error:', error);
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] getCurrentUser - Request received');
      if (!req.user) {
        console.log('[UserController] getCurrentUser - Unauthorized: User missing');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('[UserController] getCurrentUser - Fetching current user for auth0_id:', req.user.auth0_id);
      const user = await this.userService.getUserByAuth0Id(req.user.auth0_id);
      console.log('[UserController] getCurrentUser - Current user retrieved:', user.name);
      return res.json(user);
    } catch (error) {
      console.error('[UserController] getCurrentUser - Error:', error);
      return next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] createUser - Request received');
      const { email, name, phone, role } = req.body;
      console.log('[UserController] createUser - Creating user:', email, 'with role:', role);
      const user = await this.userService.createUser({
        email,
        name,
        phone,
        role,
      });
      console.log('[UserController] createUser - User created:', user.id);
      return res.status(201).json(user);
    } catch (error) {
      console.error('[UserController] createUser - Error:', error);
      return next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] updateUser - Request received');
      if (!req.user) {
        console.log('[UserController] updateUser - Unauthorized: User missing');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const internalUser = await this.userService.getUserByAuth0Id(req.user.auth0_id);
      const { name, phone, address } = req.body;
      console.log('[UserController] updateUser - Updating user:', internalUser.id);
      const user = await this.userService.updateUser(internalUser.id, {
        name,
        phone,
        address,
      });
      console.log('[UserController] updateUser - User updated');
      return res.json(user);
    } catch (error) {
      console.error('[UserController] updateUser - Error:', error);
      return next(error);
    }
  };

  updateUserAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] updateUserAdmin - Request received');
      const { user_id } = req.params;
      const { name, email, phone, role, address } = req.body;
      console.log('[UserController] updateUserAdmin - Admin updating user:', user_id);
      const user = await this.userService.updateUserAdmin(user_id, {
        name,
        email,
        phone,
        role,
        address,
      });
      console.log('[UserController] updateUserAdmin - User updated by admin');
      res.json(user);
    } catch (error) {
      console.error('[UserController] updateUserAdmin - Error:', error);
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] deleteUser - Request received');
      const { user_id } = req.params;
      console.log('[UserController] deleteUser - Deleting user:', user_id);
      await this.userService.deleteUser(user_id);
      console.log('[UserController] deleteUser - User deleted');
      res.status(204).send();
    } catch (error) {
      console.error('[UserController] deleteUser - Error:', error);
      next(error);
    }
  };

  getModerators = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] getModerators - Request received');
      const result = await this.userService.getUsers({ role: 'moderator' });
      console.log('[UserController] getModerators - Retrieved', result.users?.length || 0, 'moderators');
      res.json(result.users);
    } catch (error) {
      console.error('[UserController] getModerators - Error:', error);
      next(error);
    }
  };

  createModerator = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] createModerator - Request received');
      const { email, name } = req.body;
      console.log('[UserController] createModerator - Creating moderator:', email);
      const user = await this.userService.createUser({
        email,
        name,
        role: 'moderator',
      });
      console.log('[UserController] createModerator - Moderator created:', user.id);
      res.status(201).json(user);
    } catch (error) {
      console.error('[UserController] createModerator - Error:', error);
      next(error);
    }
  };

  updateModerator = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] updateModerator - Request received');
      const { moderator_id } = req.params;
      console.log('[UserController] updateModerator - Updating moderator:', moderator_id);
      const user = await this.userService.getUserById(moderator_id);
      console.log('[UserController] updateModerator - Moderator updated');
      return res.json(user);
    } catch (error) {
      console.error('[UserController] updateModerator - Error:', error);
      return next(error);
    }
  };

  deleteModerator = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] deleteModerator - Request received');
      const { moderator_id } = req.params;
      console.log('[UserController] deleteModerator - Changing moderator to customer:', moderator_id);
      await this.userService.updateUserAdmin(moderator_id, { role: 'customer' });
      console.log('[UserController] deleteModerator - Moderator role changed');
      res.status(204).send();
    } catch (error) {
      console.error('[UserController] deleteModerator - Error:', error);
      next(error);
    }
  };

  getAdmins = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] getAdmins - Request received');
      const result = await this.userService.getUsers({ role: 'admin' });
      console.log('[UserController] getAdmins - Retrieved', result.users?.length || 0, 'admins');
      res.json(result.users);
    } catch (error) {
      console.error('[UserController] getAdmins - Error:', error);
      next(error);
    }
  };

  createAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] createAdmin - Request received');
      const { email, name } = req.body;
      console.log('[UserController] createAdmin - Creating admin:', email);
      const user = await this.userService.createUser({
        email,
        name,
        role: 'admin',
      });
      console.log('[UserController] createAdmin - Admin created:', user.id);
      res.status(201).json(user);
    } catch (error) {
      console.error('[UserController] createAdmin - Error:', error);
      next(error);
    }
  };

  deleteAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[UserController] deleteAdmin - Request received');
      const { admin_id } = req.params;
      console.log('[UserController] deleteAdmin - Changing admin to customer:', admin_id);
      await this.userService.updateUserAdmin(admin_id, { role: 'customer' });
      console.log('[UserController] deleteAdmin - Admin role changed');
      res.status(204).send();
    } catch (error) {
      console.error('[UserController] deleteAdmin - Error:', error);
      next(error);
    }
  };
}

