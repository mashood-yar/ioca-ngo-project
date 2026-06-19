import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Global Error]', err);

  let message = 'Internal server error';
  let statusCode = 500;

  if (err instanceof Error) {
    // If it's a known safe error (like Zod validation), we can send it.
    // But raw Postgres/Supabase errors often contain schema details.
    if (
      err.message.includes('violates') || 
      err.message.includes('syntax error') || 
      err.message.includes('relation') ||
      err.message.includes('operator')
    ) {
      message = 'A database error occurred. Please try again later.';
    } else {
      message = err.message;
    }
    
    // Simple mapping for common HTTP status codes
    if (message.toLowerCase().includes('not found')) statusCode = 404;
    if (message.toLowerCase().includes('unauthorized')) statusCode = 401;
    if (message.toLowerCase().includes('forbidden')) statusCode = 403;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
