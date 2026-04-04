import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/lib/constants/colors';

interface MonthCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  visibleMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a: string, b: string): boolean {
  return a === b;
}

function isPast(dateKey: string): boolean {
  const today = toDateKey(new Date());
  return dateKey <= today;
}

export function MonthCalendar({
  selectedDate,
  onSelectDate,
  visibleMonth,
  onPrevMonth,
  onNextMonth,
}: MonthCalendarProps) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const days = getCalendarDays(year, month);
  const todayKey = toDateKey(new Date());

  const monthLabel = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Month header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navBtn}>
          <Text style={styles.navText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navBtn}>
          <Text style={styles.navText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.weekCell}>
            <Text style={styles.weekText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {days.map((day, i) => {
          if (!day) {
            return <View key={`empty-${i}`} style={styles.dayCell} />;
          }

          const dateKey = toDateKey(day);
          const isSelected = isSameDay(dateKey, selectedDate);
          const isToday = dateKey === todayKey;
          const disabled = isPast(dateKey);

          return (
            <TouchableOpacity
              key={dateKey}
              onPress={() => !disabled && onSelectDate(dateKey)}
              disabled={disabled}
              activeOpacity={0.6}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  disabled && styles.dayTextDisabled,
                  isSelected && styles.dayTextSelected,
                ]}
              >
                {day.getDate()}
              </Text>
              {isToday && !isSelected && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: colors.forest700,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.foreground,
  },
  dayTextDisabled: {
    color: colors.slate300,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.forest600,
    position: 'absolute',
    bottom: 6,
  },
});
