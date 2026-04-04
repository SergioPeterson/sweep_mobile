import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/lib/constants/colors';

interface Segment {
  label: string;
  value: string;
  count?: number;
}

interface SegmentedControlProps {
  segments: Segment[];
  selected: string;
  onSelect: (value: string) => void;
}

export function SegmentedControl({ segments, selected, onSelect }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {segments.map((seg) => {
        const active = seg.value === selected;
        return (
          <TouchableOpacity
            key={seg.value}
            onPress={() => onSelect(seg.value)}
            activeOpacity={0.7}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {seg.label}
            </Text>
            {seg.count != null && seg.count > 0 && (
              <View style={[styles.countBadge, active && styles.countBadgeActive]}>
                <Text style={[styles.countText, active && styles.countTextActive]}>
                  {seg.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.slate100,
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  segmentActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
  },
  labelActive: {
    color: colors.foreground,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: colors.slate200,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeActive: {
    backgroundColor: colors.forest50,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
  },
  countTextActive: {
    color: colors.forest700,
  },
});
