import { query, queryOne, insert, execute } from '../config/database';
import type { User, CreateUserInput, UpdateUserInput } from '../types';
import bcrypt from 'bcryptjs';

export class UserModel {
  static tableName = 'users';

  // Find all users
  static async findAll(limit = 20, offset = 0): Promise<User[]> {
    return query<User>(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  // Find user by ID
  static async findById(id: number): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM ${this.tableName} WHERE email = ?`,
      [email]
    );
  }

  // Find users by role
  static async findByRole(role: string, limit = 20, offset = 0): Promise<User[]> {
    return query<User>(
      `SELECT * FROM ${this.tableName} WHERE role = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [role, limit, offset]
    );
  }

  // Find users by status
  static async findByStatus(status: string, limit = 20, offset = 0): Promise<User[]> {
    return query<User>(
      `SELECT * FROM ${this.tableName} WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );
  }

  // Create new user
  static async create(data: CreateUserInput): Promise<number> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return insert(
      `INSERT INTO ${this.tableName} (email, password, name, role, status, email_verified) VALUES (?, ?, ?, ?, 'active', FALSE)`,
      [data.email, hashedPassword, data.name, data.role]
    );
  }

  // Update user
  static async update(id: number, data: UpdateUserInput): Promise<number> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.profile_image !== undefined) {
      fields.push('profile_image = ?');
      values.push(data.profile_image);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Update password
  static async updatePassword(id: number, newPassword: string): Promise<number> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return execute(
      `UPDATE ${this.tableName} SET password = ? WHERE id = ?`,
      [hashedPassword, id]
    );
  }

  // Set reset token
  static async setResetToken(id: number, token: string, expiry: Date): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} SET reset_token = ?, reset_token_expiry = ? WHERE id = ?`,
      [token, expiry, id]
    );
  }

  // Find user by reset token
  static async findByResetToken(token: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM ${this.tableName} WHERE reset_token = ? AND reset_token_expiry > NOW()`,
      [token]
    );
  }

  // Clear reset token
  static async clearResetToken(id: number): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} SET reset_token = NULL, reset_token_expiry = NULL WHERE id = ?`,
      [id]
    );
  }

  // Verify email
  static async verifyEmail(id: number): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} SET email_verified = TRUE WHERE id = ?`,
      [id]
    );
  }

  // Delete user
  static async delete(id: number): Promise<number> {
    return execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  // Count users
  static async count(role?: string): Promise<number> {
    const result = await queryOne<{ count: number }>(
      role
        ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE role = ?`
        : `SELECT COUNT(*) as count FROM ${this.tableName}`,
      role ? [role] : []
    );
    return result?.count || 0;
  }

  // Get stats
  static async getStats(): Promise<{ total: number; active: number; inactive: number; blocked: number }> {
    const result = await queryOne<{
      total: number;
      active: number;
      inactive: number;
      blocked: number;
    }>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
      FROM ${this.tableName} WHERE role != 'superadmin'`
    );
    return result || { total: 0, active: 0, inactive: 0, blocked: 0 };
  }

  // Verify password
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    if (!user.password) return false;
    return bcrypt.compare(password, user.password);
  }

  // Create or find Google user
  static async findOrCreateGoogleUser(googleId: string, email: string, name: string): Promise<User> {
    let user = await queryOne<User>(
      `SELECT * FROM ${this.tableName} WHERE google_id = ? OR email = ?`,
      [googleId, email]
    );

    if (!user) {
      const id = await insert(
        `INSERT INTO ${this.tableName} (email, name, role, status, google_id, email_verified) VALUES (?, ?, 'user', 'active', ?, TRUE)`,
        [email, name, googleId]
      );
      user = await this.findById(id);
    } else if (!user.google_id) {
      await execute(
        `UPDATE ${this.tableName} SET google_id = ?, email_verified = TRUE WHERE id = ?`,
        [googleId, user.id]
      );
      user = await this.findById(user.id);
    }

    return user!;
  }
}

export default UserModel;
