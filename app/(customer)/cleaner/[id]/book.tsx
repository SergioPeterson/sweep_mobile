import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import { Button, Card, LoadingScreen, StickyBottomBar } from '@/components/ui';
import { DateStrip, DurationPills, TimeSlotList, generateTimeSlots } from '@/components/booking';
import {
  getCleanerById,
  getCleanerAvailability,
  type Cleaner,
} from '@/lib/api/cleaners';
import { createHold, confirmBooking } from '@/lib/api/bookings';
import { formatUsd, formatUsdFromCents } from '@/lib/format';

const PLATFORM_FEE_RATE = 0.08;

function buildNext14Days(): string[] {
  const dates: string[] = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

function formatDateDisplay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const date = new Date(2000, 0, 1, h, m);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function CleanerBookScreen() {
  const { id, date: paramDate, duration: paramDuration, time: paramTime } =
    useLocalSearchParams<{
      id: string;
      date?: string;
      duration?: string;
      time?: string;
    }>();

  const dates = useMemo(() => buildNext14Days(), []);

  const [selectedDate, setSelectedDate] = useState(
    paramDate && dates.includes(paramDate) ? paramDate : dates[0],
  );
  const [duration, setDuration] = useState(
    paramDuration ? Number(paramDuration) : 3,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    paramTime ?? null,
  );

  // Fetch cleaner profile
  const {
    data: cleaner,
    isLoading: cleanerLoading,
  } = useQuery({
    queryKey: ['cleaner', id],
    queryFn: () => getCleanerById(id!),
    enabled: !!id,
  });

  // Fetch availability for selected date
  const {
    data: availabilityData,
    isLoading: slotsLoading,
  } = useQuery({
    queryKey: ['cleanerAvailability', id, selectedDate, duration],
    queryFn: () => getCleanerAvailability(id!, selectedDate, duration),
    enabled: !!id && !!selectedDate,
  });

  // Generate base time slots, then merge with API availability
  const timeSlots = useMemo(() => {
    const base = generateTimeSlots(8, 18);
    if (!availabilityData?.slots?.length) return base;

    const availableSet = new Set<string>();
    for (const slot of availabilityData.slots) {
      if (slot.available) {
        const raw = slot.startTime ?? slot.start ?? '';
        // Extract HH:MM from either ISO string or HH:MM
        if (raw.includes('T')) {
          const d = new Date(raw);
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          availableSet.add(`${hh}:${mm}`);
        } else if (raw.includes(':')) {
          availableSet.add(raw.slice(0, 5));
        }
      }
    }

    // If API returned no available slots, mark all as unavailable
    if (availableSet.size === 0) {
      return base.map((s) => ({ ...s, available: false }));
    }

    return base.map((s) => ({
      ...s,
      available: availableSet.has(s.time),
    }));
  }, [availabilityData]);

  // Pricing
  const rate = cleaner?.hourlyRate ?? cleaner?.baseRate ?? 0;
  const subtotalCents = Math.round(rate * duration * 100);
  const platformFeeCents = Math.round(subtotalCents * PLATFORM_FEE_RATE);
  const totalCents = subtotalCents + platformFeeCents;

  // Book mutation
  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!id || !selectedTime) throw new Error('Missing required fields');

      // Build ISO start/end times
      const [h, m] = selectedTime.split(':').map(Number);
      const startDate = new Date(`${selectedDate}T00:00:00`);
      startDate.setHours(h, m, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + duration);

      const hold = await createHold({
        cleanerId: id,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });

      // For now, confirm with a placeholder address
      // In production this would go through Stripe payment + address selection
      const booking = await confirmBooking({
        holdId: hold.id,
        paymentIntentId: 'pi_placeholder', // Real Stripe integration TBD
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
        },
      });

      return booking;
    },
    onSuccess: () => {
      Alert.alert(
        'Booking Confirmed!',
        'Your cleaning has been booked successfully.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    },
    onError: (err: Error) => {
      Alert.alert(
        'Booking Failed',
        err.message || 'Something went wrong. Please try again.',
      );
    },
  });

  const handleBook = useCallback(() => {
    if (!selectedTime) {
      Alert.alert('Select a Time', 'Please choose a time slot to continue.');
      return;
    }

    const cleanerName = cleaner
      ? `${cleaner.firstName} ${cleaner.lastName}`
      : 'Cleaner';

    Alert.alert(
      'Confirm Booking',
      `${cleanerName}\n${formatDateDisplay(selectedDate)} at ${formatTimeLabel(selectedTime)}\n${duration}h - ${formatUsdFromCents(totalCents)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Now',
          onPress: () => bookMutation.mutate(),
        },
      ],
    );
  }, [selectedTime, selectedDate, duration, totalCents, cleaner, bookMutation]);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
  }, []);

  if (cleanerLoading) return <LoadingScreen />;

  if (!cleaner) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Cleaner not found</Text>
        <Button
          title="Go Back"
          variant="secondary"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const cleanerName = `${cleaner.firstName} ${cleaner.lastName}`;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cleaner summary */}
        <Card style={styles.cleanerSummary}>
          <Text style={styles.cleanerName}>{cleanerName}</Text>
          <Text style={styles.cleanerRate}>
            {formatUsd(rate)}/hr
          </Text>
        </Card>

        {/* Date strip */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
        </View>
        <DateStrip
          dates={dates}
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
        />

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <DurationPills
            options={[2, 3, 4, 5, 6, 8]}
            selected={duration}
            onSelect={setDuration}
            minHours={cleaner.minHours}
          />
        </View>

        {/* Time slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          {slotsLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.forest700}
              style={styles.slotsLoader}
            />
          ) : (
            <TimeSlotList
              slots={timeSlots}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
            />
          )}
        </View>

        {/* Price breakdown */}
        <Card style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>Price Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Base ({duration}h x {formatUsd(rate)})
            </Text>
            <Text style={styles.priceValue}>
              {formatUsdFromCents(subtotalCents)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Platform fee (8%)</Text>
            <Text style={styles.priceValue}>
              {formatUsdFromCents(platformFeeCents)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatUsdFromCents(totalCents)}
            </Text>
          </View>
        </Card>
      </ScrollView>

      <StickyBottomBar>
        <View style={styles.bottomBarContent}>
          <View style={styles.bottomBarInfo}>
            {selectedTime ? (
              <>
                <Text style={styles.bottomBarDate}>
                  {formatDateDisplay(selectedDate)} at{' '}
                  {formatTimeLabel(selectedTime)}
                </Text>
                <Text style={styles.bottomBarTotal}>
                  {formatUsdFromCents(totalCents)}
                </Text>
              </>
            ) : (
              <Text style={styles.bottomBarPrompt}>
                Select a time to continue
              </Text>
            )}
          </View>
          <Button
            title="Book Now"
            onPress={handleBook}
            disabled={!selectedTime || bookMutation.isPending}
            loading={bookMutation.isPending}
            size="md"
          />
        </View>
      </StickyBottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  cleanerSummary: {
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cleanerName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  cleanerRate: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.forest700,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 10,
  },
  slotsLoader: {
    paddingVertical: 24,
  },
  // Pricing
  pricingCard: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.forest700,
  },
  // Bottom bar
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  bottomBarInfo: {
    flex: 1,
  },
  bottomBarDate: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.foreground,
  },
  bottomBarTotal: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.forest700,
    marginTop: 2,
  },
  bottomBarPrompt: {
    fontSize: 14,
    color: colors.muted,
  },
  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.foreground,
    fontWeight: '500',
  },
});
