import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import { StatCard, Card, StatusBadge, LoadingScreen, EmptyState } from '@/components/ui';
import { formatUsdFromCents } from '@/lib/format';
import {
  getCleanerDashboard,
  getCleanerProfile,
  type DashboardBooking,
} from '@/lib/api/cleaners';
import { startBooking, completeBooking } from '@/lib/api/bookings';
import { deriveOnboardingStatus } from '@/lib/cleaner/onboarding';

export default function CleanerDashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(new Date());

  // Check onboarding status
  const profileQuery = useQuery({
    queryKey: ['cleaner-profile'],
    queryFn: getCleanerProfile,
  });

  const dashboardQuery = useQuery({
    queryKey: ['cleaner-dashboard'],
    queryFn: getCleanerDashboard,
  });

  const startMutation = useMutation({
    mutationFn: startBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaner-dashboard'] });
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message || 'Could not start booking.');
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaner-dashboard'] });
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message || 'Could not complete booking.');
    },
  });

  // Redirect to setup if not onboarded
  useEffect(() => {
    if (!profileQuery.data) return;
    const p = profileQuery.data.cleaner;
    const status = deriveOnboardingStatus({
      bio: p.bio,
      baseRate: p.baseRate,
      locationZip: p.locationZip,
      services: p.services,
      weeklySchedule: p.weeklySchedule,
      stripeOnboardingComplete: p.stripeOnboardingComplete,
    });
    if (!status.allComplete) {
      router.replace('/(cleaner)/setup' as never);
    }
  }, [profileQuery.data, router]);

  const onRefresh = useCallback(() => {
    dashboardQuery.refetch();
    profileQuery.refetch();
  }, [dashboardQuery, profileQuery]);

  const changeDate = (delta: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta);
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleBookingAction = (booking: DashboardBooking) => {
    const actions: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }> = [];

    if (booking.status === 'confirmed') {
      actions.push({
        text: 'Start',
        onPress: () => startMutation.mutate(booking.id),
      });
    }
    if (booking.status === 'in_progress') {
      actions.push({
        text: 'Complete',
        onPress: () => completeMutation.mutate(booking.id),
      });
    }
    actions.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      `${booking.customer}`,
      `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}\n${booking.address.street}`,
      actions,
    );
  };

  if (profileQuery.isLoading || dashboardQuery.isLoading) {
    return <LoadingScreen />;
  }

  const stats = dashboardQuery.data?.stats;
  const todaysBookings = dashboardQuery.data?.todaysBookings ?? [];
  const upcomingBookings = dashboardQuery.data?.upcomingBookings ?? [];

  // Build day timeline (8am - 8pm)
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = 8 + i;
    const label = hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`;
    return { hour, label };
  });

  const dateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const isToday = new Date().toDateString() === selectedDate.toDateString();

  // Match bookings to time slots
  const getBookingForSlot = (hour: number): DashboardBooking | null => {
    return (
      todaysBookings.find((b) => {
        const bHour = new Date(b.startTime).getHours();
        const bEndHour = new Date(b.endTime).getHours();
        return hour >= bHour && hour < bEndHour;
      }) ?? null
    );
  };

  const getBookingStartHour = (booking: DashboardBooking): number => {
    return new Date(booking.startTime).getHours();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={dashboardQuery.isFetching}
          onRefresh={onRefresh}
          tintColor={colors.forest700}
        />
      }
    >
      {/* Stats */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRow}
      >
        <StatCard
          label="Earnings this week"
          value={formatUsdFromCents(stats?.weeklyEarnings ?? 0)}
        />
        <StatCard
          label="Rating"
          value={`${(stats?.rating ?? 0).toFixed(1)} \u2605`}
        />
        <StatCard
          label="Jobs"
          value={String(stats?.totalJobs ?? 0)}
        />
      </ScrollView>

      {/* Date header */}
      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow} activeOpacity={0.7}>
          <Text style={styles.dateArrowText}>{'\u2039'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday} activeOpacity={0.7}>
          <Text style={styles.dateText}>{dateStr}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow} activeOpacity={0.7}>
          <Text style={styles.dateArrowText}>{'\u203A'}</Text>
        </TouchableOpacity>
        {!isToday && (
          <TouchableOpacity onPress={goToToday} style={styles.todayButton} activeOpacity={0.7}>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Day timeline */}
      <View style={styles.timeline}>
        {timeSlots.map((slot) => {
          const booking = getBookingForSlot(slot.hour);
          const isBookingStart = booking && getBookingStartHour(booking) === slot.hour;

          return (
            <View key={slot.hour} style={styles.timeSlotRow}>
              <Text style={styles.timeLabel}>{slot.label}</Text>
              <View style={styles.timeSlotLine}>
                {isBookingStart && booking ? (
                  <TouchableOpacity
                    style={[
                      styles.bookingBlock,
                      booking.status === 'in_progress' && styles.bookingBlockActive,
                    ]}
                    onPress={() => handleBookingAction(booking)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.bookingBlockHeader}>
                      <Text style={styles.bookingBlockCustomer} numberOfLines={1}>
                        {booking.customer}
                      </Text>
                      <StatusBadge status={booking.status} />
                    </View>
                    <Text style={styles.bookingBlockTime}>
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </Text>
                    {booking.services.length > 0 && (
                      <Text style={styles.bookingBlockServices} numberOfLines={1}>
                        {booking.services.join(', ')}
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : booking ? (
                  // Continuation of a multi-hour booking - show a lighter block
                  <View style={styles.bookingContinuation} />
                ) : (
                  <View style={styles.emptySlot} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Upcoming bookings */}
      {upcomingBookings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          {upcomingBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              activeOpacity={0.7}
              onPress={() => handleBookingAction(booking)}
            >
              <Card style={styles.upcomingCard}>
                <View style={styles.upcomingHeader}>
                  <Text style={styles.upcomingCustomer}>{booking.customer}</Text>
                  <StatusBadge status={booking.status} />
                </View>
                <Text style={styles.upcomingTime}>
                  {formatDate(booking.startTime)} {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </Text>
                <Text style={styles.upcomingAddress} numberOfLines={1}>
                  {booking.address.street}
                </Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {todaysBookings.length === 0 && upcomingBookings.length === 0 && (
        <EmptyState
          title="No bookings yet"
          subtitle="Your upcoming bookings will appear here"
        />
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },

  // Date navigation
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 16,
  },
  dateArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowText: {
    fontSize: 22,
    color: colors.foreground,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
  },
  todayButton: {
    backgroundColor: colors.forest50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.forest700,
  },

  // Timeline
  timeline: {
    marginHorizontal: 16,
    marginTop: 4,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 52,
  },
  timeLabel: {
    width: 48,
    fontSize: 12,
    color: colors.muted,
    paddingTop: 2,
  },
  timeSlotLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: 52,
  },
  emptySlot: {
    minHeight: 52,
  },
  bookingBlock: {
    backgroundColor: colors.forest50,
    borderLeftWidth: 3,
    borderLeftColor: colors.forest600,
    borderRadius: 8,
    padding: 10,
    marginVertical: 2,
    marginRight: 4,
  },
  bookingBlockActive: {
    backgroundColor: '#EDE9FE',
    borderLeftColor: colors.purple500,
  },
  bookingBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingBlockCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
    marginRight: 8,
  },
  bookingBlockTime: {
    fontSize: 12,
    color: colors.muted,
  },
  bookingBlockServices: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: 2,
  },
  bookingContinuation: {
    minHeight: 52,
    backgroundColor: colors.forest50,
    borderLeftWidth: 3,
    borderLeftColor: colors.forest600,
    marginRight: 4,
    opacity: 0.4,
  },

  // Upcoming section
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 10,
  },
  upcomingCard: {
    marginBottom: 10,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  upcomingCustomer: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  upcomingTime: {
    fontSize: 13,
    color: colors.muted,
  },
  upcomingAddress: {
    fontSize: 13,
    color: colors.slate500,
    marginTop: 2,
  },

  bottomSpacer: {
    height: 24,
  },
});
