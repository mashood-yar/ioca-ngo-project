import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: 'backend/.env' })
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
async function check() {
  const { data, error } = await supabase.from('donations').select('*, projects(title)').limit(1)
  console.log('Error:', error)
  console.log('Data:', data)
}
check()
