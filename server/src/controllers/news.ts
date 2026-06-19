import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { asyncHandler } from '../middleware/asyncHandler';
import { processImageField } from '../lib/upload';

export const createNews = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { title, content, imageUrl } = req.body as {
      title: string;
      content: string;
      imageUrl?: string;
    };

    const { data: news, error } = await supabase
      .from('news')
      .insert({
        title,
        content,
        image_url: await processImageField(imageUrl),
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    res.status(201).json({
      success: true,
      data: news,
      message: 'News article created',
    });
  }
);

export const listNews = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: news, count, error } = await supabase
      .from('news')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      data: news,
      pagination: { page, limit, total: count }
    });
  }
);

export const getNews = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const { data: news, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // PostgREST code for "No rows found"
        res.status(404).json({
          success: false,
          error: 'News article not found',
        });
        return;
      }
      throw new Error(error.message);
    }

    res.status(200).json({
      success: true,
      data: news,
    });
  }
);

export const updateNews = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, content, imageUrl } = req.body as {
      title?: string;
      content?: string;
      imageUrl?: string;
    };

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (imageUrl !== undefined) updates.image_url = await processImageField(imageUrl);

    const { data: news, error } = await supabase
      .from('news')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      data: news,
      message: 'News article updated',
    });
  }
);

export const deleteNews = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      data: null,
      message: 'News article deleted',
    });
  }
);
