import { Router } from 'express';
import { EscalaController } from '../controllers/EscalaController';

const router = Router();

router.post('/', EscalaController.criar);
router.get('/', EscalaController.listar);
router.get('/:id/espelho', EscalaController.getEspelho);

export default router;
