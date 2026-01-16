import { Router } from 'express';
import { AuxDataController } from '../controllers/AuxDataController';

const router = Router();

router.get('/vigilantes', AuxDataController.getVigilantes);
router.get('/setor-jornada', AuxDataController.getSetorJornada);

export default router;
