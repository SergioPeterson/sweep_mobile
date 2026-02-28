# Sweep Mobile

Mobile application for Sweep, a two-sided marketplace connecting customers with independent cleaners in San Francisco. Built with Expo 52 and React Native 0.76.

## Tech Stack

- **Framework**: [Expo 52](https://expo.dev) + [React Native 0.76](https://reactnative.dev)
- **Routing**: [expo-router](https://docs.expo.dev/router/introduction/) (file-based)
- **Auth**: [Clerk](https://clerk.com) (`@clerk/clerk-expo`) + [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/)
- **State**: [React Query](https://tanstack.com/query) (server state) + [Zustand](https://zustand-demo.pmnd.rs) (client state)

## Prerequisites

- [Node.js](https://nodejs.org) (v20+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo`)
- iOS Simulator (macOS) or Android Emulator, or [Expo Go](https://expo.dev/go) on a physical device
- Running backend API (default: `http://localhost:3050`)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file:

```env
EXPO_PUBLIC_WEB_URL=http://localhost:3000
EXPO_PUBLIC_API_URL=http://localhost:3050
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 3. Start the dev server

```bash
npx expo start
```

Then press:
- `i` — open iOS Simulator
- `a` — open Android Emulator
- Scan QR code — open in Expo Go on device

## Scripts

| Command | Description |
|---------|-------------|
| `npx expo start` | Start Expo dev server |
| `npx expo start --ios` | Start and open iOS Simulator |
| `npx expo start --android` | Start and open Android Emulator |
| `npx expo export --platform ios` | Verify iOS build |
| `npx expo export --platform android` | Verify Android build |
| `npm run test` | Run test suite |

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
    ├── _layout.tsx        # Cleaner tab navigator
    ├── dashboard.tsx      # Job overview + stats
    ├── earnings.tsx       # Earnings breakdown
    ├── calendar.tsx       # Weekly availability
    └── profile.tsx        # Profile editing

lib/
├── api/client.ts          # Axios with token interceptor
├── stores/authStore.ts    # Zustand auth store (secure token persistence)
└── constants/colors.ts    # Design system tokens
```

## Conventions

- **Styling**: `StyleSheet.create` only — no NativeWind, no styled-components
- **Navigation**: `router.replace()` for auth redirects, `router.push()` for stack navigation
- **Alerts**: `Alert.alert()` for confirmations and errors
- **Tabs**: Each route group uses `<Tabs>` from expo-router in its `_layout.tsx`

## License

Private — All rights reserved.
