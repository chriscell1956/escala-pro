import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uiqelqgurmczmrsdeipn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWVscWd1cm1jem1yc2RlaXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzMDI1NiwiZXhwIjoyMDg0MDA2MjU2fQ.dq58zyZmqObEZfTUi_Z4xTjBPaX0JYTxWq8-Y_i7aZY';

const sb = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log('Inspecting table SETORES...');

    // Attempt to just select all columns from the first row to see what keys come back
    const { data: rows, error } = await sb.from('setores').select('*').limit(1);

    if (error) {
        console.error('Error selecting from setores:', error);
    } else if (rows && rows.length > 0) {
        console.log('Found row. Columns available:', Object.keys(rows[0]));
    } else {
        console.log('Table exists but is empty. Cannot infer columns from rows.');
        console.log('Trying to insert a dummy to see error details...');
        const { error: errInsert } = await sb.from('setores').insert({ nome: 'DEBUG_INSPECT' }).select();
        if (errInsert) console.log('Insert error:', errInsert);
    }
}

inspectTable();
