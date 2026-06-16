import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { createApplicationSchema } from '../schemas/applications';
import { sendApplicationConfirmation, sendNewApplicationNotification } from '../lib/email';

export const createApplication = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const validatedData = createApplicationSchema.parse(req.body);

    // 1. Check if user already has a pending or active application
    const { data: existingApp, error: checkError } = await supabase
      .from('applications')
      .select('status')
      .eq('user_id', user.id)
      .neq('status', 'rejected')
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingApp) {
      return res.status(409).json({ success: false, error: 'You already have a pending or active application' });
    }

    // 2. Insert application
    const { data: newApp, error: insertError } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        email: user.email!,
        status: 'pending',
        zone_id: validatedData.zoneId,
        tier_id: validatedData.tierId,
        full_name: validatedData.fullName,
        phone: validatedData.phone,
        cnic: validatedData.cnic,
        address: validatedData.address,
        occupation: validatedData.occupation,
        motivation: validatedData.motivation,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation (applications_one_pending_per_user)
        return res.status(409).json({ success: false, error: 'You already have a pending or active application' });
      }
      throw insertError;
    }

    // 3. Send emails
    const [{ data: zone }, { data: tier }] = await Promise.all([
      supabase.from('zones').select('name').eq('id', validatedData.zoneId).single(),
      supabase.from('tiers').select('name').eq('id', validatedData.tierId).single()
    ]);

    const zoneName = zone?.name || 'Selected Zone';
    const tierName = tier?.name || 'Selected Tier';
    const adminEmail = process.env.RESEND_FROM_EMAIL || 'admin@ioca.org';

    // Fire off emails asynchronously without blocking response
    sendApplicationConfirmation(user.email!, validatedData.fullName, zoneName, tierName);
    sendNewApplicationNotification(adminEmail, validatedData.fullName, zoneName, tierName);

    return res.status(201).json({ success: true, data: newApp });
  } catch (error: any) {
    console.error('Error creating application:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: 'Failed to submit application' });
  }
};

export const getMyApplication = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('applications')
      .select('*, zones(name, city), tiers(name, price)')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'No application found' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch application' });
  }
};

export const deleteMyApplication = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    // Check status first
    const { data, error } = await supabase
      .from('applications')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'No application found' });
    if (data.status !== 'rejected') {
      return res.status(403).json({ success: false, error: 'Can only delete rejected applications' });
    }

    // Delete
    const { error: deleteError } = await supabase
      .from('applications')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    return res.json({ success: true, data: null });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ success: false, error: 'Failed to delete application' });
  }
};
