# IOCA — International Organization for Community Advancement

> [!WARNING]
> The `server/` directory (Express backend) is archived and has been fully superseded by Vercel Serverless Functions located in the root `/api/` folder. All active production API routes are served serverlessly.

Full-stack website for the International Organization for Community Advancement (IOCA), featuring a public-facing React SPA frontend and a serverless backend interacting with Supabase PostgreSQL, Supabase Auth, and Resend for transactional email notifications.

---

## 🚀 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router |
| **Backend (Serverless)** | Node.js + TypeScript, Vercel Serverless Functions (`@vercel/node@5.5.15`) |
| **Database & Auth** | Supabase (PostgreSQL + Supabase Auth + Row Level Security) |
| **Media Storage** | Cloudinary (Direct Base64 API uploads) |
| **Email** | Resend (Transactional client notifications) |
| **Deployment** | Vercel (SPA + serverless routing wrappers) |

---

## 📂 Project Structure

```text
├── frontend/                 # React SPA frontend (Vite project)
│   ├── src/
│   │   ├── admin/            # Protected CMS administrative panels
│   │   ├── components/       # Shared UI components
│   │   ├── pages/            # Public-facing and dashboard routes
│   │   └── lib/              # Client configs (Supabase,ApiClient)
├── api/                      # Vercel Serverless API Functions
│   ├── _lib/                 # Shared utilities (auth, email, upload, response)
│   ├── contacts/             # Contact query handlers
│   ├── donations/            # Donation processing handlers
│   ├── events/               # Event scheduling handlers
│   ├── news/                 # News publisher handlers
│   ├── projects/             # Project coordinator handlers
│   └── misc/                 # Consolidated catch-all (upload, zones, applications)
├── supabase/
│   └── schema.sql            # Database PostgreSQL DDL, constraints & RLS policies
├── prisma/                   # (Archived) Prisma schemas for reference only
├── server/                   # (Archived) Express backend project for reference only
├── vercel.json               # Vercel configuration
└── .env.example              # Centralized environment variable template
```

---

## 🔑 Environment Variables

To run the application locally and deploy to production, create a `.env` in the root repository. Note that the React frontend reads variables prefixed with `VITE_`.

```env
# Supabase Core Config
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key" # Bypasses RLS for serverless functions

# Database Connections (For reference/Prisma migrations)
DATABASE_URL="postgresql://postgres:password@your-project-pooler:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@your-project-direct:5432/postgres"

# Resend Transactional Email Config
RESEND_API_KEY="re_yourkey"
RESEND_FROM_EMAIL="onboarding@resend.dev" # Or your verified domain email

# Cloudinary CDN Storage
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Vercel Application Configuration
CLIENT_URL="http://localhost:3000"
PORT=3000

# Frontend Environment Config (Required by Vite client)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-public-key"
VITE_API_URL="http://localhost:3000" # Local dev API base, leave empty in Vercel prod settings
```

---

## 🛠️ Local Development Setup

### 1. Installation
Clone the repository and install dependencies at the root directory (which will install root, serverless, and frontend packages):

```bash
git clone https://github.com/sultan101004/ioca-ngo-project.git
cd ioca-ngo-project
npm install
```

### 2. Configure Database Schema
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** $\rightarrow$ **New Query**, copy the entire contents of [supabase/schema.sql](file:///c:/Users/Sultan/Desktop/IOCA/IOCA-International-Organization-For-Community-Advancement-Website/supabase/schema.sql), paste it, and click **Run**.
3. Create an admin user through Supabase Auth (or sign in with Google), copy their user UUID, and elevate their role by running:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE id = 'your-user-uuid';
   ```

### 3. Run Locally with Vercel CLI
To test the serverless functions locally alongside the React frontend, run:

```bash
npm install -g vercel   # If you don't have vercel CLI installed
vercel dev
```

This starts Vercel's local compiler which serves both the frontend SPA and the serverless functions at `http://localhost:3000` with hot-reloading.

---

## 📦 Production Deployment (Vercel)

1. Connect your GitHub repository to **Vercel**.
2. Vercel automatically reads the root [vercel.json](file:///c:/Users/Sultan/Desktop/IOCA/IOCA-International-Organization-For-Community-Advancement-Website/vercel.json) file and configures:
   - Build Command: `npm run build --prefix frontend` (Vite production build)
   - Output Directory: `frontend/dist`
   - Node Runtime: `20.x`
   - Functions: `@vercel/node@5.5.15`
3. Add the 15 environment variables listed in the configuration section to your **Vercel Project Settings**. Leave `VITE_API_URL` empty in Vercel settings so it defaults to relative paths on the same domain.
