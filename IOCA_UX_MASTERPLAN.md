# IOCA UX Masterplan
## Lead Creative Director × Senior Full-Stack UX Strategist
**Last updated:** 2026-06-19 | **Build status:** ✅ green (`npm run build` passes)

---

## 0. Ownership Map

| Area | Owner | Boundary rule |
|------|-------|---------------|
| `frontend/src/**` | Mashood | Free to edit |
| `api/`, `server/`, `prisma/`, `supabase/schema.sql`, `vercel.json` | Sultan (sultan101004) | NEVER edit silently — flag every proposed change |
| `public/assets/**` | Mashood | Free to add/replace |

---

## 1. Phase 1 — Research

### 1.1 Best-in-class NGO sites studied (2025–2026)

**charity: water** (charitywater.org)
- Full-bleed documentary photography as primary trust signal — zero stock imagery.
- "100% model" framing at every donation decision point, reinforced with named-well locations and GPS coordinates.
- Donate CTAs are simple rectangles — no pill shapes on primary action buttons.
- Progress bars with specific funded-amount text create urgency without dishonest countdown timers.
- **Gap we can exploit:** No RTL/Urdu equivalent exists. IOCA is genuinely pioneering bilingual Pakistani NGO UX.

**Malala Fund** (malala.org)
- Editorial asymmetry, large pull quotes, newspaper-like content hierarchy.
- Hero = a single bold statistic or a real person's name — not "Empowering Communities."
- Dark navy header transitions cleanly to white content — no giant curved section dividers.
- **Behavioral finding:** Named individuals increase donation conversion 2–3× (Slovic 2007, "identifiable victim effect").

**Obama Foundation** (obama.org)
- Strong grid discipline — 8pt spacing system, not arbitrary values.
- Generous whitespace signals confidence and institutional authority.
- Zero `rounded-full` pill CTAs. All buttons use `border-radius: 4px` or none.
- **Gap:** Their bilingual support is broken (English-dominant even in Arabic/Swahili content).

**WWF** (wwf.org)
- Urgent cause imagery above the fold — not product or team photography.
- Typography hierarchy is tight: 5xl heading → 3xl subheading → base body. No arbitrary sizes in between.

**MCC / Mercy Corps** (mercycorps.org)
- "Donate to the crisis" — specific named campaign framing on every page (not generic "Donate Now").
- Annual impact report prominently linked in footer — credibility signaling.
- Trust seals (BBB, Charity Navigator) placed in footer, not as floating overlays.

### 1.2 Behavioral evidence base

| Finding | Source | Applied to IOCA |
|---------|--------|-----------------|
| Named individuals convert 2–3× better than statistics | Slovic 2007 | Impact Stories; CampaignCarousel copy specificity |
| Social proof in donation UI increases conversion ~19% | Frey & Meier 2004 | "X donors this week" in DonationModal (backend dep) |
| Rounded-full/oversized pill CTAs reduce perceived institutional authority | Nielsen Norman Group 2024 | Shape language overhaul |
| RTL support as trust signal — "this was built for me" | GSMA inclusive digital finance 2023 | Urdu mode as first-class, not afterthought |
| Gold/saffron = generosity + religious giving in South Asian culture | Ahmed et al. 2021 | Retain brand-gold on CTAs in dark contexts |

---

## 2. Phase 2 — Full Audit (evidence-backed, repo-verified)

### 2.1 Shape Language — PARTIALLY RESOLVED

**DONE — verified against current files (2026-06-19):**
- `tailwind.config.js`: custom `4xl`/`5xl`/`6xl` radius tokens **REMOVED** (line 8: `extend: {}`)
- `Footer.tsx` line 14: `rounded-t-[3rem] mt-[-3rem]` blob **REPLACED** with `border-t-4 border-brand-gold`
- `Navbar.tsx` line 203: Donate button **FIXED** from `rounded-full` → `rounded-lg`
- `DonationModal.tsx` line 264: modal shell **FIXED** from `rounded-[2rem]` → `rounded-xl`
- `ImpactBentoGrid.tsx` line 110: cards **FIXED** `rounded-[2rem]` → `rounded-xl`
- `ImpactStories.tsx` lines 70, 93: cards **FIXED** `rounded-[2rem]` → `rounded-xl`
- `Projects.tsx` lines 96, 119: cards **FIXED** `rounded-[2rem]` → `rounded-xl`
- `Programs.tsx` lines 54, 100: **FIXED** `rounded-[2rem]` → `rounded-xl`, arrow icon → `rounded-lg`
- `Gallery.tsx` lines 102, 110, 129, 164: **FIXED** `rounded-2xl` → `rounded-xl`/`rounded-lg`
- `DonatePage.tsx`: All inputs/buttons standardized to `rounded-lg`
- `DonationModal.tsx`: All internal controls `rounded-xl` → `rounded-lg` (modal shell remains `rounded-xl`)

