# User Landing Page Design

## Context

Build the user-facing landing page in `apps/user/app` from the Figma design file "씨브레인 Design".

Reference frames:

- `랜딩_P`: `6:487`, 1920px desktop
- `랜딩_T`: `27:252`, 1080px tablet/large tablet
- `랜딩_F`: `27:2628`, 640px foldable/small tablet
- `랜딩_M`: `29:148`, 390px mobile

Browser and device chrome frames, including `Chrome Desktop` and `ios_Status Bar`, are excluded from implementation. Only the actual landing page content should be rendered.

## Scope

Implement the root user route at `/` by replacing the current design-system showcase in `apps/user/app/page.tsx`.

Included sections:

- Header
- Hero
- Metrics
- Portfolio
- Services
- About / reason-to-choose section
- Client logos
- Blog
- CTA
- FAQ
- Footer

Out of scope:

- Admin app changes
- Server/API/database integration
- Real order/payment behavior
- Auth flows
- New route pages beyond the landing page

## Architecture

Use a single landing page route with page-specific section components:

```txt
apps/user/app/
  page.tsx
  page.module.css
  _components/
    Header.tsx
    Hero.tsx
    Metrics.tsx
    PortfolioSection.tsx
    ServicesSection.tsx
    AboutSection.tsx
    BlogSection.tsx
    CtaSection.tsx
    FaqSection.tsx
    Footer.tsx
```

Keep landing-only data arrays close to the page or in section files. Promote code to `apps/user/components` only if it is reused by multiple user pages later. Promote code to `packages/ui` only if it becomes a true cross-app primitive.

## Design System Use

Follow `design.md` and `design-system.css`.

- Use Pretendard typography classes or equivalent CSS values.
- Use project color tokens where they match. Add page-local CSS variables only for Figma colors not yet present in `design-system.css`, such as the turquoise brand used in this landing design.
- Use parent `gap` for layout spacing instead of child margins.
- Use SVG icons through `apps/user/components/Icon.tsx` when they are product UI icons.
- Use existing `@repo/ui/button` and `@repo/ui/accordion` first. Apply page-specific `className` or `style` overrides when the Figma landing design differs from the current primitive defaults.

## Responsive Behavior

Implement mobile-first CSS with four target layouts:

- Mobile: base styles for 390px and up
- Foldable/small tablet: `@media (min-width: 640px)`
- Tablet: `@media (min-width: 1080px)`
- Desktop: `@media (min-width: 1440px)` with 1920px design alignment

Expected layout changes:

- Metrics: 1 column on mobile, 2 columns at 640px, 4 columns at tablet/desktop.
- Portfolio: horizontal scroll on mobile, 2 columns at 640px, 3 columns at 1080px, 4 columns on desktop.
- Services: 1 column on mobile, 2 columns at 640px/1080px, 3 columns on desktop.
- Blog: 1 column on mobile, horizontal/tablet layout where needed, 3 columns on desktop.
- FAQ: full-width on mobile, constrained centered column on larger screens.
- Footer: stacked text/social links on mobile, wider horizontal alignment on larger screens.

## Assets

Do not keep Figma MCP asset URLs in source code.

Download required assets into:

```txt
apps/user/public/figma-assets/
```

Use stable descriptive names, for example:

- `landing-hero-background.png`
- `landing-cta-background.png`
- `portfolio-shinlim.png`
- `portfolio-*.png`
- `cbrain-logo.svg`

Reference assets with public paths such as `/figma-assets/landing-hero-background.png`.

Before completion, verify:

```bash
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

The command must return no matches.

## Data And Behavior

Use static data for the landing page content. Buttons and navigation links can point to section anchors or placeholder `#` targets until related pages and server behavior are implemented.

FAQ should be interactive using the existing `Accordion` component. Service, portfolio, and blog cards are static display content for this implementation.

## Verification

Run these checks after implementation:

```bash
pnpm --filter=user lint
pnpm --filter=user check-types
pnpm --filter=user build
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Also run the local user app and visually inspect at representative widths:

- 390px
- 640px
- 1080px
- 1920px

The page should not show browser/device chrome frames, should not overflow horizontally except intentional carousels, and should keep text readable without overlapping.
