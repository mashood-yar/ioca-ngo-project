# Humara Pakistan – Bilingual Brand Guidelines

> [!NOTE]
> This document serves as the official visual identity guide for the Humara Pakistan platform. To generate a PDF from this file, simply right-click in your markdown viewer and select **Print -> Save as PDF**.

---

## 1. Brand Logos

Our logo is the visual cornerstone of Humara Pakistan. It must be treated with respect, given adequate breathing room, and only used in approved color variations.

### Primary Logo
Use this full-color lockup on light backgrounds (`#FFFFFF` or `#F5F5F5`).

> **[INSERT PRIMARY LOGO IMAGE HERE]**  
> *(Drag and drop your primary full-color logo image file here)*

### Reversed / Monochrome Logo
Use the all-white or reversed logo on deep backgrounds (Navy `#1D2D49` or Teal `#569AD0`).

> **[INSERT REVERSED LOGO IMAGE HERE]**  
> *(Drag and drop your white/reversed logo image file here)*

### Clear Space & Minimum Size
Always maintain a protective "exclusion zone" around the logo equal to the height of the brand mark. Do not crowd the logo with typography or other visual elements.

> **[INSERT CLEAR SPACE DIAGRAM HERE]**  
> *(Drag and drop your logo clear space diagram here)*

---

## 2. Color Palette

Our colors reflect trust, professionalism, and warmth. The palette is strictly defined to ensure consistency across digital and print mediums.

### Primary Brand Colors

| Color | Hex | Usage |
| :--- | :--- | :--- |
| **Brand Teal** | `#569AD0` | Primary brand accent. Use for structural UI elements, illustrations, and highlighting key information. |
| **Brand Navy** | `#1D2D49` | Deep anchoring color. Use for primary text, deep backgrounds, footers, and high-contrast structural blocks. |
| **Brand Gold** | `#E6A726` | Action color. Strictly reserved for primary Call-to-Action (CTA) buttons, icons, and urgent interactive elements. |

### Secondary / Neutral Colors

| Color | Hex | Usage |
| :--- | :--- | :--- |
| **Pure White** | `#FFFFFF` | Primary background color. Use for standard page backgrounds, cards, and negative space. |
| **Light Gray** | `#F5F5F5` | Secondary background color. Use for section demarcations, subtle hover states, and alternating backgrounds. |

---

## 3. Typography (English)

The official English typeface for Humara Pakistan is **Univers LT Pro**. It is used universally across all digital assets for both headings and body copy to create a unified, modern, and highly legible aesthetic.

### Font Family
**Univers LT Pro**

### Approved Weights
We utilize four specific weights to establish a clear visual hierarchy:

- **45 Light**: Use for large, elegant display text or subtle metadata.
- **55 Roman (Normal)**: Use for all standard paragraph and body copy.
- **65 Bold**: Use for subheadings, buttons, and emphasized inline text.
- **75 Black (Extrabold)**: Use for primary H1/H2 section headers and massive impact stats.

### Typographic Hierarchy Example
- **H1 (Display):** Univers LT Pro 75 Black, 56px, Leading 1.1
- **H2 (Section):** Univers LT Pro 75 Black, 42px, Leading 1.2
- **H3 (Card):** Univers LT Pro 65 Bold, 24px, Leading 1.3
- **Body:** Univers LT Pro 55 Roman, 16px, Leading 1.6

---

## 4. Typography (Urdu RTL)

To maintain our bilingual integrity, the platform dynamically switches to proper Right-To-Left (RTL) rendering for Urdu. 

### Font Family
**Noto Naskh Arabic** (or your designated Urdu brand font).

### Bilingual Rules
- When the application is switched to Urdu, the font stack completely overrides Univers LT Pro to ensure perfect Nastaliq/Naskh legibility.
- Text alignment automatically mirrors (Left-aligned English becomes Right-aligned Urdu).
- Numeric figures must utilize Eastern Arabic / Urdu numerals (e.g., 10 becomes ۱۰) using the `toUrduNumerals` utility.

---

## 5. UI Elements & Buttons

Buttons are the primary method of interaction and must be instantly recognizable.

### Primary Button
- **Color:** Brand Gold (`#E6A726`)
- **Text:** Brand Navy (`#1D2D49`)
- **Font:** Univers LT Pro 65 Bold
- **Usage:** "Donate Now", "Submit", "Complete Payment". There should only be one primary button per viewport.

### Secondary Button
- **Color:** Transparent background with Brand Teal border (`#569AD0`)
- **Text:** Brand Teal (`#569AD0`)
- **Font:** Univers LT Pro 65 Bold
- **Usage:** "Browse Causes", "Learn More", secondary navigation.

> [!IMPORTANT]
> Never use default Tailwind colors (like blue-500 or red-500) for UI elements. If an error state is needed, please define a specific brand-approved error color.
