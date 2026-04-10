import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import { Avatar, Button, Card, LoadingScreen, StickyBottomBar } from '@/components/ui';
import {
  getCleanerProfile,
  saveCleanerProfile,
  startStripeConnect,
  type CleanerServiceType,
} from '@/lib/api/cleaners';
import {
  CLEANER_SERVICE_OPTIONS,
  isValidSfZip,
  toCleanerProfilePayload,
} from '@/lib/cleaner/onboarding';

const MIN_RATE = 25;
const MAX_RATE = 150;
const RATE_INCREMENT = 5;
const MIN_HOURS_OPTIONS = [2, 3, 4, 5, 6];

const SERVICE_ICONS: Record<string, string> = {
  standard: '\u{1F9F9}',
  deep_clean: '\u{2728}',
  move_in_out: '\u{1F4E6}',
  inside_fridge: '\u{2744}\uFE0F',
  inside_oven: '\u{1F525}',
  inside_cabinets: '\u{1F6AA}',
  laundry: '\u{1F455}',
  windows: '\u{1FA9F}',
};

export default function CleanerProfileScreen() {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();

  const [bio, setBio] = useState('');
  const [rateDollars, setRateDollars] = useState(45);
  const [selectedServices, setSelectedServices] = useState<CleanerServiceType[]>([]);
  const [minHours, setMinHours] = useState(3);
  const [zip, setZip] = useState('');
  const [dirty, setDirty] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['cleaner-profile'],
    queryFn: getCleanerProfile,
  });

  const saveMutation = useMutation({
    mutationFn: saveCleanerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaner-profile'] });
      setDirty(false);
      Alert.alert('Saved', 'Profile updated.');
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message || 'Could not save profile.');
    },
  });

  const stripeMutation = useMutation({
    mutationFn: startStripeConnect,
    onSuccess: async ({ url }) => {
      await Linking.openURL(url);
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message || 'Could not start Stripe setup.');
    },
  });

  // Load profile data into form
  useEffect(() => {
    if (!profileQuery.data) return;
    const p = profileQuery.data.cleaner;
    setBio(p.bio);
    setRateDollars(p.baseRate > 0 ? Math.round(p.baseRate / 100) : 45);
    setSelectedServices(p.services.map((s) => s.type as CleanerServiceType));
    setMinHours(p.minHours > 0 ? p.minHours : 3);
    setZip(p.locationZip || '');
  }, [profileQuery.data]);

  const markDirty = () => { if (!dirty) setDirty(true); };

  const incrementRate = () => {
    setRateDollars((prev) => Math.min(prev + RATE_INCREMENT, MAX_RATE));
    markDirty();
  };

  const decrementRate = () => {
    setRateDollars((prev) => Math.max(prev - RATE_INCREMENT, MIN_RATE));
    markDirty();
  };

  const toggleService = (service: CleanerServiceType) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service],
    );
    markDirty();
  };

  const handleSave = () => {
    if (bio.length < 10) {
      Alert.alert('Error', 'Bio must be at least 10 characters.');
      return;
    }
    if (!isValidSfZip(zip)) {
      Alert.alert('Error', 'Enter a valid San Francisco zip code.');
      return;
    }
    if (selectedServices.length === 0) {
      Alert.alert('Error', 'Select at least one service.');
      return;
    }

    const payload = toCleanerProfilePayload({
      bio,
      baseRateDollars: rateDollars,
      minHours,
      serviceRadiusMiles: 10,
      locationZip: zip,
      locationLat: 37.7749,
      locationLng: -122.4194,
      services: selectedServices,
    });

    saveMutation.mutate(payload);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  if (profileQuery.isLoading) {
    return <LoadingScreen />;
  }

  const profile = profileQuery.data?.cleaner;
  const stripeConnected = profile?.stripeOnboardingComplete ?? false;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <Avatar
            name={profile ? `${profile.firstName} ${profile.lastName}` : '?'}
            imageUrl={profile?.photoUrl}
            size={80}
          />
          <Text style={styles.name}>
            {profile ? `${profile.firstName} ${profile.lastName}` : ''}
          </Text>
          {profile && profile.rating > 0 && (
            <Text style={styles.ratingText}>
              {profile.rating.toFixed(1)} {'\u2605'} ({profile.reviewCount})
            </Text>
          )}
        </View>

        {/* Bio */}
        <Text style={styles.sectionLabel}>About</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={(v) => { setBio(v); markDirty(); }}
          multiline
          placeholder="Tell customers about yourself..."
          placeholderTextColor={colors.muted}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{bio.length}/500</Text>

        {/* Hourly rate */}
        <Text style={styles.sectionLabel}>Hourly Rate</Text>
        <View style={styles.rateRow}>
          <TouchableOpacity
            style={[styles.rateButton, rateDollars <= MIN_RATE && styles.rateButtonDisabled]}
            onPress={decrementRate}
            disabled={rateDollars <= MIN_RATE}
            activeOpacity={0.7}
          >
            <Text style={styles.rateButtonText}>{'\u2212'}</Text>
          </TouchableOpacity>
          <Text style={styles.rateDisplay}>${rateDollars}/hr</Text>
          <TouchableOpacity
            style={[styles.rateButton, rateDollars >= MAX_RATE && styles.rateButtonDisabled]}
            onPress={incrementRate}
            disabled={rateDollars >= MAX_RATE}
            activeOpacity={0.7}
          >
            <Text style={styles.rateButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Services */}
        <Text style={styles.sectionLabel}>Services</Text>
        <View style={styles.serviceGrid}>
          {CLEANER_SERVICE_OPTIONS.map((option) => {
            const selected = selectedServices.includes(option.value);
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.serviceCard, selected && styles.serviceCardSelected]}
                onPress={() => toggleService(option.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.serviceIcon}>{SERVICE_ICONS[option.value] || '\u2728'}</Text>
                <Text
                  style={[styles.serviceLabel, selected && styles.serviceLabelSelected]}
                  numberOfLines={2}
                >
                  {option.label}
                </Text>
                {selected && <Text style={styles.serviceCheck}>{'\u2713'}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Min hours */}
        <Text style={styles.sectionLabel}>Minimum Hours</Text>
        <View style={styles.hoursRow}>
          {MIN_HOURS_OPTIONS.map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.hoursPill, minHours === h && styles.hoursPillSelected]}
              onPress={() => { setMinHours(h); markDirty(); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.hoursPillText, minHours === h && styles.hoursPillTextSelected]}>
                {h}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Zip code */}
        <Text style={styles.sectionLabel}>Service Area (Zip)</Text>
        <TextInput
          style={styles.zipInput}
          value={zip}
          onChangeText={(v) => { setZip(v); markDirty(); }}
          keyboardType="number-pad"
          placeholder="94102"
          placeholderTextColor={colors.muted}
          maxLength={5}
        />
        {zip.length === 5 && !isValidSfZip(zip) && (
          <Text style={styles.errorText}>Must be a San Francisco zip code</Text>
        )}

        {/* Stripe Connect */}
        <Card style={styles.stripeCard}>
          <View style={styles.stripeHeader}>
            <Text style={styles.sectionLabel}>Payout Account</Text>
            <View style={[styles.stripeDot, stripeConnected ? styles.stripeDotGreen : styles.stripeDotRed]} />
          </View>
          <Text style={styles.stripeStatus}>
            {stripeConnected ? 'Stripe connected' : 'Not connected'}
          </Text>
          {!stripeConnected && (
            <Button
              title={stripeMutation.isPending ? 'Connecting...' : 'Connect Stripe'}
              onPress={() => stripeMutation.mutate()}
              loading={stripeMutation.isPending}
              disabled={stripeMutation.isPending}
              size="sm"
              style={styles.stripeButton}
            />
          )}
          {stripeConnected && (
            <Button
              title="Reconnect"
              onPress={() => stripeMutation.mutate()}
              variant="ghost"
              size="sm"
            />
          )}
        </Card>

        <Card style={styles.utilityCard}>
          <TouchableOpacity
            style={styles.utilityRow}
            activeOpacity={0.7}
            onPress={() => router.push('/(cleaner)/notifications' as never)}
          >
            <View style={styles.utilityCopy}>
              <Text style={styles.utilityLabel}>Notifications</Text>
              <Text style={styles.utilitySublabel}>
                Booking updates, reminders, and payout alerts
              </Text>
            </View>
            <Text style={styles.utilityChevron}>{'>'}</Text>
          </TouchableOpacity>

          <View style={styles.utilityDivider} />

          <TouchableOpacity
            style={styles.utilityRow}
            activeOpacity={0.7}
            onPress={() => router.push('/(cleaner)/settings' as never)}
          >
            <View style={styles.utilityCopy}>
              <Text style={styles.utilityLabel}>Notification Settings</Text>
              <Text style={styles.utilitySublabel}>
                Choose push, email, and SMS preferences
              </Text>
            </View>
            <Text style={styles.utilityChevron}>{'>'}</Text>
          </TouchableOpacity>
        </Card>

        {/* Sign out */}
        <Button
          title="Sign out"
          onPress={handleSignOut}
          variant="destructive"
          style={styles.signOutButton}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sticky save button */}
      {dirty && (
        <StickyBottomBar>
          <Button
            title={saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            loading={saveMutation.isPending}
            disabled={saveMutation.isPending}
            size="lg"
          />
        </StickyBottomBar>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: 10,
  },
  ratingText: {
    fontSize: 14,
    color: colors.amber500,
    fontWeight: '600',
    marginTop: 2,
  },

  // Sections
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 8,
    marginTop: 20,
  },

  // Bio
  bioInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.foreground,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  // Rate
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  rateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.forest100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateButtonDisabled: {
    backgroundColor: colors.slate100,
    opacity: 0.5,
  },
  rateButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.forest700,
  },
  rateDisplay: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.foreground,
    minWidth: 120,
    textAlign: 'center',
  },

  // Services
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    position: 'relative',
  },
  serviceCardSelected: {
    borderColor: colors.forest600,
    backgroundColor: colors.forest50,
  },
  serviceIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
  },
  serviceLabelSelected: {
    color: colors.forest700,
  },
  serviceCheck: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.forest600,
  },

  // Hours
  hoursRow: {
    flexDirection: 'row',
    gap: 10,
  },
  hoursPill: {
    width: 52,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursPillSelected: {
    borderColor: colors.forest600,
    backgroundColor: colors.forest50,
  },
  hoursPillText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  hoursPillTextSelected: {
    color: colors.forest700,
  },

  // Zip
  zipInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.foreground,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },

  // Stripe
  stripeCard: {
    marginTop: 24,
  },
  stripeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stripeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stripeDotGreen: {
    backgroundColor: colors.success,
  },
  stripeDotRed: {
    backgroundColor: colors.error,
  },
  stripeStatus: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 8,
  },
  stripeButton: {
    alignSelf: 'flex-start',
  },
  utilityCard: {
    marginTop: 16,
    paddingVertical: 0,
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  utilityCopy: {
    flex: 1,
    gap: 2,
  },
  utilityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  utilitySublabel: {
    fontSize: 12,
    color: colors.muted,
  },
  utilityChevron: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
  },
  utilityDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // Sign out
  signOutButton: {
    marginTop: 32,
  },

  bottomSpacer: {
    height: 40,
  },
});
