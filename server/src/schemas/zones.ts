import { z } from 'zod';

export const createZoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  city: z.string().min(1, 'City is required'),
  description: z.string().optional(),
});

export const updateZoneSchema = createZoneSchema.partial();
