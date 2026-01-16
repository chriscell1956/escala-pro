import { useState, useEffect } from 'react';
import { api } from '../api';

export function useConflitos(escalaId: number) {
    const [conflitos, setConflitos] = useState<{
        setoresCriticosDescobertos: any[];
        campiBaixoEfetivo: any[];
    } | null>(null);

    const fetchConflitos = async () => {
        if (!escalaId) return;
        try {
            const response = await api.get(`/conflitos/${escalaId}`);
            setConflitos(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchConflitos();
    }, [escalaId]);

    return { conflitos, refreshConflitos: fetchConflitos };
}
