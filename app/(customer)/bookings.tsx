import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import {
  Card,
  Button,
  StatusBadge,
  SegmentedControl,
  EmptyState,
  LoadingScreen,
} from '@/components/ui';
import { getBookings, cancelBooking, type Booking } from '@/lib/api/bookings';
import { submitReview, type SubmitReviewParams } from '@/lib/api/reviews';
import { formatUsdFromCents } from '@/lib/format';

type Tab = 'upcoming' | 'past';

const UPCOMING_STATUSES = ['confirmed', 'in_progress'];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateOnly(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  return `${fmt(s)} - ${fmt(e)}`;
}

export default function BookingsScreen() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const queryClient = useQueryClient();

  // Review inline form state
  const [reviewingBookingId, setReviewingBookingId] = useState<string | null>(
    null,
  );
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const {
    data: allBookings = [],
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ['myBookings'],
    queryFn: getBookings,
  });

  const upcoming = useMemo(
    () =>
      allBookings.filter((b) => UPCOMING_STATUSES.includes(b.status)),
    [allBookings],
  );

  const past = useMemo(
    () =>
      allBookings.filter((b) => !UPCOMING_STATUSES.includes(b.status)),
    [allBookings],
  );

  const bookings = tab === 'upcoming' ? upcoming : past;

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      Alert.alert('Cancelled', 'Your booking has been cancelled.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (params: SubmitReviewParams) => submitReview(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      setReviewingBookingId(null);
      setReviewRating(5);
      setReviewText('');
      Alert.alert('Thank you!', 'Your review has been submitted.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    },
  });

  const handleCancel = useCallback(
    (booking: Booking) => {
      Alert.alert(
        'Cancel Booking',
        `Are you sure you want to cancel your booking on ${formatDateOnly(booking.startTime)}?`,
        [
          { text: 'Keep Booking', style: 'cancel' },
          {
            text: 'Cancel Booking',
            style: 'destructive',
            onPress: () => cancelMutation.mutate(booking.id),
          },
        ],
      );
    },
    [cancelMutation],
  );

  const handleSubmitReview = useCallback(() => {
    if (!reviewingBookingId) return;
    reviewMutation.mutate({
      bookingId: reviewingBookingId,
      rating: reviewRating,
      text: reviewText.trim() || undefined,
    });
  }, [reviewingBookingId, reviewRating, reviewText, reviewMutation]);

  const renderBooking = useCallback(
    ({ item }: { item: Booking }) => {
      const isUpcoming = UPCOMING_STATUSES.includes(item.status);
      const isCompleted = item.status === 'completed';
      const hasReview = !!item.reviewId;
      const isReviewing = reviewingBookingId === item.id;

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push(`/(customer)/booking/${item.id}` as never)}
        >
          <Card style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Text style={styles.cleanerName} numberOfLines={1}>
                {item.cleanerName ?? 'Cleaner'}
              </Text>
              <StatusBadge status={item.status} />
            </View>

            <Text style={styles.dateText}>
              {formatDateOnly(item.startTime)}
            </Text>
            <Text style={styles.timeText}>
              {formatTimeRange(item.startTime, item.endTime)}
            </Text>

            <View style={styles.bookingFooter}>
              <Text style={styles.priceText}>
                {formatUsdFromCents(item.total)}
              </Text>

              {isUpcoming && (
                <Button
                  title="Cancel"
                  variant="destructive"
                  size="sm"
                  onPress={() => handleCancel(item)}
                  loading={
                    cancelMutation.isPending &&
                    cancelMutation.variables === item.id
                  }
                />
              )}

              {isCompleted && !hasReview && !isReviewing && (
                <Button
                  title="Leave Review"
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    setReviewingBookingId(item.id);
                    setReviewRating(5);
                    setReviewText('');
                  }}
                />
              )}

              {isCompleted && hasReview && (
                <Text style={styles.reviewedText}>Reviewed</Text>
              )}
            </View>

            {/* Inline review form */}
            {isReviewing && (
              <View style={styles.reviewForm}>
                <Text style={styles.reviewFormTitle}>Your Rating</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewRating(star)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.star,
                          star <= reviewRating && styles.starActive,
                        ]}
                      >
                        {'\u2605'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Write a review (optional)"
                  placeholderTextColor={colors.muted}
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <View style={styles.reviewActions}>
                  <Button
                    title="Cancel"
                    variant="ghost"
                    size="sm"
                    onPress={() => setReviewingBookingId(null)}
                  />
                  <Button
                    title="Submit"
                    size="sm"
                    onPress={handleSubmitReview}
                    loading={reviewMutation.isPending}
                  />
                </View>
              </View>
            )}
          </Card>
        </TouchableOpacity>
      );
    },
    [
      reviewingBookingId,
      reviewRating,
      reviewText,
      handleCancel,
      handleSubmitReview,
      cancelMutation,
      reviewMutation,
    ],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.segmentWrap}>
        <SegmentedControl
          segments={[
            { label: 'Upcoming', value: 'upcoming', count: upcoming.length },
            { label: 'Past', value: 'past', count: past.length },
          ]}
          selected={tab}
          onSelect={(v) => setTab(v as Tab)}
        />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load bookings. Pull to retry.
          </Text>
        </View>
      ) : null}

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.forest700}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title={
              tab === 'upcoming'
                ? 'No upcoming bookings'
                : 'No past bookings'
            }
            subtitle={
              tab === 'upcoming'
                ? 'Book a cleaner to get started'
                : 'Your completed bookings will appear here'
            }
            actionLabel={tab === 'upcoming' ? 'Find Cleaners' : undefined}
            onAction={
              tab === 'upcoming'
                ? () => router.push('/(customer)/search')
                : undefined
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  bookingCard: {
    gap: 6,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cleanerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  timeText: {
    fontSize: 13,
    color: colors.muted,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.forest700,
  },
  reviewedText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.success,
  },
  // Review form
  reviewForm: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  reviewFormTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  starRow: {
    flexDirection: 'row',
    gap: 6,
  },
  star: {
    fontSize: 28,
    color: colors.slate300,
  },
  starActive: {
    color: colors.amber500,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.foreground,
    minHeight: 72,
    backgroundColor: colors.background,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
});
