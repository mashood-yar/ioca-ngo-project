import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { supabase } from '../_lib/supabase'
import { ok, err } from '../_lib/response'
import { getUser, requireAuth, requireAdmin } from '../_lib/auth'
import { cors } from '../_lib/cors'
import { sendDonationThankYouEmail, sendAdminDonationNotification } from '../_lib/email'

const donationSchema = z.object({
  // Accept both camelCase and snake_case for maximum backwards compatibility
  donorName: z.string().min(1).optional(),
  donor_name: z.string().min(1).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  paymentMethod: z.string().optional(),
  payment_method: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('PKR'),
  message: z.string().optional(),
  screenshotUrl: z.string().optional().nullable().or(z.literal('')),
  screenshot_url: z.string().optional().nullable().or(z.literal('')),
  screenshotPublicId: z.string().optional().nullable(),
  screenshot_public_id: z.string().optional().nullable(),
  projectId: z.string().uuid().optional().nullable().or(z.literal('')),
  project_id: z.string().uuid().optional().nullable().or(z.literal('')),
  transactionId: z.string().optional().nullable(),
  transaction_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
  status: z.enum(['pending', 'confirmed', 'rejected']).optional().nullable(),
})

const updateDonationStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'rejected']),
  notes: z.string().optional().nullable(),
})

