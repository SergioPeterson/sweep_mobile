import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useAuthStore } from '../lib/stores/authStore';
import { getDashboardRouteForRole } from '../lib/auth/roles';

export default function HomeScreen() {
  const { isSignedIn } = useAuth();
  const { role, isRoleLoaded } = useAuthStore();

  if (isSignedIn && isRoleLoaded && role && role !== 'admin') {
    const dashboardRoute = getDashboardRouteForRole(role);
    if (dashboardRoute) {
      return <Redirect href={dashboardRoute as '/(customer)/search'} />;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Sweep</Text>
        <Text style={styles.subtitle}>Find trusted cleaners near you</Text>
      </View>

      <View style={styles.buttons}>
        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Log In</Text>
          </Pressable>
        </Link>

        <Link href="/(auth)/signup" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Create an account</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
    paddingBottom: 48,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
