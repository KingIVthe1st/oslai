# OSL Skin AI - Premium Design Quick Reference

## Color Palette Cheat Sheet

### Primary Teal
```css
--primary-50: #f0fdfa   /* Lightest - backgrounds */
--primary-100: #ccfbf1  /* Very light - subtle highlights */
--primary-200: #99f6e4  /* Light - accents */
--primary-300: #5eead4  /* Medium light */
--primary-400: #2dd4bf  /* Medium */
--primary-500: #14b8a6  /* BRAND PRIMARY */
--primary-600: #0d9488  /* BRAND DARK */
--primary-700: #0f766e  /* Dark */
--primary-800: #115e59  /* Very dark */
--primary-900: #134e4a  /* Darkest */
```

### Grays
```css
--gray-50: #f8fafc     /* Backgrounds */
--gray-100: #f1f5f9    /* Borders, dividers */
--gray-200: #e2e8f0    /* Borders */
--gray-300: #cbd5e1    /* Disabled */
--gray-400: #94a3b8    /* Placeholder */
--gray-500: #64748b    /* Secondary text */
--gray-600: #475569    /* Body text */
--gray-700: #334155    /* Headings */
--gray-800: #1e293b    /* Dark headings */
--gray-900: #0f172a    /* Darkest text */
```

---

## Spacing Scale

| Variable | Size | Use For |
|----------|------|---------|
| --space-1 | 4px | Tight spacing |
| --space-2 | 8px | Icon gaps |
| --space-3 | 12px | Small gaps |
| --space-4 | 16px | Standard gap |
| --space-5 | 24px | Medium gap |
| --space-6 | 32px | Large gap |
| --space-7 | 40px | Extra large |
| --space-8 | 48px | Section padding |
| --space-9 | 64px | Large sections |
| --space-10 | 80px | Extra large sections |
| --space-11 | 96px | Hero sections |
| --space-12 | 128px | Major sections |

---

## Typography Scale

| Class | Size | Use For |
|-------|------|---------|
| --text-xs | 12px | Small labels |
| --text-sm | 14px | Captions, metadata |
| --text-base | 16px | Body text |
| --text-lg | 18px | Large body |
| --text-xl | 20px | Subheadings |
| --text-2xl | 24px | H4 |
| --text-3xl | 30px | H3 |
| --text-4xl | 36px | H2 |
| --text-5xl | 48px | H1 |
| --text-6xl | 60px | Hero text |
| --text-7xl | 72px | Extra large hero |

---

## Shadow Scale

| Variable | Use For |
|----------|---------|
| --shadow-xs | Subtle depth |
| --shadow-sm | Small elements |
| --shadow-md | Cards, dropdowns |
| --shadow-lg | Elevated cards |
| --shadow-xl | Modals, popovers |
| --shadow-2xl | Hero elements |
| --shadow-primary | Branded buttons |
| --shadow-primary-lg | Hover states |
| --shadow-glow | Ambient effects |

---

## Border Radius

| Variable | Size | Use For |
|----------|------|---------|
| --radius-sm | 6px | Small elements |
| --radius-md | 8px | Default |
| --radius-lg | 12px | Buttons, inputs |
| --radius-xl | 16px | Cards |
| --radius-2xl | 24px | Large cards |
| --radius-full | 9999px | Pills, circles |

---

## Gradients

```css
/* Primary gradient */
background: var(--gradient-primary);
/* linear-gradient(135deg, #14b8a6 0%, #0d9488 100%) */

/* Soft gradient */
background: var(--gradient-primary-soft);
/* linear-gradient(135deg, #5eead4 0%, #14b8a6 100%) */

/* Hero gradient */
background: var(--gradient-hero);
/* linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, #e0f2fe 100%) */
```

---

## Common Patterns

### Button Primary
```css
background: var(--gradient-primary);
color: var(--white);
padding: var(--space-4) var(--space-8);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-primary);
font-weight: var(--font-semibold);
transition: all var(--transition-base);
```

