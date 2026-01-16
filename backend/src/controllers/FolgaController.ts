import { Request, Response } from 'express';
import { FolgaService } from '../services/FolgaService';

export class FolgaController {
    // POST /api/folgas
    static async solicitar(req: Request, res: Response) {
        try {
            const { vigilante_id, escala_mensal_id, data } = req.body;
            const folga = await FolgaService.solicitar(vigilante_id, escala_mensal_id, data);
            return res.status(201).json(folga);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    // PATCH /api/folgas/:id/responder
    static async responder(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'APROVADA' | 'NEGADA'

            if (!['APROVADA', 'NEGADA'].includes(status)) {
                return res.status(400).json({ error: 'Status inválido.' });
            }

            const folga = await FolgaService.responder(Number(id), status);
            return res.json(folga);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // GET /api/folgas/:escalaId/pendentes
    static async listarPendentes(req: Request, res: Response) {
        try {
            const { escalaId } = req.params;
            const pendentes = await FolgaService.listarPendentes(Number(escalaId));
            return res.json(pendentes);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
