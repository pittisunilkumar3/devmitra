import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../config/database';
import type { User, AuthRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User & {
        developer_id?: number;
        approval_status?: 'pending' | 'approved' | 'rejected';
      };
    }
  }
}

// Verify JWT token middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header or cookie
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.cookies) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    if (!decoded?.userId) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    // Get user from database
    const user = await queryOne<User & { developer_id?: number; approval_status?: 'pending' | 'approved' | 'rejected' }>(
      `SELECT u.id, u.email, u.password, u.name, u.role, u.status, u.profile_image, u.google_id, u.email_verified, u.reset_token, u.reset_token_expiry, u.created_at, u.updated_at,
              d.id as developer_id, d.approval_status
       FROM users u
       LEFT JOIN developers d ON u.id = d.user_id
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    if (user.status === 'blocked') {
      res.status(403).json({ success: false, error: 'Your account has been blocked' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Require specific role middleware
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    next();
  };
};

// Require admin role
export const requireAdmin = requireRole('superadmin');

// Require developer role
export const requireDeveloper = requireRole('developer');

// Require user role
export const requireUser = requireRole('user');

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.cookies) {
      token = req.cookies.auth_token;
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      
      if (decoded?.userId) {
        const user = await queryOne<User>(
          `SELECT u.id, u.email, u.name, u.role, u.status, u.profile_image, u.google_id, u.email_verified, u.reset_token, u.reset_token_expiry, u.created_at, u.updated_at
           FROM users u WHERE u.id = ?`,
          [decoded.userId]
        );

        if (user && user.status !== 'blocked') {
          req.user = user;
        }
      }
    }
    
    next();
  } catch {
    // Continue without authentication
    next();
  }
};

// Check if developer is approved
export const requireApprovedDeveloper = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'developer') {
    res.status(403).json({ success: false, error: 'Only developers can access this resource' });
    return;
  }

  const userWithDeveloper = req.user as User & { developer_id?: number; approval_status?: string };
  
  if (userWithDeveloper.approval_status !== 'approved') {
    res.status(403).json({ success: false, error: 'Your developer profile is not approved yet' });
    return;
  }

  next();
};
