import { Router } from 'express';
import DeveloperController from '../controllers/DeveloperController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/developers/browse (public - for users to browse developers)
router.get('/browse', optionalAuth, DeveloperController.browse);

// GET /api/developers/me (get authenticated developer's own profile)
router.get('/me', authenticate, DeveloperController.getMine);

// GET /api/developers/stats (admin only)
router.get('/stats', authenticate, requireAdmin, DeveloperController.getStats);

// POST /api/developers (create developer profile - requires developer role)
router.post('/', authenticate, DeveloperController.create);

// GET /api/developers (admin only - get all developers)
router.get('/', authenticate, requireAdmin, DeveloperController.getAll);

// GET /api/developers/:id
router.get('/:id', DeveloperController.getById);

// PUT /api/developers/:id
router.put('/:id', authenticate, DeveloperController.update);

// PUT /api/developers/:id/approve (admin only)
router.put('/:id/approve', authenticate, requireAdmin, DeveloperController.approve);

// PUT /api/developers/:id/reject (admin only)
router.put('/:id/reject', authenticate, requireAdmin, DeveloperController.reject);

// DELETE /api/developers/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, DeveloperController.delete);

export default router;
