# Sweep Mobile

Expo 52 + React Native 0.76 with expo-router, Zustand, and React Query.

## Quick Start

```bash
npm install
npx expo start                      # Dev server
npx expo export --platform ios      # Verify iOS build
npx expo export --platform android  # Verify Android build
npm run test                        # Full test suite
```

## Project Structure

```
app/
├── _layout.tsx            # Root layout
├── index.tsx              # Entry redirect
├── (auth)/
│   ├── login.tsx          # Email/password login
│   └── signup.tsx         # Registration with role selector
├── (customer)/
│   ├── _layout.tsx        # Customer tab navigator
│   ├── search.tsx         # Cleaner search/browse
│   ├── bookings.tsx       # Booking history
│   └── cleaner/[id].tsx   # Cleaner profile + booking
└── (cleaner)/
    ├── _layout.tsx        # Cleaner tab navigator (Dashboard, Earnings, Calendar, Profile)
    ├── dashboard.tsx      # Job overview + stats
    ├── earnings.tsx       # Earnings breakdown
    ├── calendar.tsx       # Weekly availability + blocked dates
    └── profile.tsx        # Profile editing (bio, rate, services, Stripe)

lib/
├── api/client.ts          # Axios instance with token interceptor
├── stores/authStore.ts    # Zustand auth store (expo-secure-store for token persistence)
└── constants/colors.ts    # Design system color tokens
```

## Conventions

- **Routing**: expo-router file-based routing with route groups — `(auth)`, `(customer)`, `(cleaner)`
- **Styling**: `StyleSheet.create` only. No NativeWind, no styled-components.
- **State**: React Query for server state, Zustand for client state, useState for form state
- **Navigation**: `router.replace()` for auth redirects, `router.push()` for stack navigation
- **Alerts**: Use `Alert.alert()` for confirmations and error messages
- **Auth store**: Zustand with expo-secure-store for persisting auth tokens
- **Tabs**: Each route group with tabs has a `_layout.tsx` using `<Tabs>` from expo-router

## Definition of Done (Required)

- Every new function, utility, or business-rule change must include corresponding automated tests in the same PR.
- Validate impacted user journeys with e2e checks (automated when available; otherwise documented manual e2e verification on device/emulator).
- Keep mobile code modular and DRY:
  - Move repeated UI into reusable components.
  - Move repeated data/state logic into reusable hooks or `lib/` modules.
  - Avoid duplicating request/response mapping logic across screens.
- Maintain end-to-end type safety for API interactions and shared contracts (avoid `any`).
- Before marking work complete, run the full existing automated test suite for this repo (not just newly added or targeted tests); all prior tests must pass.
- For every code change, create a new branch and open a new PR to merge into `main` unless explicitly instructed otherwise.
- Never commit or push directly to `main` unless the user explicitly asks for that exception.
- Before merging a PR, run code review using a fresh reviewer sub-agent; if any blocking issue is found, fix it and run review again with a new fresh reviewer sub-agent.
- Repeat that fix and fresh-review cycle until the latest sub-agent PR review is clean, then merge.
- After every change, run:
  - `npm run test`
  - `npx tsc --noEmit`
  - `npx expo export --platform ios`
  - `npx expo export --platform android`

## Current State

All screens use inline mock data and simulated API calls. Real API integration pending.

## Production Guardrails (Required)

- Require pull requests to `main` with required status checks and required approvals before merge.
- Require Code Owner approval for critical paths (`backend`, `auth`, `payments`, `infra`, and workflow/security configs).
- Treat AI-generated output as draft input only; human review and accountability are mandatory before merge.
- CI on every PR must run compile/build validation, the full automated test suite, and static analysis.
- Security gates are mandatory: CodeQL/code scanning and dependency review must pass.
- Release artifacts must have supply-chain provenance attestation (SLSA-aligned build provenance).
- For AI-related changes, run evals continuously on every change; fail PRs when evals are required but missing.
- Follow secure SDLC baseline controls: NIST SSDF (SP 800-218) and OWASP ASVS 5.0.0.
