import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are missing. ' +
    'Direct Supabase authentication will fall back to dummy credentials and fail to fetch.'
  );
}

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseKey || 'dummy_anon_key'
);
