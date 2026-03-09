import { query, queryOne, insert, execute } from '../config/database';
import type { Booking, CreateBookingInput, UpdateBookingInput, Milestone, CreateMilestoneInput } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface BookingWithDetails extends Booking {
  user_name: string;
  user_email: string;
  developer_name: string;
  developer_email: string;
}

export class BookingModel {
  static tableName = 'bookings';

  // Generate unique booking ID
  static generateBookingId(): string {
    const year = new Date().getFullYear();
    const random = uuidv4().split('-')[0].toUpperCase();
    return `BK-${year}-${random}`;
  }

  // Calculate platform fee (10%)
  static calculatePlatformFee(budget: number): { platformFee: number; developerEarnings: number } {
    const platformFee = Math.round(budget * 0.1 * 100) / 100;
    const developerEarnings = budget - platformFee;
    return { platformFee, developerEarnings };
  }

  // Find all bookings
  static async findAll(limit = 20, offset = 0): Promise<BookingWithDetails[]> {
    return query<BookingWithDetails>(
      `SELECT b.*, 
              u.name as user_name, u.email as user_email,
              du.name as developer_name, du.email as developer_email
       FROM ${this.tableName} b
       JOIN users u ON b.user_id = u.id
       JOIN developers d ON b.developer_id = d.id
       JOIN users du ON d.user_id = du.id
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  // Find booking by ID
  static async findById(id: number): Promise<Booking | null> {
    return queryOne<Booking>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }

  // Find booking by booking_id
  static async findByBookingId(bookingId: string): Promise<Booking | null> {
    return queryOne<Booking>(
      `SELECT * FROM ${this.tableName} WHERE booking_id = ?`,
      [bookingId]
    );
  }

  // Find bookings by user ID
  static async findByUserId(userId: number, limit = 20, offset = 0): Promise<BookingWithDetails[]> {
    return query<BookingWithDetails>(
      `SELECT b.*, 
              u.name as user_name, u.email as user_email,
              du.name as developer_name, du.email as developer_email
       FROM ${this.tableName} b
       JOIN users u ON b.user_id = u.id
       JOIN developers d ON b.developer_id = d.id
       JOIN users du ON d.user_id = du.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
  }

  // Find bookings by developer ID
  static async findByDeveloperId(developerId: number, limit = 20, offset = 0): Promise<BookingWithDetails[]> {
    return query<BookingWithDetails>(
      `SELECT b.*, 
              u.name as user_name, u.email as user_email,
              du.name as developer_name, du.email as developer_email
       FROM ${this.tableName} b
       JOIN users u ON b.user_id = u.id
       JOIN developers d ON b.developer_id = d.id
       JOIN users du ON d.user_id = du.id
       WHERE b.developer_id = ?
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [developerId, limit, offset]
    );
  }

  // Find bookings by status
  static async findByStatus(
    status: string,
    limit = 20,
    offset = 0
  ): Promise<BookingWithDetails[]> {
    return query<BookingWithDetails>(
      `SELECT b.*, 
              u.name as user_name, u.email as user_email,
              du.name as developer_name, du.email as developer_email
       FROM ${this.tableName} b
       JOIN users u ON b.user_id = u.id
       JOIN developers d ON b.developer_id = d.id
       JOIN users du ON d.user_id = du.id
       WHERE b.status = ?
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );
  }

  // Create booking
  static async create(data: CreateBookingInput): Promise<string> {
    const bookingId = this.generateBookingId();
    const { platformFee, developerEarnings } = this.calculatePlatformFee(data.budget);

    await insert(
      `INSERT INTO ${this.tableName} (
        booking_id, user_id, developer_id, status, project_title, project_description,
        project_type, budget, platform_fee, developer_earnings, deadline, priority, payment_status
      ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        bookingId,
        data.user_id,
        data.developer_id,
        data.project_title,
        data.project_description || null,
        data.project_type || null,
        data.budget,
        platformFee,
        developerEarnings,
        data.deadline || null,
        data.priority || 'medium',
      ]
    );

    return bookingId;
  }

  // Update booking
  static async update(id: number, data: UpdateBookingInput): Promise<number> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.admin_notes !== undefined) {
      fields.push('admin_notes = ?');
      values.push(data.admin_notes);
    }
    if (data.payment_status !== undefined) {
      fields.push('payment_status = ?');
      values.push(data.payment_status);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Accept booking (developer)
  static async accept(id: number): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} SET status = 'accepted', started_at = NOW() WHERE id = ? AND status = 'pending'`,
      [id]
    );
  }

  // Decline booking (developer)
  static async decline(id: number): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} SET status = 'cancelled', cancelled_at = NOW() WHERE id = ? AND status = 'pending'`,
      [id]
    );
  }

  // Start work (developer)
  static async startWork(id: number): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} SET status = 'in_progress', started_at = NOW() WHERE id = ? AND status = 'accepted'`,
      [id]
    );
  }

  // Complete booking
  static async complete(id: number): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} SET status = 'completed', completed_at = NOW() WHERE id = ?`,
      [id]
    );
  }

  // Cancel booking
  static async cancel(id: number, cancelledBy: number, reason: string): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} 
       SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = ?, cancellation_reason = ?
       WHERE id = ?`,
      [cancelledBy, reason, id]
    );
  }

  // Mark as disputed
  static async dispute(id: number): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} SET status = 'disputed' WHERE id = ?`,
      [id]
    );
  }

  // Count bookings
  static async count(status?: string): Promise<number> {
    const result = await queryOne<{ count: number }>(
      status
        ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = ?`
        : `SELECT COUNT(*) as count FROM ${this.tableName}`,
      status ? [status] : []
    );
    return result?.count || 0;
  }

  // Get stats
  static async getStats(): Promise<{
    total: number;
    pending: number;
    accepted: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    revenue: number;
  }> {
    const result = await queryOne<{
      total: number;
      pending: number;
      accepted: number;
      in_progress: number;
      completed: number;
      cancelled: number;
      revenue: number;
    }>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN budget ELSE 0 END), 0) as revenue
      FROM ${this.tableName}`
    );
    return result || { total: 0, pending: 0, accepted: 0, in_progress: 0, completed: 0, cancelled: 0, revenue: 0 };
  }

  // Log booking history
  static async logHistory(
    bookingId: number,
    action: string,
    performedBy: number,
    oldStatus: string | null,
    newStatus: string | null,
    notes?: string
  ): Promise<void> {
    await insert(
      `INSERT INTO booking_history (booking_id, action, performed_by, old_status, new_status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [bookingId, action, performedBy, oldStatus, newStatus, notes || null]
    );
  }
}

