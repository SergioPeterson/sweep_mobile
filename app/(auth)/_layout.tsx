import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '../../lib/stores/authStore';
import { getDashboardRouteForRole } from '../../lib/auth/roles';

export default function AuthLayout() {
  const { isSignedIn } = useAuth();
  const { role, isRoleLoaded } = useAuthStore();

  if (isSignedIn && isRoleLoaded && role && role !== 'admin') {
    const dashboardRoute = getDashboardRouteForRole(role);
    if (dashboardRoute) {
      return <Redirect href={dashboardRoute as '/(customer)/search'} />;
    }
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="login" options={{ title: 'Log In' }} />
      <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
    </Stack>
  );
}
