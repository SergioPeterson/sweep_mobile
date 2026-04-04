import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/lib/constants/colors';

interface DurationPillsProps {
  options?: number[];
  selected: number;
  onSelect: (hours: number) => void;
  minHours?: number;
}

const DEFAULT_OPTIONS = [2, 3, 4, 5, 6, 8];

export function DurationPills({
  options = DEFAULT_OPTIONS,
  selected,
  onSelect,
  minHours = 0,
}: DurationPillsProps) {
  return (
    <View style={styles.container}>
      {options.map((h) => {
        const active = h === selected;
        const disabled = h < minHours;
        return (
          <TouchableOpacity
            key={h}
            onPress={() => !disabled && onSelect(h)}
            disabled={disabled}
            activeOpacity={0.7}
            style={[
              styles.pill,
              active && styles.pillActive,
              disabled && styles.pillDisabled,
            ]}
          >
            <Text
              style={[
                styles.text,
                active && styles.textActive,
                disabled && styles.textDisabled,
              ]}
            >
              {h}h
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pillActive: {
    backgroundColor: colors.forest700,
    borderColor: colors.forest700,
  },
  pillDisabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  textActive: {
    color: colors.white,
  },
  textDisabled: {
    color: colors.muted,
  },
});
