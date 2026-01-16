import { Router } from 'express';
import { ConflitosController } from '../controllers/ConflitosController';

const router = Router();

router.get('/:escalaId', ConflitosController.verificar);

export default router;
