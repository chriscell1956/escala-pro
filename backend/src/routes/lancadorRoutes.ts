import { Router } from 'express';
import { getPostos, alocarVigilante, removerAlocacao } from '../controllers/LancadorController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Public or Protected? Protected.
router.use(authenticateToken);

router.get('/postos', getPostos);
router.post('/alocar', authorizeRole(['MASTER', 'ADMIN']), alocarVigilante);
router.delete('/alocacao/:id', authorizeRole(['MASTER', 'ADMIN']), removerAlocacao);

export default router;
