import { supabase } from './supabase'
import { uploadBase64Image } from './upload'
import { generateCustomQR } from './qrGenerator'

/**
 * Generates the next sequential UID for a given personnel category.
 * Format: {PREFIX}-{000}  e.g. VOL-001, BOA-002, EMP-003
 */
export async function getNextSequentialUid(category: string): Promise<string> {
  const prefix = category.toUpperCase().substring(0, 3)
  const { data } = await supabase
    .from('personnel')
    .select('uid')
    .like('uid', `${prefix}-%`)

  let maxNum = 0
  if (data) {
    for (const row of data) {
      const parts = row.uid.split('-')
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10)
        if (!isNaN(num) && num > maxNum) {
          maxNum = num
        }
      }
    }
  }

  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`
}

export interface CreatePersonnelInput {
  category: 'board' | 'partner' | 'employee' | 'volunteer'
  full_name: string
  email?: string | null
  phone?: string | null
  title: string
  bio?: string | null
  status?: 'active' | 'suspended' | 'former'
  profile_image_url?: string | null
}

/**
 * Creates a personnel record with a sequential UID and branded QR code.
 * Handles UID collision retry (up to 5 times).
 */
export async function createPersonnelRecord(input: CreatePersonnelInput) {
  const baseUrl = process.env.CLIENT_URL || 'https://www.iocaworld.org'
  const logoPath = `${baseUrl}/assets/logos/logo-icon-white.webp`

  // Generate UID with collision retry
  let uid = await getNextSequentialUid(input.category)
  let retries = 0
  while (retries < 5) {
    const { data: existing } = await supabase
      .from('personnel')
      .select('id')
      .eq('uid', uid)
      .maybeSingle()
    if (!existing) break

    const parts = uid.split('-')
    const currentNum = parseInt(parts[1], 10)
    uid = `${parts[0]}-${String(currentNum + 1).padStart(3, '0')}`
    retries++
  }

  // Generate and upload branded QR code
  const verifyUrl = `${baseUrl}/verify/${uid}`
  const qrDataUrl = await generateCustomQR(verifyUrl, logoPath)
  const { url: qr_code_url } = await uploadBase64Image(qrDataUrl, 'ioca/qrcodes')

  // Insert into personnel table
  const { data, error } = await supabase
    .from('personnel')
    .insert([{
      category: input.category,
      uid,
      full_name: input.full_name.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      profile_image_url: input.profile_image_url || null,
      qr_code_url,
      status: input.status || 'active',
      title: input.title.trim(),
      bio: input.bio?.trim() || null,
    }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
