import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { asyncHandler } from '../middleware/asyncHandler';
import { updateApplicationStatusSchema } from '../schemas/applications';
import { sendApplicationApproved, sendApplicationRejected } from '../lib/email';

export const listApplications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { status } = req.query;
  
  let query = supabase
    .from('applications')
    .select('*, zones(name, city), tiers(name, price), profiles(name, email)')
    .order('submitted_at', { ascending: false });

  if (status && typeof status === 'string') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  res.json({ success: true, data });
});

export const updateApplicationStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validatedData = updateApplicationStatusSchema.parse(req.body);

  // Get the application
  const { data: application, error: fetchError } = await supabase
    .from('applications')
    .select('*, tiers(duration_days, name)')
    .eq('id', id)
    .single();

  if (fetchError || !application) {
    res.status(404).json({ success: false, error: 'Application not found' });
    return;
  }

  if (application.status === 'approved') {
    res.status(400).json({ success: false, error: 'Application is already approved' });
    return;
  }

  // Prepare update payload
  const updatePayload: Record<string, unknown> = {
    status: validatedData.status,
    updated_at: new Date().toISOString()
  };

  if (validatedData.status === 'approved' || validatedData.status === 'rejected') {
    updatePayload.reviewed_at = new Date().toISOString();
    if (validatedData.adminNotes !== undefined) {
      updatePayload.admin_notes = validatedData.adminNotes;
    }
  }

  const { error: updateError } = await supabase
    .from('applications')
    .update(updatePayload)
    .eq('id', id);

  if (updateError) throw new Error(updateError.message);

  // Handle side effects for approved
  if (validatedData.status === 'approved') {
    const durationDays = application.tiers?.duration_days || 365;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    // Create membership
    const { error: membershipError } = await supabase.from('memberships').insert({
      user_id: application.user_id,
      tier_id: application.tier_id,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      payment_ref: `IOCA-${Date.now()}`,
    });

    if (membershipError) {
      console.error('Failed to create membership:', membershipError.message);
    }

    // Create member record — include user_id to link to auth user
    const { error: memberError } = await supabase.from('members').insert({
      user_id: application.user_id,
      zone_id: application.zone_id,
      full_name: application.full_name,
      email: application.email,
      phone: application.phone,
      cnic: application.cnic,
      role_in_org: 'member',
      is_active: true,
    });

    if (memberError) {
      console.error('Failed to create member record:', memberError.message);
    }

    // Fire email asynchronously
    sendApplicationApproved(
      application.email, 
      application.full_name, 
      application.tiers?.name || 'Membership', 
      endDate.toISOString()
    );
  }

  // Handle side effects for rejected
  if (validatedData.status === 'rejected') {
    sendApplicationRejected(
      application.email,
      application.full_name,
      validatedData.adminNotes
    );
  }

  res.json({ success: true, data: { ...application, ...updatePayload } });
});
