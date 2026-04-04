import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import { formatUsdFromCents } from '@/lib/format';
import {
  getAdminDisputes,
  resolveDispute,
  type AdminDispute,
} from '@/lib/api/admin';
import {
  Card,
  StatusBadge,
  SegmentedControl,
  LoadingScreen,
  EmptyState,
} from '@/components/ui';

const RESOLUTION_OPTIONS = [
  { key: 'full_refund', label: 'Full Refund' },
  { key: 'reclean', label: 'Reclean' },
  { key: 'dismiss', label: 'Dismiss' },
] as const;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function DisputeCard({
  dispute,
  onResolve,
}: {
  dispute: AdminDispute;
  onResolve: (dispute: AdminDispute) => void;
}) {
  const isOpen = dispute.status === 'open' || dispute.status === 'investigating';

  return (
    <TouchableOpacity
      activeOpacity={isOpen ? 0.7 : 1}
      onPress={() => {
        if (isOpen) onResolve(dispute);
      }}
    >
      <Card style={styles.disputeCard}>
        <View style={styles.disputeHeader}>
          {dispute.bookingId && (
            <Text style={styles.bookingId}>
              Booking {dispute.bookingId.slice(0, 8)}...
            </Text>
          )}
          <StatusBadge status={dispute.status} />
        </View>

        <Text style={styles.disputeDate}>{formatDate(dispute.createdAt)}</Text>

        <View style={styles.disputeParties}>
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Customer</Text>
            <Text style={styles.partyName} numberOfLines={1}>
              {dispute.customer}
            </Text>
          </View>
          <View style={styles.partyCol}>
            <Text style={styles.partyLabel}>Cleaner</Text>
            <Text style={styles.partyName} numberOfLines={1}>
              {dispute.cleaner}
            </Text>
          </View>
          <View style={styles.partyColSmall}>
            <Text style={styles.partyLabel}>Total</Text>
            <Text style={styles.partyAmount}>
              {formatUsdFromCents(dispute.total)}
            </Text>
          </View>
        </View>

        <View style={styles.disputeBody}>
          <Text style={styles.reasonLabel}>Reason</Text>
          <Text style={styles.reasonText}>{dispute.reason}</Text>
          {dispute.details ? (
            <Text style={styles.detailsText}>
              {truncateText(dispute.details, 120)}
            </Text>
          ) : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function AdminDisputesScreen() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const queryParams = {
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'disputes', queryParams],
    queryFn: () => getAdminDisputes(queryParams),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      disputeId,
      resolution,
    }: {
      disputeId: string;
      resolution: string;
    }) => resolveDispute(disputeId, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      Alert.alert('Resolved', 'Dispute has been resolved.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to resolve dispute. Please try again.');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleResolve = useCallback(
    (dispute: AdminDispute) => {
      const buttons = [
        ...RESOLUTION_OPTIONS.map((opt) => ({
          text: opt.label,
          onPress: () => {
            Alert.alert(
              'Confirm Resolution',
              `Resolve this dispute with "${opt.label}"?`,
              [
                { text: 'Cancel', style: 'cancel' as const },
                {
                  text: 'Confirm',
                  style: 'destructive' as const,
                  onPress: () =>
                    resolveMutation.mutate({
                      disputeId: dispute.id,
                      resolution: opt.key,
                    }),
                },
              ],
            );
          },
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ];

      Alert.alert('Resolve Dispute', 'Choose a resolution:', buttons);
    },
    [resolveMutation],
  );

  const disputes = data ?? [];
  const openCount = disputes.filter(
    (d) => d.status === 'open',
  ).length;

  const segments = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'open', count: statusFilter === 'all' ? openCount : undefined },
    { label: 'Investigating', value: 'investigating' },
    { label: 'Resolved', value: 'resolved' },
  ];

  const header = (
    <View style={styles.headerSection}>
      <SegmentedControl
        segments={segments}
        selected={statusFilter}
        onSelect={setStatusFilter}
      />
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        {header}
        <LoadingScreen />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.errorContainer}>
          <EmptyState
            title="Unable to load disputes"
            subtitle="Pull down to retry"
          />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={disputes}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <DisputeCard dispute={item} onResolve={handleResolve} />
      )}
      ListEmptyComponent={
        <EmptyState
          title="No disputes"
          subtitle={
            statusFilter !== 'all'
              ? `No ${statusFilter} disputes`
              : 'No disputes have been filed'
          }
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
    paddingBottom: 32,
  },
  headerSection: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // Dispute card
  disputeCard: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  disputeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookingId: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    fontFamily: 'Courier',
  },
  disputeDate: {
    fontSize: 12,
    color: colors.slate500,
    marginBottom: 10,
  },

  // Parties
  disputeParties: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  partyCol: {
    flex: 1,
  },
  partyColSmall: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  partyLabel: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2,
  },
  partyName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.foreground,
  },
  partyAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.forest700,
  },

  // Body
  disputeBody: {},
  reasonLabel: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 13,
    color: colors.slate500,
    lineHeight: 18,
  },
});
