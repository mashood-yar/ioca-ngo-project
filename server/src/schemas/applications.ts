import { z } from 'zod';

export const createApplicationSchema = z.object({
  zoneId: z.string().uuid(),
  tierId: z.string().uuid(),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  cnic: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  motivation: z.string().min(50),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['under_review', 'approved', 'rejected']),
  adminNotes: z.string().optional(),
});
