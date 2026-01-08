# WinnStorm™ Brand Guidelines

**Version:** 1.0  
**Last Updated:** January 2026

---

## Brand Overview

WinnStorm™ is a comprehensive damage assessment platform designed for professional consultants. The brand conveys precision, reliability, and industrial strength through its visual identity.

---

## Color Palette

### Primary Colors

| Color Name | HSL | HEX | RGB | Usage |
|------------|-----|-----|-----|-------|
| **Safety Orange** | `hsl(16, 100%, 50%)` | `#FF6600` | `rgb(255, 102, 0)` | Primary brand color, CTAs, buttons, accents, links |
| **Charcoal** | `hsl(0, 0%, 10%)` | `#1A1A1A` | `rgb(26, 26, 26)` | Dark mode backgrounds, primary text on light |
| **Pure White** | `hsl(0, 0%, 100%)` | `#FFFFFF` | `rgb(255, 255, 255)` | Light mode backgrounds, text on dark |

### Secondary Colors

| Color Name | HSL | HEX | RGB | Usage |
|------------|-----|-----|-----|-------|
| **Near White** | `hsl(0, 0%, 98%)` | `#FAFAFA` | `rgb(250, 250, 250)` | Dark mode text, subtle backgrounds |
| **Light Gray** | `hsl(0, 0%, 96%)` | `#F5F5F5` | `rgb(245, 245, 245)` | Secondary backgrounds, cards |
| **Medium Gray** | `hsl(0, 0%, 45%)` | `#737373` | `rgb(115, 115, 115)` | Muted text, captions |
| **Border Gray** | `hsl(0, 0%, 90%)` | `#E5E5E5` | `rgb(229, 229, 229)` | Light mode borders |
| **Dark Border** | `hsl(0, 0%, 20%)` | `#333333` | `rgb(51, 51, 51)` | Dark mode borders |

### Accent Colors

| Color Name | HSL | HEX | RGB | Usage |
|------------|-----|-----|-----|-------|
| **Light Orange** | `hsl(16, 100%, 95%)` | `#FFF5EB` | `rgb(255, 245, 235)` | Light accent backgrounds |
| **Orange 60%** | `hsl(16, 100%, 60%)` | `#FF8533` | `rgb(255, 133, 51)` | Charts, secondary orange elements |
| **Destructive Red** | `hsl(0, 84%, 60%)` | `#EF4444` | `rgb(239, 68, 68)` | Errors, warnings, delete actions |

### Shadow Glow Effect

```css
box-shadow: 0 0 15px rgba(255, 102, 0, 0.4);
```
Use for highlighted cards, focused elements, and premium features.

---

## Typography

### Primary Fonts

| Font | Weights | Usage |
|------|---------|-------|
| **Montserrat** | 400, 500, 600, 700, 800, 900 | Headings, titles, buttons, navigation |
| **Inter** | 300, 400, 500, 600, 700 | Body text, paragraphs, form labels, captions |

### Font Import
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700;800;900&display=swap');
```

### Typography Scale

| Style | Font | Size | Weight | Case |
|-------|------|------|--------|------|
| **Headline XL** | Montserrat | 4xl-6xl (36-72px) | Bold (700) | UPPERCASE |
| **Headline LG** | Montserrat | 3xl-4xl (30-48px) | Bold (700) | UPPERCASE |
| **Headline MD** | Montserrat | 2xl-3xl (24-36px) | Semibold (600) | UPPERCASE |
| **Body Large** | Inter | lg (18px) | Medium (500) | Sentence |
| **Body Regular** | Inter | base (16px) | Regular (400) | Sentence |
| **Body Small** | Inter | sm (14px) | Regular (400) | Sentence |
| **Caption** | Inter | xs (12px) | Regular (400) | Sentence |

---

## Design Principles

### 1. Sharp Edges (Industrial Aesthetic)
- **Border Radius:** 0px (no rounded corners)
- All buttons, cards, inputs, and containers use sharp rectangular edges
- Conveys precision and professionalism

### 2. High Contrast
- Strong contrast between Safety Orange and Charcoal
- Ensures readability in both indoor and outdoor field conditions
- Accessibility-first approach

### 3. Mobile-First Field App Design
- **Touch Targets:** Minimum 44x44px for all interactive elements
- **Field Input Height:** 48px (h-12) for easy outdoor use
- **Outdoor Readable:** 18px+ font sizes for critical information

---

## Logo Usage

### Available Logo Files

| File | Description | Use Case |
|------|-------------|----------|
| `winnstorm-logo.png` | Primary full-color logo | Default usage on light/dark backgrounds |
| `logo-dark.png` | Dark variant | Use on light backgrounds |
| `logo-light.png` | Light variant | Use on dark backgrounds |
| `winnstorm-logo-transparent.png` | Transparent background | Overlays, partnerships |
| `white-hot-logo.png` | White Hot variant | Special applications |
| `favicon.png` | App icon | Browser tabs, app icons |
| `og-image.png` | Social preview | Open Graph, social sharing |

### Logo Clear Space
- Maintain padding equal to the height of the "W" in WinnStorm around all sides
- Never crowd the logo with other elements

### Logo Don'ts
- Don't stretch or distort proportions
- Don't add effects (shadows, glows, outlines)
- Don't place on busy or low-contrast backgrounds
- Don't recolor the logo

---

## UI Component Styles

### Buttons

**Primary Button:**
```css
background: #FF6600;
color: #FFFFFF;
font-family: Montserrat;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.05em;
padding: 16px 32px;
border-radius: 0;
```

**Secondary Button:**
```css
background: transparent;
border: 2px solid #FFFFFF;
color: #FFFFFF;
font-family: Montserrat;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.05em;
padding: 16px 32px;
border-radius: 0;
```

### Cards
```css
background: #FFFFFF; /* or #1F1F1F in dark mode */
border: 1px solid #E5E5E5; /* or #333333 in dark mode */
border-radius: 0;
```

### Inputs
```css
height: 48px;
padding: 0 16px;
background: #F5F5F5; /* or #2D2D2D in dark mode */
border: 1px solid #E5E5E5;
border-radius: 0;
font-family: Inter;
font-size: 16px;
```

---

## Brand Voice

### Tone
- **Professional:** Expert-level, authoritative
- **Clear:** Direct, no jargon for end users
- **Supportive:** Helpful, guiding
- **Confident:** Assured, reliable

### Key Phrases
- "WinnStorm™" (always include trademark symbol on first use)
- "Damage Assessment Professionals"
- "Winn Methodology"
- "Stormy" (AI assistant name)

---

## Contact

For brand-related questions or asset requests:
- Website: winnstorm.com
- Support: support@winnstorm.com

---

*© 2026 WinnStorm™. All rights reserved.*
