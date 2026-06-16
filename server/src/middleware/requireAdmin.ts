import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Primary check: read role from JWT app_metadata (fast, no DB query)
  const appRole = (req.user as any)?.app_metadata?.role;
  if (appRole === 'admin') {
    next();
    return;
  }

  // Fallback: check profiles table (backwards compatibility)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role === 'admin') {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: 'Admin access required',
  });
}
