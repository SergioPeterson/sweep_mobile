import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import { SegmentedControl, LoadingScreen } from '@/components/ui';
import {
  getCleanerProfile,
  saveCleanerAvailability,
} from '@/lib/api/cleaners';
import {
  type DayKey,
  DAY_LABELS,
  type TimeRange,
} from '@/lib/cleaner/onboarding';

type SlotMode = 'available' | 'blocked';

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 8am-8pm

const HOUR_LABELS: Record<number, string> = {};
HOURS.forEach((h) => {
  HOUR_LABELS[h] = h === 12 ? '12 pm' : h > 12 ? `${h - 12} pm` : `${h} am`;
});

const SEGMENTS = [
  { label: 'Available', value: 'available' },
  { label: 'Blocked', value: 'blocked' },
];

const DAY_INDEX_TO_KEY: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export default function ScheduleScreen() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mode, setMode] = useState<SlotMode>('available');
  const [slots, setSlots] = useState<Map<number, SlotMode>>(new Map());
  const [allDaySlots, setAllDaySlots] = useState<Record<string, Map<number, SlotMode>>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['cleaner-profile'],
    queryFn: getCleanerProfile,
  });

  const saveMutation = useMutation({
    mutationFn: saveCleanerAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaner-profile'] });
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message || 'Could not save schedule.');
    },
  });

  // Build slot map from profile schedule
  useEffect(() => {
    if (!profileQuery.data) return;

    const schedule = profileQuery.data.cleaner.weeklySchedule;
    const daySlots: Record<string, Map<number, SlotMode>> = {};

    for (const dayLabel of DAY_LABELS) {
      const ranges = schedule[dayLabel.key] ?? [];
      const slotMap = new Map<number, SlotMode>();

      for (const range of ranges) {
        const startHour = parseInt(range.start.split(':')[0], 10);
        const endHour = parseInt(range.end.split(':')[0], 10);
        for (let h = startHour; h < endHour; h++) {
          if (h >= 8 && h <= 20) {
            slotMap.set(h, 'available');
          }
        }
      }

      daySlots[dayLabel.key] = slotMap;
    }

    setAllDaySlots(daySlots);
  }, [profileQuery.data]);

  // Sync current day's slots
  useEffect(() => {
    const dayKey = DAY_INDEX_TO_KEY[selectedDate.getDay()];
    setSlots(allDaySlots[dayKey] ?? new Map());
  }, [selectedDate, allDaySlots]);

  const changeDate = (delta: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta);
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const toggleSlot = (hour: number) => {
    const dayKey = DAY_INDEX_TO_KEY[selectedDate.getDay()];

    setSlots((prev) => {
      const next = new Map(prev);
      if (next.get(hour) === mode) {
        next.delete(hour);
      } else {
        next.set(hour, mode);
      }
      return next;
    });

    setAllDaySlots((prev) => {
      const dayMap = new Map(prev[dayKey] ?? new Map());
      if (dayMap.get(hour) === mode) {
        dayMap.delete(hour);
      } else {
        dayMap.set(hour, mode);
      }
      return { ...prev, [dayKey]: dayMap };
    });

    // Debounced auto-save
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      autoSave(dayKey);
    }, 1000);
  };

  const deleteSlot = (hour: number) => {
    const dayKey = DAY_INDEX_TO_KEY[selectedDate.getDay()];

    Alert.alert('Remove slot', `Remove the ${HOUR_LABELS[hour]} slot?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setSlots((prev) => {
            const next = new Map(prev);
            next.delete(hour);
            return next;
          });

          setAllDaySlots((prev) => {
            const dayMap = new Map(prev[dayKey] ?? new Map());
            dayMap.delete(hour);
            const updated = { ...prev, [dayKey]: dayMap };

            // Trigger save
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              autoSave(dayKey, updated);
            }, 500);

            return updated;
          });
        },
      },
    ]);
  };

  const autoSave = async (dayKey?: string, overrideSlots?: Record<string, Map<number, SlotMode>>) => {
    const slotsToUse = overrideSlots ?? allDaySlots;
    const weeklySchedule: Record<string, TimeRange[]> = {};

    for (const dayLabel of DAY_LABELS) {
      const dayMap = dayKey === dayLabel.key && !overrideSlots
        ? slots // Use latest local state for the current day
        : slotsToUse[dayLabel.key] ?? new Map();
      const availableHours = Array.from(dayMap.entries())
        .filter(([, m]) => m === 'available')
        .map(([h]) => h)
        .sort((a, b) => a - b);

      // Group consecutive hours into ranges
      const ranges: TimeRange[] = [];
      let rangeStart: number | null = null;
      let prevHour: number | null = null;

      for (const h of availableHours) {
        if (rangeStart === null) {
          rangeStart = h;
          prevHour = h;
        } else if (h === (prevHour ?? 0) + 1) {
          prevHour = h;
        } else {
          ranges.push({
            start: `${String(rangeStart).padStart(2, '0')}:00`,
            end: `${String((prevHour ?? 0) + 1).padStart(2, '0')}:00`,
          });
          rangeStart = h;
          prevHour = h;
        }
      }
      if (rangeStart !== null && prevHour !== null) {
        ranges.push({
          start: `${String(rangeStart).padStart(2, '0')}:00`,
          end: `${String(prevHour + 1).padStart(2, '0')}:00`,
        });
      }

      weeklySchedule[dayLabel.key] = ranges;
    }

    setSaving(true);
    try {
      await saveMutation.mutateAsync({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        weeklySchedule,
      });
    } finally {
      setSaving(false);
    }
  };

  if (profileQuery.isLoading) {
    return <LoadingScreen />;
  }

  const dateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const isToday = new Date().toDateString() === selectedDate.toDateString();

  return (
    <View style={styles.container}>
      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <SegmentedControl
          segments={SEGMENTS}
          selected={mode}
          onSelect={(v) => setMode(v as SlotMode)}
        />
      </View>

      {/* Date navigation */}
      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow} activeOpacity={0.7}>
          <Text style={styles.dateArrowText}>{'\u2039'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday} activeOpacity={0.7}>
          <Text style={styles.dateText}>{dateStr}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow} activeOpacity={0.7}>
          <Text style={styles.dateArrowText}>{'\u203A'}</Text>
        </TouchableOpacity>
        {!isToday && (
          <TouchableOpacity onPress={goToToday} style={styles.todayButton} activeOpacity={0.7}>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Saving indicator */}
      {saving && (
        <View style={styles.savingRow}>
          <ActivityIndicator size="small" color={colors.forest600} />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}

      {/* Time slots */}
      <ScrollView style={styles.slotsScroll} showsVerticalScrollIndicator={false}>
        {HOURS.map((hour) => {
          const slotMode = slots.get(hour);
          const isEmpty = !slotMode;
          const isAvailable = slotMode === 'available';
          const isBlocked = slotMode === 'blocked';

          return (
            <TouchableOpacity
              key={hour}
              style={[
                styles.slotRow,
                isAvailable && styles.slotAvailable,
                isBlocked && styles.slotBlocked,
              ]}
              onPress={() => toggleSlot(hour)}
              onLongPress={isEmpty ? undefined : () => deleteSlot(hour)}
              activeOpacity={0.7}
            >
              <Text style={[styles.slotTimeLabel, !isEmpty && styles.slotTimeLabelFilled]}>
                {HOUR_LABELS[hour]}
              </Text>
              {isAvailable && (
                <View style={styles.slotIndicator}>
                  <Text style={styles.slotAvailableText}>Available</Text>
                </View>
              )}
              {isBlocked && (
                <View style={styles.slotIndicator}>
                  <Text style={styles.slotBlockedText}>Blocked</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modeRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },

  // Date navigation
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 16,
  },
  dateArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowText: {
    fontSize: 22,
    color: colors.foreground,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
  },
  todayButton: {
    backgroundColor: colors.forest50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.forest700,
  },

  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  savingText: {
    fontSize: 12,
    color: colors.forest600,
  },

  // Slots
  slotsScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: 0,
    minHeight: 52,
  },
  slotAvailable: {
    backgroundColor: colors.forest50,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    borderRadius: 4,
    marginBottom: 2,
  },
  slotBlocked: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    borderRadius: 4,
    marginBottom: 2,
  },
  slotTimeLabel: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
    width: 60,
  },
  slotTimeLabelFilled: {
    color: colors.foreground,
    fontWeight: '600',
  },
  slotIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotAvailableText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  slotBlockedText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },

  bottomSpacer: {
    height: 32,
  },
});
