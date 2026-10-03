---
name: Earthquake Tracker
colors:
  surface: '#fdf9f2'
  surface-dim: '#dddad3'
  surface-bright: '#fdf9f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3ec'
  surface-container: '#f1ede6'
  surface-container-high: '#ebe8e1'
  surface-container-highest: '#e6e2db'
  on-surface: '#1c1c18'
  on-surface-variant: '#4e453f'
  inverse-surface: '#31302c'
  inverse-on-surface: '#f4f0e9'
  outline: '#80756e'
  outline-variant: '#d1c4bc'
  surface-tint: '#6d5b4e'
  primary: '#0f0601'
  on-primary: '#ffffff'
  primary-container: '#2a1d13'
  on-primary-container: '#988375'
  inverse-primary: '#dac2b2'
  secondary: '#914d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe9c43'
  on-secondary-container: '#6c3800'
  tertiary: '#000b03'
  on-tertiary: '#ffffff'
  tertiary-container: '#002611'
  on-tertiary-container: '#54956a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f7dece'
  primary-fixed-dim: '#dac2b2'
  on-primary-fixed: '#25190f'
  on-primary-fixed-variant: '#544438'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#aef2c0'
  tertiary-fixed-dim: '#93d5a5'
  on-tertiary-fixed: '#00210e'
  on-tertiary-fixed-variant: '#0a522d'
  background: '#fdf9f2'
  on-background: '#1c1c18'
  surface-variant: '#e6e2db'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '800'
    lineHeight: 28px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '800'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 2.5rem
  screen-edge-padding: 1.25rem
  card-inner-padding: 1rem
  bottom-nav-height: 4.5rem
  header-banner-height: 4rem
---

## Brand & Style

This design system is engineered for critical life-safety scenarios, crisis prevention, and disaster preparedness. Unlike standard utilitarian emergency apps that evoke acute anxiety through stark neon reds and industrial grays, this system grounds the user with an organic, warm-earth aesthetic. It combines steadying tactile warmth with high-urgency clarity to project authority, calm, and preparedness.

The design movement is **Tactile Warmth & Organic Modernism**:
- **Human & Calming**: Replaces cold clinical whites with organic cream and warm sand tones that soften stress during critical moments.
- **Authoritative Grounding**: Heavy dark espresso replaces digital black, giving buttons and primary cards structural weight and unmistakable affordance.
- **Semantic Preparedness Triad**: The interface is anchored around three distinct phases of an emergency:
  - *Prevención (Before)*: Grounded forest/emerald green evoking safety, preparation, and learning.
  - *Durante (During)*: Alert ochre-orange signaling focused, immediate survival actions (Drop, Cover, Hold On).
  - *Después (After)*: Calming steel-blue for communication, reporting, and rescue coordination.
- **Physical Trust**: Soft borders, rounded capsule cards, and tactile pill buttons feel deliberate, responsive, and legible under high-stress, low-dexterity conditions.

## Colors

The palette draws directly from the geological and protective world—sedimentary layers, rich soil, warning amber, and resilient foliage.

### Palette Roles & Values
- **Primary (`#2A1D13`) — Dark Espresso**: Serves as the primary ground for typography, high-priority action buttons ("Estoy a salvo", "Hacer donación"), key iconography, and navigation active states.
- **Secondary (`#D47A22`) — Hazard Ochre / Amber**: Signals mid-crisis state ("Durante"), active seismic warnings, and cautionary alerts. Accompanied by deep terracotta alert red (`#C24726`) for acute danger and immediate tremors.
- **Tertiary (`#3D7D54`) — Forest / Emerald Green**: Designates safety, validated secure zones ("Zonas seguras"), and preparedness modules ("Prevención").
- **Auxiliary Accent (`#3F6F8E`) — Calm Steel Blue**: Drives recovery communication, post-event status updates ("Después"), and rescue logistics.
- **Neutral Surface Canvas (`#F9F5EE` to `#F4ECE1`) — Warm Sand / Cream**: Replaces standard device white to reduce glare in emergency night environments while sustaining tactile warmth.
- **Surface Containers (`#FFFFFF` and `#EDE4D5`)**: Used for encapsulated cards, form rows, and list containers.
- **Borders & Dividers (`#E2D5C3`)**: Soft, organic separation strokes that hold cards together without harsh lines.

## Typography

Typography relies on **Plus Jakarta Sans** across all roles to ensure geometric balance, wide apertures, open counters, and instant legibility even under shaking screens, low lighting, or high-stress glance scenarios.

- **Emergency Action Typography**: Imperative instructions such as **AGÁCHATE, CÚBRETE, AGÁRRATE** must utilize `headline-lg` in uppercase with heavy tracking to guarantee instant comprehension within fractions of a second.
- **Header Blocks**: Screen titles situated inside warm ochre, forest green, or espresso header banners use bold uppercase tracking (`label-caps` or `headline-md`) set in high-contrast contrast tones (e.g. pure white `#FFFFFF` on colored caps).
- **Secondary Guidance**: Body copy remains strictly high-contrast dark espresso (`#2A1D13`) or subdued warm brown (`#6E5B4B`) for supporting contextual details.

## Layout & Spacing

The layout is built for fluid mobile-first thumb reachability, respecting physical device boundaries and safe zones.

