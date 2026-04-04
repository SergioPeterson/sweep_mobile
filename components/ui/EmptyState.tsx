import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/constants/colors';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} size="sm" style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  button: {
    marginTop: 16,
  },
});
