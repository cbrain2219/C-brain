# Product Type Page Design

Date: 2026-07-15
Branch: `feat/product-type-page`

## Goal

Create a dedicated `/order` page in the user-facing Next.js app that matches the supplied Figma product-type designs in the order `P`, `T`, `F`, `M`.

The page should guide visitors from product type discovery to either fixed-price immediate payment or KakaoTalk estimate consultation.

## Source Designs

- P: Figma node `177:1301`
- T: Figma node `187:1448`
- F: Figma node `187:1969`
- M: Figma node `187:2879`

These nodes are responsive variants of the same page, not separate feature flows.

## Route And Navigation

- Add the page at `apps/user/app/(site)/order/page.tsx`, served as `/order`.
- Update the shared user-site header so `주문 · 결제` links to `/order`.
- Keep the remaining header links pointed at the home page sections with root anchors such as `/#portfolio`, `/#faq`, and `/#contact`.
- Show the `주문 · 결제` nav item in the active brand color on `/order`.

## Page Structure

The page uses the existing site shell:

1. Shared `Header`
2. Product order hero
3. Four-step progress rail
4. Order method cards
5. Product type card grid
6. Dark CTA section for KakaoTalk and FAQ
7. Shared `Footer`

The existing homepage service card content is the source of truth for product titles, descriptions, prices, quote states, and icons.

## Responsive Behavior

- Desktop/P: product cards use a three-column grid in a wide centered container.
- Tablet/T and foldable/F: product cards use a two-column grid.
- Mobile/M: product cards stack in one column.
- The shared header keeps desktop navigation on wider widths and collapses to the existing mobile menu pattern on narrow widths.
- The order method cards use two columns when space allows and stack on mobile.
- Text must wrap cleanly in cards and buttons without overlap.

## Visual And Asset Rules

- Reuse existing assets where the Figma design matches current local files:
  - `/figma-assets/landing-hero-background.png`
  - `/figma-assets/landing-cta-background.jpg`
  - existing footer/logo assets
- Do not keep Figma MCP asset URLs in source.
- Use the shared `Icon` component for product UI icons.
- Keep page-specific styling in a dedicated CSS module for the `/order` route where practical.
- Preserve existing landing typography, colors, button gradients, and card interaction patterns.

## Actions

- Fixed-price items show `160,000원 ~` and a `정찰제 즉시결제` text action.
- Quote-only items show `견적 후 주문(카카오톡)`.
- CTA buttons are presentational until real destination URLs are provided.

## Verification

Run:

- `corepack pnpm lint`
- `corepack pnpm check-types`
- `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages`

Also visually verify `/order` at desktop, tablet, foldable/mobile, and narrow mobile widths.
