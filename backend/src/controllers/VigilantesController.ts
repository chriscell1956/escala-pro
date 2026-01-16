import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const sb = createClient(supabaseUrl, supabaseKey);

export const listarVigilantes = async (req: Request, res: Response) => {
    try {
        const { data, error } = await sb
            .from('vigilantes')
            .select('*')
            .order('nome');

        if (error) throw error;
        return res.json(data);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const criarVigilante = async (req: Request, res: Response) => {
    try {
        const { nome, matricula, equipe } = req.body;
        const { data, error } = await sb
            .from('vigilantes')
            .insert({ nome, matricula, equipe })
            .select()
            .single();

        if (error) throw error;
        return res.json(data);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getIndicadores = async (req: Request, res: Response) => {
    try {
        const { ano, mes } = req.query;

        if (!ano || !mes) return res.status(400).json({ error: 'Ano e Mês necessários' });

        // 1. Get ALL Active Vigilantes
        const { data: vigilantes, error: errVig } = await sb
            .from('vigilantes')
            .select('id, equipe');

        if (errVig) throw errVig;

        // Group TOTALS by Equipe
        const totals: Record<string, number> = {
            'A': 0, 'B': 0, 'C': 0, 'D': 0, 'ECO1': 0, 'ECO2': 0
        };

        vigilantes?.forEach((v: any) => {
            const eq = v.equipe || 'OUTROS';
            if (totals[eq] !== undefined) totals[eq]++;
        });

        // 2. Get Allocations for this Month
        // We need to see WHICH vigilantes are allocated at least ONCE (or fully? Rule says "alocado corretamente").
        // Usually "Allocated" means they are on the schedule.
        // For ECO: "Horário do posto corresponde ao período".

        // Let's get unique vigilantes allocated in this scale
        const { data: escala, error: errEscala } = await sb
            .from('escala_mensal')
            .select('id')
            .eq('ano', ano)
            .eq('mes', mes)
            .maybeSingle();

        const allocatedCounts: Record<string, Set<number>> = {
            'A': new Set(), 'B': new Set(), 'C': new Set(), 'D': new Set(), 'ECO1': new Set(), 'ECO2': new Set()
        };

        if (escala) {
            const { data: alocacoes, error: errAlloc } = await sb
                .from('escala_vigilantes')
                .select(`
                    vigilante_id,
                    vigilantes (equipe)
                `)
                .eq('escala_mensal_id', escala.id);

            if (errAlloc) throw errAlloc;

            alocacoes?.forEach((a: any) => {
                const eq = a.vigilantes?.equipe;
                if (!eq || !totals.hasOwnProperty(eq)) return;

                // Simplified Logic: If allocated, count it.
                // TODO: Restore rigorous ECO time-based check once relation is confirmed.
                allocatedCounts[eq].add(a.vigilante_id);
            });
        }

        // Calculate Percentages
        const metrics: any[] = [];
        const colorMap: Record<string, string> = {
            'A': '#f97316', 'B': '#f97316', 'C': '#f97316', 'D': '#f97316',
            'ECO1': '#64748b', 'ECO2': '#64748b'
        };

        Object.keys(totals).forEach(key => {
            const total = totals[key];
            const allocated = allocatedCounts[key].size;
            const pct = total === 0 ? 0 : Math.round((allocated / total) * 100);

            metrics.push({
                label: `${key}:`,
                val: `${pct}%`,
                color: colorMap[key] || '#cccccc',
                details: `${allocated}/${total}` // Helpful for debug
            });
        });

        return res.json(metrics);

    } catch (error: any) {
        console.error('Erro em getIndicadores:', error);
        return res.status(500).json({ error: error.message });
    }
};
