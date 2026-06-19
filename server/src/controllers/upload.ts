import { Request, Response } from 'express';
import { z } from 'zod';
import { uploadBase64Image } from '../lib/upload';
import { asyncHandler } from '../middleware/asyncHandler';

const uploadSchema = z.object({
  file: z.string().min(1, 'File is required'),
  folder: z.string().optional(),
});

export const uploadImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validatedData = uploadSchema.parse(req.body);
  const { file, folder } = validatedData;

  const result = await uploadBase64Image(file, folder);

  res.status(200).json({
    success: true,
    data: {
      url: result.url,
      publicId: result.publicId,
    },
  });
});

// Keep the old export name for compatibility — just re-exports the handler
export { uploadImage as default };
