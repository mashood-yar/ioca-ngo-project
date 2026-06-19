# IOCA Design Token Sheet
## Extracted from `index.css` (@theme block) & `tailwind.config.js`
### Status: Verified against live repo — June 19, 2026

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| `brand-teal` | `#569AD0` | Primary CTA, active states, links, highlights |
| `brand-navy` | `#1D2D49` | Primary text, backgrounds, headings |
| `brand-gold` | `#E6A726` | Accent, certification badges, testimonial highlights |
| `brand-white` | `#FFFFFF` | Card backgrounds, reversed text |
| `brand-gray` | `#F5F5F5` | Page background, soft section fills |

**Note:** No semantic colors (success/warning/error/info) are defined in the token sheet. These are currently ad-hoc (red-600, etc.).

---

## Typography

| Token | Value | Usage |
|---|---|---|
| `font-sans` | `Univers`, `Inter`, `system-ui`, `sans-serif` | All English body & heading text |
| `font-serif` | `Aleo`, `Georgia`, `serif` | Blockquote font-serif (rarely used) |
| `font-urduHeading` | `Noto Nastaliq Urdu`, `serif` | Urdu headings |
| `font-urduBody` | `Noto Nastaliq Urdu`, `serif` | Urdu body text |

**Univers Font Weights Available:** 300 (Light), 400 (Regular), 700 (Bold), 900 (Black)
**Noto Nastaliq Urdu Weights Available:** 400, 500, 600, 700

**Urdu Special Rule (enforced globally):**
```css
.font-urduHeading, .font-urduBody {
  line-height: 2.4 !important;
  padding-top: 0.1em;
  padding-bottom: 0.2em;
}
```

---

## Type Scale (observed in components)

| Element | Mobile | Desktop | Weight |
|---|---|---|---|
| Hero h1 | 28px | 48px | Extrabold 800 |
| Hero subtitle | 16px | 24px | Normal 400 |
| Page h1 | 36-48px | 60-72px | Extrabold |
| Section h2 | 30-36px | 48-60px | Bold/Extrabold |
| Card h3 | 16-20px | 24px | Bold |
| Body text | 14-16px | 18px | Normal |
| Labels/badges | 11px | 11px | Medium/Semibold |

**PROBLEM:** Sizes use raw px values (text-[28px]) not Tailwind named scale — inconsistency risk.

---

## Spacing

| Context | Value |
|---|---|
| Page horizontal padding mobile | px-4 (16px) |
| Page horizontal padding desktop | px-16 (64px) |
| Section vertical padding mobile | py-12 to py-16 |
| Section vertical padding desktop | py-20 to py-24 |
| Card internal padding | p-6 to p-10 |
| Grid gap | gap-4 to gap-8 |

---

## Border Radius

| Token | Value |
|---|---|
| rounded-2xl | 1rem — small components |
| rounded-3xl | 1.5rem — feature cards |
| rounded-[2rem] | 2rem — bento cards (hardcoded) |
| rounded-4xl (custom) | 2rem |
| rounded-5xl (custom) | 2.5rem |
| rounded-6xl (custom) | 3rem |
| rounded-t-[3rem] | 3rem — footer (hardcoded) |

---

## Motion (Framer Motion observed)

| Pattern | Duration | Trigger |
|---|---|---|
| Fade + slide up | 0.5-0.6s | whileInView once |
| Stagger | 0.1s per item | array maps |
| Hero entrance | 0.6s, 0.1-0.4s delays | mount |
| Accordion | 0.3s | AnimatePresence |

---

## Mock vs Live Data

| Data | Status |
|---|---|
| /projects | LIVE (Supabase) + mock fallback |
| /events | LIVE (Supabase) |
| /news | LIVE (Supabase) |
| Programs | MOCK ONLY |
| Campaigns | MOCK ONLY |
| Team Members | MOCK ONLY |
| Testimonials | MOCK ONLY |
| Gallery | MOCK ONLY |
| Impact Stories | MOCK ONLY |
