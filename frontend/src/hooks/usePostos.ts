import { useState, useCallback, useEffect } from 'react';
import { api } from '../api';

export function usePostos() {
    const [postos, setPostos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPostos = async () => {
        setLoading(true);
        try {
            const response = await api.get('/postos');
            setPostos(response.data);
            setError(null);
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Erro ao buscar postos';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const criarPosto = async (dados: any) => {
        try {
            await api.post('/postos', dados);
            await fetchPostos();
            window.dispatchEvent(new Event('refresh-indicators'));
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.response?.data?.error || 'Erro ao criar posto' };
        }
    };

    const deletarPosto = async (id: number) => {
        try {
            // Optimistic Update: Remove immediately from UI
            setPostos(prev => prev.filter(p => p.id !== id));

            await api.delete(`/postos/${id}`);
            await fetchPostos(); // Sync to be sure
            window.dispatchEvent(new Event('refresh-indicators'));
            return { success: true };
        } catch (err: any) {
            await fetchPostos(); // Revert on error
            return { success: false, error: err.response?.data?.error || 'Erro ao deletar posto' };
        }
    };

    useEffect(() => {
        fetchPostos();

        const handleRefresh = () => fetchPostos();
        window.addEventListener('refresh-indicators', handleRefresh);
        return () => window.removeEventListener('refresh-indicators', handleRefresh);
    }, []);

    const atualizarPosto = async (id: number, dados: any) => {
        try {
            await api.put(`/postos/${id}`, dados);
            await fetchPostos();
            window.dispatchEvent(new Event('refresh-indicators'));
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.response?.data?.error || 'Erro ao atualizar posto' };
        }
    };

    return { postos, loading, error, criarPosto, deletarPosto, atualizarPosto, refresh: fetchPostos };
}
