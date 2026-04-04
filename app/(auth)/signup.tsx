import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useSignUp } from '@clerk/clerk-expo';

export default function SignupScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [role, setRole] = useState<'customer' | 'cleaner'>('customer');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!isLoaded) {
      return;
    }

    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
        unsafeMetadata: { role },
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Signup failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded || !signUp) {
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
      } else {
        Alert.alert('Error', 'Verification could not be completed.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Verification failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.verifyTitle}>Verify your email</Text>
          <Text style={styles.verifyMessage}>
            We sent a verification code to {email}
          </Text>

          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="Enter code"
            keyboardType="number-pad"
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <View style={styles.roleRow}>
          <Pressable
            style={[
              styles.roleButton,
              role === 'customer' && styles.roleButtonActive,
            ]}
            onPress={() => setRole('customer')}
          >
            <Text
              style={[
                styles.roleText,
                role === 'customer' && styles.roleTextActive,
              ]}
            >
              I need cleaning
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.roleButton,
              role === 'cleaner' && styles.roleButtonActive,
            ]}
            onPress={() => setRole('cleaner')}
          >
            <Text
              style={[
                styles.roleText,
                role === 'cleaner' && styles.roleTextActive,
              ]}
            >
              I&apos;m a cleaner
            </Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
            />
          </View>
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
        />

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating...' : 'Create Account'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  form: { flex: 1, justifyContent: 'center' },
  verifyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  verifyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  roleButtonActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  roleText: { fontSize: 14, fontWeight: '500', color: '#666' },
  roleTextActive: { color: '#2563eb' },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
