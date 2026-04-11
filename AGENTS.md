# AGENTS.md

If you are reading this file, also read `CLAUDE.md` and `README.md` in this same directory before taking actions.

If these files conflict, follow the stricter rule. If older workspace docs say `main`, treat that as `master` for this repo because the real default branch here is `master`.

## Project Context

Sweep is a two-sided home-cleaning marketplace in San Francisco with three core roles:

- customer
- cleaner
- admin

Related repos:

- `sweep_webserver` for the backend API
- `sweep_web` for the Next.js web app
- `@sweep/shared` for shared contracts and schemas

Cross-repo flows like auth, booking, notifications, and MCP agent access should stay aligned with backend contracts and web behavior.

## Repo Snapshot

This repo owns the Sweep Expo mobile app:

- customer search, booking, and booking management flows
- cleaner dashboard, calendar, earnings, and profile flows
- admin route support
- customer-facing MCP grant and approval controls

## Quick Start

```bash
npm install
npx expo start
```

The app depends on:

- backend API on `3050`
- Clerk publishable key
- Stripe publishable key for payment flows

## Shared Testing Context

The team uses three shared manual QA accounts:

- admin: `sergiopeterson.dev@gmail.com`
- cleaner: `sergiopeter2020@gmail.com`
- customer: `sergiopeter2016@gmail.com`

Passwords are managed in Clerk, not in the repo.

Important mobile nuance:

- role routing currently depends on those exact emails
- if role behavior looks wrong, confirm the signed-in email first
- this repo does not currently have a full Detox-style E2E harness, so most verification is tests plus simulator or export smoke checks

## Important Paths

- `app/` contains expo-router routes and layouts
- `components/` contains shared UI and feature components
- `components/account/AgentAccessSection.tsx` contains the MCP settings UI
- `lib/api/` contains API helpers
- `lib/auth/` contains role and auth helpers
- `lib/mcp/` contains MCP presentation and settings helpers

## Repo Conventions

- Use expo-router route groups already in place.
- Use `StyleSheet.create` for styling.
- Prefer reusable components and helpers over screen-local duplication.
- Keep API mapping logic in helpers instead of burying it inside screens.
- Keep mobile MCP behavior aligned with backend and web.
- Role routing depends on the known shared test emails.
- Clerk and Stripe publishable keys are required for many real flows.

## Definition Of Done

- Every new function, utility, or business-rule change must include corresponding automated tests in the same PR.
- Validate impacted user journeys with automated coverage when available, otherwise document manual E2E verification on device or emulator.
- Before marking work complete, run the full existing automated test suite for this repo, not just targeted tests.
- Do not mark work complete if any pre-existing test fails.

Required verification:

```bash
bun test
npx tsc --noEmit
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dummy npx expo export --platform ios
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dummy npx expo export --platform android
```

## Branch And PR Workflow

- Create a new branch from `master` for every code change unless explicitly instructed otherwise.
- Open a PR targeting `master`.
- Never commit or push directly to `master` unless the user explicitly asks for that exception.
- Before merging a PR, run code review using a fresh reviewer sub-agent.
- If review finds any blocking issue, fix it and run review again with a new fresh reviewer sub-agent.
- Repeat that fix-and-review cycle until the latest review is clean, then merge.

## Production Guardrails

- Require pull requests to `master` with required status checks and required approvals before merge.
- Require Code Owner approval for critical paths such as auth, payments, infra, and workflow or security config.
- Treat AI-generated output as draft input only; human review and accountability are mandatory before merge.
- CI on every PR must run compile or build validation, the full automated test suite, and static analysis.
- Security gates are mandatory: CodeQL or code scanning and dependency review must pass.
- Release artifacts must have supply-chain provenance attestation.
- Follow secure SDLC baseline controls including NIST SSDF and OWASP ASVS 5.0.0.
