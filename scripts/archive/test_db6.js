import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://duufrysoboxraurtyzfj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzgzNzA5MSwiZXhwIjoyMTAzNDEzMDkxfQ.-lhFpvxda05S-_5skqYkLjbC_Hs_KlYdBPRlh4cwkP4'
)
async function check() {
  const { data, error } = await supabase.from('impact_stats').select('*').limit(1)
  console.log('Error:', error)
  console.log('Data:', data)
}
check()
