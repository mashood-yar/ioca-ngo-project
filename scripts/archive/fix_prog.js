import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { error } = await supabase.from('programs')
    .update({ 
      image_url: '/assets/prog-comm-card.webp',
      hero_image_url: '/assets/prog-comm-hero.webp'
    })
    .eq('title_en', 'Community Bonding');
  console.log('Update Error:', error);
}
run();
