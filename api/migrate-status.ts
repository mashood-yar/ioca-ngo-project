import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './_lib/prisma';
import { cors } from './_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // 1. Check database connection & list tables
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    // 2. Fetch migrations if _prisma_migrations exists
    let migrations: any[] = [];
    const hasMigrationTable = tables.some(t => t.table_name === '_prisma_migrations');
    if (hasMigrationTable) {
      migrations = await prisma.$queryRaw`
        SELECT id, migration_name, finished_at, applied_steps_count
        FROM _prisma_migrations
        ORDER BY started_at DESC;
      `;
    }

    return res.status(200).json({
      success: true,
      message: 'Database check successful',
      connection: 'CONNECTED',
      tables: tables.map(t => t.table_name),
      migrations
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Database check failed',
      connection: 'FAILED',
      error: error.message,
      stack: error.stack
    });
  }
}
