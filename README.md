# IOCA — International Organization for Community Advancement

Full-stack website for the International Organization for Community Advancement (IOCA), featuring a public-facing React frontend with Supabase for database/auth and Resend for contact form emails.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router |
| Database & Auth | Supabase (PostgreSQL + Auth + RLS) |
| Email | Resend (Vercel serverless function) |
| Deployment | Vercel (frontend + API routes) |

## Project Structure

```
├── frontend/
│   └── src/
│       ├── admin/            # Protected admin panel
│       ├── lib/              # Supabase client, auth, email helpers
│       └── pages/            # Public-facing pages
├── api/
│   └── contact.ts            # Vercel serverless function (Resend + Supabase)
├── supabase/
│   └── schema.sql            # Database schema (run in Supabase SQL editor)
├── .env.example
└── vercel.json
```

## Local Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Resend](https://resend.com) account (for contact form emails)

### 1. Clone and install

```bash
git clone https://github.com/mashood-yar/IOCA-International-Organization-For-Community-Advancement-Website.git
cd IOCA-International-Organization-For-Community-Advancement-Website
cd frontend && npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Copy your **Project URL** and **anon public key** from **Settings → API**

### 3. Run database schema

1. Open your Supabase project → **SQL Editor**
2. Paste the contents of `supabase/schema.sql` and run it

### 4. Create an admin user

1. In Supabase → **Authentication → Users** → **Add user** (email + password)
2. Copy the user's UUID from the users table
3. In **SQL Editor**, set their role to admin:

```sql
insert into profiles (id, name, role)
values ('<user-uuid>', 'Admin', 'admin');
```

### 5. Configure environment

```bash
cp .env.example .env
```

Create `frontend/.env` with the same values (Vite reads env from the `frontend/` directory).

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `RESEND_API_KEY` | Resend API key (serverless only) |
| `CONTACT_EMAIL_TO` | Email address that receives contact form submissions |

### 6. Run development server

```bash
cd frontend
npm run dev
```

- Frontend: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin/login`

> **Note:** The contact form calls `/api/contact`, which is a Vercel serverless function. For local contact form testing, run `npm run dev:vercel` from the `frontend/` directory.

## Admin Panel

| Route | Access | Description |
|-------|--------|-------------|
| `/admin/login` | Public | Email + password login via Supabase Auth |
| `/admin/dashboard` | Protected | View and delete contact submissions |

## Build

```bash
cd frontend
npm run build
```

## Deployment (Vercel)

1. Import the GitHub repo at [vercel.com](https://vercel.com)
2. The root `vercel.json` configures the build automatically
3. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`
   - `CONTACT_EMAIL_TO`

## License

Private — IOCA project.
