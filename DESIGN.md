# Design Brief: Inpui Language Preservation

**Purpose**: Digital platform for preserving, teaching, and revitalizing the Inpui tribal language through voice contributions, corpus browsing, collaborative translation, and community engagement.

**Tone**: Heritage-forward + professional polish — warm, purposeful, educational, celebratory of cultural knowledge.

**Differentiation**: Gold icons + green pulsing microphone = unmistakable tribal preservation identity. Combines indigenous heritage warmth with modern SaaS usability.

## Color Palette (OKLCH)

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| **Primary** | `0.35 0.12 247` | `0.62 0.14 247` | Deep blue header, navigation, primary CTAs |
| **Secondary** | `0.75 0.22 135` | `0.82 0.25 135` | Bright green microphone buttons, pulsing voice CTAs |
| **Accent** | `0.65 0.18 65` | `0.72 0.2 65` | Gold icons, highlights, confidence scores |
| **Background** | `0.98 0 0` | `0.12 0 0` | Page background, neutral surface |
| **Card** | `1.0 0.01 0` | `0.16 0.01 0` | Corpus entries, contribution cards |
| **Muted** | `0.93 0.02 0` | `0.22 0.01 0` | Section dividers, disabled states |
| **Border** | `0.88 0.01 0` | `0.25 0.01 0` | Card borders, subtle separations |

## Typography

| Layer | Font | Weight | Use |
|-------|------|--------|-----|
| **Display** | Fraunces (serif) | 600–700 | Page headings, section titles, feature callouts |
| **Body** | Figtree (sans) | 400–500 | All body text, form labels, list items |
| **Mono** | General Sans | 400 | Keyboard shortcuts, technical tags, code snippets |

**Line height**: 1.5 (body), 1.2 (headings). **Font weight**: normal throughout except headings (bold display + medium body).

## Structural Zones

| Zone | Background | Border | Treatment |
|------|------------|--------|-----------|
| **Header** | `bg-primary` | none | Elevation: `shadow-elevated`, text: white/foreground-invert |
| **Sidebar/Nav** | `bg-sidebar` | `border-b border-border/50` | Subtle backdrop, high-contrast navigation items |
| **Content** | `bg-background` | none | Clean neutral foundation |
| **Cards** | `bg-card` | `border border-border/50` | `rounded-lg shadow-subtle`, hover: `shadow-elevated` |
| **Footer** | `bg-muted/20` | `border-t border-border/50` | Recessive, small text, contact/credits |

## Component Patterns

- **Microphone button**: `pulse-micro` animation (green pulsing glow), "recording" state indicator
- **Icon usage**: All icons `text-accent` (gold), 20–24px size for consistency
- **High-contrast text**: `.text-high-contrast` class for critical reads (corpus entries, leaderboard, stats)
- **Card elevation**: `.card-elevated` for corpus entries, contributor cards, translation queue
- **Form inputs**: `bg-input border-border rounded-md`, focus: `ring-2 ring-primary/20`

## Motion & Interaction

- **Smooth transitions**: `transition-smooth` (0.3s cubic-bezier) for all interactive elements
- **Microphone pulse**: Infinite 2s loop, opacity + box-shadow expansion, resets at 50%
- **Hover states**: `shadow-subtle` → `shadow-elevated` on cards, text opacity 80% → 100%
- **Load animations**: Subtle fade-in for corpus items, no bounce or overshoot

## Spacing & Rhythm

- **Base radius**: `0.75rem` (12px) — all cards, inputs, buttons
- **Gap scale**: 12px (xs), 16px (sm), 24px (md), 32px (lg), 48px (xl)
- **Card padding**: 20px (mobile), 24px (desktop)
- **Content width**: `max-w-7xl` centered, 2rem padding on mobile

## Accessibility & Constraints

- **Contrast**: AA+ foreground-on-background (L diff ≥ 0.7), AA+ on primary (L diff ≥ 0.45)
- **Text rendering**: All text normal weight except display headings; antialiased body
- **Responsive**: Mobile-first, breakpoints: `sm: 640px, md: 768px, lg: 1024px, xl: 1280px`
- **Focus**: `:focus-visible` ring-2 ring-primary, outlines only on keyboard nav (not mouse)
- **Microphone affordance**: Always visually distinct, pulsing animation + label for screen readers

## Signature Detail

**The tribal gold + green combination** is unprecedented in language preservation apps. Every gold icon reads as cultural authenticity; every green pulse reads as voice/life. This pairing creates instant recognition and emotional resonance with the mission of language preservation.
