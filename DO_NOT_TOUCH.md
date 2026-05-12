# DO NOT TOUCH (Guardrails)

These areas are protected during cleanup/refactor work unless explicitly approved.

## Protected (NO changes)
- ✅ Project cards
  - UI/layout
  - data shape / props
  - styling and animations
  - any card-related fetching/transform logic

- ✅ Admin pages
  - routes
  - UI + components
  - permissions / gating logic

- ✅ Supabase auth flow currently in use
  - sign-in / sign-up
  - session handling
  - protected routes
  - tokens / client initialization

## If a change must touch protected areas
- isolate it in its own commit
- document the reason + expected behavior change (ideally: none)
- verify the same pages still load and behave the same afterward