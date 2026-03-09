import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import developerRoutes from './developer.routes';
import bookingRoutes from './booking.routes';
import ticketRoutes from './ticket.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Developer routes
router.use('/developers', developerRoutes);

// Booking routes
router.use('/bookings', bookingRoutes);

// Support ticket routes
router.use('/tickets', ticketRoutes);

export default router;
