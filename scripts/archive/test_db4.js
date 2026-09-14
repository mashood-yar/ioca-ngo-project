import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: 'backend/.env' })
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
async function check() {
  const { data, error } = await supabase.from('projects').select('*').limit(1)
  console.log('Data keys:', data && data.length ? Object.keys(data[0]) : 'no data')
}
check()
