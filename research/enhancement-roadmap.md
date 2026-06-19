# IOCA Website — Strategic Enhancement Roadmap
## Phase 3 | June 19, 2026
### Mapped to 24-Law UX Framework + Donation Psychology

---

## Brand Token Compliance Note (applies to ALL items)
Every recommended change must use ONLY:
- Colors: `brand-teal` (#569AD0), `brand-navy` (#1D2D49), `brand-gold` (#E6A726), `brand-white`, `brand-gray`
- Fonts: `font-sans` (Univers) for English, `font-urduHeading`/`font-urduBody` (Noto Nastaliq) for Urdu
- No new colors. No new font imports. No new breakpoints.

---

## HORIZON 1 — Quick Wins (Low Effort / High Impact)
*Target: 1–3 days. Zero backend touchpoints.*

---

### H1-01: Fix Hero Headline Copy
- **Page:** `Hero.tsx`
- **Problem:** "The Smarter / Path to Creating Lasting Change" — generic, doesn't state WHO or WHERE. Fails the 5-second test.
- **Proposed Change:** Replace with emotionally direct, cause-specific copy:
  - EN Line 1 (extrabold): "Transforming Communities"
  - EN Line 2 (normal): "Across Pakistan — One Life at a Time"
  - UR Line 1: "پاکستان میں تبدیلی لا رہے ہیں"
  - UR Line 2: "ایک زندگی، ایک کمیونٹی"
- **UX Laws:** 5-Second Test, Peak-End Rule (first impression IS the peak), Gaze Cueing
- **Backend:** None
- **Effort:** S | **Impact:** L

---

### H1-02: Hero Slide Indicators
- **Page:** `Hero.tsx`
- **Problem:** 3-slide carousel with no navigation dots — invisible affordance. Users don't know content changes.
- **Proposed Change:** Add 3 clickable dot indicators at bottom-center of hero. Active dot = brand-gold, inactive = white/40.
- **UX Laws:** Visibility of System Status, Affordance
- **Backend:** None
- **Effort:** S | **Impact:** M

---

### H1-03: Fix Hero Slider stale closure bug
- **Page:** `Hero.tsx` — `useEffect` with `[]` dependency for `setInterval`
- **Problem:** `currentImages.length` is captured at mount. Language switch changes `currentImages` but the timer still uses the stale value.
- **Proposed Change:** Add `[currentImages.length]` to the `useEffect` dependency array. Reset `currentSlide` to 0 when language changes via a separate `useEffect` on `isUrdu`.
- **UX Laws:** Consistency & Standards
- **Backend:** None
- **Effort:** S | **Impact:** H (bug fix)

---

### H1-04: Fix text selection contrast (WCAG)
- **Page:** `App.tsx` (global)
- **Problem:** `selection:bg-brand-gold` + `selection:text-white` — contrast ratio ~2.1:1, fails WCAG AA (needs 4.5:1).
- **Proposed Change:** Change to `selection:bg-brand-navy selection:text-brand-white` (contrast 18:1, passes).
- **UX Laws:** WCAG 1.4.3
- **Backend:** None
- **Effort:** S | **Impact:** H (accessibility)

---

### H1-05: Fix About hero overlay color
- **Page:** `About.tsx`
- **Problem:** `bg-black/50` used instead of the brand pattern `bg-brand-navy/60`.
- **Proposed Change:** Replace `bg-black/50` with `bg-brand-navy/60`.
- **UX Laws:** Brand Consistency, Aesthetic-Usability Effect
- **Backend:** None
- **Effort:** S | **Impact:** L

---

### H1-06: Add Donation Modal Progress Bar
- **Component:** `DonationModal.tsx`
- **Problem:** 5-step flow with zero progress indication. Primary abandonment trigger.
- **Proposed Change:** Add a branded progress bar at the top of the modal:
  ```
  [Amount] → [Your Info] → [Payment] → [Confirm] → [Done!]
  ```
  Each step label lights up in `brand-teal` when active, `brand-gold` when complete.
- **UX Laws:** Zeigarnik Effect (completion desire), Endowed Progress Effect (feeling started = must finish), Doherty Threshold (responsiveness)
- **Backend:** None (pure UI)
- **Effort:** M | **Impact:** L (conversion-critical)

---

### H1-07: Add Impact Labels to Donation Amounts
- **Component:** `DonationModal.tsx` + `DonatePage.tsx`
- **Problem:** Amount buttons (Rs 1,000 / Rs 5,000 / Rs 10,000) have no impact context.
- **Proposed Change:** Add a single line below each amount:
  - Rs 1,000 → "Feeds a family for a week"
  - Rs 2,500 → "Provides school supplies for a child"
  - Rs 5,000 → "Funds a medical checkup camp"
  - Rs 10,000 → "Sponsors a student for a semester"
  - Rs 25,000 → "Equips a water filter system"
  - Rs 50,000 → "Supports an entire classroom"
- **UX Laws:** Anchoring, Fogg Behavior Model (motivation + trigger), Cognitive Load (reduces decision anxiety)
- **Backend:** None (copy change)
- **Effort:** S | **Impact:** L

---

### H1-08: Wire DonatePage Amount into Modal
- **Pages:** `DonatePage.tsx`, `DonationModal.tsx`
- **Problem:** The DonatePage amount selection is dead UI — clicking "Donate Now" opens the modal reset to its own default (Rs 5,000), ignoring the user's selection.
- **Proposed Change:** Pass the selected amount from `DonatePage` to the `onDonateClick` callback. The `App.tsx` handler should accept an optional `amount` param and pass it as `initialAmount` to `DonationModal`. Modal uses this as its default `amount` state.
- **UX Laws:** Consistency & Standards, Principle of Least Effort (don't make user pick twice), Commitment/Consistency
- **Backend:** None
- **Effort:** M | **Impact:** L

---

### H1-09: Replace Fake Newsletter with Honest CTA
- **Component:** `Footer.tsx`
- **Problem:** Newsletter form does `console.log` + shows "Subscribed!" confirmation. This is a deception.
- **Proposed Change:**
  - **If Sultan can wire it:** Coordinate endpoint for newsletter signup.
  - **If not yet:** Replace with a "Follow us on social" message and hide the email input until the endpoint is ready. NEVER fake a confirmation.
- **UX Laws:** Trust, Reciprocity
- **Backend:** Coordinate with Sultan | Flag: `POST /api/newsletter` needed
- **Effort:** S | **Impact:** H (trust-critical)

---

### H1-10: Real Social Links in Footer
- **Component:** `Footer.tsx`
- **Problem:** All social links point to `https://facebook.com` etc. — placeholder, not IOCA's profiles.
- **Proposed Change:** Replace with actual IOCA social URLs OR remove icons until profiles exist. Showing generic social links is worse than showing none.
- **UX Laws:** Trust Signals
- **Backend:** None
- **Effort:** S | **Impact:** H

---

### H1-11: Mobile Nav Tap Target Fix
- **Component:** `Navbar.tsx`
- **Problem:** Mobile menu auth links (Sign In / Sign Up) use only `py-2` — tap targets ~32px, below WCAG 2.5.5 minimum of 44px.
- **Proposed Change:** Add `min-h-[48px] flex items-center` to all mobile menu link/button elements.
- **UX Laws:** Fitts's Law, WCAG 2.5.5
- **Backend:** None
- **Effort:** S | **Impact:** H

---

### H1-12: Keyboard Focus Ring on Avatar Dropdown
- **Component:** `Navbar.tsx`
- **Problem:** Desktop user avatar button has no visible focus ring — keyboard navigation fails.
- **Proposed Change:** Add `focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2` to the avatar `<button>`.
- **UX Laws:** WCAG 2.4.7
- **Backend:** None
- **Effort:** S | **Impact:** H

---

### H1-13: Add OG / Social Meta Tags
- **All pages:** Helmet blocks
- **Problem:** No `og:image`, `og:title`, `og:description`, `twitter:card` tags. IOCA links shared on WhatsApp/FB/Twitter show blank previews.
- **Proposed Change:** Add a default OG image (use the hero section image), and page-specific OG meta to every page's `<Helmet>`.
- **UX Laws:** Trust Signal, First Impression (social proof)
- **Backend:** None
- **Effort:** M | **Impact:** H

---

### H1-14: ImpactStory expand scroll fix (mobile)
- **Page:** `ImpactStories.tsx`
- **Problem:** Expanding a story shows content ABOVE the "Read Full Story" button. On mobile, user can't see the expanded content without scrolling up.
- **Proposed Change:** On toggle expand, call `articleRef.scrollIntoView({ behavior: 'smooth', block: 'start' })`.
- **UX Laws:** Principle of Least Effort, Spatial Awareness
- **Backend:** None
- **Effort:** S | **Impact:** M

---

## HORIZON 2 — Mid-Term (Component Redesigns)
*Target: 1–2 weeks. Some backend coordination flagged.*

---

### H2-01: Donation Funnel — Add Monthly/Recurring Toggle
- **Component:** `DonationModal.tsx`, `DonatePage.tsx`
- **Problem:** No recurring option. International NGO benchmark: monthly giving shown by default.
- **Proposed Change:** Add One-Time / Monthly toggle above amount selection. Monthly framing: "Rs 1,000/month = 12,000/year of change" (commitment framing). Monthly should be default.
- **UX Laws:** Commitment/Consistency (recurring = higher LTV), Loss Aversion ("give monthly so the impact doesn't stop"), Anchoring
- **Backend:** Flag for Sultan — `saveDonation` needs a `frequency` field (`one-time` | `monthly`). Database schema needs `frequency` column.
- **Effort:** M | **Impact:** L

---

### H2-02: Programs Page — Add Hover CTA to Cards
- **Page:** `Programs.tsx`, `ProgramDetails.tsx`
- **Problem:** Program cards are entirely clickable but have no visible "Learn More" affordance. Users don't know they're interactive.
- **Proposed Change:** Add an "Explore Program →" button that appears on hover (or is always visible on mobile). Add program-specific stats to each card (beneficiaries, projects).
- **UX Laws:** Affordance, Fitts's Law, Progressive Disclosure
- **Backend:** None (mock data has stats)
- **Effort:** M | **Impact:** M

---

### H2-03: Impact Stats — Separate Trust Bar from Statistics
- **Component:** `ImpactBentoGrid.tsx`
- **Problem:** The "100% of donations..." certification tile competes with the stats tiles in the bento grid. Two competing messages.
- **Proposed Change:** Move certifications (PCP, FBR Tax Exempt, Zakat Eligible, Shariah Compliant) to a dedicated horizontal "Trust Strip" between Hero and the bento grid. Use `brand-navy` background with `brand-gold` icons. This is above-the-fold trust social proof.
- **UX Laws:** Von Restorff Effect (isolated trust signals are more memorable), Serial Position Effect (place trust early), Fogg Behavior Model (motivation before ask)
- **Backend:** None
- **Effort:** M | **Impact:** L

---

### H2-04: Gallery — Lightbox for Image Viewing
- **Page:** `Gallery.tsx`
- **Problem:** Gallery images are displayed in a grid but clicking them does nothing. No way to view full-size.
- **Proposed Change:** Add a simple lightbox: clicking an image opens a full-screen overlay with the image, title, description, and category. Prev/Next navigation. Keyboard accessible.
- **UX Laws:** Progressive Disclosure, Principle of Least Effort (don't navigate away to view an image)
- **Backend:** None (works with mock + live data)
- **Effort:** M | **Impact:** M

---

### H2-05: Skeleton Loading States
- **Pages:** `ImpactStories.tsx`, `Gallery.tsx`, `Projects.tsx`, `Events.tsx`, `News.tsx`
- **Problem:** When Sultan wires live data, pages with network fetches will momentarily show empty content. No loading state = perceived broken page.
- **Proposed Change:** Add skeleton loading cards using `brand-gray` animated pulse for all data-driven pages.
- **UX Laws:** Doherty Threshold (perceived responsiveness), Aesthetic-Usability Effect
- **Backend:** None (frontend only, triggered by loading state)
- **Effort:** M | **Impact:** H

---

### H2-06: Contact — Inline Validation
- **Page:** `Contact.tsx`
- **Problem:** No inline field validation. Errors only surface after submit, form doesn't highlight which field failed.
- **Proposed Change:** Add real-time validation (on blur) for each field: email format, phone format, required fields. Show error message in `text-red-600` with icon directly under the field.
- **UX Laws:** Error Prevention (WCAG 3.3.1), Principle of Least Effort
- **Backend:** None (frontend validation)
- **Effort:** M | **Impact:** H

---

### H2-07: Flag Bilingual Gap for Projects Live Data
- **`api.ts`**
- **Problem:** Live Projects data maps `titleUr: row.title` (English title) and has empty `locationEn`/`locationUr`.
- **Proposed Change (FLAG for Sultan):** Sultan needs to add `title_ur`, `description_ur`, `location_en`, `location_ur` to the projects table in Supabase schema. Until then, display a subtle "(Urdu coming soon)" indicator for live projects when in Urdu mode.
- **UX Laws:** Consistency & Standards, Bilingual UX
- **Backend:** Coordinate with Sultan — schema change required
- **Effort:** S (flag) / L (if Sultan implements) | **Impact:** H

---

### H2-08: Split UserDashboard.tsx (101KB)
- **Page:** `UserDashboard.tsx`
- **Problem:** At 101KB, this is a megafile. Bundle size, maintainability, and collaboration risk are all high.
- **Proposed Change:** Split into:
  - `UserDashboard.tsx` (shell with navigation/routing)
  - `dashboard/DashboardOverview.tsx`
  - `dashboard/DashboardDonations.tsx`
  - `dashboard/DashboardMembership.tsx`
  - `dashboard/DashboardProfile.tsx`
- **UX Laws:** Occam's Razor, Pareto Principle (maintainability)
- **Backend:** None
- **Effort:** M | **Impact:** M (code quality)

---

### H2-09: Donation Page — Add Story/Impact Section Above Form
- **Page:** `DonatePage.tsx`
- **Problem:** Page opens cold on a donation form. No emotional motivation presented first.
- **Proposed Change:** Add a 2-column section above the form: LEFT: a powerful 1-2 sentence impact story with a photo (rotate quarterly). RIGHT: 3 stat pills (lives impacted, camps organized, water projects). Then the donation form below.
- **UX Laws:** Fogg Behavior Model (motivation must come before ability/trigger), Storytelling, Peak-End Rule
- **Backend:** None (static content or pull from mockStories[0])
- **Effort:** M | **Impact:** L

---

## HORIZON 3 — Long-Term (New Patterns)
*Target: 3–8 weeks. Requires backend coordination.*

---

### H3-01: Live Impact/Transparency Dashboard
- **New Page:** `/impact` or section of `/about`
- **Problem:** NGO accountability is IOCA's stated value. The website says "100% transparent" but shows no live proof.
- **Proposed Change:** A live stats dashboard showing: total donations received, total beneficiaries served, active programs, latest project updates. Pull from real Supabase data.
- **UX Laws:** Trust, Social Proof, Transparency (stated brand value)
- **Backend:** Coordinate with Sultan — needs aggregation queries, possibly a `/api/stats` endpoint
- **Effort:** L | **Impact:** L

---

### H3-02: Scroll Storytelling on Homepage
- **Component:** New `ImpactScrollStory.tsx`
- **Problem:** Homepage goes: Hero → Stats → How We Work → Campaigns → Testimonials. There's no scroll-driven narrative thread — each section feels disconnected.
- **Proposed Change:** Add a horizontal scroll story section: "For every Rs 5,000 donated →" with 3 full-bleed illustrated panels showing the journey from donation to impact, with parallax and counter animations.
- **UX Laws:** Storytelling, Scroll Storytelling, Peak-End Rule (end the scroll journey on a powerful moment), Zeigarnik Effect (keep them scrolling to see the resolution)
- **Backend:** None
- **Effort:** L | **Impact:** L

---

### H3-03: Zakat Calculator Feature
- **New Component:** `ZakatCalculator.tsx` (modal or page section)
- **Problem:** IOCA is Zakat-eligible but doesn't help donors calculate their Zakat liability. This is a MASSIVE missed opportunity in the Pakistani NGO space — almost nobody does this.
- **Proposed Change:** A simple, Shariah-guided Zakat calculator: enter gold/silver/savings → calculator shows Zakat due → pre-fills donation form with the amount → "Pay Your Zakat to IOCA" CTA.
- **UX Laws:** Fogg Behavior Model (removes biggest friction: "how much should I give?"), Endowed Progress Effect, Conversion Psychology
- **Backend:** None (pure frontend math)
- **Effort:** M | **Impact:** L (potentially the highest-conversion feature on the entire site for the Pakistani Muslim audience)

---

### H3-04: Beneficiary Voice — Video Stories
- **Section:** Enhancement of `ImpactStories.tsx`
- **Problem:** Current impact stories are text + photo. The most persuasive NGO sites (charity:water, GiveDirectly) use short video testimonials.
- **Proposed Change:** Add optional `videoUrl` to `ImpactStory` type. When present, show a play button overlay on the story image that opens a lightweight video player. Short 60-90 second beneficiary videos.
- **UX Laws:** Social Proof (real beneficiary voices), Peak-End Rule, Fogg Behavior Model
- **Backend:** Sultan to add optional `video_url` column to impact_stories table. Cloudinary for hosting.
- **Effort:** L | **Impact:** L

---

## Summary Table

| ID | Page/Component | Problem | Change | UX Law | Backend | Effort | Impact |
|---|---|---|---|---|---|---|---|
| H1-01 | Hero.tsx | Generic headline fails 5-sec test | Rewrite copy | Peak-End, 5-Sec Test | None | S | L |
| H1-02 | Hero.tsx | No slide indicators | Add dots | Visibility of Status | None | S | M |
| H1-03 | Hero.tsx | Stale closure bug | Fix useEffect deps | Consistency | None | S | H |
| H1-04 | App.tsx | Selection contrast fails WCAG | brand-navy selection | WCAG 1.4.3 | None | S | H |
| H1-05 | About.tsx | Black overlay vs brand-navy | Fix overlay color | Brand Consistency | None | S | L |
| H1-06 | DonationModal | No progress bar (5 steps) | Add step progress bar | Zeigarnik, Endowed Progress | None | M | L |
| H1-07 | DonationModal | No impact per amount | Add impact labels | Anchoring, Fogg | None | S | L |
| H1-08 | DonatePage | Amount selection dead UI | Wire to modal | Consistency, Least Effort | None | M | L |
| H1-09 | Footer | Fake newsletter confirmation | Fix or remove | Trust | Sultan (newsletter EP) | S | H |
| H1-10 | Footer | Placeholder social links | Real URLs or remove | Trust | None | S | H |
| H1-11 | Navbar | Mobile tap targets too small | min-h-[48px] | Fitts's Law, WCAG 2.5.5 | None | S | H |
| H1-12 | Navbar | No focus ring on avatar | Add focus-visible ring | WCAG 2.4.7 | None | S | H |
| H1-13 | All pages | No OG meta tags | Add Helmet OG tags | Trust, Social Proof | None | M | H |
| H1-14 | ImpactStories | Expand doesn't scroll into view | scrollIntoView on expand | Least Effort | None | S | M |
| H2-01 | DonationModal | No monthly/recurring | Monthly toggle | Commitment/Consistency | Sultan (schema) | M | L |
| H2-02 | Programs | Cards have no hover CTA | Add "Explore" button | Affordance, Fitts | None | M | M |
| H2-03 | ImpactBentoGrid | Trust signals buried in stats | Separate Trust Bar | Von Restorff, Serial Position | None | M | L |
| H2-04 | Gallery | No lightbox | Add lightbox | Progressive Disclosure | None | M | M |
| H2-05 | Multiple pages | No skeleton/loading states | Add skeletons | Doherty Threshold | None | M | H |
| H2-06 | Contact | No inline validation | Add field validation | Error Prevention | None | M | H |
| H2-07 | api.ts | Projects missing Urdu data | Flag for Sultan | Bilingual Consistency | Sultan (schema) | S | H |
| H2-08 | UserDashboard | 101KB megafile | Split into sub-components | Occam's Razor | None | M | M |
| H2-09 | DonatePage | No story above form | Add impact + stats row | Fogg, Peak-End Rule | None | M | L |
| H3-01 | New /impact | No live transparency proof | Live stats dashboard | Trust, Social Proof | Sultan (new EP) | L | L |
| H3-02 | Home | Disconnected scroll journey | Scroll story section | Storytelling, Zeigarnik | None | L | L |
| H3-03 | New ZakatCalc | Missed Zakat calc opportunity | Zakat calculator widget | Fogg, Least Effort | None | M | L |
| H3-04 | ImpactStories | Text-only stories | Optional video support | Social Proof, Peak-End | Sultan (schema) | L | L |

---

## Session 1 Progress Log

### Session 1 — June 19, 2026

**Completed:**
- Phase 0: Full codebase audit (all pages, components, services, types)
- Phase 0: Design token sheet extracted (`research/design-tokens.md`)
- Phase 0: Mock vs Live data status mapped
- Phase 2: Full 40-issue audit log (`research/audit-findings.md`)
- Phase 3: Full 27-item enhancement roadmap (`research/enhancement-roadmap.md`)
- Phase 1: Competitive research delegated to research subagent (pending merge)

**Files Touched (read-only audit — NO changes made):**
- `frontend/src/index.css`, `tailwind.config.js`, `App.tsx`
- `frontend/src/components/Hero.tsx`, `Navbar.tsx`, `ImpactBentoGrid.tsx`, `DonationModal.tsx`, `Footer.tsx`
- `frontend/src/pages/Home.tsx`, `About.tsx`, `DonatePage.tsx`, `ImpactStories.tsx`
- `frontend/src/services/api.ts`, `frontend/src/types/index.ts`

**Deliverables Produced:**
- `research/design-tokens.md` ✅
- `research/audit-findings.md` ✅
- `research/enhancement-roadmap.md` ✅
- Competitive analysis: pending from research subagent

**Open Questions for Mashood:**
1. Can you confirm IOCA's real Facebook/Instagram/Twitter/LinkedIn URLs so we can fix the footer social links? (H1-10)
2. The DonatePage has dead amount selection UI — should we wire it to the modal (simpler) or build the page into its own standalone donation form (better UX, more work)?
3. For the newsletter: should we hold it as a "Coming Soon" or does Sultan have a plan for this endpoint?
4. Zakat Calculator (H3-03) — this could be the single most impactful feature for your Pakistani Muslim audience. Is this something you want to build?

**Open Questions for Sultan:**
1. Projects table needs `title_ur`, `description_ur`, `location_en`, `location_ur` columns for bilingual support. Is this in scope?
2. `saveDonation.ts` — can we add a `frequency` column (`one-time` | `monthly`) for recurring donations?
3. Newsletter endpoint — `POST /api/newsletter` — is this planned?
4. Donations with no `screenshotUrl` after manual payment should be clearly flagged in the Admin dashboard as "Pending Verification" — can you ensure this is surfaced?
5. `/api/stats` endpoint — for the live transparency dashboard (H3-01) — aggregated counts for beneficiaries, donations, projects.

**Next Session Should Start With:**
1. Read this progress log first.
2. Merge the competitive analysis from the research subagent into `research/competitive-analysis.md`.
3. Start Phase 4 implementation — recommended order:
   - H1-03 (stale closure bug — 5 min fix)
   - H1-04 (WCAG selection contrast — 1 min)
   - H1-11, H1-12 (tap targets + focus ring — 10 min)
   - H1-01 (hero copy — 10 min)
   - H1-02 (slide indicators — 20 min)
   - H1-06 (donation progress bar — 30 min)
   - H1-07 (impact labels on amounts — 20 min)
   - H1-08 (wire DonatePage amount to modal — 30 min)
