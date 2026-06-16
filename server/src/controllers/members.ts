import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { asyncHandler } from '../middleware/asyncHandler';
import { createMemberSchema, updateMemberSchema } from '../schemas/members';

/**
 * Map camelCase input (from the Zod schema) to snake_case DB columns.
 * The schema intentionally stays camelCase for frontend consistency.
 */
function toDbRow(d: Partial<ReturnType<typeof createMemberSchema.parse>>) {
  return {
    ...(d.zoneId             !== undefined && { zone_id: d.zoneId }),
    ...(d.fullName           !== undefined && { full_name: d.fullName }),
    ...(d.email              !== undefined && { email: d.email }),
    ...(d.phone              !== undefined && { phone: d.phone }),
    ...(d.cnic               !== undefined && { cnic: d.cnic }),
    ...(d.roleInOrg          !== undefined && { role_in_org: d.roleInOrg }),
    ...(d.profileImageUrl    !== undefined && { profile_image_url: d.profileImageUrl }),
    ...(d.profileImagePublicId !== undefined && { profile_image_public_id: d.profileImagePublicId }),
    ...(d.joinedAt           !== undefined && { joined_at: d.joinedAt }),
    ...(d.isActive           !== undefined && { is_active: d.isActive }),
  };
}

export const createMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validatedData = createMemberSchema.parse(req.body);

  const { data, error } = await supabase
    .from('members')
    .insert({
      ...toDbRow(validatedData),
      role_in_org: validatedData.roleInOrg ?? 'member', // default to 'member' if omitted
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  res.status(201).json({ success: true, data });
});

export const listMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { zone } = req.query;

  let query = supabase.from('members').select('*, zone:zones(name)');

  if (zone && typeof zone === 'string') {
    query = query.eq('zone_id', zone);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  res.status(200).json({ success: true, data });
});

export const getMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('members')
    .select('*, zone:zones(name)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    throw new Error(error.message);
  }
  res.status(200).json({ success: true, data });
});

export const updateMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validatedData = updateMemberSchema.parse(req.body);

  const dbRow = toDbRow(validatedData);

  if (Object.keys(dbRow).length === 0) {
    res.status(400).json({ success: false, error: 'No valid fields provided for update' });
    return;
  }

  const { data, error } = await supabase
    .from('members')
    .update(dbRow)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  res.status(200).json({ success: true, data });
});

export const deleteMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  res.status(200).json({ success: true, data: null });
});
