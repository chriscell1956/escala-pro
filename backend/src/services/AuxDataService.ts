import { supabase } from '../config/supabase';

export class AuxDataService {
    static async listarVigilantes() {
        const { data, error } = await supabase
            .from('vigilantes')
            .select('*')
            .eq('ativo', true)
            .order('nome');
        if (error) throw new Error(error.message);
        return data;
    }

    static async listarSetorJornada() {
        const { data, error } = await supabase
            .from('setor_jornada')
            .select(`
        id,
        setores ( nome, campus ),
        jornadas ( nome ),
        horarios ( hora_inicio, hora_fim )
      `);

        if (error) throw new Error(error.message);
        return data;
    }
}
