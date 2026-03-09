import { Request, Response } from 'express';
import UserModel from '../models/User';
import type { ApiResponse, PaginatedResponse, User } from '../types';

export class UserController {
  // GET /api/users
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const role = req.query.role as string;
      const status = req.query.status as string;

      const offset = (page - 1) * limit;
      let users: User[];
      let total: number;

      if (role) {
        users = await UserModel.findByRole(role, limit, offset);
        total = await UserModel.count(role);
      } else if (status) {
        users = await UserModel.findByStatus(status, limit, offset);
        total = await UserModel.count();
      } else {
        users = await UserModel.findAll(limit, offset);
        total = await UserModel.count();
      }

      // Remove passwords from response
      const safeUsers = users.map(u => {
        const { password: _, ...safeUser } = u;
        return safeUser;
      });

      const response: PaginatedResponse<Omit<User, 'password'>> = {
        success: true,
        data: safeUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ success: false, error: 'Failed to get users' });
    }
  }

  // GET /api/users/:id
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = await UserModel.findById(id);

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      // Remove password
      const { password: _, ...safeUser } = user;

      res.json({ success: true, data: safeUser });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ success: false, error: 'Failed to get user' });
    }
  }

  // PUT /api/users/:id
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user!;

      // Only admin can update other users, users can update themselves
      if (currentUser.role !== 'superadmin' && currentUser.id !== id) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }

      const { name, profile_image, status } = req.body;

      // Only admin can update status
      const updateData: { name?: string; profile_image?: string; status?: 'active' | 'inactive' | 'blocked' } = {};
      if (name) updateData.name = name;
      if (profile_image) updateData.profile_image = profile_image;
      if (status && currentUser.role === 'superadmin') {
        updateData.status = status;
      }

      const affected = await UserModel.update(id, updateData);
      if (affected === 0) {
        res.status(400).json({ success: false, error: 'No changes made' });
        return;
      }

      const updatedUser = await UserModel.findById(id);
      const { password: _, ...safeUser } = updatedUser!;

      res.json({ success: true, message: 'User updated successfully', data: safeUser });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ success: false, error: 'Failed to update user' });
    }
  }

  // DELETE /api/users/:id
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = await UserModel.findById(id);

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      // Prevent deleting super admins
      if (user.role === 'superadmin') {
        res.status(403).json({ success: false, error: 'Cannot delete super admin' });
        return;
      }

      await UserModel.delete(id);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
  }

  // PUT /api/users/:id/block
  static async block(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = await UserModel.findById(id);

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      if (user.role === 'superadmin') {
        res.status(403).json({ success: false, error: 'Cannot block super admin' });
        return;
      }

      await UserModel.update(id, { status: 'blocked' });
      res.json({ success: true, message: 'User blocked successfully' });
    } catch (error) {
      console.error('Block user error:', error);
      res.status(500).json({ success: false, error: 'Failed to block user' });
    }
  }

  // PUT /api/users/:id/unblock
  static async unblock(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = await UserModel.findById(id);

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      await UserModel.update(id, { status: 'active' });
      res.json({ success: true, message: 'User unblocked successfully' });
    } catch (error) {
      console.error('Unblock user error:', error);
      res.status(500).json({ success: false, error: 'Failed to unblock user' });
    }
  }

  // GET /api/users/stats
  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await UserModel.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
  }
}

export default UserController;
