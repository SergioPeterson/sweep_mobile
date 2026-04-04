import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import { Button, Card, StatusBadge, LoadingScreen } from '@/components/ui';
import { getBookingById, cancelBooking, type Booking } from '@/lib/api/bookings';
import { formatUsdFromCents } from '@/lib/format';

const CANCELLABLE_STATUSES = ['confirmed', 'in_progress'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

function computeHours(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: booking,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingById(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      Alert.alert('Cancelled', 'Your booking has been cancelled.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    },
  });

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(),
        },
      ],
    );
  }, [cancelMutation]);

  if (isLoading) return <LoadingScreen />;

  if (error || !booking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Booking not found</Text>
        <Text style={styles.errorSubtitle}>
          This booking may no longer exist.
        </Text>
        <Button
          title="Go Back"
          variant="secondary"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(booking.status);
  const hours = booking.hours ?? computeHours(booking.startTime, booking.endTime);

  // Reverse-engineer pricing: total is in cents
  // totalCents = subtotal + fee; fee = subtotal * 0.08
  // totalCents = subtotal * 1.08 => subtotal = total / 1.08
  const totalCents = booking.total;
  const subtotalCents = Math.round(totalCents / 1.08);
  const platformFeeCents = totalCents - subtotalCents;
  const hourlyRateCents = hours > 0 ? Math.round(subtotalCents / hours) : 0;

  const address = booking.address;
  const addressString = address
    ? [
        address.street,
        address.unit ? `Unit ${address.unit}` : null,
        `${address.city}, ${address.state} ${address.zip}`,
      ]
        .filter(Boolean)
        .join('\n')
    : 'No address provided';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.forest700}
        />
      }
    >
      {/* Status header */}
      <View style={styles.statusHeader}>
        <StatusBadge status={booking.status} />
        <Text style={styles.bookingId}>Booking #{booking.id.slice(0, 8)}</Text>
      </View>

      {/* Cleaner */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Cleaner</Text>
        <Text style={styles.cardValue}>
          {booking.cleanerName ?? 'Assigned cleaner'}
        </Text>
      </Card>

      {/* Date & Time */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Date & Time</Text>
        <Text style={styles.dateValue}>{formatDate(booking.startTime)}</Text>
        <Text style={styles.timeValue}>
          {formatTimeRange(booking.startTime, booking.endTime)}
        </Text>
        <Text style={styles.durationValue}>{hours} hour{hours !== 1 ? 's' : ''}</Text>
      </Card>

      {/* Address */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Address</Text>
        <Text style={styles.addressValue}>{addressString}</Text>
        {booking.accessInstructions ? (
          <View style={styles.accessRow}>
            <Text style={styles.accessLabel}>Access Instructions</Text>
            <Text style={styles.accessValue}>
              {booking.accessInstructions}
            </Text>
          </View>
        ) : null}
      </Card>

      {/* Price Breakdown */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Price Breakdown</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>
            Base ({hours}h x {formatUsdFromCents(hourlyRateCents)}/hr)
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

      {/* Cancel button */}
      {canCancel && (
        <View style={styles.cancelSection}>
          <Button
            title="Cancel Booking"
            variant="destructive"
            onPress={handleCancel}
            loading={cancelMutation.isPending}
          />
        </View>
      )}

      {/* Booked on */}
      <Text style={styles.createdAt}>
        Booked on{' '}
        {new Date(booking.createdAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </Text>
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
    paddingBottom: 40,
    gap: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingId: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  card: {
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  timeValue: {
    fontSize: 15,
    color: colors.foreground,
  },
  durationValue: {
    fontSize: 13,
    color: colors.muted,
  },
  addressValue: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.foreground,
  },
  accessRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  accessLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: 4,
  },
  accessValue: {
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 20,
  },
  // Pricing
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
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
  cancelSection: {
    marginTop: 8,
  },
  createdAt: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    minWidth: 120,
  },
});
