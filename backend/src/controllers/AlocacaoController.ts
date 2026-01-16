import { Request, Response } from 'express';
import { AlocacaoService } from '../services/AlocacaoService';

export class AlocacaoController {
    // POST /api/alocacao
    static async criar(req: Request, res: Response) {
        try {
            const { escala_mensal_id, vigilante_id, data, setor_jornada_id } = req.body;

            if (!escala_mensal_id || !vigilante_id || !data || !setor_jornada_id) {
                return res.status(400).json({ error: 'Dados incompletos para alocação.' });
            }

            const alocacao = await AlocacaoService.alocar(escala_mensal_id, vigilante_id, data, setor_jornada_id);
            return res.status(201).json(alocacao);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    // DELETE /api/alocacao/:id
    static async remover(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await AlocacaoService.remover(Number(id));
            return res.status(200).json({ message: 'Alocação removida com sucesso.' });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // GET /api/alocacao/:escalaId
    static async listar(req: Request, res: Response) {
        try {
            const { escalaId } = req.params;
            const alocacoes = await AlocacaoService.listarPorEscala(Number(escalaId));
            return res.json(alocacoes);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
