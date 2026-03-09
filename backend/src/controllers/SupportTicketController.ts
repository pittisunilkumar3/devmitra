import { Request, Response } from 'express';
import SupportTicketModel from '../models/SupportTicket';
import type { ApiResponse, PaginatedResponse, CreateTicketInput, SupportTicket } from '../types';

interface TicketWithUser extends SupportTicket {
  user_name: string;
  user_email: string;
}

export class SupportTicketController {
  // GET /api/tickets (Admin - all tickets)
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const offset = (page - 1) * limit;
      let tickets: TicketWithUser[];
      let total: number;

      if (status) {
        tickets = await SupportTicketModel.findByStatus(status, limit, offset);
        total = await SupportTicketModel.count(status);
      } else {
        tickets = await SupportTicketModel.findAll(limit, offset);
        total = await SupportTicketModel.count();
      }

      const response: PaginatedResponse<TicketWithUser> = {
        success: true,
        data: tickets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get tickets error:', error);
      res.status(500).json({ success: false, error: 'Failed to get tickets' });
    }
  }

  // GET /api/tickets/my (User's tickets)
  static async getMyTickets(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const tickets = await SupportTicketModel.findByUserId(currentUser.id, limit, offset);
      const total = await SupportTicketModel.count();

      const response: PaginatedResponse<SupportTicket> = {
        success: true,
        data: tickets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get my tickets error:', error);
      res.status(500).json({ success: false, error: 'Failed to get tickets' });
    }
  }

  // GET /api/tickets/:id
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const ticket = await SupportTicketModel.findById(id);

      if (!ticket) {
        res.status(404).json({ success: false, error: 'Ticket not found' });
        return;
      }

      // Check access
      const currentUser = req.user!;
      if (currentUser.role !== 'superadmin' && ticket.user_id !== currentUser.id) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }

      // Get messages
      const includeInternal = currentUser.role === 'superadmin';
      const messages = await SupportTicketModel.getMessages(id, includeInternal);

      res.json({ success: true, data: { ...ticket, messages } });
    } catch (error) {
      console.error('Get ticket error:', error);
      res.status(500).json({ success: false, error: 'Failed to get ticket' });
    }
  }

  // POST /api/tickets (Create new ticket)
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const {
        subject,
        category,
        priority,
        related_booking_id,
        message,
      } = req.body;

      // Validation
      if (!subject || !category || !message) {
        res.status(400).json({ success: false, error: 'Subject, category, and message are required' });
        return;
      }

      const userRole = currentUser.role === 'developer' ? 'developer' : 'user';

      const input: CreateTicketInput = {
        user_id: currentUser.id,
        user_role: userRole,
        subject,
        category,
        priority,
        related_booking_id,
        message,
      };

      const ticketId = await SupportTicketModel.create(input);

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: { ticket_id: ticketId },
      });
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({ success: false, error: 'Failed to create ticket' });
    }
  }

  // PUT /api/tickets/:id/status (Update ticket status)
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!['open', 'in_progress', 'waiting_reply', 'resolved', 'closed'].includes(status)) {
        res.status(400).json({ success: false, error: 'Invalid status' });
        return;
      }

      const ticket = await SupportTicketModel.findById(id);
      if (!ticket) {
        res.status(404).json({ success: false, error: 'Ticket not found' });
        return;
      }

      const affected = await SupportTicketModel.updateStatus(id, status);
      if (affected === 0) {
        res.status(400).json({ success: false, error: 'No changes made' });
        return;
      }

      res.json({ success: true, message: 'Ticket status updated' });
    } catch (error) {
      console.error('Update ticket status error:', error);
      res.status(500).json({ success: false, error: 'Failed to update ticket status' });
    }
  }

  // PUT /api/tickets/:id/priority (Update ticket priority)
  static async updatePriority(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { priority } = req.body;

      if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
        res.status(400).json({ success: false, error: 'Invalid priority' });
        return;
      }

      const affected = await SupportTicketModel.updatePriority(id, priority);
      if (affected === 0) {
        res.status(400).json({ success: false, error: 'No changes made' });
        return;
      }

      res.json({ success: true, message: 'Ticket priority updated' });
    } catch (error) {
      console.error('Update ticket priority error:', error);
      res.status(500).json({ success: false, error: 'Failed to update ticket priority' });
    }
  }

  // PUT /api/tickets/:id/assign (Assign ticket to admin)
  static async assign(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { assigned_to } = req.body;

      if (!assigned_to) {
        res.status(400).json({ success: false, error: 'Assigned to is required' });
        return;
      }

      const affected = await SupportTicketModel.assign(id, assigned_to);
      if (affected === 0) {
        res.status(400).json({ success: false, error: 'No changes made' });
        return;
      }

      res.json({ success: true, message: 'Ticket assigned successfully' });
    } catch (error) {
      console.error('Assign ticket error:', error);
      res.status(500).json({ success: false, error: 'Failed to assign ticket' });
    }
  }

  // POST /api/tickets/:id/messages (Add message to ticket)
  static async addMessage(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user!;
      const { message, attachments, is_internal } = req.body;

      if (!message) {
        res.status(400).json({ success: false, error: 'Message is required' });
        return;
      }

      const ticket = await SupportTicketModel.findById(id);
      if (!ticket) {
        res.status(404).json({ success: false, error: 'Ticket not found' });
        return;
      }

      // Check access
      if (currentUser.role !== 'superadmin' && ticket.user_id !== currentUser.id) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }

      const senderRole = currentUser.role === 'superadmin' ? 'superadmin' : 
                        currentUser.role === 'developer' ? 'developer' : 'user';

      const messageId = await SupportTicketModel.addMessage(
        id,
        currentUser.id,
        senderRole,
        message,
        attachments,
        is_internal && currentUser.role === 'superadmin'
      );

      // Update ticket status to waiting_reply if admin replied
      if (currentUser.role === 'superadmin') {
        await SupportTicketModel.updateStatus(id, 'waiting_reply');
      }

      res.status(201).json({
        success: true,
        message: 'Message added successfully',
        data: { id: messageId },
      });
    } catch (error) {
      console.error('Add message error:', error);
      res.status(500).json({ success: false, error: 'Failed to add message' });
    }
  }

  // GET /api/tickets/stats
  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await SupportTicketModel.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Get ticket stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
  }
}

export default SupportTicketController;
