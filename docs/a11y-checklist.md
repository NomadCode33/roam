# A11y checklist — run before closing any ticket with UI

- [ ] Every interactive element reachable and operable by keyboard
- [ ] Buttons that only show an icon have aria-label
- [ ] Every img has alt (empty alt="" if purely decorative)
- [ ] Every input has a real label (htmlFor / id, or aria-label)
- [ ] No div or span with onClick — use button or a
- [ ] Modals use shadcn Dialog; focus returns to trigger on close
- [ ] Dynamic changes announced via LiveRegion
- [ ] Contrast checked: 4.5:1 text, 3:1 large text and UI
- [ ] Color is never the only signal (add text or icon)
- [ ] Tested with keyboard only, no mouse

## CSS gotchas (project-specific)

- Tailwind v4's cascade layers mean unlayered CSS always beats layered
  CSS, regardless of specificity or !important. Any global override in
  globals.css (focus rings, reduced motion, etc.) must sit immediately
  after `@import "tailwindcss";`, before layer context is established —
  otherwise plain unlayered stylesheets like landing.css or auth.css
  will win the cascade even against an !important rule. Confirmed
  09/26/26 fixing the reduced-motion override against .pulse.