import 'dotenv/config';

// ── Startup: fail fast if any required env vars are missing ──────────────────
const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'CLIENT_URL',
];
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(`[STARTUP ERROR] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import contactsRouter from './routes/contacts';
import donationsRouter from './routes/donations';
import newsRouter from './routes/news';
import eventsRouter from './routes/events';
import projectsRouter from './routes/projects';
import uploadRouter from './routes/upload';
import zonesRouter from './routes/zones';
import membersRouter from './routes/members';
import userRouter from './routes/user';
import tiersRouter from './routes/tiers';
import applicationsRouter from './routes/applications';
import adminApplicationsRouter from './routes/adminApplications';
import auditRouter from './routes/audit';


const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Security headers
app.use(helmet({
  contentSecurityPolicy: isProd ? undefined : false,
}));

// CORS — only needed in dev (in prod, same origin serves everything)
if (!isProd) {
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    })
  );
}

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: 'IOCA API is running' });
});

// API routes
app.use('/api/contacts', contactsRouter);
app.use('/api/donations', donationsRouter);
app.use('/api/news', newsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/zones', zonesRouter);
app.use('/api/members', membersRouter);
app.use('/api/tiers', tiersRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/admin/applications', adminApplicationsRouter);
app.use('/api/audit', auditRouter);
app.use('/api', userRouter);


// In production: serve the React build as static files
if (isProd) {
  const distPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));
  // Catch-all: return index.html for any non-API route (React Router support)
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handler — must be registered last
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`IOCA server running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
});
