import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Cleaning Marketplace</Text>
        <Text style={styles.subtitle}>
          Find trusted cleaners near you
        </Text>
      </View>

      <View style={styles.buttons}>
        <Link href="/(customer)/search" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Find a Cleaner</Text>
          </Pressable>
        </Link>

        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </Pressable>
        </Link>

        <Link href="/(auth)/signup" asChild>
          <Pressable style={styles.textButton}>
            <Text style={styles.textButtonText}>Create an account</Text>
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
  textButton: {
    padding: 8,
    alignItems: 'center',
  },
  textButtonText: {
    color: '#2563eb',
    fontSize: 14,
  },
});
