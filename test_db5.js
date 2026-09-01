import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://duufrysoboxraurtyzfj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1dWZyeXNvYm94cmF1cnR5emZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MzcwOTEsImV4cCI6MjEwMzQxMzA5MX0.7vt_shJrB4_pdZ_djqIXU4cJ_g6jDHdqXUXPJlbwTsI'
)
async function check() {
  const { data, error } = await supabase.from('donations').select('*').limit(1)
  console.log('Error:', error)
  console.log('Data keys:', data && data.length ? Object.keys(data[0]) : 'no data')
}
check()
