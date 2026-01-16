import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    // throw new Error('Missing Supabase URL or Key in .env'); 
    // Allowing to simplify development if just testing structure, but usually critical.
}

export const supabase = createClient(supabaseUrl!, supabaseKey!);
