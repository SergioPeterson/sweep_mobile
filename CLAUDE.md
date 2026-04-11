# Sweep Mobile

This repo is the Expo mobile app for Sweep. It covers customer, cleaner, and admin mobile flows, including agent access controls for MCP.

## Quick Start

```bash
npm install
npx expo start
```

Useful local context:

- backend dependency on `3050`
- Stripe publishable key is required for payment flows
- the real default branch in this repo is `master`

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
├── (admin)/               # Admin support routes
└── (cleaner)/             # Cleaner routes

lib/
├── api/                   # API helpers
├── auth/                  # Role and auth helpers
├── stores/                # Zustand stores
└── mcp/                   # MCP presentation and settings helpers
```

## Conventions

- Routing: expo-router file-based route groups.
- Styling: `StyleSheet.create` only.
- State: React Query for server state and Zustand for client-side state.
- Navigation: use the existing router patterns already established in the app.
- Auth: role routing depends on the shared known test emails.
- MCP: keep mobile agent-access behavior aligned with backend and web.

## Definition of Done (Required)

- Every new function, utility, or business-rule change must include corresponding automated tests in the same PR.
- Validate impacted user journeys with e2e checks (automated when available; otherwise documented manual e2e verification on device/emulator).
- Keep mobile code modular and DRY:
  - Move repeated UI into reusable components.
  - Move repeated data/state logic into reusable hooks or `lib/` modules.
  - Avoid duplicating request/response mapping logic across screens.
- Maintain end-to-end type safety for API interactions and shared contracts (avoid `any`).
- Before marking work complete, run the full existing automated test suite for this repo (not just newly added or targeted tests); all prior tests must pass.
- For every code change, create a new branch and open a new PR to merge into `master` unless explicitly instructed otherwise.
- Never commit or push directly to `master` unless the user explicitly asks for that exception.
- Before merging a PR, run code review using a fresh reviewer sub-agent; if any blocking issue is found, fix it and run review again with a fresh reviewer sub-agent.
- Repeat that fix and fresh-review cycle until the latest sub-agent PR review is clean, then merge.
- After every change, run:
  - `bun test`
  - `npx tsc --noEmit`
  - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dummy npx expo export --platform ios`
  - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dummy npx expo export --platform android`

## Production Guardrails (Required)

- Require pull requests to `master` with required status checks and required approvals before merge.
- Require Code Owner approval for critical paths (`backend`, `auth`, `payments`, `infra`, and workflow/security configs).
- Treat AI-generated output as draft input only; human review and accountability are mandatory before merge.
- CI on every PR must run compile/build validation, the full automated test suite, and static analysis.
- Security gates are mandatory: CodeQL/code scanning and dependency review must pass.
- Release artifacts must have supply-chain provenance attestation (SLSA-aligned build provenance).
- For AI-related changes, run evals continuously on every change; fail PRs when evals are required but missing.
- Follow secure SDLC baseline controls: NIST SSDF (SP 800-218) and OWASP ASVS 5.0.0.
