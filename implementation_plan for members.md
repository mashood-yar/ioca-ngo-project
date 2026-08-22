# Volunteer, Employee & Board Member Architecture

Based on industry best practices for enterprise and NGO systems, conflating paying "Members" (supporters) with internal staff (Employees, Board Members, Volunteers) leads to messy data models. 

Therefore, we will implement **Single Table Inheritance** for internal staff. We will create a dedicated `personnel` table that tracks all three distinct roles under one unified roof, using a `category` flag to differentiate them. This is the exact approach used by senior full-stack engineers to maintain clean, scalable relational databases.

## Key Decisions (Based on your feedback)
- **Language:** We will drop Urdu fields for team bios and stick strictly to English.
- **Visibility:** Only `board` and `partner` categories will be fetched and displayed on the public "About Us" page.
- **Verification:** **ALL** personnel (Board Members, Partners, Employees, and Volunteers) will automatically receive unique digital IDs and QR codes for the verification scanner. Employee and Volunteer profiles will be verifiable via scan but remain hidden from the "About Us" page.

---

## Proposed Changes

### 1. Database Architecture (Supabase)

#### [NEW] `personnel` Table
We will create a new table strictly for internal tracking.
```sql
CREATE TABLE public.personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('board', 'partner', 'employee', 'volunteer')),
  uid TEXT UNIQUE NOT NULL, -- e.g., 'EMP-8X29', 'VOL-9K1P', 'BOD-1A2B'
  
  -- Common Fields
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  profile_image_url TEXT,
  qr_code_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'former')),
  
  -- Role-Specific Fields
  title TEXT NOT NULL, -- e.g., "Chief Technical Officer" or "Field Volunteer"
  bio TEXT, -- Only populated/used for Board & Partners
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
*Why this is best practice:* It allows a single `/api/verify` endpoint to verify anyone associated with the NGO, while allowing the `/api/team` endpoint to easily filter by `category IN ('board', 'partner')`.

---

### 2. Backend API (Vercel)

#### [NEW] `api/verify/[uid].ts`
- **Purpose:** Public endpoint for the QR scanner.
- **Logic:** Queries `SELECT * FROM personnel WHERE uid = ?`. Returns the person's photo, name, title, category, and `status`. If `status` is 'suspended', it returns a specific flag so the frontend can show a red warning.

#### [NEW] `api/team/index.ts`
- **Purpose:** Public endpoint for the "About Us" page.
- **Logic:** Queries `SELECT * FROM personnel WHERE category IN ('board', 'partner') AND status = 'active' ORDER BY created_at ASC`.

#### [NEW] `api/admin/personnel/[...path].ts`
- **Purpose:** Admin CRUD operations for staff management.
- **Logic:** When creating a new person, the backend automatically generates a random 6-character `uid` based on their category (e.g., `VOL-XXXXXX`), generates a QR Code image using the `qrcode` library, uploads it to Cloudinary, and saves the URL in the database.

---

### 3. Frontend (React)

#### [MODIFY] `frontend/src/pages/About.tsx`
- Remove the hardcoded `teamMembers` from `mockData.ts`.
- Implement a `useEffect` hook to fetch data from `/api/team`.
- Render the team grid dynamically. Because we are dropping Urdu for this section, we will clean up the JSX to only use the English names, titles, and bios returned from the API.

#### [NEW] `frontend/src/pages/VerifyID.tsx`
- **Route:** `/verify/:uid`
- **UI:** A highly secure, visually distinct "Digital ID Card". 
- **Behavior:** 
  - Green theme + Checkmark for `active` status.
  - Red theme + Warning for `suspended` or `former` status.
  - Displays the person's category prominently (e.g., "Official Employee" vs "Registered Volunteer").

#### [NEW] `frontend/src/pages/admin/AdminPersonnel.tsx`
- **Purpose:** A dedicated, highly secure dashboard tab for HR/Admins to manage the organization's internal team.
- **Onboarding (Adding):** Board Members, Partners, and Employees do not apply publicly. Instead, the Admin clicks "Add Personnel", fills out their name, title, uploads a photo, selects their category, and hits save. The backend instantly provisions their unique ID and generates their QR code.
- **Offboarding (Replacing):** When someone leaves the NGO, we do not delete their record (which would break history). Instead, the Admin changes their status from `active` to `former`. 
  - This immediately removes them from the public "About Us" page.
  - If someone scans their old ID card, the verification page will clearly flag them in red as a "Former Employee/Member".

### Manual Verification
1. **Database:** Deploy the new `personnel` table via Supabase SQL editor.
2. **Admin Creation:** Create one Board Member, one Employee, and one Volunteer in the new Admin panel.
3. **About Us Page:** Navigate to `/about` and ensure **only** the Board Member appears.
4. **QR Scanning:** Navigate to `/verify/EMP-XXXXXX` and ensure the Employee ID card shows up correctly with a green "Verified" status.
