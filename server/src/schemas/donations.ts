import { z } from 'zod';

export const donationSchema = z.object({
  donorName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.string(),
  screenshotUrl: z.string().url().optional(),
  screenshotPublicId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'rejected']).optional(),
  userId: z.string().uuid().optional(),
});

export const updateDonationStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'rejected'])
});

export const uploadScreenshotSchema = z.object({
  screenshotUrl: z.string().url(),
  screenshotPublicId: z.string()
});
