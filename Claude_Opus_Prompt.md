# CLAUDE OPUS MASTER PROMPT — IOCA NGO WEBSITE ENHANCEMENT

## YOUR ROLE
You are an expert Full-Stack Developer and UI/UX Designer specializing in React/TypeScript frontend development and NGO/nonprofit website design. You have deep knowledge of accessibility standards (WCAG 2.1), color psychology, and conversion optimization for charitable organizations.

## PROJECT CONTEXT
This is the IOCA (International Organization For Community Advancement) website — a Pakistan-based NGO website built with React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui on the frontend, with a dual backend (Express server + Vercel serverless functions), using Supabase for auth/database and Cloudinary for image uploads.

**Repository**: https://github.com/mashood-yar/ioca-ngo-project.git
**Clone and work from this repo — it contains the REAL, up-to-date code.**

## BRAND GUIDELINES (STRICT — MUST FOLLOW)

### Color Tokens (from `frontend/src/index.css`):
```
--color-brand-teal:    #569AD0  (Primary — trust, CTAs, links)
--color-brand-navy:    #1D2D49  (Authority — headers, text, footer)
--color-brand-gold:    #E6A726  (Warmth — donate CTAs, urgent banners)
--color-brand-white:   #FFFFFF  (Backgrounds)
--color-brand-gray:    #F5F5F5  (Page backgrounds)
```

### Typography:
```
--font-sans:      'Univers', 'Inter', system-ui, sans-serif;
--font-urduBody:  'Noto Nastaliq Urdu', serif;
```

### Golden Rules:
1. **NEVER use Tailwind's default `primary` class** — it maps to indigo (#4F46E5), NOT brand-teal
2. **NEVER use `indigo-`, `slate-`, `emerald-`, `blue-`, `green-`, `orange-`, `purple-` color utilities** in dashboard, login, signup, or admin pages
3. **ALWAYS use brand color utilities**: `brand-teal`, `brand-navy`, `brand-gold`, `brand-white`, `brand-gray`
4. **NEVER modify backend logic, API routes, database schema, or auth flows** unless explicitly instructed
5. **NEVER break existing functionality** — preserve all existing features while enhancing

---

## TASKS TO COMPLETE

### TASK 1: FIX MOBILE LOGIN/SIGNUP (CRITICAL)
**Problem**: Mobile users (below 768px) have ZERO way to log in or sign up. The login link in Navbar.tsx has `hidden md:flex` and the mobile menu has no auth links at all.

**Files to modify**:
- `frontend/src/components/Navbar.tsx`

**What to do**:
1. Add login and signup links to the mobile menu dropdown (inside the AnimatePresence mobile menu section)
2. Add a "Continue with Google" button in the mobile menu
3. When user IS logged in, show their avatar + name and a "Sign Out" button
4. Use brand colors: `text-brand-teal` for auth links, `border-brand-teal` for Google button
5. Ensure the mobile menu closes when any auth link is clicked
6. Match the existing mobile menu styling (py-2, border-b, etc.)

**Mobile menu should show** (when not logged in):
```
Home
About
Programs (dropdown)
Projects
Impact Stories
Gallery
Contact
Volunteer
Sign In [link to /user/login]
Sign Up [link to /signup]
Continue with Google [button]
Donate Now [existing button]
```

**Mobile menu should show** (when logged in):
```
[Avatar + Name]
Dashboard [link]
Sign Out [button]
[Existing nav items...]
```

---

### TASK 2: REBRAND USER DASHBOARD TO MATCH BRAND GUIDELINES
**Problem**: The UserDashboard uses entirely wrong colors (indigo, slate, emerald) — looks like a different company.

**Files to modify**:
- `frontend/src/pages/UserDashboard.tsx`

**What to do**:
1. Replace ALL `slate-*` color utilities with brand equivalents:
   - `bg-slate-50` → `bg-brand-gray`
   - `bg-slate-100` / `border-slate-100` → `bg-brand-navy/5` / `border-brand-navy/5`
   - `bg-slate-200` / `border-slate-200` → `bg-brand-navy/10` / `border-brand-navy/10`
   - `text-slate-400` → `text-brand-navy/40`
   - `text-slate-500` → `text-brand-navy/50`
   - `text-slate-600` → `text-brand-navy/60`
   - `text-slate-700` → `text-brand-navy/70`
   - `text-slate-800` → `text-brand-navy/80`
   - `text-slate-900` → `text-brand-navy`
   - `bg-slate-800` / `bg-slate-900` → `bg-brand-navy` / `bg-brand-navy/90`

