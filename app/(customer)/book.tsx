import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import { Avatar, Card, Button } from '@/components/ui';
import { MonthCalendar, DurationPills, TimeSlotList, generateTimeSlots } from '@/components/booking';
import { searchCleaners, type Cleaner } from '@/lib/api/cleaners';
import { formatUsd } from '@/lib/format';

const SF_LAT = 37.7749;
const SF_LNG = -122.4194;
const STEPS = ['Date', 'Time', 'Cleaners'] as const;

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateDisplay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const date = new Date(2000, 0, 1, h, m);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getInitialDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateKey(d);
}

export default function BookScreen() {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(getInitialDate);
  const [duration, setDuration] = useState(3);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const timeSlots = useMemo(() => generateTimeSlots(8, 18), []);

  const {
    data: cleaners = [],
    isLoading: cleanersLoading,
  } = useQuery({
    queryKey: ['bookWizardCleaners', selectedDate, duration],
    queryFn: () =>
      searchCleaners({
        lat: SF_LAT,
        lng: SF_LNG,
        date: selectedDate,
        duration,
      }),
    enabled: step === 3,
  });

  const handlePrevMonth = useCallback(() => {
    setVisibleMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setVisibleMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }, []);

  const canGoNext =
    (step === 1 && !!selectedDate) ||
    (step === 2 && !!selectedTime);

  const handleNext = useCallback(() => {
    if (step < 3) setStep((s) => s + 1);
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const handleSelectCleaner = useCallback(
    (cleaner: Cleaner) => {
      if (!selectedTime) return;
      router.push({
        pathname: '/(customer)/cleaner/[id]/book' as never,
        params: {
          id: cleaner.id,
          date: selectedDate,
          duration: String(duration),
          time: selectedTime,
        },
      } as never);
    },
    [selectedDate, duration, selectedTime],
  );

  const renderCleaner = useCallback(
    ({ item }: { item: Cleaner }) => {
      const name = `${item.firstName} ${item.lastName}`;
      const rate = item.hourlyRate ?? item.baseRate ?? 0;
      const distanceMiles =
        item.distance != null ? (item.distance / 1609.34).toFixed(1) : null;

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSelectCleaner(item)}
        >
          <Card style={styles.cleanerCard}>
            <View style={styles.cleanerRow}>
              <Avatar name={name} size={48} />
              <View style={styles.cleanerInfo}>
                <Text style={styles.cleanerName} numberOfLines={1}>
                  {name}
                </Text>
                <View style={styles.cleanerMeta}>
                  <Text style={styles.cleanerRating}>
                    {'\u2605'} {item.rating.toFixed(1)}
                  </Text>
                  {distanceMiles && (
                    <Text style={styles.cleanerDistance}>
                      {distanceMiles} mi
                    </Text>
                  )}
                  <Text style={styles.cleanerRate}>
                    {formatUsd(rate)}/hr
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    },
    [handleSelectCleaner],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;

          return (
            <View key={label} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCompleted && styles.stepCircleCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    (isActive || isCompleted) && styles.stepNumberActive,
                  ]}
                >
                  {isCompleted ? '\u2713' : stepNum}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Step content */}
      <View style={styles.content}>
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose a date</Text>
            <MonthCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              visibleMonth={visibleMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
            <View style={styles.durationSection}>
              <Text style={styles.durationLabel}>Duration</Text>
              <DurationPills
                options={[2, 3, 4, 5, 6, 8]}
                selected={duration}
                onSelect={setDuration}
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose a time</Text>
            <View style={styles.summaryChips}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {formatDateDisplay(selectedDate)}
                </Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{duration}h</Text>
              </View>
            </View>
            <TimeSlotList
              slots={timeSlots}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContentFlex}>
            <Text style={styles.stepTitle}>Choose a cleaner</Text>
            <View style={styles.summaryChips}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {formatDateDisplay(selectedDate)}
                </Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{duration}h</Text>
              </View>
              {selectedTime && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {formatTimeDisplay(selectedTime)}
                  </Text>
                </View>
              )}
            </View>
            {cleanersLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.forest700} />
              </View>
            ) : (
              <FlatList
                data={cleaners}
                keyExtractor={(item) => item.id}
                renderItem={renderCleaner}
                contentContainerStyle={styles.cleanerList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      No cleaners available for this date and time
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        )}
      </View>

      {/* Navigation buttons */}
      <View style={styles.navBar}>
        {step > 1 ? (
          <Button
            title="Back"
            variant="secondary"
            onPress={handleBack}
            style={styles.navButton}
          />
        ) : (
          <View style={styles.navButton} />
        )}
        {step < 3 && (
          <Button
            title="Next"
            onPress={handleNext}
            disabled={!canGoNext}
            style={styles.navButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.forest700,
  },
  stepCircleCompleted: {
    backgroundColor: colors.forest600,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
  },
  stepLabelActive: {
    color: colors.forest700,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
    gap: 16,
  },
  stepContentFlex: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  durationSection: {
    gap: 10,
  },
  durationLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  summaryChips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.forest50,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.forest700,
  },
  cleanerList: {
    gap: 10,
    paddingBottom: 16,
  },
  cleanerCard: {
    padding: 14,
  },
  cleanerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cleanerInfo: {
    flex: 1,
  },
  cleanerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  cleanerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cleanerRating: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.amber500,
  },
  cleanerDistance: {
    fontSize: 13,
    color: colors.muted,
  },
  cleanerRate: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.forest700,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
});
