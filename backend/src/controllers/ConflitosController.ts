import { Request, Response } from 'express';
import { ConflitosService } from '../services/ConflitosService';

export class ConflitosController {
    // GET /api/conflitos/:escalaId
    static async verificar(req: Request, res: Response) {
        try {
            const { escalaId } = req.params;

            if (!escalaId) {
                return res.status(400).json({ error: 'ID da escala é obrigatório.' });
            }

            const relatorio = await ConflitosService.checarConflitos(Number(escalaId));
            return res.json(relatorio);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
