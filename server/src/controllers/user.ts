import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { asyncHandler } from '../middleware/asyncHandler';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  res.json(data);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { name, phone } = req.body;

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, name, phone })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  res.json(data);
});

export const getMemberships = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('memberships')
    .select('*, tier:tiers(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // If no membership is found, don't throw an error, just return null
  if (error && error.code === 'PGRST116') {
    return res.json(null);
  }

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  res.json(data);
});

export const getDonations = asyncHandler(async (req: Request, res: Response) => {
  const email = req.user?.email;
  const userId = req.user?.id;
  if (!email && !userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  let query = supabase.from('donations').select('*');
  
  if (userId) {
    // Some donations might only have email if they were created before we linked user_id, 
    // so let's match either user_id or email
    query = query.or(`user_id.eq.${userId},email.eq.${email}`);
  } else {
    query = query.eq('email', email);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  res.json(data || []);
});

export const getEventRegistrations = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('event_registrations')
    .select('*, event:events(*)')
    .eq('user_id', userId)
    .order('registered_at', { ascending: false });

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  res.json(data || []);
});

export const getMemberData = asyncHandler(async (req: Request, res: Response) => {
  const email = req.user?.email;
  if (!email) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('members')
    .select('*, zone:zones(*)')
    .eq('email', email)
    .limit(1)
    .single();

  if (error && error.code === 'PGRST116') {
    return res.json(null);
  }

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  res.json(data);
});
