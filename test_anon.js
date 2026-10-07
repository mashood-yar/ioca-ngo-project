const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);

async function test() {
  const { data, error } = await supabase
    .from('testimonial_submissions')
    .insert({
      submitter_name: 'Test Anon',
      submitter_email: 'anon@test.com',
      submitter_location: 'Anon City',
      quote_en: 'This is a test testimonial that is exactly thirty characters long.',
      consent_to_publish: true,
      status: 'pending'
    });
  console.log('Without select:', { data, error });

  const { data: data2, error: error2 } = await supabase
    .from('testimonial_submissions')
    .insert({
      submitter_name: 'Test Anon 2',
      submitter_email: 'anon2@test.com',
      submitter_location: 'Anon City',
      quote_en: 'This is a test testimonial that is exactly thirty characters long.',
      consent_to_publish: true,
      status: 'pending'
    }).select().single();
  console.log('With select:', { data: data2, error: error2 });
}
test();
