import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User';
import type { ApiResponse } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthController {
  // POST /api/auth/register
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      // Validation
      if (!name || !email || !password || !role) {
        res.status(400).json({ success: false, error: 'All fields are required' });
        return;
      }

      if (!['user', 'developer'].includes(role)) {
        res.status(400).json({ success: false, error: 'Invalid role' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
        return;
      }

      // Check if email exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(400).json({ success: false, error: 'Email already registered' });
        return;
      }

      // Create user
      const userId = await UserModel.create({ name, email, password, role });

      // Generate token
      const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // Set cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: { userId, token },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, error: 'Registration failed' });
    }
  }

  // POST /api/auth/login
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      // Check status
      if (user.status === 'blocked') {
        res.status(403).json({ success: false, error: 'Your account has been blocked. Please contact support.' });
        return;
      }

      // Verify password
      const isValid = await UserModel.verifyPassword(user, password);
      if (!isValid) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      // Generate token
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // Set cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  }

  // POST /api/auth/logout
  static async logout(_req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie('auth_token');
      res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, error: 'Logout failed' });
    }
  }

  // GET /api/auth/me
  static async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
          status: req.user.status,
          profile_image: req.user.profile_image,
        },
      });
    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({ success: false, error: 'Failed to get user' });
    }
  }

  // POST /api/auth/forgot-password
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ success: false, error: 'Email is required' });
        return;
      }

      const user = await UserModel.findByEmail(email);

      // Always return success to prevent email enumeration
      if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        await UserModel.setResetToken(user.id, resetToken, expiry);

        // TODO: Send email with reset link
        console.log(`Reset token for ${email}: ${resetToken}`);
      }

      res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ success: false, error: 'Failed to process request' });
    }
  }

  // POST /api/auth/reset-password
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({ success: false, error: 'Token and password are required' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
        return;
      }

      const user = await UserModel.findByResetToken(token);
      if (!user) {
        res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
        return;
      }

      await UserModel.updatePassword(user.id, password);
      await UserModel.clearResetToken(user.id);

      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ success: false, error: 'Failed to reset password' });
    }
  }
}

export default AuthController;
