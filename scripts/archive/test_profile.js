const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://zrlbwvlagpearpuqqdpk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('Fetching profiles...');
  const { data, error } = await supabase.from('profiles').select('id, role').limit(10);
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Profiles roles list:', data);
  }
}

run();
