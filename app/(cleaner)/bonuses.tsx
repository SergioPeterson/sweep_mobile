import { View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  getCleanerBonusAwards,
  getCleanerBonusSummary,
} from '../../lib/api';

const formatUsdFromCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function BonusesScreen() {
  const summaryQuery = useQuery({
    queryKey: ['cleaner-bonuses', 'summary'],
    queryFn: getCleanerBonusSummary,
  });

  const awardsQuery = useQuery({
    queryKey: ['cleaner-bonuses', 'awards'],
    queryFn: () => getCleanerBonusAwards({ limit: 12 }),
  });

  const summary = summaryQuery.data;
  const awards = awardsQuery.data?.awards ?? [];
  const isLoading = summaryQuery.isLoading || awardsQuery.isLoading;
  const hasError = summaryQuery.isError || awardsQuery.isError;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (hasError || !summary) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Unable to load bonus data.</Text>
      </View>
    );
  }

  const topPercentLabel = `${Math.round((summary.topPercent ?? 0.2) * 100)}%`;
  const periodLabel =
    summary.period.type === 'yearly'
      ? String(summary.period.year)
      : summary.period.month
        ? new Date(Date.UTC(summary.period.year, summary.period.month - 1, 1)).toLocaleString('en-US', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          })
        : String(summary.period.year);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bonuses</Text>
      <Text style={styles.subtitle}>
        1.5% of booking GMV funds a bonus pool, distributed monthly across the top {topPercentLabel} of cleaners.
      </Text>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>This Period</Text>
          <Text style={styles.cardValue}>{periodLabel}</Text>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Rank</Text>
            <Text style={styles.kvValue}>#{summary.cleaner.rank} / {summary.cleaner.totalRanked}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Score</Text>
            <Text style={styles.kvValue}>{summary.cleaner.score.toFixed(1)}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Eligibility</Text>
            <Text style={[styles.kvValue, summary.cleaner.eligible ? styles.eligible : styles.notEligible]}>
              {summary.cleaner.eligible ? `Top ${topPercentLabel}` : 'Not eligible'}
            </Text>
          </View>
          <View style={[styles.kvRow, styles.kvRowTop]}>
            <Text style={styles.kvLabel}>Est. bonus</Text>
            <Text style={styles.kvValue}>
              {summary.cleaner.estimatedBonusCents != null ? formatUsdFromCents(summary.cleaner.estimatedBonusCents) : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Bonus Pool</Text>
          <Text style={styles.cardValue}>{formatUsdFromCents(summary.period.poolAmountCents)}</Text>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>GMV</Text>
            <Text style={styles.kvValue}>{formatUsdFromCents(summary.period.gmvCents)}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Status</Text>
            <Text style={styles.kvValue}>{summary.period.status}</Text>
          </View>
          <Text style={styles.formula}>
            (Rating × 50) + (Repeat% × 30) + (Hours × 0.2) - (Cancellations × 20)
          </Text>
        </View>
      </View>

      <View style={styles.awardsSection}>
        <Text style={styles.sectionTitle}>Bonus Awards</Text>
        <FlatList
          data={awards}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.awardRow}>
              <View>
                <Text style={styles.awardPeriod}>
                  {item.month ? `${item.year}-${String(item.month).padStart(2, '0')}` : item.year}
                </Text>
                <Text style={styles.awardMeta}>Score {item.score.toFixed(1)} · {String(item.status).replace(/_/g, ' ')}</Text>
              </View>
              <Text style={styles.awardAmount}>{formatUsdFromCents(item.amountCents)}</Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No bonus awards yet.</Text>
          )}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 8, fontSize: 14, color: '#4b5563' },
  cardRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  cardLabel: { fontSize: 12, color: '#6b7280' },
  cardValue: { marginTop: 6, fontSize: 18, fontWeight: '700', color: '#111827' },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  kvRowTop: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8 },
  kvLabel: { fontSize: 12, color: '#6b7280' },
  kvValue: { fontSize: 12, fontWeight: '600', color: '#111827' },
  eligible: { color: '#047857' },
  notEligible: { color: '#374151' },
  formula: { marginTop: 10, fontSize: 11, color: '#6b7280' },
  awardsSection: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  awardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  awardPeriod: { fontSize: 14, fontWeight: '600', color: '#111827' },
  awardMeta: { marginTop: 2, fontSize: 12, color: '#6b7280' },
  awardAmount: { fontSize: 14, fontWeight: '700', color: '#2563eb' },
  separator: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
  emptyText: { fontSize: 13, color: '#6b7280' },
});

