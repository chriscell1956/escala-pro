import { Router } from 'express';
import { listarVigilantes, criarVigilante, getIndicadores } from '../controllers/VigilantesController';

const router = Router();

router.get('/', listarVigilantes);
router.post('/', criarVigilante);
router.get('/indicadores', getIndicadores); // /api/vigilantes/indicadores

export default router;
