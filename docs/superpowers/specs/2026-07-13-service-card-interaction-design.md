# Service Card Interaction Design

## Goal

Match every landing-page service card's hover and press appearance to Figma node `193:5671` while preserving the existing service data, labels, and responsive grid.

## Interaction

- Pointer hover and pointer press use the same visual state.
- The state is temporary and ends when the pointer leaves or the press ends.
- No selected-card state is stored in React.
- All service cards share one CSS state rule.

## Active Appearance

- Card background: `linear-gradient(106.92deg, brand-800 0%, gray-800 100%)`.
- Card radius: `16px`.
- Active cards have no visible stroke and retain the same dimensions and content position as default cards.
- Desktop card size remains `440px` wide by `248px` high through the existing grid, minimum height, and `32px` padding rules.
- The content and price groups remain separated by `32px`.

## Content Styling

- Icon container: `40px` square, `12px` radius, brand-50 background, brand-500 icon.
- Title and price: Pretendard GOV Bold, `18px/26px`, `-0.27px` letter spacing, white-text-1000 (`#f8fafc`).
- Description: Pretendard GOV Medium, `14px/20px`, `-0.21px` letter spacing, gray-200 (`#e2e8f0`).
- Action label and arrow remain brand-500 (`#30bac3`).
- Action arrow is `16px`.
- Existing action text, including `자세히 보기`, remains unchanged.

## Implementation

- Keep the existing `ServicesSection` structure and service data array.
- Use CSS `:hover` and `:active` selectors for the transient state.
- Replace the layout-affecting default border with an inset visual stroke so removing it in the active state does not move content by one pixel.
- Update the service-card action arrow size in `ServicesSection.tsx`.
- Do not add dependencies or persistent interaction state.

## Verification

- Compare a desktop card at the `1440px` breakpoint with the Figma reference.
- Verify hover and held pointer press show the same colors and geometry.
- Verify releasing the pointer or leaving the card restores the default state.
- Verify all nine service cards share the behavior.
- Run the user app lint and type checks.
