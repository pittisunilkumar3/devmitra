import { Router } from 'express';
import UserController from '../controllers/UserController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users/stats
router.get('/stats', requireAdmin, UserController.getStats);

// GET /api/users
router.get('/', requireAdmin, UserController.getAll);

// GET /api/users/:id
router.get('/:id', UserController.getById);

// PUT /api/users/:id
router.put('/:id', UserController.update);

// DELETE /api/users/:id
router.delete('/:id', requireAdmin, UserController.delete);

// PUT /api/users/:id/block
router.put('/:id/block', requireAdmin, UserController.block);

// PUT /api/users/:id/unblock
router.put('/:id/unblock', requireAdmin, UserController.unblock);

export default router;
