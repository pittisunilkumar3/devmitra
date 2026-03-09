import { query, queryOne, insert, execute } from '../config/database';
import type { SupportTicket, CreateTicketInput } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TicketWithUser extends SupportTicket {
  user_name: string;
  user_email: string;
}

interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_id: number;
  sender_role: 'user' | 'developer' | 'superadmin';
  sender_name: string;
  message: string;
  attachments: string[] | null;
  is_internal: boolean;
  created_at: Date;
}

export class SupportTicketModel {
  static tableName = 'support_tickets';

  // Generate unique ticket ID
  static generateTicketId(): string {
    const year = new Date().getFullYear();
    const random = uuidv4().split('-')[0].toUpperCase();
    return `TKT-${year}-${random}`;
  }

  // Find all tickets
  static async findAll(limit = 20, offset = 0): Promise<TicketWithUser[]> {
    return query<TicketWithUser>(
      `SELECT t.*, u.name as user_name, u.email as user_email
       FROM ${this.tableName} t
       JOIN users u ON t.user_id = u.id
       ORDER BY 
         CASE t.priority
           WHEN 'urgent' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           ELSE 4
         END,
         t.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
  }

  // Find ticket by ID
  static async findById(id: number): Promise<SupportTicket | null> {
    return queryOne<SupportTicket>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }

  // Find ticket by ticket_id
  static async findByTicketId(ticketId: string): Promise<SupportTicket | null> {
    return queryOne<SupportTicket>(
      `SELECT * FROM ${this.tableName} WHERE ticket_id = ?`,
      [ticketId]
    );
  }

  // Find tickets by user ID
  static async findByUserId(userId: number, limit = 20, offset = 0): Promise<SupportTicket[]> {
    return query<SupportTicket>(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
  }

  // Find tickets by status
  static async findByStatus(
    status: string,
    limit = 20,
    offset = 0
  ): Promise<TicketWithUser[]> {
    return query<TicketWithUser>(
      `SELECT t.*, u.name as user_name, u.email as user_email
       FROM ${this.tableName} t
       JOIN users u ON t.user_id = u.id
       WHERE t.status = ?
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [status, limit, offset]
    );
  }

  // Create ticket
  static async create(data: CreateTicketInput): Promise<string> {
    const ticketId = this.generateTicketId();

    await insert(
      `INSERT INTO ${this.tableName} (
        ticket_id, user_id, user_role, subject, category, priority, status, related_booking_id
      ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`,
      [
        ticketId,
        data.user_id,
        data.user_role,
        data.subject,
        data.category,
        data.priority || 'medium',
        data.related_booking_id || null,
      ]
    );

    // Add initial message
    const ticket = await this.findByTicketId(ticketId);
    if (ticket) {
      await this.addMessage(ticket.id, data.user_id, data.user_role, data.message);
    }

    return ticketId;
  }

  // Update ticket status
  static async updateStatus(
    id: number,
    status: 'open' | 'in_progress' | 'waiting_reply' | 'resolved' | 'closed'
  ): Promise<number> {
    if (status === 'resolved') {
      return execute(
        `UPDATE ${this.tableName} SET status = ?, resolved_at = NOW() WHERE id = ?`,
        [status, id]
      );
    }
    if (status === 'closed') {
      return execute(
        `UPDATE ${this.tableName} SET status = ?, closed_at = NOW() WHERE id = ?`,
        [status, id]
      );
    }
    return execute(
      `UPDATE ${this.tableName} SET status = ? WHERE id = ?`,
      [status, id]
    );
  }

  // Update ticket priority
  static async updatePriority(
    id: number,
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} SET priority = ? WHERE id = ?`,
      [priority, id]
    );
  }

  // Assign ticket
  static async assign(id: number, assignedTo: number): Promise<number> {
    return execute(
      `UPDATE ${this.tableName} SET assigned_to = ?, status = 'in_progress' WHERE id = ?`,
      [assignedTo, id]
    );
  }

  // Add message to ticket
  static async addMessage(
    ticketId: number,
    senderId: number,
    senderRole: 'user' | 'developer' | 'superadmin',
    message: string,
    attachments?: string[],
    isInternal = false
  ): Promise<number> {
    return insert(
      `INSERT INTO support_ticket_messages (ticket_id, sender_id, sender_role, message, attachments, is_internal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ticketId, senderId, senderRole, message, attachments ? JSON.stringify(attachments) : null, isInternal]
    );
  }

  // Get ticket messages
  static async getMessages(ticketId: number, includeInternal = false): Promise<TicketMessage[]> {
    const sql = includeInternal
      ? `SELECT m.*, u.name as sender_name
         FROM support_ticket_messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.ticket_id = ?
         ORDER BY m.created_at ASC`
      : `SELECT m.*, u.name as sender_name
         FROM support_ticket_messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.ticket_id = ? AND m.is_internal = FALSE
         ORDER BY m.created_at ASC`;

    return query<TicketMessage>(sql, [ticketId]);
  }

  // Count tickets
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
    open: number;
    inProgress: number;
    resolved: number;
  }> {
    const result = await queryOne<{
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
    }>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status IN ('in_progress', 'waiting_reply') THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved
      FROM ${this.tableName}`
    );
    return result || { total: 0, open: 0, inProgress: 0, resolved: 0 };
  }
}

export default SupportTicketModel;
