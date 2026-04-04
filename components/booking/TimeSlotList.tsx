import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/lib/constants/colors';

interface TimeSlot {
  time: string; // "09:00"
  label: string; // "9:00 AM"
  available?: boolean;
}

interface TimeSlotListProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

export function TimeSlotList({ slots, selectedTime, onSelectTime }: TimeSlotListProps) {
  return (
    <View style={styles.container}>
      {slots.map((slot) => {
        const active = slot.time === selectedTime;
        const disabled = slot.available === false;

        return (
          <TouchableOpacity
            key={slot.time}
            onPress={() => !disabled && onSelectTime(slot.time)}
            disabled={disabled}
            activeOpacity={0.7}
            style={[
              styles.slot,
              active && styles.slotActive,
              disabled && styles.slotDisabled,
            ]}
          >
            <Text
              style={[
                styles.text,
                active && styles.textActive,
                disabled && styles.textDisabled,
              ]}
            >
              {slot.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function generateTimeSlots(startHour = 8, endHour = 18): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (const m of [0, 30]) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const date = new Date(2000, 0, 1, h, m);
      const label = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      slots.push({ time, label, available: true });
    }
  }
  return slots;
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  slot: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  slotActive: {
    backgroundColor: colors.forest700,
    borderColor: colors.forest700,
  },
  slotDisabled: {
    opacity: 0.35,
  },
  text: {
    fontSize: 16,
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
