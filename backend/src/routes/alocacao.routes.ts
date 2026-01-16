import { Router } from 'express';
import { AlocacaoController } from '../controllers/AlocacaoController';

const router = Router();

router.post('/', AlocacaoController.criar);
router.delete('/:id', AlocacaoController.remover);
router.get('/:escalaId', AlocacaoController.listar);

export default router;