- **Mobile Canvas**: A fluid mobile shell bounded by `1.25rem` (`20px`) lateral screen-edge padding, ensuring buttons and content maintain breathing space from hardware edges.
- **Top Header Shell**: Screens present a dominant color-coded header cap (height `64px` / `4rem`) that immediately identifies the active module state (Forest Green for Prevención, Ochre for Durante, Steel Blue for Después, Dark Espresso for Mapa and Alertas).
- **Vertical Rhythm**: Stacked interactive items employ an `0.75rem` (`12px`) separation, ensuring cards do not visually collide while maintaining compact scannability.
- **Bottom Navigation Dock**: Anchored floating or flush bottom dock with a persistent height of `4.5rem` (`72px`) plus system home indicator safe margins, featuring four distinct icon destinations with tap targets exceeding `48px × 48px`.

## Elevation & Depth

Visual hierarchy does not rely on harsh synthetic drop shadows. Instead, depth is achieved through **Tonal Surface Stacking** and **Soft Earth-Tone Outlines**:

- **Ground Level (Base)**: Warm Sand `#F9F5EE` to `#F4ECE1`.
- **Card Containers (Raised)**: Off-white canvas `#FFFFFF` or pale linen `#FAF6F0` framed by a subtle 1px border of `#E5DACB`.
- **Selected or Active State**: Accent tint washes (e.g., `#3D7D5412` for prevention, `#D47A2214` for active warnings) bounded by corresponding colored 1.5px borders.
- **Ambient Floor Shadows**: Where floating action components or emergency alerts require depth, a diffuse, warm-tinted shadow is applied:
  `box-shadow: 0 4px 16px -2px rgba(42, 29, 19, 0.08), 0 2px 6px -1px rgba(42, 29, 19, 0.04)`.
- **Emergency Alert Card**: Highlighted with a saturated ochre-to-terracotta horizontal linear gradient (`#D47A22` to `#C24726`) with crisp white interior typography.

## Shapes

The shape system leverages organic rounded forms to soften cognitive load:

- **Cards & Modules**: Standard cards feature `1rem` (`16px`) corner radiuses (`rounded-lg`), producing friendly, accessible blocks.
- **Primary Buttons & Action Pills**: Interactive triggers, callouts, and category selectors use fully rounded pill geometries (`border-radius: 9999px` or `2rem`) to afford instant pressability.
- **Circular Badges & Avatar Wrappers**: Icon holders for emergency categories (e.g., first aid, water, shelters) sit within concentric circular discs (`rounded-full`) tinted in the module's accent tone.

## Components

### Buttons
- **Primary Emergency Action ("Estoy a salvo", "Hacer donación")**:
  - Background: `#2A1D13` (Dark Espresso).
  - Text: `#FFFFFF`, `label-lg`, center-aligned.
  - Border: None.
  - Radius: Pill (`9999px`).
  - Height: `52px` to guarantee minimum touch-target compliance during tremors.
- **Secondary Button ("Necesito ayuda")**:
  - Background: Transparent or `#F4ECE1`.
  - Text: `#2A1D13`.
  - Border: `1.5px solid #2A1D13`.
  - Radius: Pill (`9999px`).
  - Height: `52px`.

### Phase Navigation Cards (Prevención, Durante, Después)
- Enclosed rounded rectangular cards (`rounded-lg`) on `#FFFFFF` base.
- Left-aligned thematic circular icon badge (`44px × 44px`).
- 1.5px structural border matching the state:
  - Green (`#3D7D54`) for Prevención.
  - Orange (`#D47A22`) for Durante.
  - Blue (`#3F6F8E`) for Después.
- Title in bold espresso (`#2A1D13`), accompanied by 2-line brief instructional subtitle (`#6E5B4B`).

### Emergency Action Visual Cards (Durante Action Blocks)
- Cream-filled containers with high-contrast centered titles: **AGÁCHATE, CÚBRETE, AGÁRRATE**.
- Sequence illustration tiles showing safe postural steps side-by-side with rounded framing.
- Persistent status chips (e.g., "Detectamos movimiento sísmico", "Conexión Bluetooth activa: Conectado" in tertiary green).

### Incident & Alert Banners
- **Active Tremor Warning**: Full-bleed or inset pill banner with `#D47A22` to `#C24726` warm gradient fill. Features an animated seismic waveform icon on the left, white bold header, and estimated intensity indicator.
- **Historical Alert Rows**: Soft linen cards with round status icons (Orange bell for sismo detectado, Green shield for simulacro programado, Blue info disc for general recommendations).

### Lists & Resource Items (Ayuda y Donaciones, Directorio)
- Contained row items with warm divider lines (`#E2D5C3`).
- Left-hand icon glyph depicting commodity (e.g., can for non-perishable food, water drop, medical cross).
- Text block with arrow chevron (`>`) aligned right for navigation drill-down.
- Direct-call shortcut buttons for emergency contacts (telephone glyph enclosed in dark espresso circular pill).

### Bottom Navigation Bar
- Background: Warm linen/cream (`#F4ECE1` or `#FAF6F0`) with a delicate top divider line (`#E2D5C3`).
- Four icons: **Inicio**, **Mapa**, **Alertas**, **Perfil**.
- Line-weight iconography in dark espresso (`#2A1D13`).
- Active item indicated by a solid espresso glyph and bold caption; inactive items rendered at 60% opacity (`#6E5B4B`).