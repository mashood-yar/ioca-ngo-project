import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://duufrysoboxraurtyzfj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzgzNzA5MSwiZXhwIjoyMTAzNDEzMDkxfQ.-lhFpvxda05S-_5skqYkLjbC_Hs_KlYdBPRlh4cwkP4'
)
async function check() {
  const { data, error } = await supabase.from('projects').select('*').limit(1)
  console.log('Error:', error)
  console.log('Data keys:', data && data.length ? Object.keys(data[0]) : 'no data')
}
check()
