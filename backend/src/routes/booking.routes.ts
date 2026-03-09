import { Router } from 'express';
import BookingController from '../controllers/BookingController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/bookings/stats
router.get('/stats', requireAdmin, BookingController.getStats);

// GET /api/bookings/my (user's or developer's bookings)
router.get('/my', BookingController.getMyBookings);

// GET /api/bookings (admin only - all bookings)
router.get('/', requireAdmin, BookingController.getAll);

// POST /api/bookings (create new booking)
router.post('/', BookingController.create);

// GET /api/bookings/:id
router.get('/:id', BookingController.getById);

// PUT /api/bookings/:id (admin only)
router.put('/:id', requireAdmin, BookingController.update);

// PUT /api/bookings/:id/accept (developer accepts)
router.put('/:id/accept', BookingController.accept);

// PUT /api/bookings/:id/decline (developer declines)
router.put('/:id/decline', BookingController.decline);

// PUT /api/bookings/:id/complete
router.put('/:id/complete', BookingController.complete);

// Milestone routes
// GET /api/bookings/:id/milestones
router.get('/:id/milestones', BookingController.getMilestones);

// POST /api/bookings/:id/milestones
router.post('/:id/milestones', BookingController.createMilestone);

// PUT /api/bookings/:id/milestones/:milestoneId
router.put('/:id/milestones/:milestoneId', BookingController.updateMilestoneStatus);

export default router;
