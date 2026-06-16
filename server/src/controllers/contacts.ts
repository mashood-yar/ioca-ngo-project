import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { asyncHandler } from '../middleware/asyncHandler';
import { contactSchema, updateContactStatusSchema } from '../schemas/contacts';

export const createContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validatedData = contactSchema.parse(req.body);
  const { data, error } = await supabase
    .from('contacts')
    .insert([{
      name: validatedData.name,
      email: validatedData.email,
      message: validatedData.message,
      status: 'unread'
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  res.status(201).json({ success: true, data });
});

export const listContacts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const status = req.query.status as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  let query = supabase.from('contacts').select('*', { count: 'exact' });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  res.json({
    success: true,
    data,
    meta: {
      total: count,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    }
  });
});

export const getContact = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      res.status(404).json({ success: false, error: 'Contact not found' });
      return;
    }
    throw new Error(error.message);
  }

  res.json({ success: true, data });
});

export const updateContactStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, adminNotes } = updateContactStatusSchema.parse(req.body);

  const updateData: Record<string, unknown> = { status };
  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes;
  }
  
  if (status === 'replied') {
    updateData.replied_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('contacts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  res.json({ success: true, data });
});
