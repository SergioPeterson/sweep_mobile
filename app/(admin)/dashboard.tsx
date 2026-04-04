import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import { formatUsdFromCents } from '@/lib/format';
import { getAdminDashboard, type AdminRecentBooking } from '@/lib/api/admin';
import { StatCard, Card, StatusBadge, LoadingScreen, EmptyState } from '@/components/ui';

function truncateId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}...` : id;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function BookingCard({ booking }: { booking: AdminRecentBooking }) {
  return (
    <Card style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingId}>{truncateId(booking.id)}</Text>
        <StatusBadge status={booking.status} />
      </View>
      <View style={styles.bookingRow}>
        <View style={styles.bookingNames}>
          <Text style={styles.bookingLabel}>Customer</Text>
          <Text style={styles.bookingName} numberOfLines={1}>
            {booking.customer}
          </Text>
        </View>
        <View style={styles.bookingNames}>
          <Text style={styles.bookingLabel}>Cleaner</Text>
          <Text style={styles.bookingName} numberOfLines={1}>
            {booking.cleaner}
          </Text>
        </View>
      </View>
      <View style={styles.bookingFooter}>
        <Text style={styles.bookingDate}>{formatDate(booking.date)}</Text>
        <Text style={styles.bookingTotal}>
          {formatUsdFromCents(booking.total)}
        </Text>
      </View>
    </Card>
  );
}

export default function AdminDashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getAdminDashboard,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isError || !data) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState
          title="Unable to load dashboard"
          subtitle="Pull down to retry"
        />
      </View>
    );
  }

  const { stats, recentBookings } = data;

  const header = (
    <View>
      {/* Primary 2x2 stat grid */}
      <View style={styles.statGrid}>
        <View style={styles.statCell}>
          <StatCard label="Total Users" value={String(stats.totalUsers)} />
        </View>
        <View style={styles.statCell}>
          <StatCard label="Total Cleaners" value={String(stats.totalCleaners)} />
        </View>
        <View style={styles.statCell}>
          <StatCard label="GMV" value={formatUsdFromCents(stats.gmv)} />
        </View>
        <View style={styles.statCell}>
          <StatCard
            label="Platform Revenue"
            value={formatUsdFromCents(stats.platformRevenue)}
          />
        </View>
      </View>

      {/* Secondary stats row */}
      <View style={styles.secondaryRow}>
        <View style={styles.secondaryStat}>
          <Text style={styles.secondaryValue}>{stats.bookingsToday}</Text>
          <Text style={styles.secondaryLabel}>Today</Text>
        </View>
        <View style={styles.secondaryDivider} />
        <View style={styles.secondaryStat}>
          <Text style={styles.secondaryValue}>{stats.bookingsThisWeek}</Text>
          <Text style={styles.secondaryLabel}>This Week</Text>
        </View>
        <View style={styles.secondaryDivider} />
        <View style={styles.secondaryStat}>
          <Text style={styles.secondaryValue}>
            {formatUsdFromCents(stats.averageBookingValue)}
          </Text>
          <Text style={styles.secondaryLabel}>Avg Value</Text>
        </View>
        <View style={styles.secondaryDivider} />
        <View style={styles.secondaryStat}>
          <Text
            style={[
              styles.secondaryValue,
              stats.openDisputes > 0 && styles.secondaryValueWarning,
            ]}
          >
            {stats.openDisputes}
          </Text>
          <Text style={styles.secondaryLabel}>Disputes</Text>
        </View>
      </View>

      {/* Section header */}
      <Text style={styles.sectionTitle}>Recent Bookings</Text>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={recentBookings}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => <BookingCard booking={item} />}
      ListEmptyComponent={
        <EmptyState
          title="No bookings yet"
          subtitle="Bookings will appear here once created"
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.forest700}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },

  // Primary stat grid
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  statCell: {
    width: '50%',
    padding: 4,
  },

  // Secondary stats
  secondaryRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
    paddingVertical: 14,
  },
  secondaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  secondaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  secondaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  secondaryValueWarning: {
    color: colors.warning,
  },
  secondaryLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: 24,
    marginBottom: 12,
  },

  // Booking cards
  bookingCard: {
    marginBottom: 10,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookingId: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    fontFamily: 'Courier',
  },
  bookingRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  bookingNames: {
    flex: 1,
  },
  bookingLabel: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2,
  },
  bookingName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  bookingDate: {
    fontSize: 13,
    color: colors.muted,
  },
  bookingTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.forest700,
  },
});
