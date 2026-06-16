import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { asyncHandler } from '../middleware/asyncHandler';
import { createZoneSchema, updateZoneSchema } from '../schemas/zones';

export const createZone = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validatedData = createZoneSchema.parse(req.body);
  const { data, error } = await supabase
    .from('zones')
    .insert(validatedData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  res.status(201).json({ success: true, data });
});

export const listZones = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('zones')
    .select('*, members:members(count)');

  if (error) throw new Error(error.message);
  res.status(200).json({ success: true, data });
});

export const getZone = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      res.status(404).json({ success: false, error: 'Zone not found' });
      return;
    }
    throw new Error(error.message);
  }
  res.status(200).json({ success: true, data });
});

export const updateZone = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validatedData = updateZoneSchema.parse(req.body);
  
  const { data, error } = await supabase
    .from('zones')
    .update(validatedData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  res.status(200).json({ success: true, data });
});

export const deleteZone = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { error } = await supabase
    .from('zones')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  res.status(200).json({ success: true, data: null });
});
