import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useState } from 'react';

type TimeSlot = { start: string; end: string };
type DaySchedule = { enabled: boolean; slots: TimeSlot[] };
type WeekSchedule = Record<string, DaySchedule>;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_SCHEDULE: WeekSchedule = {
  Monday: { enabled: false, slots: [] },
  Tuesday: { enabled: false, slots: [] },
  Wednesday: { enabled: false, slots: [] },
  Thursday: { enabled: false, slots: [] },
  Friday: { enabled: false, slots: [] },
  Saturday: { enabled: false, slots: [] },
  Sunday: { enabled: false, slots: [] },
};

const DEFAULT_BLOCKED: { id: string; start: string; end: string; reason: string }[] = [];

export default function CalendarScreen() {
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [blockedDates, setBlockedDates] = useState(DEFAULT_BLOCKED);
  const [newBlockStart, setNewBlockStart] = useState('');
  const [newBlockEnd, setNewBlockEnd] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        slots: !prev[day].enabled ? [{ start: '09:00', end: '17:00' }] : [],
      },
    }));
  };

  const addSlot = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { start: '09:00', end: '17:00' }],
      },
    }));
  };

  const removeSlot = (day: string, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index),
      },
    }));
  };

  const addBlockedDate = () => {
    if (!newBlockStart || !newBlockEnd) {
      Alert.alert('Error', 'Please enter start and end dates (YYYY-MM-DD).');
      return;
    }
    setBlockedDates((prev) => [
      ...prev,
      { id: String(Date.now()), start: newBlockStart, end: newBlockEnd, reason: newBlockReason || 'Blocked' },
    ]);
    setNewBlockStart('');
    setNewBlockEnd('');
    setNewBlockReason('');
  };

  const removeBlockedDate = (id: string) => {
    setBlockedDates((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSave = () => {
    // TODO: Replace with real API call to save availability
    Alert.alert('Error', 'Saving availability is not yet available.');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Weekly Schedule</Text>

      {DAYS.map((day) => {
        const d = schedule[day];
        return (
          <View key={day} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Pressable onPress={() => toggleDay(day)} style={styles.toggleRow}>
                <View style={[styles.checkbox, d.enabled && styles.checkboxActive]}>
                  {d.enabled && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.dayName, !d.enabled && styles.dayNameOff]}>{day}</Text>
              </Pressable>
              {d.enabled && (
                <Pressable onPress={() => addSlot(day)}>
                  <Text style={styles.addSlotText}>+ Add Slot</Text>
                </Pressable>
              )}
            </View>

            {d.enabled && d.slots.map((slot, i) => (
              <View key={i} style={styles.slotRow}>
                <Text style={styles.slotText}>{slot.start} – {slot.end}</Text>
                {d.slots.length > 1 && (
                  <Pressable onPress={() => removeSlot(day, i)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                )}
              </View>
            ))}

            {!d.enabled && <Text style={styles.offText}>Day off</Text>}
          </View>
        );
      })}

      <Text style={[styles.heading, { marginTop: 24 }]}>Blocked Dates</Text>

      {blockedDates.map((b) => (
        <View key={b.id} style={styles.blockedRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.blockedDate}>{b.start} → {b.end}</Text>
            <Text style={styles.blockedReason}>{b.reason}</Text>
          </View>
          <Pressable onPress={() => removeBlockedDate(b.id)}>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <View style={styles.addBlockSection}>
        <Text style={styles.label}>Start (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={newBlockStart} onChangeText={setNewBlockStart} placeholder="2026-03-10" />
        <Text style={styles.label}>End (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={newBlockEnd} onChangeText={setNewBlockEnd} placeholder="2026-03-12" />
        <Text style={styles.label}>Reason (optional)</Text>
        <TextInput style={styles.input} value={newBlockReason} onChangeText={setNewBlockReason} placeholder="Vacation" />
        <Pressable style={styles.addButton} onPress={addBlockedDate}>
          <Text style={styles.addButtonText}>Add Blocked Date</Text>
        </Pressable>
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Availability</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  heading: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  dayCard: { marginBottom: 12, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  dayName: { fontSize: 15, fontWeight: '600' },
  dayNameOff: { color: '#999' },
  addSlotText: { color: '#2563eb', fontSize: 13, fontWeight: '500' },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingLeft: 30 },
  slotText: { fontSize: 14, color: '#333' },
  removeText: { color: '#ef4444', fontSize: 13 },
  offText: { fontSize: 13, color: '#999', marginTop: 4, paddingLeft: 30 },
  blockedRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, marginBottom: 8 },
  blockedDate: { fontSize: 14, fontWeight: '500' },
  blockedReason: { fontSize: 12, color: '#666', marginTop: 2 },
  addBlockSection: { marginTop: 12, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 },
  label: { fontSize: 13, fontWeight: '500', color: '#333', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 10 },
  addButton: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  addButtonText: { fontSize: 14, fontWeight: '500', color: '#333' },
  saveButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', margin: 16 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
