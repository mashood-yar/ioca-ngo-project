import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function test() {
  console.log('Testing projects...');
  const { data: projects, error: pErr } = await supabase.from('projects').select('*');
  if (pErr) console.error('Projects Error:', pErr);
  else console.log('Projects count:', projects?.length);

  console.log('Testing events...');
  const { data: events, error: eErr } = await supabase.from('events').select('*');
  if (eErr) console.error('Events Error:', eErr);
  else console.log('Events count:', events?.length);
}

test();