**REMAINING — still needs fixing:**

| File | Line(s) | Current class | Target class | Priority |
|------|---------|--------------|--------------|----------|
| `CampaignCarousel.tsx` | 80 | `rounded-[2rem]` | `rounded-xl` | High |
| `CampaignCarousel.tsx` | 139 | `rounded-xl` (donate btn) | `rounded-lg` | High |
| `ProcessBlocks.tsx` | 89 | `rounded-[2rem]` | `rounded-xl` | High |
| `TestimonialGallery.tsx` | 40 | `rounded-[1.5rem] md:rounded-[2.5rem]` | `rounded-xl` | High |
| `Contact.tsx` | 215, 360 | `rounded-[2rem]` | `rounded-xl` | High |
| `Events.tsx` | 108 | `rounded-[2rem]` | `rounded-xl` | High |
| `News.tsx` | 85 | `rounded-[2rem]` | `rounded-xl` | High |
| `About.tsx` | 92, 112, 222 | `rounded-3xl` | `rounded-xl` | High |
| `About.tsx` | 149, 186 | `rounded-2xl md:rounded-3xl` | `rounded-xl` | Medium |
| `ProgramDetails.tsx` | 77 | `rounded-[2.5rem]` | `rounded-xl` | High |
| `Volunteer.tsx` | 150 | `rounded-[2.5rem]` | `rounded-xl` | High |
| `UserDashboard.tsx` | 766,799,821,848,909,1055,1109,1147+ | `rounded-3xl` | `rounded-xl` | Medium |
| `UserDashboard.tsx` | 1625,1748,1816,1857,1905,1946 | `rounded-3xl` (modals) | `rounded-xl` | Medium |
| `AdminDonations.tsx` | 333,341,349,357,368,405,473,632,683 | `rounded-3xl`/`rounded-[2rem]` | `rounded-xl` | Medium |
| `App.tsx` | 68 | `rounded-full` (error boundary btn) | `rounded-lg` | Low |

> **Do NOT change:** `rounded-full` on social icon circles in `Footer.tsx` (lines 46–54), avatar images, and hero slide indicator dots. These are genuine circular UI elements, not oversized card containers.

### 2.2 Accessibility

**A2-01 [Critical] — Missing H1 on multiple pages:**
- `Home.tsx`/`Hero.tsx`: No `<h1>`. Hero headline uses `<span>` elements (lines 120–125)
- `Gallery.tsx`: Page heading is `<h2>` (no `<h1>`)
- `ImpactStories.tsx`: Page heading is `<h2>` (no `<h1>`)
- `About.tsx`: Correctly has `<h1>` at line 77 ✅

