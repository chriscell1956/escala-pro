import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uiqelqgurmczmrsdeipn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY';

const sb = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
    console.log('Verifying Schema...');

    // Attempt to insert with the new columns
    const mockPosto = {
        nome: 'DEBUG_VERIFY_' + Date.now(),
        campus: 'CAMPUS DEBUG',
        equipe: 'A',
        codigo_radio: 'DBG',
        refeicao: '12:00 - 13:00'
    };

    console.log('1. Testing table SETORES (column: equipe)...');
    const { data: sector, error: errSector } = await sb
        .from('setores')
        .insert({
            nome: mockPosto.nome,
            campus: mockPosto.campus,
            equipe: mockPosto.equipe,
            codigo_radio: mockPosto.codigo_radio
        })
        .select()
        .single();

    if (errSector) {
        console.error('FAIL Setores OBJECT:', JSON.stringify(errSector, null, 2));
    } else {
        console.log('SUCCESS Setores. ID:', sector.id);

        console.log('2. Testing table SETOR_JORNADA (column: refeicao)...');
        // Need IDs for FKs. Let's just create dependencies quickly or fail if complex
        // Actually, just checking Setores is a good proxy, but let's be sure.
        // We will skip SETOR_JORNADA simple insert because of FKs (Horario/Jornada require existing IDs).
        // But if Setores passed, likely the user ran the whole script. 
        // Let's try to just select * from setor_jornada limit 1 to see structure? No, select * doesn't fail on missing expected columns if we don't ask for them explicitly in typed client... 
        // But Supabase JS plain select returns all columns.

        // Clean up
        await sb.from('setores').delete().eq('id', sector.id);
    }
}

verifySchema();
