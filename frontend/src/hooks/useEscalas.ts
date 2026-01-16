import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Escala } from '../types';

export function useEscalas() {
    const [escalas, setEscalas] = useState<Escala[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEscalas = async () => {
        setLoading(true);
        try {
            const response = await api.get('/escalas');
            setEscalas(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao buscar escalas');
        } finally {
            setLoading(false);
        }
    };

    const criarEscala = async (ano: number, mes: number) => {
        try {
            await api.post('/escalas', { ano, mes });
            await fetchEscalas();
            return true;
        } catch (err: any) {
            throw new Error(err.response?.data?.error || 'Erro ao criar escala');
        }
    };

    useEffect(() => {
        fetchEscalas();
    }, []);

    return { escalas, loading, error, criarEscala, refresh: fetchEscalas };
}
