import { query, queryOne, insert, execute } from '../config/database';
import type { Review, CreateReviewInput } from '../types';

export class ReviewModel {
  static tableName = 'reviews';

  // Find all reviews
  static async findAll(limit = 20, offset = 0): Promise<Review[]> {
    return query<Review>(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  // Find review by ID
  static async findById(id: number): Promise<Review | null> {
    return queryOne<Review>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }

  // Find reviews by developer ID
  static async findByDeveloperId(developerId: number, limit = 20, offset = 0): Promise<Review[]> {
    return query<Review>(
      `SELECT r.*, u.name as user_name FROM ${this.tableName} r
       JOIN users u ON r.user_id = u.id
       WHERE r.developer_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [developerId, limit, offset]
    );
  }

  // Find review by booking ID
  static async findByBookingId(bookingId: number): Promise<Review | null> {
    return queryOne<Review>(
      `SELECT * FROM ${this.tableName} WHERE booking_id = ?`,
      [bookingId]
    );
  }

  // Create review
  static async create(data: CreateReviewInput): Promise<number> {
    return insert(
      `INSERT INTO ${this.tableName} (booking_id, user_id, developer_id, rating, review)
       VALUES (?, ?, ?, ?, ?)`,
      [data.booking_id, data.user_id, data.developer_id, data.rating, data.review || null]
    );
  }

  // Update review
  static async update(id: number, data: { rating?: number; review?: string }): Promise<number> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.rating !== undefined) {
      fields.push('rating = ?');
      values.push(data.rating);
    }
    if (data.review !== undefined) {
      fields.push('review = ?');
      values.push(data.review);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Delete review
  static async delete(id: number): Promise<number> {
    return execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  // Get average rating for developer
  static async getAverageRating(developerId: number): Promise<number> {
    const result = await queryOne<{ avg: number }>(
      `SELECT AVG(rating) as avg FROM ${this.tableName} WHERE developer_id = ?`,
      [developerId]
    );
    return result?.avg || 0;
  }

  // Count reviews
  static async count(developerId?: number): Promise<number> {
    const result = await queryOne<{ count: number }>(
      developerId
        ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE developer_id = ?`
        : `SELECT COUNT(*) as count FROM ${this.tableName}`,
      developerId ? [developerId] : []
    );
    return result?.count || 0;
  }
}

export default ReviewModel;
