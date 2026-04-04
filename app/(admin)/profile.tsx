import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { colors } from '@/lib/constants/colors';
import { Avatar, Button, StatusBadge, Card } from '@/components/ui';

export default function AdminProfileScreen() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut, isLoaded: isAuthLoaded } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const fullName =
    user?.fullName ??
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ??
    'Admin';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Card style={styles.profileCard}>
        <View style={styles.avatarSection}>
          <Avatar name={fullName} imageUrl={user?.imageUrl} size={72} />
          <View style={styles.nameSection}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
            <StatusBadge status="investigating" label="Admin" />
          </View>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>Administrator</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {email}
          </Text>
        </View>
        {user?.createdAt && (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member since</Text>
              <Text style={styles.infoValue}>
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </>
        )}
      </Card>

      <View style={styles.signOutSection}>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="destructive"
          disabled={!isUserLoaded || !isAuthLoaded}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },

  // Profile card
  profileCard: {
    marginBottom: 12,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  nameSection: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  email: {
    fontSize: 14,
    color: colors.muted,
  },

  // Info card
  infoCard: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  // Sign out
  signOutSection: {
    marginTop: 8,
  },
});
