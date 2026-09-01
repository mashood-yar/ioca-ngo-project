import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://duufrysoboxraurtyzfj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1dWZyeXNvYm94cmF1cnR5emZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzgzNzA5MSwiZXhwIjoyMTAzNDEzMDkxfQ.-lhFpvxda05S-_5skqYkLjbC_Hs_KlYdBPRlh4cwkP4'
)
async function check() {
  const { data, error } = await supabase.from('donations').insert([{ 
    donor_name: 'Test', 
    email: 'test@test.com',
    amount: 10,
    payment_method: 'card',
    project_id: null,
    transaction_id: 'test'
  }])
  console.log('Error:', error)
}
check()
