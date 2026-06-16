import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const listTiers = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('tiers')
      .select('*')
      .eq('is_active', true)
      .order('price');

    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tiers' });
  }
};
