import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import { Button } from '@/components/ui';
import {
  type DayKey,
  CLEANER_SERVICE_OPTIONS,
  DAY_LABELS,
  isValidSfZip,
  toCleanerProfilePayload,
  toCleanerAvailabilityPayload,
  deriveOnboardingStatus,
  createDefaultWeeklySchedule,
} from '@/lib/cleaner/onboarding';
import {
  getCleanerProfile,
  saveCleanerProfile,
  saveCleanerAvailability,
  startStripeConnect,
  type CleanerServiceType,
} from '@/lib/api/cleaners';

const TOTAL_STEPS = 9;
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

export default function CleanerSetupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [rateDollars, setRateDollars] = useState(45);
  const [selectedServices, setSelectedServices] = useState<CleanerServiceType[]>([]);
  const [minHours, setMinHours] = useState(3);
  const [zip, setZip] = useState('');
  const [locationLat, setLocationLat] = useState(37.7749);
  const [locationLng, setLocationLng] = useState(-122.4194);
  const [bio, setBio] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayKey[]>([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
  ]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getCleanerProfile();
      const p = data.cleaner;

      const status = deriveOnboardingStatus({
        bio: p.bio,
        baseRate: p.baseRate,
        locationZip: p.locationZip,
        services: p.services,
        weeklySchedule: p.weeklySchedule,
        stripeOnboardingComplete: p.stripeOnboardingComplete,
      });

      if (status.allComplete) {
        router.replace('/(cleaner)/dashboard');
        return;
      }

      // Pre-fill from existing profile
      if (p.baseRate > 0) setRateDollars(Math.round(p.baseRate / 100));
      if (p.services.length > 0) {
        setSelectedServices(p.services.map((s) => s.type as CleanerServiceType));
      }
      if (p.minHours > 0) setMinHours(p.minHours);
      if (p.locationZip) setZip(p.locationZip);
      if (p.bio) setBio(p.bio);
    } catch {
      // New cleaner — no profile yet, use defaults
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const goNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const incrementRate = () => {
    setRateDollars((prev) => Math.min(prev + RATE_INCREMENT, MAX_RATE));
  };

  const decrementRate = () => {
    setRateDollars((prev) => Math.max(prev - RATE_INCREMENT, MIN_RATE));
  };

  const toggleService = (service: CleanerServiceType) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service],
    );
  };

  const toggleDay = (day: DayKey) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const requestLocation = () => {
    // Use navigator.geolocation which is available in Expo / React Native
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationLat(position.coords.latitude);
          setLocationLng(position.coords.longitude);
          Alert.alert('Location set', 'Your location has been saved.');
        },
        () => {
          Alert.alert('Error', 'Could not get your location. Please enter a zip code.');
        },
        { enableHighAccuracy: false, timeout: 10000 },
      );
    } else {
      Alert.alert('Not available', 'Location services are not available. Please enter a zip code.');
    }
  };

  const handleSaveProfile = async () => {
    const payload = toCleanerProfilePayload({
      bio,
      baseRateDollars: rateDollars,
      minHours,
      serviceRadiusMiles: 10,
      locationZip: zip,
      locationLat,
      locationLng,
      services: selectedServices,
    });

    setSaving(true);
    try {
      await saveCleanerProfile(payload);
      goNext();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save profile.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvailability = async () => {
    const weeklySchedule = createDefaultWeeklySchedule();
    // Clear days that are not selected
    for (const day of DAY_LABELS) {
      if (!selectedDays.includes(day.key)) {
        weeklySchedule[day.key] = [];
      }
    }

    const payload = toCleanerAvailabilityPayload({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      weeklySchedule,
    });

    setSaving(true);
    try {
      await saveCleanerAvailability(payload);
      goNext();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save schedule.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleStripeConnect = async () => {
    setSaving(true);
    try {
      const { url } = await startStripeConnect();
      await Linking.openURL(url);
      goNext();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not start Stripe setup.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    queryClient.invalidateQueries({ queryKey: ['cleaner-profile'] });
    queryClient.invalidateQueries({ queryKey: ['cleaner-dashboard'] });
    router.replace('/(cleaner)/dashboard');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.forest700} />
      </SafeAreaView>
    );
  }

  // --- Step renderers ---

  const renderWelcome = () => (
    <View style={styles.stepContent}>
      <Text style={styles.welcomeIcon}>{'\u{1F9F9}'}</Text>
      <Text style={styles.welcomeTitle}>Welcome to Sweep</Text>
      <Text style={styles.welcomeSubtitle}>Let's set up your profile</Text>
      <Button title="Get Started" onPress={goNext} size="lg" style={styles.primaryAction} />
    </View>
  );

  const renderRate = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your hourly rate</Text>
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
      <Text style={styles.rateHint}>${MIN_RATE} – ${MAX_RATE}</Text>
      <Button title="Next" onPress={goNext} size="lg" style={styles.primaryAction} />
    </View>
  );

  const renderServices = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Services you offer</Text>
      <Text style={styles.stepSubtitle}>Select all that apply</Text>
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
      <Button
        title="Next"
        onPress={goNext}
        size="lg"
        disabled={selectedServices.length === 0}
        style={styles.primaryAction}
      />
    </View>
  );

  const renderHours = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Minimum booking hours</Text>
      <View style={styles.hoursRow}>
        {MIN_HOURS_OPTIONS.map((h) => (
          <TouchableOpacity
            key={h}
            style={[styles.hoursPill, minHours === h && styles.hoursPillSelected]}
            onPress={() => setMinHours(h)}
            activeOpacity={0.7}
          >
            <Text style={[styles.hoursPillText, minHours === h && styles.hoursPillTextSelected]}>
              {h}h
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button title="Next" onPress={goNext} size="lg" style={styles.primaryAction} />
    </View>
  );

  const renderLocation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your service area</Text>
      <Button
        title="Use my location"
        onPress={requestLocation}
        variant="secondary"
        size="lg"
        style={styles.locationButton}
      />
      <Text style={styles.orText}>or enter zip code</Text>
      <TextInput
        style={styles.zipInput}
        value={zip}
        onChangeText={setZip}
        keyboardType="number-pad"
        placeholder="94102"
        placeholderTextColor={colors.muted}
        maxLength={5}
      />
      {zip.length === 5 && !isValidSfZip(zip) && (
        <Text style={styles.errorText}>Must be a San Francisco zip code</Text>
      )}
      <Button
        title="Next"
        onPress={goNext}
        size="lg"
        disabled={!isValidSfZip(zip)}
        style={styles.primaryAction}
      />
    </View>
  );

  const renderBio = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>About you</Text>
      <TextInput
        style={styles.bioInput}
        value={bio}
        onChangeText={setBio}
        multiline
        placeholder="Tell customers about yourself..."
        placeholderTextColor={colors.muted}
        maxLength={500}
        textAlignVertical="top"
      />
      <Text style={styles.charCounter}>
        {bio.length}/500 (min 10)
      </Text>
      <Button
        title={saving ? 'Saving...' : 'Save & Continue'}
        onPress={handleSaveProfile}
        size="lg"
        disabled={bio.length < 10 || saving}
        loading={saving}
        style={styles.primaryAction}
      />
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Working days</Text>
      <Text style={styles.stepSubtitle}>Tap to toggle (9am-5pm default)</Text>
      <View style={styles.daysRow}>
        {DAY_LABELS.map((day) => {
          const selected = selectedDays.includes(day.key);
          return (
            <TouchableOpacity
              key={day.key}
              style={[styles.dayCircle, selected && styles.dayCircleSelected]}
              onPress={() => toggleDay(day.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayCircleText, selected && styles.dayCircleTextSelected]}>
                {day.short}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Button
        title={saving ? 'Saving...' : 'Save & Continue'}
        onPress={handleSaveAvailability}
        size="lg"
        disabled={selectedDays.length === 0 || saving}
        loading={saving}
        style={styles.primaryAction}
      />
    </View>
  );

  const renderStripe = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Get paid</Text>
      <Text style={styles.stepSubtitle}>Connect your bank account via Stripe</Text>
      <Button
        title={saving ? 'Connecting...' : 'Connect bank account'}
        onPress={handleStripeConnect}
        size="lg"
        loading={saving}
        disabled={saving}
        style={styles.primaryAction}
      />
      <TouchableOpacity onPress={goNext} style={styles.skipButton} activeOpacity={0.7}>
        <Text style={styles.skipText}>I'll do this later</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDone = () => (
    <View style={styles.stepContent}>
      <View style={styles.doneCheckCircle}>
        <Text style={styles.doneCheck}>{'\u2713'}</Text>
      </View>
      <Text style={styles.welcomeTitle}>You're all set!</Text>
      <Text style={styles.welcomeSubtitle}>Start accepting bookings</Text>
      <Button title="Go to Dashboard" onPress={handleFinish} size="lg" style={styles.primaryAction} />
    </View>
  );

  const STEPS = [
    renderWelcome,
    renderRate,
    renderServices,
    renderHours,
    renderLocation,
    renderBio,
    renderSchedule,
    renderStripe,
    renderDone,
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>

      {/* Back arrow */}
      {step > 1 && (
        <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backArrow}>{'\u2190'}</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {STEPS[step - 1]()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.slate200,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.forest600,
    borderRadius: 2,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  backArrow: {
    fontSize: 24,
    color: colors.foreground,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  stepContent: {
    alignItems: 'center',
  },

  // Welcome / Done
  welcomeIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.muted,
    marginTop: 8,
    textAlign: 'center',
  },

  // Step title
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Rate
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    gap: 24,
  },
  rateButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.forest100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateButtonDisabled: {
    backgroundColor: colors.slate100,
    opacity: 0.5,
  },
  rateButtonText: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.forest700,
  },
  rateDisplay: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.foreground,
    minWidth: 160,
    textAlign: 'center',
  },
  rateHint: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 8,
  },

  // Services
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  serviceCard: {
    width: '45%',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative',
  },
  serviceCardSelected: {
    borderColor: colors.forest600,
    backgroundColor: colors.forest50,
  },
  serviceIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
  },
  serviceLabelSelected: {
    color: colors.forest700,
  },
  serviceCheck: {
    position: 'absolute',
    top: 8,
    right: 10,
    fontSize: 16,
    fontWeight: '700',
    color: colors.forest600,
  },

  // Hours
  hoursRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  hoursPill: {
    width: 60,
    height: 60,
    borderRadius: 14,
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  hoursPillTextSelected: {
    color: colors.forest700,
  },

  // Location
  locationButton: {
    width: '100%',
    marginBottom: 16,
  },
  orText: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
  },
  zipInput: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.foreground,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 6,
  },

  // Bio
  bioInput: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.foreground,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
    alignSelf: 'flex-end',
  },

  // Schedule
  daysRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 24,
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    borderColor: colors.forest600,
    backgroundColor: colors.forest600,
  },
  dayCircleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  dayCircleTextSelected: {
    color: colors.white,
  },

  // Stripe
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 15,
    color: colors.muted,
    textDecorationLine: 'underline',
  },

  // Done
  doneCheckCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.forest100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  doneCheck: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.forest600,
  },

  // Shared
  primaryAction: {
    width: '100%',
    marginTop: 32,
  },
});
