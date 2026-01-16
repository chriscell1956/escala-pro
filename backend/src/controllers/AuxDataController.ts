import { Request, Response } from 'express';
import { AuxDataService } from '../services/AuxDataService';

export class AuxDataController {
    static async getVigilantes(req: Request, res: Response) {
        try {
            const data = await AuxDataService.listarVigilantes();
            return res.json(data);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }

    static async getSetorJornada(req: Request, res: Response) {
        try {
            const data = await AuxDataService.listarSetorJornada();
            return res.json(data);
        } catch (e: any) {
            return res.status(500).json({ error: e.message });
        }
    }
}
