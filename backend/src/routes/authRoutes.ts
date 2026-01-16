import { Router } from 'express';
import { login, changePassword } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public
router.post('/login', login);

// Private
router.post('/change-password', authenticateToken, changePassword);

export default router;
