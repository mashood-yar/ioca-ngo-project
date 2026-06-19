# IOCA Website — Full Audit Findings
## Phase 2 Audit | June 19, 2026
### Severity: Critical / High / Medium / Low

---

## Design Token Key (reference)
- brand-teal: #569AD0 | brand-navy: #1D2D49 | brand-gold: #E6A726 | brand-gray: #F5F5F5

---

## AUDIT FINDINGS LOG

| # | Page/Component | Issue | Severity | UX Principle | Fix Direction |
|---|---|---|---|---|---|
| 1 | Hero | Headline copy "The Smarter / Path to Creating Lasting Change" is disconnected, generic, and fails the 5-second test. Does not state WHO IOCA is or WHAT they do. | **Critical** | Peak-End Rule, 5-Second Test | Rewrite to state the cause + geography + proof in one bold line. E.g. "Transforming Lives in Pakistan" with supporting stat. |
| 2 | Hero | No slide navigation dots/indicators. User has no idea there are 3 slides. Invisible affordance. | **High** | Visibility of System Status (Nielsen) | Add 3 dot indicators bottom-center of hero. |
| 3 | Hero | Slider interval dependency bug: `setInterval` in `useEffect` captures stale `currentImages.length` since dependency array is `[]`. Language switch won't restart timer with correct array. | **High** | Frontend Code — Stale Closure | Add `currentImages.length` to the useEffect dependency array. |
| 4 | Hero | Slide transition resets to slide 0 when language is toggled (state not preserved). Jarring UX. | **Medium** | Consistency & Standards | Reset `currentSlide` to 0 on language switch with `useEffect`. |
| 5 | Hero | Hero alt text is "Hero background" on all 3 slides — meaningless for screen readers. | **High** | WCAG 2.1 AA (1.1.1) | Use descriptive per-slide alt text or mark as aria-hidden if purely decorative. |
| 6 | ImpactBentoGrid | Stats (500+, 50K, 1200+) are hardcoded in component. No connection to live data. Content editors cannot update these without a code change. | **High** | Backend/Data integrity | Flag for Sultan: should come from `global_assets` or a dedicated stats table. For now, make them easy-to-find constants at the top of the file. |
| 7 | ImpactBentoGrid | The "100% of donation..." section is in the bento grid but is a trust/certification statement. It competes visually with the stats. Hierarchy is unclear. | **Medium** | Visual Hierarchy, F-Pattern | Separate into a dedicated "Trust Bar" strip, distinct from the statistics. |
| 8 | DonatePage | **Duplicate donation UI.** There is both a `DonatePage.tsx` AND a `DonationModal.tsx` with different preset amounts (DonatePage: 1000/2500/5000/10000/25000/50000; Modal: 1000/2000/5000/10000). Clicking "Donate Now" on DonatePage OPENS THE MODAL instead of the DonatePage form doing anything. The DonatePage amount selection is 100% dead UI. | **Critical** | Hick's Law, Cognitive Load, Conversion | Either: (a) wire DonatePage amount selection to pre-populate the modal, OR (b) make DonatePage a fully self-contained form. Currently it's a conversion dead-end. |
| 9 | DonatePage | No story, no emotional hook, no beneficiary photography above the fold. Page opens directly on a donation form. | **High** | Fogg Behavior Model, Motivation | Add a compact impact narrative / stats row above the donation widget to reinforce WHY before asking for money. |
| 10 | DonatePage | No recurring donation option. International benchmark standard is to offer monthly/annually with monthly as default. | **High** | Commitment/Consistency, Revenue | Add one-time vs. monthly toggle. Monthly should be the default with a subtle savings framing. |
| 11 | DonationModal | 5 steps is too many. Steps: Amount → Donor Info → Payment Method → Screenshot Upload / Checkout → Confirmation. Steps 4-5 for manual are necessary but the overall flow feels like a bureaucratic form, not a donation. | **High** | Miller's Law, Cognitive Load, Doherty Threshold | Merge donor name/email into Step 1 (pre-fill from auth). Show progress bar with step labels. |
| 12 | DonationModal | No progress indicator showing "Step 2 of 5". Users do not know how long the process takes — a primary abandonment trigger. | **Critical** | Zeigarnik Effect, Endowed Progress | Add a visible step progress bar at the top of the modal. |
| 13 | DonationModal | Amount presets in modal (1000/2000/5000/10000) have no context. Rs 5,000 means nothing without "feeds a family for a month" or similar impact messaging next to each. | **High** | Anchoring, Fogg Behavior Model | Add a one-line impact label under each amount button ("Educates 2 children for a month"). |
| 14 | DonationModal | The "Easypaisa/JazzCash" manual transfer flow collects a screenshot upload AFTER the donation record is saved. If upload fails, a silent catch is in place: `// Still go to success step even if screenshot/TRX ID fails`. Reconciliation nightmare for Admin. | **High** | Backend Flag (inform Sultan) | Flag: Admin dashboard should clearly mark donations with no `screenshotUrl` as "Pending Verification." Sultan to ensure this is visible. |
| 15 | Navbar | Language toggle button has no visible label — only the "اردو/EN" text. No icon or clear affordance for new visitors. | **Medium** | Jakob's Law, Multilingual UX | Add a globe icon + clearer visual treatment to the language switcher. |
| 16 | Navbar | Desktop: logged-in user avatar dropdown has no visible focus ring. Keyboard navigation fails. | **High** | WCAG 2.1 AA (2.4.7) | Add `focus-visible:ring-2 focus-visible:ring-brand-teal` to the avatar button. |
| 17 | Navbar | Mobile menu items do not have min-height of 48px consistently. "Sign In" and "Sign Up" links are plain `<Link>` elements with only `py-2` — tap targets too small on mobile. | **High** | Fitts's Law, WCAG 2.5.5 | Ensure all mobile nav links have `min-h-[48px] flex items-center`. |
| 18 | About | Hero uses `bg-black/50` overlay — generic black overlay instead of `bg-brand-navy/60`. Inconsistent with the brand pattern used everywhere else. | **Low** | Brand Consistency | Replace `bg-black/50` with `bg-brand-navy/60`. |
| 19 | About | Team section pulls from `mockData` directly (hardcoded import, not via `api.ts`). Bypasses the API service layer pattern. | **Medium** | Architectural Consistency | Move to `getTeamMembers()` from `api.ts` with a `useEffect` + `useState` pattern. |
| 20 | About | Mission and Vision cards are identical in structure (centered, icon, text) giving no visual hierarchy between the two. Vision = future aspiration should feel different (perhaps lighter, more open). | **Medium** | Visual Hierarchy, Von Restorff Effect | Give Mission and Vision distinct visual treatments: Mission = teal accent, Vision = gold accent, asymmetric layout. |
| 21 | ImpactStories | Stories are displayed as an accordion list. Expanding "Read Full Story" does not scroll the expanded content into view — on mobile the text appears ABOVE the button the user just clicked. | **High** | Principle of Least Effort, Spatial Awareness | On toggle expand, `scrollIntoView({ behavior: 'smooth', block: 'start' })` on the article element. |
| 22 | ImpactStories | Page title is `<h1>Impact Stories</h1>` then each story has `<h2>` — correct semantics. BUT the header section has no `<header>` landmark. | **Medium** | WCAG 2.4.6 (Headings and Labels) | Wrap page intro in `<header>`. |
| 23 | ImpactStories | All impact stories come from mock data only — no loading state, no empty state. When Sultan wires live data, if the fetch is slow, the page will briefly show nothing. | **Medium** | Error/Loading States | Add skeleton loading UI and empty state. |
| 24 | Gallery | Gallery items show category filter buttons (Education/Health/Youth/Community) but these are filtering mock data client-side. The UI is built correctly but currently uses reversed mock data. No loading or empty state. | **Medium** | Progressive Disclosure | Add skeleton grid and empty state. When live, filter via API params rather than client-side. |
| 25 | Gallery | Gallery images have no alt text that describes the content — using `item.titleEn` for alt is a good start but check mock data to ensure it is descriptive enough. | **Medium** | WCAG 1.1.1 | Ensure all alt attributes describe WHAT IS SHOWN, not just the category label. |
| 26 | Programs | Programs page uses a card grid but clicking a program routes to `/programs/:id`. The Program cards have no visible hover CTA ("Learn More →") — the entire card is a link but there's no affordance. | **Medium** | Affordance, Fitts's Law | Add a visible "Learn More →" or "Explore Program →" button inside each program card with a hover effect. |
| 27 | ProgramDetails | The hero for each program page has a hardcoded `heroImage` which falls back to `program.image`. No error/fallback if image 404s. | **Low** | Robustness | Add `onError` fallback to program hero images. |
| 28 | Contact | Contact form has all fields required but no inline validation. Submitting with errors clears/resets the form state making it unclear what went wrong. | **High** | Error Prevention, WCAG 3.3.1 | Add real-time validation with inline error messages per field. Show errors in red with descriptive text, not just a failed toast. |
| 29 | Contact | The map section shows a static image placeholder — not an actual interactive map. Text says "Find Us" but no address, directions, or real coordinates linked. | **Medium** | Trust Signal | Replace with an embedded Google Maps iframe (no API key required for embed), or link to Google Maps with coordinates. |
| 30 | Footer | Newsletter email input has a `// TODO: Backend dev to integrate newsletter API here` comment, with a `console.log` as the action. Users who submit their email get a "subscribed" confirmation but nothing actually happens. | **Critical** | Trust, Data Integrity | Either: (a) coordinate with Sultan to wire the newsletter endpoint, OR (b) display a tooltip "Newsletter coming soon — follow us on social" instead of a fake confirmation. The fake confirmation is a deception. |
| 31 | Footer | Social links go to `https://facebook.com`, `https://instagram.com` etc. — placeholder URLs, not IOCA's actual social profiles. | **High** | Trust Signal | Replace with real IOCA social URLs, or hide icons until profiles exist. |
| 32 | NotFound (404) | 404 page exists (`NotFound.tsx`) — good. But needs verification: does it have a clear "Go Home" CTA? Bilingual content? | **Low** | Error Recovery | Verify bilingual CTA + ensure it doesn't look like a dead end. |
| 33 | Volunteer | At 17KB, this is the largest non-Dashboard page. Check for excessive inline data definitions that could be moved to a data file. | **Low** | Code Organization | Move volunteer form config / section data to a `data/` file or top of file. |
| 34 | Projects | Projects page fetches live data via `getProjects()` BUT the mapping in `api.ts` sets `titleUr: row.title` (copying the English title). Urdu projects display will always show English text until Sultan adds Urdu fields to the schema. | **High** | Backend/Data Gap — FLAG | Flag for Sultan: DB schema needs `title_ur`, `description_ur`, `location_en`, `location_ur` columns for bilingual support. |
| 35 | Global | No OG (Open Graph) tags defined beyond basic title/description. Sharing any IOCA page on WhatsApp/Facebook shows no preview image. | **High** | SEO, Social Sharing | Add `og:image`, `og:title`, `og:description`, `og:url`, `twitter:card` to every page's Helmet. |
| 36 | Global | `selection:bg-brand-gold selection:text-white` is set globally — a nice touch but `brand-gold` (#E6A726) on white text fails WCAG AA contrast (ratio ~2.1:1, needs 4.5:1). | **High** | WCAG 1.4.3 | Change selection color to `selection:bg-brand-navy selection:text-brand-white` which passes contrast. |
| 37 | Global | No `<meta name="viewport" ...>` check — Vite's index.html should have this but confirm it is set correctly. | **Low** | Mobile rendering | Verify `index.html` has proper viewport meta tag. |
| 38 | Global | Framer Motion `whileInView` with `once: true` means animations NEVER replay. While good for performance, if a user scrolls back up they see static elements. Consider `once: false` for high-value sections like ImpactStats. | **Low** | Delight vs. Performance | Leave as `once: true` for most, but consider `once: false` for the Impact counter section specifically. |
| 39 | UserDashboard | At 101KB, this file is enormous. It likely contains hardcoded UI sections, multiple sub-views, and possibly mock state management all in one file. Should be split into sub-components. | **High** | Code Maintainability | Split into `DashboardOverview`, `DashboardMembership`, `DashboardDonations` sub-components. |
| 40 | Admin | Admin portal not audited in detail (Sultan's domain) — flagged for awareness only. Ensure that RLS policies prevent unauthorized data access even if a non-admin somehow visits `/admin` routes. | **Medium** | Security — Backend Flag | Confirm ProtectedRoute `adminOnly` prop properly redirects non-admin authenticated users. |

---

## Summary By Severity

| Severity | Count |
|---|---|
| Critical | 5 |
| High | 18 |
| Medium | 11 |
| Low | 6 |
| **Total** | **40** |

## Top 5 Highest-Priority Fixes

1. **#8 — Dead DonatePage UI** (Critical): The DonatePage's amount selection does nothing. This is a direct conversion killer.
2. **#12 — No donation progress bar** (Critical): Users abandon 5-step flows when they can't see how long it takes.
3. **#30 — Fake newsletter confirmation** (Critical): Collecting emails that go nowhere is a trust violation.
4. **#1 — Hero copy fails 5-second test** (Critical): First impression fails to explain what IOCA is or does.
5. **#34 — Urdu missing from live projects** (High): A bilingual NGO displaying English-only content in Urdu mode on its Projects page breaks the core promise.
