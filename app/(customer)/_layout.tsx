import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '../../lib/stores/authStore';
import { colors } from '../../lib/constants/colors';

export default function CustomerLayout() {
  const { isSignedIn } = useAuth();
  const { role, isRoleLoaded } = useAuthStore();

  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isRoleLoaded && role === 'cleaner') {
    return <Redirect href="/(cleaner)/dashboard" />;
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
        name="search"
        options={{ title: 'Find Cleaners', tabBarLabel: 'Home' }}
      />
      <Tabs.Screen
        name="book"
        options={{ title: 'Book a Clean', tabBarLabel: 'Book' }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: 'My Bookings', tabBarLabel: 'Bookings' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarLabel: 'Profile' }}
      />
      {/* Hidden routes (push targets, not tabs) */}
      <Tabs.Screen name="cleaner/[id]" options={{ href: null }} />
      <Tabs.Screen name="cleaner/[id]/book" options={{ href: null }} />
      <Tabs.Screen name="booking/[id]" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