### Button Secondary
```css
background: var(--white);
color: var(--primary);
border: 2px solid var(--primary);
padding: var(--space-4) var(--space-8);
border-radius: var(--radius-xl);
```

### Card
```css
background: var(--white);
border: 1px solid var(--border-light);
border-radius: var(--radius-2xl);
padding: var(--space-8);
box-shadow: var(--shadow-sm);
transition: all var(--transition-slow);
```

### Card Hover
```css
transform: translateY(-8px);
box-shadow: var(--shadow-xl);
border-color: var(--primary-200);
```

### Glass Effect
```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
```

### Gradient Text
```css
background: var(--gradient-primary);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

### Focus Ring
```css
outline: none;
border-color: var(--primary);
box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1);
```

---

## Animation Timing

| Variable | Duration | Use For |
|----------|----------|---------|
| --transition-fast | 150ms | Subtle changes |
| --transition-base | 250ms | Standard transitions |
| --transition-slow | 350ms | Complex animations |
| --transition-bounce | 500ms | Playful effects |

---

## Z-Index Scale

| Variable | Value | Use For |
|----------|-------|---------|
| --z-base | 1 | Default stacking |
| --z-dropdown | 1000 | Dropdowns |
| --z-sticky | 1100 | Sticky elements |
| --z-fixed | 1200 | Fixed navbar |
| --z-modal-backdrop | 1300 | Modal backdrop |
| --z-modal | 1400 | Modal content |
| --z-popover | 1500 | Popovers |
| --z-tooltip | 1600 | Tooltips |

---

## Breakpoints

```css
/* Tablet */
@media (max-width: 1024px) { }

/* Mobile */
@media (max-width: 768px) { }

/* Small Mobile */
@media (max-width: 480px) { }
```

---

## Common Effects

### Hover Lift
```css
.element:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
}
```

### Icon Rotate on Hover
```css
.icon {
    transition: transform var(--transition-base);
}
.element:hover .icon {
    transform: rotate(5deg) scale(1.1);
}
```

### Underline Animation
```css
.link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--primary);
    transition: width var(--transition-base);
}
.link:hover::after {
    width: 100%;
}
```

---

## Accessibility

### Focus States
Always include visible focus:
```css
element:focus {
    outline: none;
    box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1);
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

### Contrast
- Body text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: Clear visual feedback

---

## Performance Tips

### Use These (60fps)
- `transform`
- `opacity`
- `filter`

### Avoid These (Janky)
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`

### Hardware Acceleration
```css
transform: translateZ(0);
will-change: transform;
```

---

## Component Checklist

When creating new components:
- [ ] Use spacing scale variables
- [ ] Use shadow system
- [ ] Use border radius scale
- [ ] Add hover states
- [ ] Add focus states
- [ ] Test mobile responsive
- [ ] Verify accessibility
- [ ] 60fps animations

---

## Quick Commands

```bash
# Check CSS line count
wc -l public/styles.css

# View design variables
head -n 167 public/styles.css

# Find a specific style
grep "btn-primary" public/styles.css
```

---

## Helpful Formulas

### Fluid Typography
```css
font-size: clamp(min, preferred, max);
/* Example: clamp(2rem, 5vw, 3.75rem) */
```

### Spacing Calculation
```
Base = 4px
Level n = 4px × fibonacci(n)
```

### Shadow Opacity
- xs-md: 0.1 (10%)
- lg-xl: 0.1 (10%)
- 2xl: 0.25 (25%)
- Colored: 0.2-0.3

---

## Brand Colors Only

For consistency, use ONLY these:
- Primary: `--primary`, `--primary-dark`, `--primary-light`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Background: `--background`, `--background-alt`
- Border: `--border`, `--border-light`

---

This quick reference covers 90% of daily styling needs. For complete documentation, see `DESIGN_SYSTEM.md`.
