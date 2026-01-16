import { Router } from 'express';
import { FolgaController } from '../controllers/FolgaController';

const router = Router();

router.post('/', FolgaController.solicitar);
router.patch('/:id/responder', FolgaController.responder);
router.get('/:escalaId/pendentes', FolgaController.listarPendentes);

export default router;