2. Replace ALL `indigo-*` color utilities:
   - `bg-indigo-50` → `bg-brand-teal/10`
   - `text-indigo-600` / `text-indigo-700` → `text-brand-teal`
   - `border-indigo-600` / `border-indigo-500` → `border-brand-teal`
   - `bg-indigo-600` / `bg-indigo-700` → `bg-brand-teal`
   - `bg-indigo-500/20` → `bg-brand-teal/20`
   - `text-indigo-400` → `text-brand-teal/60`
   - `shadow-indigo-100` → `shadow-brand-teal/10`
   - `ring-indigo-500` → `ring-brand-teal`
   - `from-indigo-600 to-indigo-800` → `from-brand-teal to-brand-navy`

3. Replace ALL `emerald-*` color utilities:
   - `bg-emerald-50` → `bg-brand-teal/10`
   - `bg-emerald-600` / `bg-emerald-700` → `bg-brand-teal`
   - `text-emerald-600` / `text-emerald-700` → `text-brand-teal`
   - `shadow-emerald-100` → `shadow-brand-teal/10`

4. Replace ALL `amber-*` / `yellow-*` color utilities:
   - `bg-amber-50` → `bg-brand-gold/10`
   - `text-amber-700` → `text-brand-gold`

5. Keep ALL functionality intact — do not change any logic, state management, API calls, handlers, or data flow. Only change color utility classes.

6. Keep `bg-white` for card backgrounds — this is correct.

---

### TASK 3: REBRAND LOGIN & SIGNUP PAGES
**Problem**: Login and Signup pages use generic Tailwind `primary`, `gray-`, and `bg-gray-50` colors instead of brand colors.

**Files to modify**:
- `frontend/src/pages/UserLogin.tsx`
- `frontend/src/pages/UserSignup.tsx`

**What to do**:
1. Replace ALL color utilities to use brand palette:
   - `bg-gray-50` → `bg-brand-gray`
   - `text-gray-900` → `text-brand-navy`
   - `text-gray-600` → `text-brand-navy/60`
   - `text-gray-500` → `text-brand-navy/50`
   - `text-gray-400` → `text-brand-navy/40`
   - `text-gray-700` → `text-brand-navy/70`
   - `border-gray-300` → `border-brand-navy/20`
   - `border-gray-200` → `border-brand-navy/10`
   - `border-gray-100` → `border-brand-navy/5`
   - `focus:ring-primary` → `focus:ring-brand-teal`
   - `focus:border-primary` → `focus:border-brand-teal`
   - `bg-primary` → `bg-brand-teal`
   - `bg-primary/10` → `bg-brand-teal/10`
   - `text-primary` → `text-brand-teal`
   - `hover:bg-primary/90` → `hover:bg-brand-teal/90`
   - `shadow-gray-200/50` → `shadow-brand-navy/5`
   - `hover:bg-gray-50` → `hover:bg-brand-gray`

2. Change the Leaf icon container from `bg-primary/10` to `bg-brand-teal/10`
3. Change `text-primary` on icons to `text-brand-teal`
4. Keep ALL existing functionality — forms, validation, handlers, Google login — untouched

---

### TASK 4: FIX ADMIN PORTAL COLORS
**Problem**: Admin portal uses `#0D9488` (Tailwind teal-600/emerald-600) instead of `#569AD0` (brand-teal).

**Files to modify**:
- `frontend/src/pages/admin/AdminLayout.tsx`
- `frontend/src/pages/admin/AdminDashboard.tsx`
- `frontend/src/pages/admin/AdminPosts.tsx`
- Any other admin page files

**What to do**:
1. In AdminLayout.tsx:
   - Replace ALL `bg-[#0D9488]` with `bg-brand-teal`
   - Replace ALL `text-[#0D9488]` with `text-brand-teal`
   - Replace `border-[#0D9488]` with `border-brand-teal`
   - Keep `bg-[#1D2D49]` as `bg-brand-navy` (this is correct)
   - Keep `bg-[#162238]` (this is correct for sidebar header)

2. In AdminDashboard.tsx:
   - Replace stat card colors:
     - `text-blue-600` → `text-brand-teal`
     - `bg-blue-100` → `bg-brand-teal/10`
     - `text-green-600` → `text-brand-teal`
     - `bg-green-100` → `bg-brand-teal/10`
     - `text-orange-600` → `text-brand-gold`
     - `bg-orange-100` → `bg-brand-gold/10`
     - `text-purple-600` → `text-brand-teal`
     - `bg-purple-100` → `bg-brand-teal/10`
   - Replace `text-[#0D9488]` with `text-brand-teal`
   - Replace `text-[#0F766E]` with `text-brand-teal`

