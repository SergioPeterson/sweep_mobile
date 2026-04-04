import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/lib/constants/colors';

interface DateStripProps {
  dates: string[]; // YYYY-MM-DD[]
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

function parseDate(iso: string): { dayName: string; dayNum: number; monthShort: string } {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return {
    dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNum: d,
    monthShort: date.toLocaleDateString('en-US', { month: 'short' }),
  };
}

function isToday(iso: string): boolean {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return iso === key;
}

export function DateStrip({ dates, selectedDate, onSelectDate }: DateStripProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {dates.map((iso) => {
        const { dayName, dayNum, monthShort } = parseDate(iso);
        const selected = iso === selectedDate;
        const today = isToday(iso);

        return (
          <TouchableOpacity
            key={iso}
            onPress={() => onSelectDate(iso)}
            activeOpacity={0.7}
            style={[styles.card, selected && styles.cardSelected]}
          >
            <Text style={[styles.dayName, selected && styles.textSelected]}>
              {today ? 'Today' : dayName}
            </Text>
            <Text style={[styles.dayNum, selected && styles.textSelected]}>
              {dayNum}
            </Text>
            <Text style={[styles.month, selected && styles.textSelected]}>
              {monthShort}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  card: {
    width: 62,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  cardSelected: {
    backgroundColor: colors.forest700,
    borderColor: colors.forest700,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.muted,
  },
  dayNum: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    marginVertical: 2,
  },
  month: {
    fontSize: 11,
    color: colors.muted,
  },
  textSelected: {
    color: colors.white,
  },
});
