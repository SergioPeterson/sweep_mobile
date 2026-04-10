import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '@/lib/constants/colors';
import {
  createDefaultRecurrence,
  getBookingRecurrencePreset,
  normalizeBookingRecurrence,
  RECURRENCE_DAY_ORDER,
  setBookingRecurrencePreset,
  toggleRecurrenceDay,
  type BookingRecurrence,
  type BookingRecurrenceDay,
  type BookingRecurrencePreset,
} from '@/lib/booking/recurrence';

interface RecurrencePickerProps {
  selectedDate: string;
  value: BookingRecurrence | null;
  onChange: (value: BookingRecurrence | null) => void;
}

const PRESET_OPTIONS: Array<{
  label: string;
  value: BookingRecurrencePreset;
}> = [
  { label: 'One time', value: 'one_time' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Every 2 weeks', value: 'biweekly' },
  { label: 'Custom days', value: 'custom' },
];

const DAY_LABELS: Record<BookingRecurrenceDay, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export function RecurrencePicker({
  selectedDate,
  value,
  onChange,
}: RecurrencePickerProps) {
  const selectedPreset = getBookingRecurrencePreset(value);
  const customValue =
    normalizeBookingRecurrence(value) ?? createDefaultRecurrence(selectedDate);

  return (
    <View style={styles.container}>
      <View style={styles.pills}>
        {PRESET_OPTIONS.map((option) => {
          const active = option.value === selectedPreset;

          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() =>
                onChange(setBookingRecurrencePreset(selectedDate, option.value, value))
              }
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedPreset === 'custom' ? (
        <View style={styles.customSection}>
          <Text style={styles.customLabel}>Choose your recurring days</Text>
          <View style={styles.dayPills}>
            {RECURRENCE_DAY_ORDER.map((day) => {
              const active = customValue.daysOfWeek.includes(day);

              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayPill, active && styles.dayPillActive]}
                  onPress={() => onChange(toggleRecurrenceDay(customValue, day))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayPillText, active && styles.dayPillTextActive]}>
                    {DAY_LABELS[day]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillActive: {
    borderColor: colors.forest700,
    backgroundColor: colors.forest700,
  },
  pillText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.white,
  },
  customSection: {
    gap: 8,
  },
  customLabel: {
    color: colors.slate600,
    fontSize: 13,
    lineHeight: 18,
  },
  dayPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPill: {
    minWidth: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dayPillActive: {
    borderColor: colors.forest600,
    backgroundColor: colors.forest50,
  },
  dayPillText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '700',
  },
  dayPillTextActive: {
    color: colors.forest700,
  },
});
