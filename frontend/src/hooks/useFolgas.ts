import { useState, useEffect } from 'react';
import { api } from '../api';

export function useFolgas(escalaId?: number) {
    const [pendentes, setPendentes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPendentes = async () => {
        if (!escalaId) return;
        setLoading(true);
        try {
            const response = await api.get(`/folgas/${escalaId}/pendentes`);
            setPendentes(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error);
        } finally {
            setLoading(false);
        }
    };

    const solicitar = async (vigilanteId: number, data: string) => {
        try {
            // Need to pass escala_mensal_id (fetched internally or passed?)
            // For MVP, we need the user to select the scale context or just pass it
            if (!escalaId) throw new Error('Selecione uma escala');
            await api.post('/folgas', {
                vigilante_id: vigilanteId,
                escala_mensal_id: escalaId,
                data
            });
            await fetchPendentes();
            window.dispatchEvent(new Event('refresh-indicators'));
            return true;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Erro ao solicitar');
        }
    };

    const responder = async (id: number, status: 'APROVADA' | 'NEGADA') => {
        try {
            await api.patch(`/folgas/${id}/responder`, { status });
            await fetchPendentes();
            window.dispatchEvent(new Event('refresh-indicators'));
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Erro ao responder');
        }
    };

    useEffect(() => {
        fetchPendentes();
    }, [escalaId]);

    return { pendentes, loading, error, solicitar, responder, refresh: fetchPendentes };
}
