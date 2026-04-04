import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/constants/colors';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: '#DBEAFE', text: '#1D4ED8' },
  in_progress: { bg: '#EDE9FE', text: '#6D28D9' },
  completed: { bg: colors.forest50, text: colors.forest700 },
  cancelled_by_customer: { bg: '#FEE2E2', text: colors.error },
  cancelled_by_cleaner: { bg: '#FEE2E2', text: colors.error },
  disputed: { bg: '#FEF3C7', text: '#92400E' },
  pending: { bg: '#FEF3C7', text: '#92400E' },
  paid: { bg: colors.forest50, text: colors.forest700 },
  failed: { bg: '#FEE2E2', text: colors.error },
  active: { bg: colors.forest50, text: colors.forest700 },
  suspended: { bg: '#FEE2E2', text: colors.error },
  open: { bg: '#FEF3C7', text: '#92400E' },
  investigating: { bg: '#DBEAFE', text: '#1D4ED8' },
  resolved: { bg: colors.slate100, text: colors.slate600 },
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled_by_customer: 'Cancelled',
  cancelled_by_cleaner: 'Cancelled',
  disputed: 'Disputed',
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  active: 'Active',
  suspended: 'Suspended',
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] ?? { bg: colors.slate100, text: colors.slate600 };
  const displayLabel = label ?? STATUS_LABELS[status] ?? status;

  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.text }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
