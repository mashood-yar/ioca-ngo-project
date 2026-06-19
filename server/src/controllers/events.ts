import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { asyncHandler } from '../middleware/asyncHandler';
import { processImageField } from '../lib/upload';

export const createEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { title, description, location, eventDate, imageUrl } = req.body as {
      title: string;
      description: string;
      location?: string;
      eventDate?: string;
      imageUrl?: string;
    };

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title,
        description,
        location,
        event_date: eventDate,
        image_url: await processImageField(imageUrl),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    res.status(201).json({
      success: true,
      data: event,
      message: 'Event created',
    });
  }
);

export const listEvents = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: events, count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      data: events,
      pagination: { page, limit, total: count }
    });
  }
);

export const getEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Event not found',
        });
        return;
      }
      throw new Error(error.message);
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  }
);

export const updateEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, description, location, eventDate, imageUrl } = req.body as {
      title?: string;
      description?: string;
      location?: string;
      eventDate?: string;
      imageUrl?: string;
    };

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (eventDate !== undefined) updates.event_date = eventDate;
    if (imageUrl !== undefined) updates.image_url = await processImageField(imageUrl);

    const { data: event, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      data: event,
      message: 'Event updated',
    });
  }
);

export const deleteEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      data: null,
      message: 'Event deleted',
    });
  }
);

export const registerForEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { data: registration, error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: id,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        res.status(409).json({ success: false, error: 'Already registered for this event' });
        return;
      }
      throw new Error(error.message);
    }

    res.status(201).json({
      success: true,
      data: registration,
      message: 'Successfully registered for event',
    });
  }
);

export const unregisterFromEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .match({ event_id: id, user_id: userId });

    if (error) throw new Error(error.message);

    res.status(200).json({
      success: true,
      data: null,
      message: 'Successfully unregistered from event',
    });
  }
);
