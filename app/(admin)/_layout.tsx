import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '../../lib/stores/authStore';
import { colors } from '../../lib/constants/colors';

export default function AdminLayout() {
  const { isSignedIn } = useAuth();
  const { role, isRoleLoaded } = useAuthStore();

  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isRoleLoaded && role !== 'admin') {
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
        options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }}
      />
      <Tabs.Screen
        name="users"
        options={{ title: 'Users', tabBarLabel: 'Users' }}
      />
      <Tabs.Screen
        name="disputes"
        options={{ title: 'Disputes', tabBarLabel: 'Disputes' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarLabel: 'Profile' }}
      />
    </Tabs>
  );
}
