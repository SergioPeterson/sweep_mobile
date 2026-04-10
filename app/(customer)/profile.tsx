import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { colors } from '@/lib/constants/colors';
import { Avatar, Button, Card } from '@/components/ui';
import { LoadingScreen } from '@/components/ui';

export default function ProfileScreen() {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  if (!userLoaded) return <LoadingScreen />;

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Customer';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Profile header */}
      <View style={styles.header}>
        <Avatar
          name={fullName}
          imageUrl={user?.imageUrl}
          size={80}
        />
        <Text style={styles.name}>{fullName}</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}
      </View>

      {/* Menu items */}
      <View style={styles.menuSection}>
        <Card>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/(customer)/settings' as never)}
          >
            <Text style={styles.menuIcon}>{'\uD83E\uDD16'}</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Agent Access</Text>
              <Text style={styles.menuSublabel}>
                Review connected AI clients and approval guardrails
              </Text>
            </View>
            <Text style={styles.menuChevron}>{'>'}</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>{'\uD83C\uDFE0'}</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Saved Addresses</Text>
              <Text style={styles.menuSublabel}>
                Manage your cleaning locations
              </Text>
            </View>
            <Text style={styles.menuChevron}>{'>'}</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>{'\uD83D\uDCB3'}</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Payment Methods</Text>
              <Text style={styles.menuSublabel}>
                Manage your payment options
              </Text>
            </View>
            <Text style={styles.menuChevron}>{'>'}</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>{'\uD83D\uDD14'}</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Notifications</Text>
              <Text style={styles.menuSublabel}>
                Manage your notification preferences
              </Text>
            </View>
            <Text style={styles.menuChevron}>{'>'}</Text>
          </TouchableOpacity>
        </Card>
      </View>

      {/* Support */}
      <View style={styles.menuSection}>
        <Card>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>{'\u2753'}</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Help & Support</Text>
              <Text style={styles.menuSublabel}>FAQ, contact support</Text>
            </View>
            <Text style={styles.menuChevron}>{'>'}</Text>
          </TouchableOpacity>
        </Card>
      </View>

      {/* Sign out */}
      <View style={styles.signOutSection}>
        <Button
          title="Sign Out"
          variant="destructive"
          onPress={handleSignOut}
        />
      </View>

      <Text style={styles.version}>Sweep v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  menuSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  menuSublabel: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  menuChevron: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 40,
  },
  signOutSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.muted,
    marginTop: 24,
  },
});
