import { Request, Response } from 'express';
import { BookingModel, MilestoneModel } from '../models';
import DeveloperModel from '../models/Developer';
import type { ApiResponse, PaginatedResponse, CreateBookingInput, Booking } from '../types';

interface BookingWithDetails extends Booking {
  user_name: string;
  user_email: string;
  developer_name: string;
  developer_email: string;
}

export class BookingController {
  // GET /api/bookings (Admin - all bookings)
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const offset = (page - 1) * limit;
      let bookings: BookingWithDetails[];
      let total: number;

      if (status) {
        bookings = await BookingModel.findByStatus(status, limit, offset);
        total = await BookingModel.count(status);
      } else {
        bookings = await BookingModel.findAll(limit, offset);
        total = await BookingModel.count();
      }

      const response: PaginatedResponse<BookingWithDetails> = {
        success: true,
        data: bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ success: false, error: 'Failed to get bookings' });
    }
  }

  // GET /api/bookings/my (User's or Developer's bookings)
  static async getMyBookings(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      let bookings: BookingWithDetails[];
      let total: number;

      if (currentUser.role === 'developer') {
        // Get developer's bookings
        const developer = await DeveloperModel.findByUserId(currentUser.id);
        if (!developer) {
          res.status(404).json({ success: false, error: 'Developer profile not found' });
          return;
        }
        bookings = await BookingModel.findByDeveloperId(developer.id, limit, offset);
        total = await BookingModel.count();
      } else {
        // Get user's bookings
        bookings = await BookingModel.findByUserId(currentUser.id, limit, offset);
        total = await BookingModel.count();
      }

      const response: PaginatedResponse<BookingWithDetails> = {
        success: true,
        data: bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get my bookings error:', error);
      res.status(500).json({ success: false, error: 'Failed to get bookings' });
    }
  }

  // GET /api/bookings/:id
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const booking = await BookingModel.findById(id);

      if (!booking) {
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      // Check access
      const currentUser = req.user!;
      if (currentUser.role !== 'superadmin' && 
          booking.user_id !== currentUser.id) {
        // Check if user is the developer
        const developer = await DeveloperModel.findByUserId(currentUser.id);
        if (!developer || developer.id !== booking.developer_id) {
          res.status(403).json({ success: false, error: 'Forbidden' });
          return;
        }
      }

      res.json({ success: true, data: booking });
    } catch (error) {
      console.error('Get booking error:', error);
      res.status(500).json({ success: false, error: 'Failed to get booking' });
    }
  }

  // POST /api/bookings (Create new booking)
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const {
        developer_id,
        project_title,
        project_description,
        project_type,
        budget,
        deadline,
        priority,
      } = req.body;

      // Validation
      if (!developer_id || !project_title || !budget) {
        res.status(400).json({ success: false, error: 'Developer ID, project title, and budget are required' });
        return;
      }

      // Check if developer exists and is approved
      const developer = await DeveloperModel.findById(developer_id);
      if (!developer) {
        res.status(404).json({ success: false, error: 'Developer not found' });
        return;
      }

      if (developer.approval_status !== 'approved') {
        res.status(400).json({ success: false, error: 'Developer is not approved yet' });
        return;
      }

      const input: CreateBookingInput = {
        user_id: currentUser.id,
        developer_id,
        project_title,
        project_description,
        project_type,
        budget,
        deadline: deadline ? new Date(deadline) : undefined,
        priority,
      };

      const bookingId = await BookingModel.create(input);

      // Log history
      await BookingModel.logHistory(
        (await BookingModel.findByBookingId(bookingId))!.id,
        'created',
        currentUser.id,
        null,
        'pending',
        'Booking created'
      );

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: { booking_id: bookingId },
      });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ success: false, error: 'Failed to create booking' });
    }
  }

  // PUT /api/bookings/:id (Update booking - Admin only)
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { status, admin_notes, payment_status } = req.body;

      const booking = await BookingModel.findById(id);
      if (!booking) {
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      const oldStatus = booking.status;
      const affected = await BookingModel.update(id, { status, admin_notes, payment_status });

      if (affected === 0) {
        res.status(400).json({ success: false, error: 'No changes made' });
        return;
      }

      // Log history
      await BookingModel.logHistory(
        id,
        'updated',
        req.user!.id,
        oldStatus,
        status || oldStatus,
        admin_notes
      );

      res.json({ success: true, message: 'Booking updated successfully' });
    } catch (error) {
      console.error('Update booking error:', error);
      res.status(500).json({ success: false, error: 'Failed to update booking' });
    }
  }

  // PUT /api/bookings/:id/accept (Developer accepts booking)
  static async accept(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user!;

      const booking = await BookingModel.findById(id);
      if (!booking) {
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      // Verify the developer owns this booking
      const developer = await DeveloperModel.findByUserId(currentUser.id);
      if (!developer || developer.id !== booking.developer_id) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }

      const affected = await BookingModel.accept(id);
      if (affected === 0) {
        res.status(400).json({ success: false, error: 'Booking cannot be accepted' });
        return;
      }

      // Log history
      await BookingModel.logHistory(id, 'accepted', currentUser.id, 'pending', 'accepted', 'Booking accepted by developer');

      res.json({ success: true, message: 'Booking accepted successfully' });
    } catch (error) {
      console.error('Accept booking error:', error);
      res.status(500).json({ success: false, error: 'Failed to accept booking' });
    }
  }

  // PUT /api/bookings/:id/decline (Developer declines booking)
  static async decline(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user!;

      const booking = await BookingModel.findById(id);
      if (!booking) {
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      // Verify the developer owns this booking
      const developer = await DeveloperModel.findByUserId(currentUser.id);
      if (!developer || developer.id !== booking.developer_id) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }

      const affected = await BookingModel.decline(id);
      if (affected === 0) {
        res.status(400).json({ success: false, error: 'Booking cannot be declined' });
        return;
      }

      // Log history
      await BookingModel.logHistory(id, 'declined', currentUser.id, 'pending', 'cancelled', 'Booking declined by developer');

      res.json({ success: true, message: 'Booking declined' });
    } catch (error) {
      console.error('Decline booking error:', error);
      res.status(500).json({ success: false, error: 'Failed to decline booking' });
    }
  }

  // PUT /api/bookings/:id/complete (Mark booking as complete)
  static async complete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const booking = await BookingModel.findById(id);

      if (!booking) {
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      const affected = await BookingModel.complete(id);
      if (affected === 0) {
        res.status(400).json({ success: false, error: 'Booking cannot be completed' });
        return;
      }

      // Log history
      await BookingModel.logHistory(id, 'completed', req.user!.id, booking.status, 'completed', 'Booking marked as complete');

      res.json({ success: true, message: 'Booking completed successfully' });
    } catch (error) {
      console.error('Complete booking error:', error);
      res.status(500).json({ success: false, error: 'Failed to complete booking' });
    }
  }

  // GET /api/bookings/stats
  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await BookingModel.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Get booking stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
  }

  // Milestone endpoints

  // GET /api/bookings/:id/milestones
  static async getMilestones(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = parseInt(req.params.id);
      const milestones = await MilestoneModel.findByBookingId(bookingId);
      res.json({ success: true, data: milestones });
    } catch (error) {
      console.error('Get milestones error:', error);
      res.status(500).json({ success: false, error: 'Failed to get milestones' });
    }
  }

  // POST /api/bookings/:id/milestones
  static async createMilestone(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = parseInt(req.params.id);
      const { title, description, amount, due_date } = req.body;

      if (!title || !amount) {
        res.status(400).json({ success: false, error: 'Title and amount are required' });
        return;
      }

      const milestoneId = await MilestoneModel.create({
        booking_id: bookingId,
        title,
        description,
        amount,
        due_date: due_date ? new Date(due_date) : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Milestone created successfully',
        data: { id: milestoneId },
      });
    } catch (error) {
      console.error('Create milestone error:', error);
      res.status(500).json({ success: false, error: 'Failed to create milestone' });
    }
  }

  // PUT /api/bookings/:id/milestones/:milestoneId
  static async updateMilestoneStatus(req: Request, res: Response): Promise<void> {
    try {
      const milestoneId = parseInt(req.params.milestoneId);
      const { status } = req.body;

      if (!['pending', 'in_progress', 'completed', 'approved'].includes(status)) {
        res.status(400).json({ success: false, error: 'Invalid status' });
        return;
      }

      const affected = await MilestoneModel.updateStatus(milestoneId, status);
      if (affected === 0) {
        res.status(400).json({ success: false, error: 'Milestone not found' });
        return;
      }

      res.json({ success: true, message: 'Milestone status updated' });
    } catch (error) {
      console.error('Update milestone error:', error);
      res.status(500).json({ success: false, error: 'Failed to update milestone' });
    }
  }
}

export default BookingController;
