# Sweep Mobile

This repo is the Expo mobile app for Sweep. It covers customer, cleaner, and admin mobile flows, including agent access controls for MCP.

## Stack

- Expo 52
- React Native 0.76
- expo-router
- Clerk Expo
- React Query
- Zustand
- Stripe React Native

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Add the `.env` file you were given.

Minimum useful local variables:

```env
EXPO_PUBLIC_WEB_URL=http://localhost:3000
EXPO_PUBLIC_API_URL=http://localhost:3050
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

3. Start Expo.

```bash
npx expo start
```

Then use one of:

- `i` for iOS Simulator
- `a` for Android Emulator
- Expo Go on a real device

## What This Repo Owns

- Mobile auth and role routing
- Customer search, booking, and booking management
- Cleaner dashboard, calendar, earnings, and profile flows
- Admin route group support
- Customer agent access controls and approvals

## Code Map

| Path | What lives there |
|------|------------------|
| `app/` | expo-router routes and layouts |
| `app/(customer)/` | Customer routes |
| `app/(cleaner)/` | Cleaner routes |
| `app/(admin)/` | Admin routes |
| `components/` | Shared account, booking, notifications, and UI components |
| `components/account/AgentAccessSection.tsx` | MCP settings UI |
| `lib/api/` | API clients |
| `lib/auth/` | Role and auth helpers |
| `lib/stores/` | Zustand stores |
| `lib/mcp/` | MCP presentation and settings helpers |

## Useful Commands

| Command | What it does |
|---------|--------------|
| `npx expo start` | Start the Expo dev server |
| `npx expo start --ios` | Start and open iOS Simulator |
| `npx expo start --android` | Start and open Android Emulator |
| `npx expo export --platform ios` | Smoke-test the iOS bundle output |
| `npx expo export --platform android` | Smoke-test the Android bundle output |
| `bun test` | Run the mobile test suite |
| `npx tsc --noEmit` | Typecheck the app |

## Manual QA Accounts

Use these exact emails for role-based testing:

| Role | Email |
|------|-------|
| Admin | `sergiopeterson.dev@gmail.com` |
| Cleaner | `sergiopeter2020@gmail.com` |
| Customer | `sergiopeter2016@gmail.com` |

Important:

- Mobile currently hardcodes role mapping for those emails in `lib/auth/roles.ts`.
- Passwords are managed in Clerk, not in the repo.

## Testing

Before handing off a change:

```bash
bun test
npx tsc --noEmit
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dummy npx expo export --platform ios
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dummy npx expo export --platform android
```

Right now there is not a full mobile end-to-end harness like Playwright or Detox in this repo, so most verification is a mix of automated tests plus simulator or device smoke checks.

## Day-One Gotchas

- The mobile app expects the backend on port `3050`.
- Booking payment flows need `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- If role routing looks wrong, first confirm you are signed in with one of the three shared testing emails above.
- Stick to `StyleSheet.create` for styling in this codebase.
