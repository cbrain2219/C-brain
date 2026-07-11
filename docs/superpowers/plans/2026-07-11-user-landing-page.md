# User Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the C-Brain user landing page at `/` from the approved Figma frames without browser/device chrome.

**Architecture:** Replace the current showcase route with one `page.tsx` composition and page-local section components in `apps/user/app/_components`. Keep styling in `apps/user/app/page.module.css`, use static data for landing content, and reuse existing `@repo/ui` primitives where practical.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS Modules, pnpm, Turborepo, existing `@repo/ui` primitives.

## Global Constraints

- Work only in the user app and supporting local assets unless a reusable primitive must be adjusted.
- Do not change `apps/admin`, `app/admin`, or server/Supabase behavior.
- Exclude `Chrome Desktop`, `ios_Status Bar`, and all browser/device chrome frames.
- Implement four target layouts: 390px, 640px, 1080px, and 1920px.
- Prefer existing `@repo/ui/button`, `@repo/ui/accordion`, and `apps/user/components/Icon.tsx`.
- Do not keep Figma MCP asset URLs in source code.
- Download required Figma assets into `apps/user/public/figma-assets/`.
- Verify `rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages` returns no matches.

---

## File Structure

- Modify `apps/user/app/page.tsx`: compose landing sections and static content.
- Replace `apps/user/app/page.module.css`: landing layout, section styling, responsive breakpoints, and page-local Figma color variables.
- Create `apps/user/app/_components/Header.tsx`: desktop/tablet header and compact mobile header.
- Create `apps/user/app/_components/Hero.tsx`: Figma hero copy, CTAs, and background asset.
- Create `apps/user/app/_components/Metrics.tsx`: four stat blocks.
- Create `apps/user/app/_components/PortfolioSection.tsx`: category rail and portfolio image grid/scroll area.
- Create `apps/user/app/_components/ServicesSection.tsx`: service cards and consultation prompt.
- Create `apps/user/app/_components/AboutSection.tsx`: company intro, reason list, and client logo rail.
- Create `apps/user/app/_components/BlogSection.tsx`: three static blog cards.
- Create `apps/user/app/_components/CtaSection.tsx`: dark CTA band with background asset.
- Create `apps/user/app/_components/FaqSection.tsx`: interactive FAQ using `Accordion`.
- Create `apps/user/app/_components/Footer.tsx`: footer legal/contact/social content.
- Create `apps/user/public/figma-assets/`: local Figma image and SVG assets.

## Task 1: Asset Intake And Constants

**Files:**
- Create: `apps/user/public/figma-assets/`
- Create: image files under `apps/user/public/figma-assets/`
- Modify: none

**Interfaces:**
- Produces: stable public paths such as `/figma-assets/landing-hero-background.png` and `/figma-assets/portfolio-shinlim.png`.

- [ ] **Step 1: Create the asset directory**

Run:

```bash
mkdir -p apps/user/public/figma-assets
```

Expected: directory exists.

- [ ] **Step 2: Download required assets from MCP URLs**

Download these assets to stable local names:

```txt
landing-hero-background.png
landing-cta-background.png
cbrain-logo-main.svg
cbrain-logo-footer.svg
portfolio-shinlim.png
portfolio-axis.png
portfolio-wedding.png
portfolio-tmes.png
portfolio-orange.png
portfolio-black-red.png
portfolio-lab.png
portfolio-blue-guide.png
portfolio-green.png
portfolio-blue-brochure.png
portfolio-building.png
portfolio-card.png
```

Expected: assets are committed files under `apps/user/public/figma-assets/`.

- [ ] **Step 3: Inspect asset dimensions**

Run:

```bash
file apps/user/public/figma-assets/*
```

Expected: image and SVG files are readable; no HTML error pages were downloaded.

## Task 2: Landing Composition And Data

**Files:**
- Modify: `apps/user/app/page.tsx`
- Create: `apps/user/app/_components/Header.tsx`
- Create: `apps/user/app/_components/Hero.tsx`
- Create: `apps/user/app/_components/Metrics.tsx`
- Create: `apps/user/app/_components/PortfolioSection.tsx`
- Create: `apps/user/app/_components/ServicesSection.tsx`
- Create: `apps/user/app/_components/AboutSection.tsx`
- Create: `apps/user/app/_components/BlogSection.tsx`
- Create: `apps/user/app/_components/CtaSection.tsx`
- Create: `apps/user/app/_components/FaqSection.tsx`
- Create: `apps/user/app/_components/Footer.tsx`

**Interfaces:**
- Consumes: asset paths created in Task 1.
- Produces: a server-rendered landing page at `/`.

- [ ] **Step 1: Replace the root page composition**

`apps/user/app/page.tsx` should import the section components and render them in Figma order:

```tsx
import { AboutSection } from "./_components/AboutSection";
import { BlogSection } from "./_components/BlogSection";
import { CtaSection } from "./_components/CtaSection";
import { FaqSection } from "./_components/FaqSection";
import { Footer } from "./_components/Footer";
import { Header } from "./_components/Header";
import { Hero } from "./_components/Hero";
import { Metrics } from "./_components/Metrics";
import { PortfolioSection } from "./_components/PortfolioSection";
import { ServicesSection } from "./_components/ServicesSection";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <Header />
      <Hero />
      <Metrics />
      <PortfolioSection />
      <ServicesSection />
      <AboutSection />
      <BlogSection />
      <CtaSection />
      <FaqSection />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 2: Create page-local components**

Each component should import `styles` from `../page.module.css`. Components that need buttons should import `Button` from `@repo/ui/button`; FAQ should import `Accordion` from `@repo/ui/accordion`; product UI icons should import `Icon` from `../../components/Icon`.

Expected: components are focused and do not import admin/server code.

- [ ] **Step 3: Keep static landing content local**

Define arrays in the relevant section file:

```tsx
const metrics = [
  { label: "업력", value: "26년", description: "2000년 씨브레인 설립" },
  { label: "누적 고객사", value: "1,200곳+", description: "전국 기업 · 공공기관" },
  { label: "누적 제작 건수", value: "4,000건+", description: "브로슈어 · 카탈로그 · 리플렛 등" },
  { label: "대형 박람회 협력", value: "15년 연속", description: "킨텍스 · 나라장터 엑스포" },
];
```

Expected: no server/API integration is introduced.

## Task 3: Landing CSS And Breakpoints

**Files:**
- Replace: `apps/user/app/page.module.css`

**Interfaces:**
- Consumes: class names used by Task 2 components.
- Produces: Figma-aligned landing layout across 390px, 640px, 1080px, and 1920px.

- [ ] **Step 1: Define page tokens**

Add page-local variables on `.page`:

```css
.page {
  --landing-brand-500: #30bac3;
  --landing-brand-600: #269aa3;
  --landing-kakao: #fae100;
  --landing-kakao-dark: #3b1d1d;
  min-height: 100svh;
  background: #ffffff;
  color: var(--color-gray-800);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}
```

- [ ] **Step 2: Implement mobile-first layout**

Use base styles for 390px. Add media queries for:

```css
@media (min-width: 640px) {}
@media (min-width: 1080px) {}
@media (min-width: 1440px) {}
```

Expected: one code path adapts to all four Figma frames.

- [ ] **Step 3: Match grid behavior**

Implement:

```txt
Metrics: 1 / 2 / 4 / 4 columns
Portfolio: horizontal scroll / 2 columns / 3 columns / 4 columns
Services: 1 / 2 / 2 / 3 columns
Blog: 1 / horizontal or 2 / 3 / 3 columns
FAQ: full mobile width, centered max-width on larger screens
```

Expected: no accidental full-page horizontal overflow.

## Task 4: Icon And UI Primitive Integration

**Files:**
- Modify: `apps/user/components/Icon.tsx` only if a missing product UI icon is required.
- Modify: `apps/user/components/icons.tsx` only if a missing product UI icon is required.
- Modify: landing section files from Task 2.

**Interfaces:**
- Consumes: existing `Icon`, `Button`, and `Accordion`.
- Produces: UI that follows the repository design rules.

- [ ] **Step 1: Reuse existing icons first**

Use existing names where possible:

```tsx
<Icon name="arrow-right" size={16} />
<Icon name="message-typing" size={20} />
<Icon name="chevron-down" size={20} />
```

Expected: no duplicate icons are added for existing shapes.

- [ ] **Step 2: Use `Button` for CTAs**

Use `Button` with landing-specific classes or styles:

```tsx
<Button className={styles.kakaoButton} rightIcon={<Icon name="message-typing" size={20} />}>
  실시간 카톡상담
</Button>
```

Expected: common UI primitive is reused while Figma-specific colors are applied locally.

- [ ] **Step 3: Use `Accordion` for FAQ**

Use:

```tsx
<Accordion
  defaultOpen={item.defaultOpen}
  question={item.question}
  answer={item.answer}
  className={styles.faqItem}
  style={{ width: "100%" }}
/>
```

Expected: FAQ is interactive without writing a custom accordion.

## Task 5: Verification And Cleanup

**Files:**
- All files changed above

**Interfaces:**
- Consumes: completed landing implementation.
- Produces: verified user landing page.

- [ ] **Step 1: Check no Figma URLs remain in app/package source**

Run:

```bash
rg "figma.com/api/mcp/asset|https://www.figma.com/api" apps packages
```

Expected: no matches.

- [ ] **Step 2: Run user lint**

Run:

```bash
pnpm --filter=user lint
```

Expected: exits 0.

- [ ] **Step 3: Run user typecheck**

Run:

```bash
pnpm --filter=user check-types
```

Expected: exits 0.

- [ ] **Step 4: Run user build**

Run:

```bash
pnpm --filter=user build
```

Expected: exits 0.

- [ ] **Step 5: Run local visual check**

Run:

```bash
pnpm dev --filter=user
```

Open `http://localhost:3000` and inspect at widths 390px, 640px, 1080px, and 1920px.

Expected: no browser/device chrome, no broken images, no unintended horizontal overflow, no unreadable overlapping text.