3. In AdminPosts.tsx:
   - Replace `focus:ring-[#0D9488]` with `focus:ring-brand-teal`
   - Replace `focus:border-[#0D9488]` with `focus:border-brand-teal`
   - Replace `file:bg-[#0D9488]/10` with `file:bg-brand-teal/10`
   - Replace `file:text-[#0D9488]` with `file:text-brand-teal`
   - Replace `hover:file:bg-[#0D9488]/20` with `hover:file:bg-brand-teal/20`

4. Keep ALL functionality intact — don't change any data loading, form handling, or API calls

---

### TASK 5: ADD TOAST NOTIFICATION SYSTEM
**Problem**: Code throughout the app dispatches 'app-toast' CustomEvents, but there's no listener to actually display them.

**Files to modify**:
- `frontend/src/App.tsx` (mount toast container)
- Create: `frontend/src/components/ui/Toast.tsx`
- Create: `frontend/src/components/ui/ToastContainer.tsx`

**What to do**:
1. Create a Toast component that accepts: message, variant ('success' | 'error' | 'info' | 'warning'), onClose callback, auto-dismiss (default 4s)
2. Style with brand colors:
   - Success: `bg-brand-teal` text white
   - Error: `bg-red-600` text white
   - Info: `bg-brand-navy` text white
   - Warning: `bg-brand-gold` text white
3. Create a ToastContainer that listens for 'app-toast' CustomEvents
4. Mount ToastContainer in App.tsx (inside the main div, before or after Routes)
5. Toast should appear at top-right of screen, stacked if multiple
6. Include close button and auto-dismiss with progress bar
7. Use framer-motion for enter/exit animations (slide in from right)

---

## IMPLEMENTATION WORKFLOW

1. **Clone the repo**: `git clone https://github.com/mashood-yar/ioca-ngo-project.git`
2. **Navigate to frontend**: `cd ioca-ngo-project/frontend`
3. **Install dependencies**: `npm install`
4. **Start development**: `npm run dev`
5. **Work through tasks in order** — P0 (Tasks 1-3) first, then P1 (Tasks 4-5)
6. **Test thoroughly**: Check desktop, tablet, and mobile breakpoints
7. **Verify brand consistency**: All colors should match #569AD0 (teal), #1D2D49 (navy), #E6A726 (gold)

## TESTING CHECKLIST

After completing all tasks, verify:

- [ ] Mobile menu shows Login, Sign Up, and Google Sign In links
- [ ] Mobile menu shows user avatar and Sign Out when logged in
- [ ] Dashboard uses brand-teal (#569AD0) instead of indigo
- [ ] Dashboard uses brand-navy (#1D2D49) instead of slate-900
- [ ] Login page uses brand-teal for primary button
- [ ] Login page has bg-brand-gray background
- [ ] Signup page matches login page branding
- [ ] Admin sidebar uses brand-teal (#569AD0) for active state
- [ ] Admin stat cards use brand palette
- [ ] Toast notifications appear when errors occur
- [ ] All existing functionality still works (forms submit, data loads, etc.)
- [ ] No broken layouts at any breakpoint (320px, 768px, 1024px, 1440px)

## IMPORTANT NOTES

- **DO NOT** change any backend code (server/, api/ directories)
- **DO NOT** change database schema or Prisma files
- **DO NOT** modify auth logic in useAuth.ts
- **DO NOT** change API endpoints or fetch logic
- **DO NOT** add/remove any routes from App.tsx
- **DO NOT** modify package.json or add new dependencies without approval
- **DO** preserve all existing animations and transitions
- **DO** use framer-motion for any new animations (already in project)
- **DO** use lucide-react for icons (already in project)
- **DO** test on mobile viewport (375px width minimum)

## PSYCHOLOGICAL CONTEXT

The brand colors were chosen for specific psychological impact:
- **Teal (#569AD0)**: Trust, healing, calm — reduces donor anxiety
- **Navy (#1D2D49)**: Authority, professionalism — builds credibility
- **Gold (#E6A726)**: Warmth, hope, urgency — drives action
- Together they communicate: "We are a credible, trustworthy organization that genuinely cares"

Every color choice should reinforce this message.

---

## QUESTIONS?

If any instruction is unclear, check the existing code patterns first — the project has consistent patterns you should follow. The existing main site (Home, About, Footer, Navbar desktop view) already uses brand colors correctly — use those as reference.

Reference files for correct brand usage:
- `frontend/src/components/Footer.tsx` — uses brand colors perfectly
- `frontend/src/components/Hero.tsx` — uses brand colors perfectly
- `frontend/src/pages/About.tsx` — uses brand colors perfectly
- `frontend/src/index.css` — defines the brand tokens

---

END OF PROMPT
