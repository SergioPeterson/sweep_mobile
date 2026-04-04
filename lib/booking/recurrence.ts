export const RECURRENCE_DAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type BookingRecurrenceDay = (typeof RECURRENCE_DAY_ORDER)[number];

export interface BookingRecurrence {
  intervalWeeks: number;
  daysOfWeek: BookingRecurrenceDay[];
}

export type BookingRecurrencePreset = 'one_time' | 'weekly' | 'biweekly' | 'custom';

const RECURRENCE_DAY_LABELS: Record<BookingRecurrenceDay, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

function getSortedRecurrenceDays(days: BookingRecurrenceDay[]): BookingRecurrenceDay[] {
  return [...days].sort(
    (left, right) =>
      RECURRENCE_DAY_ORDER.indexOf(left) - RECURRENCE_DAY_ORDER.indexOf(right),
  );
}

export function getRecurrenceDayFromDate(dateIso: string): BookingRecurrenceDay {
  const [year, month, day] = dateIso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const jsDay = date.getDay();
  const mappedIndex = jsDay === 0 ? 6 : jsDay - 1;
  return RECURRENCE_DAY_ORDER[mappedIndex];
}

export function createDefaultRecurrence(
  dateIso: string,
  intervalWeeks = 1,
): BookingRecurrence {
  return {
    intervalWeeks,
    daysOfWeek: [getRecurrenceDayFromDate(dateIso)],
  };
}

export function normalizeBookingRecurrence(
  recurrence: BookingRecurrence | null | undefined,
): BookingRecurrence | null {
  if (!recurrence) return null;

  const uniqueDays = Array.from(new Set(recurrence.daysOfWeek)).filter(
    (day): day is BookingRecurrenceDay => RECURRENCE_DAY_ORDER.includes(day),
  );

  if (uniqueDays.length === 0) return null;

  return {
    intervalWeeks: Math.max(1, Math.min(12, Math.round(recurrence.intervalWeeks))),
    daysOfWeek: getSortedRecurrenceDays(uniqueDays),
  };
}

export function formatBookingRecurrenceSummary(
  recurrence: BookingRecurrence | null | undefined,
): string {
  const normalized = normalizeBookingRecurrence(recurrence);
  if (!normalized) return 'One time';

  const dayLabels = normalized.daysOfWeek.map((day) => RECURRENCE_DAY_LABELS[day]).join(', ');
  if (normalized.intervalWeeks === 1) return `Every week on ${dayLabels}`;
  if (normalized.intervalWeeks === 2) return `Every 2 weeks on ${dayLabels}`;
  return `Every ${normalized.intervalWeeks} weeks on ${dayLabels}`;
}