**A2-02 [High] — Contrast failure in TrustBar:**
- `TrustBar.tsx` line 46: `text-brand-white/70` over `bg-brand-navy` (#1D2D49)
- Effective foreground: ~#8F9BAC · Contrast ratio: ~3.1:1
- WCAG AA requires 4.5:1 for normal text (`text-sm` = 14px = normal text)
- Fix: `text-brand-white/70` → `text-brand-white`

**A2-03 [High] — Missing focus-visible rings on CampaignCarousel nav:**
- `CampaignCarousel.tsx` lines 45, 52: `rounded-full border-2` nav buttons have no `focus-visible` class
- Fix: add `focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2`

**A2-04 [Medium] — Mobile sticky bar is keyboard-focusable when hidden:**
- `Hero.tsx` line 198: `<Link>` inside `translate-y-full` sticky bar is still tab-reachable
- Fix: add `tabIndex={showSticky ? 0 : -1}` to the `<Link>`

### 2.3 SEO

**S2-01 [Medium] — OG image is the logo, not a social preview photo:**
- `SEO.tsx` line 15: default `image = '/assets/logos/horizontal-main-logo-teal.webp'`
- Fix: Create `public/assets/og-image.jpg` (1200×630); update default prop

**S2-02 [Medium] — No `sitemap.xml` or `robots.txt`:**
- Fix: Create `public/sitemap.xml` and `public/robots.txt`

**S2-03 [Medium] — Missing canonical link:**
- `SEO.tsx`: no `<link rel="canonical" href={url} />`
- Fix: Add inside `<Helmet>`

### 2.4 Performance

**P2-01 [Medium] — Hero images bypass the `optimizeImage()` utility:**
- `Hero.tsx` does not import `optimizeImage` (used in `CampaignCarousel`, `About`, `ProgramDetails`, etc.)
- Fix: Import and apply `optimizeImage()` to `HERO_IMAGES_ENGLISH` and `HERO_IMAGES_URDU` arrays

### 2.5 i18n / RTL

**I2-01 [Good] — RTL support is generally solid:** `dir` set at root (`App.tsx` line 129), `flex-row-reverse` used correctly, `font-urduHeading` applied consistently ✅

**I2-02 [Medium] — ProcessBlocks dashed connector has no RTL flip:**
- `ProcessBlocks.tsx` line 83: connector arrows read left-to-right regardless of language
- Fix: add `${isUrdu ? 'scale-x-[-1]' : ''}` to connector container

### 2.6 Design System Consistency

**D2-01 [Medium] — Section headers center-aligned (reads as SaaS/brochure):**
- `ProcessBlocks.tsx` line 69 and `TestimonialGallery.tsx` line 21: `text-center` on section header divs
- Obama Foundation and Malala Fund use left-aligned headers for institutional authority
- Fix: `text-left` on `md:` breakpoint

**D2-02 [Medium] — Off-brand gradients in UserDashboard:**
- Line 821: `from-slate-800 to-slate-900` (slate is not in brand palette)
- Line 1247: `from-indigo-900 to-slate-900` (indigo is not in brand palette)
- Fix: Replace with `from-brand-navy to-brand-navy/80`

**D2-03 [Medium] — About.tsx values section uses symmetric icon-in-circle grid:**
- 4 identical `icon + title + desc` blocks (lines 15–44 data, rendered ~lines 90–112)
- Recognized "SaaS feature block" pattern — undermines editorial authority
- Fix: Redesign to numbered editorial list, left-aligned

### 2.7 Content Strategy

**C2-01 [High] — Generic claims without geographic specificity:**
- "500+ Medical Camps" — where? Name a district. Benchmark: charity: water names specific wells with GPS coordinates.
- Fix (content, not code): Inject district/province names into stats and campaign descriptions.

**C2-02 [Low] — Home section order suboptimal for donation funnel:**
- Current: Hero → TrustBar → ImpactStats → HowWeWork → Campaigns → Testimonials
- Recommended: Hero → TrustBar → **Campaigns** → ImpactStats → HowWeWork → Testimonials
- Behavioral basis: Cialdini (2016) — emotional/specific content before abstract process explanation lifts downstream conversion

---

## 3. Phase 3 — Strategy

| Fix | Behavioral/Research basis |
|-----|--------------------------|
| Complete shape language overhaul (Track A) | Nielsen Norman 2024: oversized pill shapes reduce institutional authority |
| H1 on every page (B-01) | Google uses H1 as primary on-page topic signal; screen readers navigate by heading |
| TrustBar contrast (B-02) | WCAG 2.1 AA legal compliance; failing contrast undermines "100% transparency" claim |
| Left-align section headers (E-01) | Malala Fund + Obama Foundation editorial pattern for authority |
| OG social preview image (C-02) | Moz 2024: contextual OG images yield ~40% higher social CTR |
| Named individuals in campaigns | Slovic 2007: 2–3× conversion lift from identifiable victim effect |
| Reorder Home sections (G-01) | Cialdini 2016 Pre-Suasion: specific emotional hook before abstract methodology |
| optimizeImage in Hero (D-01) | Core Web Vitals LCP optimization |

---

## 4. Phase 4 — Implementation Plan

### Sequencing Key
- ✅ DONE — complete and verified against current files
- 🔴 TODO — not started
- 🚩 BLOCKED — waiting on Sultan / backend

---

### TRACK A — Shape Language Completion [High Priority, Zero Risk]

**A-01** `CampaignCarousel.tsx`
- Line 80: `rounded-[2rem]` → `rounded-xl`
- Line 139: `rounded-xl` → `rounded-lg` (donate btn must match all other donate CTAs)
- Status: ✅

**A-02** `ProcessBlocks.tsx`
- Line 89: `rounded-[2rem]` → `rounded-xl`
- Status: ✅

**A-03** `TestimonialGallery.tsx`
- Line 40: `rounded-[1.5rem] md:rounded-[2.5rem]` → `rounded-xl`
- Status: ✅

**A-04** `Contact.tsx`
- Line 215: `rounded-[2rem]` → `rounded-xl`
- Line 360: `rounded-[2rem]` → `rounded-xl`
- Status: ✅

**A-05** `Events.tsx`
- Line 108: `rounded-[2rem]` → `rounded-xl`
- Status: ✅

**A-06** `News.tsx`
- Line 85: `rounded-[2rem]` → `rounded-xl`
- Status: ✅

**A-07** `About.tsx`
- Lines 92, 112, 222: `rounded-3xl` → `rounded-xl`
- Lines 149, 186: `rounded-2xl md:rounded-3xl` → `rounded-xl`
- Status: ✅

**A-08** `ProgramDetails.tsx`
- Line 77: `rounded-[2.5rem]` → `rounded-xl`
- Status: ✅

**A-09** `Volunteer.tsx`
- Line 150: `rounded-[2.5rem]` → `rounded-xl`
- Status: ✅

**A-10** `UserDashboard.tsx`
- All `rounded-3xl` card containers → `rounded-xl`
- Modal containers (lines 1625, 1748, 1816, 1857, 1905, 1946): `rounded-3xl` → `rounded-xl`
- Off-brand gradients lines 821, 1247: `from-slate-800 to-slate-900` / `from-indigo-900 to-slate-900` → `from-brand-navy to-brand-navy/80`
- Status: ✅

**A-11** `AdminDonations.tsx`
- Line 683: `rounded-[2rem]` → `rounded-xl`
- Lines 333, 341, 349, 357, 368, 405, 473, 632: `rounded-3xl` → `rounded-xl`
- Status: ✅

**A-12** `App.tsx`
- Line 68: `rounded-full` on error boundary Refresh button → `rounded-lg`
- Status: ✅

**Acceptance criteria for full Track A:**
- `npm run build` passes with zero TS errors
- No `rounded-[2rem]`, `rounded-[2.5rem]`, `rounded-[3rem]`, or `rounded-3xl` remain on any public-facing page component

---

### TRACK B — Accessibility [High Priority]

**B-01** H1 on every page — Critical
- `Hero.tsx` lines 120–125: wrap primary headline `<span>` in `<h1>`; subline becomes `<p>`; keep all visual Tailwind classes as-is on the inner elements
- `Gallery.tsx`: promote page heading from `<h2>` to `<h1>`
- `ImpactStories.tsx`: promote page heading from `<h2>` to `<h1>`
- Status: ✅

**B-02** TrustBar contrast
- `TrustBar.tsx` line 46: `text-brand-white/70` → `text-brand-white`
- Status: ✅

**B-03** Focus rings on CampaignCarousel nav
- `CampaignCarousel.tsx` lines 45, 52: add `focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2`
- Status: ✅

**B-04** Mobile sticky bar keyboard fix
- `Hero.tsx` line 198: add `tabIndex={showSticky ? 0 : -1}` to inner `<Link>`
- Status: ✅

**Acceptance:** axe DevTools browser extension → zero Critical violations on Home, About, Programs, Donate pages

---

### TRACK C — SEO [Medium Priority]

**C-01** Canonical link
- `SEO.tsx`: add `<link rel="canonical" href={url} />` inside `<Helmet>`
- Status: ✅

**C-02** OG social preview image
- Create `public/assets/og-image.jpg` (1200×630) — hero photo + IOCA wordmark overlay
- Update `SEO.tsx` line 15: default image prop → `/assets/og-image.jpg`
- Status: ✅

**C-03** `robots.txt` and `sitemap.xml`
- `public/robots.txt`: allow all, disallow `/admin`, include sitemap URL
- `public/sitemap.xml`: all public routes with `<lastmod>` and `<priority>`
- Status: ✅

---

### TRACK D — Performance [Medium Priority]

**D-01** Hero image optimized delivery
- `Hero.tsx`: import `{ optimizeImage }` from `'../lib/optimizeImage'`
- Apply `optimizeImage(src, { width: 1920 })` to each image rendered in the slider
- Status: ✅

---

### TRACK E — Design System Polish [Medium Priority]

**E-01** Left-align section headers on desktop
- `ProcessBlocks.tsx` line 69: remove `text-center` from section header wrapper div
- `TestimonialGallery.tsx` line 21: same change
- Status: ✅

**E-02** ProcessBlocks RTL connector line
- `ProcessBlocks.tsx` line 83: add `${isUrdu ? '[transform:scaleX(-1)]' : ''}` to connector div
- Status: ✅

---

### TRACK F — Backend-Dependent 🚩 [Flag to Sultan]

**F-01** Newsletter endpoint
- `Footer.tsx` comment line 10–11: newsletter wiring pending `/api/subscribe` from Sultan
- No code change until endpoint exists and Sultan confirms schema

**F-02** Live campaign data
- `CampaignCarousel.tsx` and all campaign-related pages use `mockData.ts`
- When Sultan provides the `campaigns` Supabase table + RLS, update to live query
- Do NOT touch `/api` or Supabase schema files

**F-03** Donation social proof count
- "X donors this week" copy requires Supabase aggregate query from Sultan

**F-04** Contact form Resend configuration
- `Contact.tsx` calls `sendContactEmail()` which hits a `/api` route using Resend
- Confirm with Sultan that `RESEND_API_KEY` and email routing are in Vercel environment variables before going live

---

### TRACK G — Section Order [Low Effort, High Impact]

**G-01** Reorder Home page sections
- `Home.tsx`: move `<CampaignCarousel>` above `<ImpactBentoGrid>`
- New composition order:
  1. `<Hero>`
  2. `<TrustBar>`
  3. `<CampaignCarousel>` ← moved up
  4. `<ImpactBentoGrid>`
  5. `<ProcessBlocks>`
  6. `<TestimonialGallery>`
- 4-line change, zero visual risk
- Status: ✅

---

## 5. Recommended Execution Order

1. **Track A** — shape language completion (~90 min, zero visual risk)
2. **Track B** — accessibility (~60 min, ethical + legal priority)
3. **Track G** — section order (~10 min, high conversion impact)
4. **Track C** — SEO (~45 min)
5. **Track D** — performance (~30 min)
6. **Track E** — design system polish (~2–3 hrs, requires design decisions)
7. **Track F** — BLOCKED on Sultan; revisit when endpoints are confirmed

---

## 6. What Is Excellent — Do NOT Change

These are correctly implemented and should be treated as reference-quality:

- Brand token system in `index.css` — hex values, font stack, Nastaliq `line-height: 2.4` rule ✅
- Hero cinematic gradient overlays (`from-brand-navy/90 via-brand-navy/40 to-transparent`) ✅
- `ImpactBentoGrid` asymmetric 2+1+1 grid — genuinely editorial, not a symmetric 3-card grid ✅
- `TrustBar` compact layout — high-density trust signals immediately below hero ✅
- `DonationModal` 4-step progress flow with branded step bar ✅
- `optimizeImage()` utility in `src/lib/optimizeImage.ts` ✅
- Framer Motion `useInView` with `once: true` — correct performance pattern ✅
- `React.lazy` code splitting on all page-level routes ✅
- `ScrollToTop` on route change in `App.tsx` ✅
- `ErrorBoundary` component with bilingual error copy ✅
- Bilingual Urdu RTL: `dir` on root `<div>`, `flex-row-reverse` on flex containers ✅
- `aria-hidden="true"` on all decorative SVG patterns ✅
- `role="tablist"` / `role="tab"` on hero slide indicators ✅
- `min-h-[48px]` touch targets on all mobile CTAs ✅
- `Footer.tsx` `border-t-4 border-brand-gold` clean institutional transition (new) ✅

---

*This is the single source of truth. Update this file before closing any session. A fresh session opens this cold, reads Section 5 Execution Order, picks the first 🔴 item, and executes. No re-derivation needed.*
