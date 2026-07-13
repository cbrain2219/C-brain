# Service Card Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every service card's hover and press state match Figma node `193:5671` without changing service content or responsive layout.

**Architecture:** Keep the existing stateless React card markup and implement the transient interaction entirely with shared CSS `:hover` and `:active` selectors. Use an inset shadow for the resting stroke so the active state can remove the stroke without shifting content.

**Tech Stack:** Next.js, React, TypeScript, CSS Modules, `@repo/ui` Button and Icon components.

## Global Constraints

- Preserve the existing nine service records, prices, and `자세히 보기` label.
- Do not add React state, dependencies, or persistent selected-card behavior.
- Keep mobile and tablet sizing rules intact; only the existing desktop breakpoint should produce the Figma `440px × 248px` card geometry.
- Scope typography changes to service cards so the nearby reason and consultation UI is not changed.

---

### Task 1: Implement the Figma interaction state

**Files:**
- Modify: `apps/user/app/_components/ServicesSection.tsx`
- Modify: `apps/user/app/page.module.css`

- [ ] **Step 1: Establish the current baseline**

Run:

```bash
pnpm --filter user lint
pnpm --filter user check-types
```

Expected: both commands exit with code `0` before the interaction edits.

- [ ] **Step 2: Give service-card actions their Figma-specific typography and icon size**

Add a dedicated style object without changing `textButtonStyle`, because that object is also used by the consultation button:

```tsx
const serviceButtonStyle: CSSProperties = {
  ...textButtonStyle,
  fontFamily: '"Pretendard GOV Variable", var(--font-sans)',
  letterSpacing: "-0.21px",
};
```

Use `serviceButtonStyle` only for the cards and change their arrow icon from `14` to `16`:

```tsx
<Button
  rightIcon={<Icon name="arrow-right" size={16} />}
  style={serviceButtonStyle}
>
  자세히 보기
</Button>
```

- [ ] **Step 3: Make the resting stroke non-layout-affecting**

In `.serviceCard`, replace the real border with an inset stroke and transition that stroke:

```css
border: 0;
box-shadow: inset 0 0 0 1px var(--landing-gray-100);
transition:
  background 160ms ease,
  box-shadow 160ms ease,
  color 160ms ease;
```

Expected: the default card still has a 1px gray outline, while its content padding is no longer reduced by the border.

- [ ] **Step 4: Match the shared hover and press appearance**

Update the existing state selector so both states have the same stroke-free Figma gradient:

```css
.serviceCard:is(:hover, :active) {
  box-shadow: none;
  background: linear-gradient(
    106.92deg,
    var(--landing-brand-800) 0%,
    var(--landing-gray-800) 100%
  );
}
```

Keep the active title and price at `#f8fafc`, description at gray-200, and icon tile unchanged.

- [ ] **Step 5: Scope and match service-card typography**

Separate service-card rules from the grouped reason-card rules, then apply the Figma tracking:

```css
.serviceCopy h3,
.serviceMeta strong {
  font-family: "Pretendard GOV Variable", var(--font-sans);
  font-size: 18px;
  font-weight: 700;
  line-height: 26px;
  letter-spacing: -0.27px;
}

.serviceCopy p {
  font-family: "Pretendard GOV Variable", var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.21px;
}
```

Retain equivalent standalone rules for `.reasonItem h3` and `.reasonItem p` so that section does not regress.

- [ ] **Step 6: Run static verification**

Run:

```bash
pnpm --filter user lint
pnpm --filter user check-types
```

Expected: both commands exit with code `0`.

- [ ] **Step 7: Verify in the browser at the desktop breakpoint**

Open `http://localhost:3000` at `1440px` width and inspect the service cards.

Expected:

- The grid contains nine cards and the desktop card is `440px` wide with `248px` minimum height and `32px` padding.
- Hover produces the `106.92deg` brand-800 to gray-800 gradient, no visible stroke, white title and price, gray-200 description, and teal action.
- Pointer press uses the same selector and appearance.
- Moving the pointer away restores the white card and 1px gray inset outline without moving content.
- The consultation button and reason section typography remain unchanged.

- [ ] **Step 8: Commit the implementation**

```bash
git add apps/user/app/_components/ServicesSection.tsx apps/user/app/page.module.css docs/superpowers/plans/2026-07-13-service-card-interaction.md
git commit -m "feat: match service card interaction states"
```

Expected: one focused implementation commit is created.
