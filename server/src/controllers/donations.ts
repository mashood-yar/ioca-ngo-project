import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendDonationConfirmationEmail } from '../lib/email';
import { donationSchema, updateDonationStatusSchema, uploadScreenshotSchema } from '../schemas/donations';

export const createDonation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validatedData = donationSchema.parse(req.body);
  
  let userId = validatedData.userId;
  let email = validatedData.email;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      userId = user.id;
      email = user.email || email;
    }
  }

  const { data, error } = await supabase
    .from('donations')
    .insert([{
      user_id: userId,
      donor_name: validatedData.donorName,
      email: email,
      amount: validatedData.amount,
      payment_method: validatedData.paymentMethod,
      screenshot_url: validatedData.screenshotUrl,
      screenshot_public_id: validatedData.screenshotPublicId,
      status: validatedData.status || 'pending'
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  res.status(201).json({ success: true, data });
});

export const listDonations = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw new Error(error.message);
  res.json({ success: true, data });
});

export const getDonation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      res.status(404).json({ success: false, error: 'Donation not found' });
      return;
    }
    throw new Error(error.message);
  }

  res.json({ success: true, data });
});

export const updateDonationStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = updateDonationStatusSchema.parse(req.body);
  
  const updateData: Record<string, unknown> = { status };
  if (status === 'confirmed') {
    updateData.confirmed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('donations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (status === 'confirmed' && data) {
    await sendDonationConfirmationEmail(
      data.donor_name,
      data.email,
      data.amount,
      data.payment_method,
      updateData.confirmed_at as string
    );
  }

  res.json({ success: true, data });
});

export const uploadScreenshot = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { screenshotUrl, screenshotPublicId } = uploadScreenshotSchema.parse(req.body);

  const { data, error } = await supabase
    .from('donations')
    .update({
      screenshot_url: screenshotUrl,
      screenshot_public_id: screenshotPublicId
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  res.json({ success: true, data });
});

export const deleteDonation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { error } = await supabase
    .from('donations')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  res.status(204).send();
});
