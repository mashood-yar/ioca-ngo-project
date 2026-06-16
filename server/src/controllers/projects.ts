import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { asyncHandler } from '../middleware/asyncHandler';
import { processImageField } from '../lib/upload';

export const createProject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { title, description, status, imageUrl } = req.body as {
      title: string;
      description: string;
      status?: string;
      imageUrl?: string;
    };

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title,
        description,
        status,
        image_url: await processImageField(imageUrl),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created',
    });
  }
);

export const listProjects = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      data: projects,
    });
  }
);

export const getProject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }
      throw new Error(error.message);
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  }
);

export const updateProject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, description, status, imageUrl } = req.body as {
      title?: string;
      description?: string;
      status?: string;
      imageUrl?: string;
    };

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (imageUrl !== undefined) updates.image_url = await processImageField(imageUrl);

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      data: project,
      message: 'Project updated',
    });
  }
);

export const deleteProject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      data: null,
      message: 'Project deleted',
    });
  }
);
