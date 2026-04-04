import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { setTokenGetter } from '../lib/api/client';
import { PlatformSyncBridge } from '../lib/auth/syncBridge';
import { getDashboardRouteForRole } from '../lib/auth/roles';
import { useAuthStore } from '../lib/stores/authStore';
import { colors } from '../lib/constants/colors';

function ClerkTokenBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(async () => getToken());
  }, [getToken]);

  return null;
}

function InitialRouteGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { role, isRoleLoaded } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)';
    const inCustomerGroup = firstSegment === '(customer)';
    const inCleanerGroup = firstSegment === '(cleaner)';
    const inAdminGroup = firstSegment === '(admin)';
    const onIndex = !firstSegment;

    if (!isSignedIn) {
      if (!inAuthGroup && !onIndex) {
        router.replace('/');
      }
      return;
    }

    if (!isRoleLoaded) return;

    // Route admin users to admin dashboard
    if (role === 'admin') {
      if (onIndex || inAuthGroup || inCustomerGroup || inCleanerGroup) {
        router.replace('/(admin)/dashboard' as never);
      }
      return;
    }

    const dashboardRoute = getDashboardRouteForRole(role ?? 'customer');
    if (!dashboardRoute) return;

    if (onIndex || inAuthGroup) {
      router.replace(dashboardRoute as '/(customer)/search');
      return;
    }

    if (inCustomerGroup && role === 'cleaner') {
      router.replace('/(cleaner)/dashboard');
      return;
    }

    if (inCleanerGroup && role === 'customer') {
      router.replace('/(customer)/search');
      return;
    }

    if (inAdminGroup) {
      // Non-admin users shouldn't be in admin group (admin already handled above)
      router.replace(dashboardRoute as '/(customer)/search');
      return;
    }
  }, [isLoaded, isSignedIn, isRoleLoaded, role, segments, router]);

  if (!isLoaded || (isSignedIn && !isRoleLoaded)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.forest700} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <ClerkTokenBridge />
        <PlatformSyncBridge />
        <StatusBar style="auto" />
        <InitialRouteGuard>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(customer)" options={{ headerShown: false }} />
            <Stack.Screen name="(cleaner)" options={{ headerShown: false }} />
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
        </InitialRouteGuard>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
});
