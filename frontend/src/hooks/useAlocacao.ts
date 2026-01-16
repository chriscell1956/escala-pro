import { useState, useCallback, useEffect } from 'react';
import { api } from '../api';
import type { Vigilante } from '../types';

export function useAlocacao(escalaId: number, ano?: number, mes?: number) {
    console.log('useAlocacao HOOK INIT', { escalaId, ano, mes });

    // New Structure: Grouped Posts (Campus -> [Posts])
    const [postos, setPostos] = useState<any>({});
    const [vigilantes, setVigilantes] = useState<Vigilante[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        console.log('useAlocacao fetchData called with:', { escalaId, ano, mes });
        // Allow fetch if escalaId OR (ano+mes) are present
        if (!escalaId && (!ano || !mes)) {
            console.log("useAlocacao: Skipping fetch due to missing params");
            return;
        }

        setLoading(true);
        try {
            // Construct query param based on what we have
            let query = '';
            if (escalaId) query = `escala_id=${escalaId}`;
            else if (ano && mes) query = `ano=${ano}&mes=${mes}`;

            console.log("useAlocacao: Fetching...", query);

            const [resPostos, resVig] = await Promise.all([
                api.get(`/lancador/postos?${query}`),
                api.get('/dados/vigilantes') // Still needed for the dropdown
            ]);

            console.log("useAlocacao: Fetch Success. Vig Count:", resVig.data?.length);

            setPostos(resPostos.data);
            setVigilantes(resVig.data);
            setError(null);
        } catch (err: any) {
            console.error("useAlocacao: Fetch Error", err);
            setError(err.response?.data?.error || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }

    }, [escalaId, ano, mes]);

    const alocarVigilante = async (
        setorJornadaId: number,
        vigilanteId: number,
        dias: number[],
        ano: number,
        mes: number,
        force: boolean = false
    ) => {
        try {
            const response = await api.post('/lancador/alocar', {
                setor_jornada_id: setorJornadaId,
                vigilante_id: vigilanteId,
                ano,
                mes,
                dias,
                force
            });

            await fetchData(); // Refresh data
            window.dispatchEvent(new Event('refresh-indicators'));

            // Return warnings if any, so UI can show them
            return { success: true, warnings: response.data.warnings };
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Erro ao alocar');
        }
    };

    const removeAlocacao = async (id: number) => {
        try {
            await api.delete(`/lancador/alocacao/${id}`);
            // Optimistic update or refresh? Refresh is safer for now.
            await fetchData();
            window.dispatchEvent(new Event('refresh-indicators'));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao remover');
        }
    };

    useEffect(() => {
        fetchData();

        const handleRefresh = () => fetchData();
        window.addEventListener('refresh-indicators', handleRefresh);
        return () => window.removeEventListener('refresh-indicators', handleRefresh);
    }, [fetchData]);

    return {
        postos, // Grouped object
        vigilantes,
        loading,
        error,
        alocarVigilante, // New batch function
        removeAlocacao
    };
}
