import { z } from 'zod';

export const createMemberSchema = z.object({
  zoneId: z.string().uuid('Invalid zone ID'),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  cnic: z.string().optional(),
  roleInOrg: z.string().optional(),
  profileImageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  profileImagePublicId: z.string().optional(),
  joinedAt: z.string().datetime().optional(),
  isActive: z.boolean().optional()
});

export const updateMemberSchema = createMemberSchema.partial();
