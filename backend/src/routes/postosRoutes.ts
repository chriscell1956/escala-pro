import { Router } from 'express';
import { listarPostos, criarPosto, deletarPosto, atualizarPosto } from '../controllers/PostosController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', listarPostos);
router.post('/', authorizeRole(['MASTER', 'ADMIN']), criarPosto);
router.put('/:id', authorizeRole(['MASTER', 'ADMIN']), atualizarPosto);
router.delete('/:id', authorizeRole(['MASTER', 'ADMIN']), deletarPosto);

export default router;
