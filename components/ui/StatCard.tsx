import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/constants/colors';

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <View style={styles.card}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    minWidth: 120,
    flex: 1,
  },
  iconWrap: {
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
  },
  label: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
});
