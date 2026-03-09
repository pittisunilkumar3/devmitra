import { query, queryOne, insert, execute } from '../config/database';
import type { Developer, CreateDeveloperInput, UpdateDeveloperInput } from '../types';

interface DeveloperWithUser extends Developer {
  user_name: string;
  user_email: string;
  profile_image: string | null;
}

export class DeveloperModel {
  static tableName = 'developers';

  // Find all developers
  static async findAll(limit = 20, offset = 0): Promise<DeveloperWithUser[]> {
    return query<DeveloperWithUser>(
      `SELECT d.*, u.name as user_name, u.email as user_email, u.profile_image
       FROM ${this.tableName} d
       JOIN users u ON d.user_id = u.id
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  // Find developer by ID
  static async findById(id: number): Promise<Developer | null> {
    return queryOne<Developer>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }

  // Find developer by user ID
  static async findByUserId(userId: number): Promise<Developer | null> {
    return queryOne<Developer>(
      `SELECT * FROM ${this.tableName} WHERE user_id = ?`,
      [userId]
    );
  }

  // Find developers by approval status
  static async findByStatus(
    status: 'pending' | 'approved' | 'rejected',
    limit = 20,
    offset = 0
  ): Promise<DeveloperWithUser[]> {
    return query<DeveloperWithUser>(
      `SELECT d.*, u.name as user_name, u.email as user_email, u.profile_image
       FROM ${this.tableName} d
       JOIN users u ON d.user_id = u.id
       WHERE d.approval_status = ?
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );
  }

  // Find approved developers (for browsing)
  static async findApproved(limit = 20, offset = 0, filters?: {
    skills?: string[];
    minRate?: number;
    maxRate?: number;
    availability?: boolean;
  }): Promise<DeveloperWithUser[]> {
    let sql = `SELECT d.*, u.name as user_name, u.email as user_email, u.profile_image
               FROM ${this.tableName} d
               JOIN users u ON d.user_id = u.id
               WHERE d.approval_status = 'approved'`;
    const params: unknown[] = [];

    if (filters?.skills && filters.skills.length > 0) {
      sql += ` AND JSON_OVERLAPS(d.skills, ?)`;
      params.push(JSON.stringify(filters.skills));
    }

    if (filters?.minRate !== undefined) {
      sql += ` AND d.hourly_rate >= ?`;
      params.push(filters.minRate);
    }

    if (filters?.maxRate !== undefined) {
      sql += ` AND d.hourly_rate <= ?`;
      params.push(filters.maxRate);
    }

    if (filters?.availability !== undefined) {
      sql += ` AND d.availability = ?`;
      params.push(filters.availability);
    }

    sql += ` ORDER BY d.rating DESC, d.total_projects DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return query<DeveloperWithUser>(sql, params);
  }

  // Create developer profile
  static async create(data: CreateDeveloperInput): Promise<number> {
    return insert(
      `INSERT INTO ${this.tableName} (
        user_id, skills, experience, hourly_rate, availability, bio,
        phone, country, timezone, job_title, weekly_hours,
        github_url, linkedin_url, other_urls, portfolio, approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        data.user_id,
        JSON.stringify(data.skills),
        data.experience || 0,
        data.hourly_rate,
        data.availability ?? true,
        data.bio || null,
        data.phone || null,
        data.country || null,
        data.timezone || null,
        data.job_title || null,
        data.weekly_hours || 40,
        data.github_url || null,
        data.linkedin_url || null,
        data.other_urls ? JSON.stringify(data.other_urls) : null,
        data.portfolio || null,
      ]
    );
  }

  // Update developer profile
  static async update(id: number, data: UpdateDeveloperInput): Promise<number> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.skills !== undefined) {
      fields.push('skills = ?');
      values.push(JSON.stringify(data.skills));
    }
    if (data.experience !== undefined) {
      fields.push('experience = ?');
      values.push(data.experience);
    }
    if (data.hourly_rate !== undefined) {
      fields.push('hourly_rate = ?');
      values.push(data.hourly_rate);
    }
    if (data.availability !== undefined) {
      fields.push('availability = ?');
      values.push(data.availability);
    }
    if (data.bio !== undefined) {
      fields.push('bio = ?');
      values.push(data.bio);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.country !== undefined) {
      fields.push('country = ?');
      values.push(data.country);
    }
    if (data.timezone !== undefined) {
      fields.push('timezone = ?');
      values.push(data.timezone);
    }
    if (data.job_title !== undefined) {
      fields.push('job_title = ?');
      values.push(data.job_title);
    }
    if (data.weekly_hours !== undefined) {
      fields.push('weekly_hours = ?');
      values.push(data.weekly_hours);
    }
    if (data.github_url !== undefined) {
      fields.push('github_url = ?');
      values.push(data.github_url);
    }
    if (data.linkedin_url !== undefined) {
      fields.push('linkedin_url = ?');
      values.push(data.linkedin_url);
    }
    if (data.other_urls !== undefined) {
      fields.push('other_urls = ?');
      values.push(JSON.stringify(data.other_urls));
    }
    if (data.portfolio !== undefined) {
      fields.push('portfolio = ?');
      values.push(data.portfolio);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Approve developer
  static async approve(id: number, approvedBy: number): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} 
       SET approval_status = 'approved', approved_by = ?, approved_at = NOW(), rejected_reason = NULL
       WHERE id = ?`,
      [approvedBy, id]
    );
  }

  // Reject developer
  static async reject(id: number, reason: string): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} 
       SET approval_status = 'rejected', rejected_reason = ?, rejection_count = rejection_count + 1
       WHERE id = ?`,
      [reason, id]
    );
  }

  // Re-approve rejected developer
  static async reapprove(id: number, approvedBy: number): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} 
       SET approval_status = 'approved', approved_by = ?, approved_at = NOW(), rejected_reason = NULL
       WHERE id = ?`,
      [approvedBy, id]
    );
  }

  // Update rating
  static async updateRating(id: number): Promise<void> {
    await execute(
      `UPDATE ${this.tableName} d
       SET rating = (
         SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.developer_id = d.id
       ),
       total_projects = (
         SELECT COUNT(*) FROM bookings b WHERE b.developer_id = d.id AND b.status = 'completed'
       )
       WHERE id = ?`,
      [id]
    );
  }

  // Delete developer
  static async delete(id: number): Promise<number> {
    return execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  // Count developers
  static async count(status?: string): Promise<number> {
    const result = await queryOne<{ count: number }>(
      status
        ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE approval_status = ?`
        : `SELECT COUNT(*) as count FROM ${this.tableName}`,
      status ? [status] : []
    );
    return result?.count || 0;
  }

  // Get stats
  static async getStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const result = await queryOne<{
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    }>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM ${this.tableName}`
    );
    return result || { total: 0, pending: 0, approved: 0, rejected: 0 };
  }
}

export default DeveloperModel;