// Milestone Model
export class MilestoneModel {
  static tableName = 'booking_milestones';

  // Find all milestones for a booking
  static async findByBookingId(bookingId: number): Promise<Milestone[]> {
    return query<Milestone>(
      `SELECT * FROM ${this.tableName} WHERE booking_id = ? ORDER BY created_at ASC`,
      [bookingId]
    );
  }

  // Find milestone by ID
  static async findById(id: number): Promise<Milestone | null> {
    return queryOne<Milestone>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }

  // Create milestone
  static async create(data: CreateMilestoneInput): Promise<number> {
    return insert(
      `INSERT INTO ${this.tableName} (booking_id, title, description, amount, due_date, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [data.booking_id, data.title, data.description || null, data.amount, data.due_date || null]
    );
  }

  // Update milestone status
  static async updateStatus(
    id: number,
    status: 'pending' | 'in_progress' | 'completed' | 'approved'
  ): Promise<number> {
    if (status === 'completed' || status === 'approved') {
      return execute(
        `UPDATE ${this.tableName} SET status = ?, completed_at = NOW() WHERE id = ?`,
        [status, id]
      );
    }
    return execute(
      `UPDATE ${this.tableName} SET status = ?, completed_at = NULL WHERE id = ?`,
      [status, id]
    );
  }

  // Delete milestone
  static async delete(id: number): Promise<number> {
    return execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
  }
}

export default BookingModel;
