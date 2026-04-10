import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '../../lib/stores/authStore';
import { colors } from '../../lib/constants/colors';

export default function CleanerLayout() {
  const { isSignedIn } = useAuth();
  const { role, isRoleLoaded } = useAuthStore();

  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isRoleLoaded && role === 'customer') {
    return <Redirect href="/(customer)/search" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.forest700,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarLabel: 'Home' }}
      />
      <Tabs.Screen
        name="schedule"
        options={{ title: 'Schedule', tabBarLabel: 'Schedule' }}
      />
      <Tabs.Screen
        name="earnings"
        options={{ title: 'Earnings', tabBarLabel: 'Earnings' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarLabel: 'Profile' }}
      />
      {/* Hidden routes */}
      <Tabs.Screen name="setup" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="bonuses" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
