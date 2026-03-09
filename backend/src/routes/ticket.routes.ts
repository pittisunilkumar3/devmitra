import { Router } from 'express';
import SupportTicketController from '../controllers/SupportTicketController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/tickets/stats (admin only)
router.get('/stats', requireAdmin, SupportTicketController.getStats);

// GET /api/tickets/my (user's tickets)
router.get('/my', SupportTicketController.getMyTickets);

// GET /api/tickets (admin only - all tickets)
router.get('/', requireAdmin, SupportTicketController.getAll);

// POST /api/tickets (create new ticket)
router.post('/', SupportTicketController.create);

// GET /api/tickets/:id
router.get('/:id', SupportTicketController.getById);

// PUT /api/tickets/:id/status (admin only)
router.put('/:id/status', requireAdmin, SupportTicketController.updateStatus);

// PUT /api/tickets/:id/priority (admin only)
router.put('/:id/priority', requireAdmin, SupportTicketController.updatePriority);

// PUT /api/tickets/:id/assign (admin only)
router.put('/:id/assign', requireAdmin, SupportTicketController.assign);

// POST /api/tickets/:id/messages
router.post('/:id/messages', SupportTicketController.addMessage);

export default router;
