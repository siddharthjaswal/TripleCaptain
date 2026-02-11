# Design System

Triple Captain uses a clean, minimal design system built on CSS variables for easy theming and consistency.

---

## Color Palette

### Light Theme
```css
--surface-root: #fafafa;         /* Soft warm gray background */
--surface-elevated: #ffffff;     /* Pure white cards */
--surface-hover: #f5f5f5;        /* Subtle hover state */
--surface-border: #e5e5e5;       /* Light borders */
--accent: #10b981;               /* Emerald - primary accent */
--text-primary: #171717;         /* Near black */
--text-secondary: #737373;       /* Medium gray */
```

### Dark Theme
```css
--surface-root: #0a0a0a;         /* Nearly black */
--surface-elevated: #171717;     /* Dark gray cards */
--surface-hover: #262626;        /* Lighter dark hover */
--surface-border: #262626;       /* Subtle borders */
--accent: #34d399;               /* Brighter emerald */
--text-primary: #fafafa;         /* Off-white */
--text-secondary: #a3a3a3;       /* Light gray */
```

### Semantic Colors
```css
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

---

## Typography

### Font Stack
```css
font-family: var(--font-geist-sans), system-ui, -apple-system, sans-serif;
```

### Hierarchy
- **Headings**: Bold (700-800), tracking tight
- **Body**: Regular (400-500)
- **UI Elements**: Medium (600), uppercase for labels

---

## Shadows

Subtle, soft shadows for depth without heaviness:

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
```

---

## Component Classes

### Cards
```tsx
// Standard card
<div className="tc-card p-6">...</div>

// Interactive card (hover + click)
<div className="tc-card tc-card-interactive p-6">...</div>
```

### Buttons
```tsx
import { Button } from "@/components/ui";

<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
```

### Badges
```tsx
<div className="tc-badge tc-badge-primary">Active</div>
<div className="tc-badge tc-badge-secondary">Info</div>
```

---

## Spacing Scale

Consistent spacing using Tailwind utilities:
- `gap-2` (8px)
- `gap-4` (16px)
- `gap-6` (24px)
- `p-4` (16px padding)
- `p-6` (24px padding)

---

## Loading States

All data-dependent components support loading:

```tsx
import { Skeleton } from "@/components/ui";

{isLoading ? (
  <Skeleton variant="rectangular" height="100px" />
) : (
  <ActualContent />
)}
```

Components with built-in loading:
- `DeadlineCard`
- `PointsPace`
- `ChipStatus`
- `CaptainPicksCard`
- `FixturesCard`
- `DifferentialPicksCard`
- `TransferSuggestionsCard`
- `FixtureAnalysisCard`

---

## Responsive Design

Mobile-first approach with breakpoints:
- **sm**: 640px (tablets)
- **md**: 768px (small laptops)
- **lg**: 1024px (desktops)

All grids collapse to single-column on mobile.

---

## Theme Switching

Theme is controlled via `data-theme` attribute:

```tsx
<html data-theme="light"> // or "dark"
```

Toggle implementation in `components/ThemeToggle.tsx`.

---

## Best Practices

1. **Always use CSS variables** instead of hardcoding colors
2. **Use `tc-*` classes** for components (e.g., `tc-card`, `tc-button`)
3. **Add loading states** to all async data components
4. **Test both themes** when making design changes
5. **Keep shadows subtle** - use `--shadow-sm` or `--shadow-md`
6. **44px minimum tap targets** on mobile

---

## Example Component

```tsx
export function ExampleCard({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="tc-card p-6">
        <Skeleton variant="text" width="60%" height="20px" />
        <Skeleton variant="rectangular" height="100px" className="mt-4" />
      </div>
    );
  }

  return (
    <div className="tc-card p-6 hover:shadow-[var(--shadow-md)] transition-shadow">
      <h3 className="text-lg font-bold text-[color:var(--text-primary)]">
        {data.title}
      </h3>
      <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
        {data.description}
      </p>
      <button className="mt-4 tc-button tc-button-primary">
        Take Action
      </button>
    </div>
  );
}
```

---

For full color definitions and advanced styles, see `app/globals.css`.
