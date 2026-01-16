import { Request, Response } from 'express';
import { EscalaService } from '../services/EscalaService';

export class EscalaController {
    // POST /api/escalas
    static async criar(req: Request, res: Response) {
        try {
            const { ano, mes } = req.body;

            if (!ano || !mes) {
                return res.status(400).json({ error: 'Ano e mês são obrigatórios' });
            }

            const escala = await EscalaService.criarEscala(Number(ano), Number(mes));
            return res.status(201).json(escala);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    // GET /api/escalas
    static async listar(req: Request, res: Response) {
        try {
            const escalas = await EscalaService.listarEscalas();
            return res.json(escalas);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // GET /api/escalas/:id/espelho
    static async getEspelho(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const espelho = await EscalaService.getEspelho(Number(id));
            return res.json(espelho);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
