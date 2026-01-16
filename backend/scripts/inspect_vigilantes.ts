import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
    const { data, error } = await sb.from('vigilantes').select('*').limit(1);
    if (error) console.error(error);
    else console.log('Columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No rows');
}
check();
