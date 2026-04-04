import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import {
  SegmentedControl,
  StatusBadge,
  Card,
  LoadingScreen,
  EmptyState,
} from '@/components/ui';
import { formatUsdFromCents } from '@/lib/format';
import { getCleanerEarnings, type EarningsTransaction } from '@/lib/api/cleaners';
import { getCleanerBonusSummary } from '@/lib/api/bonuses';

const PERIOD_SEGMENTS = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' },
];

export default function EarningsScreen() {
  const [period, setPeriod] = useState('month');

  const earningsQuery = useQuery({
    queryKey: ['cleaner-earnings', period],
    queryFn: () => getCleanerEarnings({ period }),
  });

  const bonusQuery = useQuery({
    queryKey: ['cleaner-bonus-summary'],
    queryFn: getCleanerBonusSummary,
  });

  const onRefresh = useCallback(() => {
    earningsQuery.refetch();
    bonusQuery.refetch();
  }, [earningsQuery, bonusQuery]);

  if (earningsQuery.isLoading) {
    return <LoadingScreen />;
  }

  const summary = earningsQuery.data?.summary;
  const transactions = earningsQuery.data?.transactions ?? [];
  const bonus = bonusQuery.data;

  const currentPeriodAmount = period === 'week'
    ? summary?.thisWeek ?? 0
    : period === 'month'
      ? summary?.thisMonth ?? 0
      : summary?.totalAllTime ?? 0;

  const renderHeader = () => (
    <View>
      {/* Big earnings number */}
      <View style={styles.heroSection}>
        <Text style={styles.heroLabel}>
          {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
        </Text>
        <Text style={styles.heroAmount}>{formatUsdFromCents(currentPeriodAmount)}</Text>
        <View style={styles.secondaryStats}>
          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryValue}>
              {formatUsdFromCents(summary?.pendingPayout ?? 0)}
            </Text>
            <Text style={styles.secondaryLabel}>Pending</Text>
          </View>
          <View style={styles.secondaryDivider} />
          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryValue}>
              {formatUsdFromCents(summary?.totalAllTime ?? 0)}
            </Text>
            <Text style={styles.secondaryLabel}>All time</Text>
          </View>
        </View>
      </View>

      {/* Period filter */}
      <View style={styles.filterRow}>
        <SegmentedControl
          segments={PERIOD_SEGMENTS}
          selected={period}
          onSelect={setPeriod}
        />
      </View>

      {/* Transactions heading */}
      <Text style={styles.transactionsTitle}>Transactions</Text>
    </View>
  );

  const renderTransaction = ({ item }: { item: EarningsTransaction }) => (
    <View style={styles.transactionRow}>
      <View style={styles.transactionLeft}>
        <Text style={styles.transactionCustomer} numberOfLines={1}>{item.customer}</Text>
        <Text style={styles.transactionMeta}>
          {formatDate(item.completedAt)} {'\u00B7'} {item.hours}h
        </Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionAmount}>{formatUsdFromCents(item.amount)}</Text>
        <StatusBadge status={item.payoutStatus} />
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!bonus) return <View style={styles.bottomSpacer} />;

    const topPercentLabel = `${Math.round((bonus.topPercent ?? 0.2) * 100)}%`;

    return (
      <View>
        <Card style={styles.bonusCard}>
          <Text style={styles.bonusTitle}>Bonus Pool</Text>
          <View style={styles.bonusStats}>
            <View style={styles.bonusStat}>
              <Text style={styles.bonusStatValue}>#{bonus.cleaner.rank}</Text>
              <Text style={styles.bonusStatLabel}>Rank</Text>
            </View>
            <View style={styles.bonusStat}>
              <Text style={styles.bonusStatValue}>{bonus.cleaner.score.toFixed(1)}</Text>
              <Text style={styles.bonusStatLabel}>Score</Text>
            </View>
            <View style={styles.bonusStat}>
              <Text style={styles.bonusStatValue}>
                {bonus.cleaner.estimatedBonusCents != null
                  ? formatUsdFromCents(bonus.cleaner.estimatedBonusCents)
                  : '\u2014'}
              </Text>
              <Text style={styles.bonusStatLabel}>Est. bonus</Text>
            </View>
          </View>
          <Text style={styles.bonusEligibility}>
            {bonus.cleaner.eligible
              ? `Top ${topPercentLabel} - Eligible`
              : `Not in top ${topPercentLabel}`}
          </Text>
        </Card>
        <View style={styles.bottomSpacer} />
      </View>
    );
  };

  return (
    <FlatList
      style={styles.container}
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={renderTransaction}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={
        <EmptyState
          title="No transactions yet"
          subtitle="Your completed jobs will appear here"
        />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={
        <RefreshControl
          refreshing={earningsQuery.isFetching}
          onRefresh={onRefresh}
          tintColor={colors.forest700}
        />
      }
    />
  );
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

  // Hero
  heroSection: {
    backgroundColor: colors.forest700,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 14,
    color: colors.forest200,
    fontWeight: '500',
  },
  heroAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.white,
    marginTop: 4,
  },
  secondaryStats: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 24,
    alignItems: 'center',
  },
  secondaryStat: {
    alignItems: 'center',
  },
  secondaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  secondaryLabel: {
    fontSize: 12,
    color: colors.forest200,
    marginTop: 2,
  },
  secondaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.forest600,
  },

  // Filter
  filterRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Transactions
  transactionsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  transactionLeft: {
    flex: 1,
    marginRight: 12,
  },
  transactionCustomer: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  transactionMeta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.forest700,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },

  // Bonus
  bonusCard: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  bonusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 12,
  },
  bonusStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  bonusStat: {
    alignItems: 'center',
  },
  bonusStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  bonusStatLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  bonusEligibility: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.forest700,
    textAlign: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  bottomSpacer: {
    height: 24,
  },
});
