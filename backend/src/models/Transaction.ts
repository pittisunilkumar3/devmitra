import { query, queryOne, insert, execute } from '../config/database';
import type { Transaction } from '../types';

export class TransactionModel {
  static tableName = 'transactions';

  // Find all transactions
  static async findAll(limit = 20, offset = 0): Promise<Transaction[]> {
    return query<Transaction>(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  // Find transaction by ID
  static async findById(id: number): Promise<Transaction | null> {
    return queryOne<Transaction>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }

  // Find transactions by booking ID
  static async findByBookingId(bookingId: number): Promise<Transaction[]> {
    return query<Transaction>(
      `SELECT * FROM ${this.tableName} WHERE booking_id = ? ORDER BY created_at DESC`,
      [bookingId]
    );
  }

  // Find transactions by user ID
  static async findByUserId(userId: number, limit = 20, offset = 0): Promise<Transaction[]> {
    return query<Transaction>(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
  }

  // Find transactions by developer ID
  static async findByDeveloperId(developerId: number, limit = 20, offset = 0): Promise<Transaction[]> {
    return query<Transaction>(
      `SELECT * FROM ${this.tableName} WHERE developer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [developerId, limit, offset]
    );
  }

  // Create transaction
  static async create(data: {
    booking_id: number;
    user_id: number;
    developer_id: number;
    amount: number;
    platform_fee: number;
    payment_id?: string;
    payment_gateway?: string;
  }): Promise<number> {
    return insert(
      `INSERT INTO ${this.tableName} (booking_id, user_id, developer_id, amount, platform_fee, status, payment_id, payment_gateway)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [data.booking_id, data.user_id, data.developer_id, data.amount, data.platform_fee, data.payment_id || null, data.payment_gateway || null]
    );
  }

  // Update transaction status
  static async updateStatus(id: number, status: 'pending' | 'completed' | 'refunded'): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} SET status = ? WHERE id = ?`,
      [status, id]
    );
  }

  // Get total earnings for developer
  static async getDeveloperEarnings(developerId: number): Promise<{ total: number; pending: number; completed: number }> {
    const result = await queryOne<{
      total: number;
      pending: number;
      completed: number;
    }>(
      `SELECT 
        COALESCE(SUM(amount - platform_fee), 0) as total,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount - platform_fee ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount - platform_fee ELSE 0 END), 0) as completed
      FROM ${this.tableName} WHERE developer_id = ?`,
      [developerId]
    );
    return result || { total: 0, pending: 0, completed: 0 };
  }

  // Get platform revenue
  static async getPlatformRevenue(): Promise<{ total: number; pending: number; completed: number }> {
    const result = await queryOne<{
      total: number;
      pending: number;
      completed: number;
    }>(
      `SELECT 
        COALESCE(SUM(platform_fee), 0) as total,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN platform_fee ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN platform_fee ELSE 0 END), 0) as completed
      FROM ${this.tableName}`
    );
    return result || { total: 0, pending: 0, completed: 0 };
  }

  // Count transactions
  static async count(): Promise<number> {
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    return result?.count || 0;
  }
}

export default TransactionModel;
