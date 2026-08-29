import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from '../backend/_lib/cors';

import keepAlive from '../backend/keep-alive';
import adminPersonnel from '../backend/admin/personnel/[...path]';
import contacts from '../backend/contacts/[...path]';
import donations from '../backend/donations/[...path]';
import events from '../backend/events/[...path]';
import gallery from '../backend/gallery/[...path]';
import impactStats from '../backend/impact-stats/index';
import misc from '../backend/misc/[...path]';
import news from '../backend/news/[...path]';
import programs from '../backend/programs/[...path]';
import projects from '../backend/projects/[...path]';
import siteSettings from '../backend/site-settings/index';
import team from '../backend/team/index';
import testimonials from '../backend/testimonials/index';
import verify from '../backend/verify/[uid]';

async function router(req: VercelRequest, res: VercelResponse) {
  const url = req.url?.split('?')[0] || '';
  const parts = url.split('/').filter(Boolean); // e.g. ['api', 'gallery', 'something']
  
  if (parts[1] === 'keep-alive') return keepAlive(req, res);
  if (parts[1] === 'admin' && parts[2] === 'personnel') {
    req.query.path = parts.slice(3);
    return adminPersonnel(req, res);
  }
  if (parts[1] === 'contacts') { req.query.path = parts.slice(2); return contacts(req, res); }
  if (parts[1] === 'donations') { req.query.path = parts.slice(2); return donations(req, res); }
  if (parts[1] === 'events') { req.query.path = parts.slice(2); return events(req, res); }
  if (parts[1] === 'gallery') { req.query.path = parts.slice(2); return gallery(req, res); }
  if (parts[1] === 'impact-stats') return impactStats(req, res);
  if (parts[1] === 'misc') { req.query.path = parts.slice(2); return misc(req, res); }
  if (parts[1] === 'news') { req.query.path = parts.slice(2); return news(req, res); }
  if (parts[1] === 'programs') { req.query.path = parts.slice(2); return programs(req, res); }
  if (parts[1] === 'projects') { req.query.path = parts.slice(2); return projects(req, res); }
  if (parts[1] === 'site-settings') return siteSettings(req, res);
  if (parts[1] === 'team') return team(req, res);
  if (parts[1] === 'testimonials') return testimonials(req, res);
  if (parts[1] === 'verify') { req.query.uid = parts[2]; return verify(req, res); }
  
  if (parts[1] === 'admin') { req.query.path = ['admin', ...parts.slice(2)]; return misc(req, res); }
  if (parts[1] === 'profile') { req.query.path = ['profile', ...parts.slice(2)]; return misc(req, res); }
  if (parts[1] === 'memberships') { req.query.path = ['memberships', ...parts.slice(2)]; return misc(req, res); }
  if (parts[1] === 'event-registrations') { req.query.path = ['event-registrations', ...parts.slice(2)]; return misc(req, res); }
  if (parts[1] === 'members') { req.query.path = ['members', ...parts.slice(2)]; return misc(req, res); }
  if (parts[1] === 'zones') { req.query.path = ['zones', ...parts.slice(2)]; return misc(req, res); }
  if (parts[1] === 'tiers') { req.query.path = ['tiers', ...parts.slice(2)]; return misc(req, res); }

  return res.status(404).json({ error: 'Not found' });
}

export default allowCors(router);