const uploadScreenshotSchema = z.object({
  screenshotUrl: z.string().optional().nullable().or(z.literal('')),
  screenshot_url: z.string().optional().nullable().or(z.literal('')),
  screenshotPublicId: z.string().optional().nullable(),
  screenshot_public_id: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  transaction_id: z.string().optional().nullable(),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const pathVal = req.query.path
  const segments = Array.isArray(pathVal)
    ? pathVal
    : typeof pathVal === 'string'
      ? pathVal.split('/').filter(Boolean)
      : []
  const first = segments[0] === 'index' ? undefined : segments[0]

  try {
    // 1. GET /api/donations/summary — Admin aggregated statistics
    if (req.method === 'GET' && first === 'summary') {
      const user = await requireAdmin(req, res)
      if (!user) return

      // Fetch all donations with project title
      const { data: allDonations, error } = await supabase
        .from('donations')
        .select('*, projects(title)')

      if (error) throw new Error(error.message)

      const confirmedDonations = allDonations.filter(d => d.status === 'confirmed')
      const pendingDonations = allDonations.filter(d => d.status === 'pending')
      const rejectedDonations = allDonations.filter(d => d.status === 'rejected')

      // Per project totals
      const projectTotalsMap: Record<string, { project_id: string | null, title: string, confirmed: number, pending: number, count: number }> = {}
      
      // Top donors (by confirmed totals)
      const donorTotalsMap: Record<string, { donor_name: string, email: string, total_donated: number, count: number }> = {}

      for (const d of allDonations) {
        const pId = d.project_id || null
        const pTitle = d.projects?.title || 'Unallocated'
        const amt = Number(d.amount) || 0
        const key = pId || 'unallocated'

        // 1. Project mapping
        if (!projectTotalsMap[key]) {
          projectTotalsMap[key] = { project_id: pId, title: pTitle, confirmed: 0, pending: 0, count: 0 }
        }
        projectTotalsMap[key].count += 1
        if (d.status === 'confirmed') {
          projectTotalsMap[key].confirmed += amt
        } else if (d.status === 'pending') {
          projectTotalsMap[key].pending += amt
        }

        // 2. Donor mapping (only confirmed contributions)
        if (d.status === 'confirmed') {
          const dEmail = d.email || ''
          const dName = d.donor_name || 'Anonymous'
          const dKey = dEmail ? `${dName.toLowerCase()}|${dEmail.toLowerCase()}` : `${dName.toLowerCase()}|anonymous`

          if (!donorTotalsMap[dKey]) {
            donorTotalsMap[dKey] = { donor_name: dName, email: dEmail, total_donated: 0, count: 0 }
          }
          donorTotalsMap[dKey].total_donated += amt
          donorTotalsMap[dKey].count += 1
        }
      }

      // Compute unique donor count
      const uniqueDonorsSet = new Set(allDonations.map(d => d.email).filter(Boolean))

      const summary = {
        total_confirmed: confirmedDonations.reduce((sum, d) => sum + Number(d.amount), 0),
        total_pending: pendingDonations.reduce((sum, d) => sum + Number(d.amount), 0),
        total_rejected: rejectedDonations.reduce((sum, d) => sum + Number(d.amount), 0),
        total_all_time: allDonations.reduce((sum, d) => sum + Number(d.amount), 0),
        count_confirmed: confirmedDonations.length,
        count_pending: pendingDonations.length,
        unique_donors_count: uniqueDonorsSet.size,
        per_project: Object.values(projectTotalsMap),
        top_donors: Object.values(donorTotalsMap)
          .sort((a, b) => b.total_donated - a.total_donated)
          .slice(0, 10),
      }

      return ok(res, summary)
    }

    // 2. GET /api/donations/donor/:email — Admin: Donor history
    if (req.method === 'GET' && first === 'donor' && segments[1]) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const donorEmail = decodeURIComponent(segments[1])

      const { data: donations, error } = await supabase
        .from('donations')
        .select('*, projects(title)')
        .eq('email', donorEmail)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)

      const total = donations.reduce((sum, d) => sum + Number(d.amount), 0)
      const donorName = donations[0]?.donor_name || 'Anonymous'

      return ok(res, {
        donations,
        total_donated: total,
        donor_name: donorName,
      })
    }

    // 3. GET /api/donations/me — Current user's donations
    if (req.method === 'GET' && first === 'me') {
      const user = await requireAuth(req, res)
      if (!user) return

      const { data, error } = await supabase
        .from('donations')
        .select('*, projects(title)')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    // 4. GET /api/donations — Admin: list all donations
    if (req.method === 'GET' && !first) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { data, error } = await supabase
        .from('donations')
        .select('*, projects(title)')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    // 5. GET /api/donations/:id — Admin: get single donation
    if (req.method === 'GET' && first) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { data, error } = await supabase
        .from('donations')
        .select('*, projects(title)')
        .eq('id', first)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return err(res, 'Donation not found', 404)
        }
        throw new Error(error.message)
      }

      return ok(res, data)
    }

    // 6. POST /api/donations — Public: create donation
    if (req.method === 'POST' && !first) {
      const validatedData = donationSchema.parse(req.body)

      let userId = validatedData.userId || validatedData.user_id || null
      let email = validatedData.email || ''

      const user = await getUser(req)
      if (user) {
        userId = user.id
        email = user.email || email
      }

      const donorName = validatedData.donor_name || validatedData.donorName || 'Anonymous'
      const paymentMethod = validatedData.payment_method || validatedData.paymentMethod || 'Credit Card'
      const screenshotUrl = validatedData.screenshot_url || validatedData.screenshotUrl || null
      const screenshotPublicId = validatedData.screenshot_public_id || validatedData.screenshotPublicId || null
      const projectId = validatedData.project_id || validatedData.projectId || null
      const transactionId = validatedData.transaction_id || validatedData.transactionId || null
      const message = validatedData.message || null
      const status = validatedData.status || 'pending'

      const { data, error } = await supabase
        .from('donations')
        .insert([{
          user_id: userId,
          donor_name: donorName,
          email: email,
          phone: validatedData.phone || null,
          amount: validatedData.amount,
          payment_method: paymentMethod,
          screenshot_url: screenshotUrl,
          screenshot_public_id: screenshotPublicId,
          project_id: projectId,
          transaction_id: transactionId,
          message: message,
          status: status,
          currency: validatedData.currency || 'PKR',
          notes: validatedData.notes || null,
        }])
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, data, 201)
    }

    // 7. PATCH /api/donations/:id/verify-payment — Admin: verify payment
    if (req.method === 'PATCH' && first && segments[1] === 'verify-payment') {
      const user = await requireAdmin(req, res)
      if (!user) return

      const donationId = first
      const { verificationNotes } = req.body

      try {
        const { data: donation, error } = await supabase
          .from('donations')
          .update({
            status: 'payment_verified',
            payment_verified_at: new Date().toISOString(),
            payment_verified_by: user.id,
            verification_notes: verificationNotes || null,
          })
          .eq('id', donationId)
          .select('*, projects(title)')
          .single()

        if (error) {
          return err(res, error.message, 400)
        }

        console.log('Payment verified for donation:', donationId)
        return ok(res, donation, 200)
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e)
        return err(res, errorMsg, 500)
      }
    }

    // 8. PATCH /api/donations/:id — Admin: update status (confirm/reject)
    if (req.method === 'PATCH' && first && segments[1] !== 'verify-payment') {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { status, notes } = updateDonationStatusSchema.parse(req.body)

      // Only allow confirming if payment is already verified
      if (status === 'confirmed') {
        const { data: donation, error: fetchError } = await supabase
          .from('donations')
          .select('status')
          .eq('id', first)
          .single()

        if (fetchError || !donation) {
          return err(res, 'Donation not found', 404)
        }

        if (donation.status !== 'payment_verified') {
          return err(res, 'Payment must be verified before confirming', 400)
        }
      }

      const updateData: Record<string, unknown> = {
        status,
        reviewed_by: user.id,
      }
      if (notes !== undefined) {
        updateData.notes = notes
      }
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('donations')
        .update(updateData)
        .eq('id', first)
        .select('*, projects(title)')
        .single()

      if (error) throw new Error(error.message)

      // Send confirmation email if status is confirmed
      if (status === 'confirmed' && data && data.email) {
        sendDonationThankYouEmail(
          data.email,
          data.donor_name,
          data.amount,
          data.currency || 'PKR',
          data.receipt_number || 'N/A',
          data.projects?.title || null,
          data.payment_method,
          data.message
        ).catch(console.error)

        sendAdminDonationNotification(
          process.env.RESEND_FROM_EMAIL || 'admin@iocaworld.org',
          data.donor_name,
          data.amount,
          data.projects?.title || 'General Fund'
        ).catch(console.error)
      }

      return ok(res, data)
    }

    // 8. POST /api/donations/:id/screenshot OR PUT /api/donations/:id — Upload/update screenshot
    if ((req.method === 'POST' && first && segments[1] === 'screenshot') || (req.method === 'PUT' && first)) {
      const validatedData = uploadScreenshotSchema.parse(req.body)

      const screenshotUrl = validatedData.screenshot_url || validatedData.screenshotUrl
      const screenshotPublicId = validatedData.screenshot_public_id || validatedData.screenshotPublicId
      const transactionId = validatedData.transaction_id || validatedData.transactionId

      const updateFields: Record<string, any> = {
        screenshot_url: screenshotUrl || null,
        screenshot_public_id: screenshotPublicId || null,
      }
      if (transactionId !== undefined) {
        updateFields.transaction_id = transactionId || null
      }

      const { data, error } = await supabase
        .from('donations')
        .update(updateFields)
        .eq('id', first)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return ok(res, data)
    }

    // 9. DELETE /api/donations/:id — Admin: delete donation
    if (req.method === 'DELETE' && first) {
      const user = await requireAdmin(req, res)
      if (!user) return

      const { error } = await supabase
        .from('donations')
        .delete()
        .eq('id', first)

      if (error) throw new Error(error.message)
      return ok(res, { message: 'Donation deleted' })
    }

    return err(res, 'Method not allowed', 405)
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : JSON.stringify(e)
    console.error('Donations error:', errorMsg)
    if (e instanceof z.ZodError) {
      return err(res, e.errors[0]?.message || 'Validation error', 400)
    }
    return err(res, errorMsg, 500)
  }
}
