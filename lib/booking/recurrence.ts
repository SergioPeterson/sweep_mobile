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

export function getBookingRecurrencePreset(
  recurrence: BookingRecurrence | null | undefined,
): BookingRecurrencePreset {
  const normalized = normalizeBookingRecurrence(recurrence);
  if (!normalized) {
    return 'one_time';
  }

  if (normalized.intervalWeeks === 1 && normalized.daysOfWeek.length === 1) {
    return 'weekly';
  }

  if (normalized.intervalWeeks === 2 && normalized.daysOfWeek.length === 1) {
    return 'biweekly';
  }

  return 'custom';
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

export function toggleRecurrenceDay(
  recurrence: BookingRecurrence | null | undefined,
  day: BookingRecurrenceDay,
): BookingRecurrence {
  const normalized = normalizeBookingRecurrence(recurrence) ?? {
    intervalWeeks: 1,
    daysOfWeek: [day],
  };

  if (normalized.daysOfWeek.includes(day)) {
    if (normalized.daysOfWeek.length === 1) {
      return normalized;
    }

    return {
      ...normalized,
      daysOfWeek: normalized.daysOfWeek.filter((currentDay) => currentDay !== day),
    };
  }

  return {
    ...normalized,
    daysOfWeek: getSortedRecurrenceDays([...normalized.daysOfWeek, day]),
  };
}

export function alignRecurrenceToDate(
  recurrence: BookingRecurrence | null | undefined,
  dateIso: string,
): BookingRecurrence | null {
  const normalized = normalizeBookingRecurrence(recurrence);
  if (!normalized) {
    return null;
  }

  const selectedDay = getRecurrenceDayFromDate(dateIso);

  if (normalized.daysOfWeek.length === 1) {
    return {
      ...normalized,
      daysOfWeek: [selectedDay],
    };
  }

  if (normalized.daysOfWeek.includes(selectedDay)) {
    return normalized;
  }

  return {
    ...normalized,
    daysOfWeek: getSortedRecurrenceDays([selectedDay, ...normalized.daysOfWeek]),
  };
}

export function setBookingRecurrencePreset(
  dateIso: string,
  preset: BookingRecurrencePreset,
  currentRecurrence: BookingRecurrence | null | undefined,
): BookingRecurrence | null {
  if (preset === 'one_time') {
    return null;
  }

  if (preset === 'weekly') {
    return createDefaultRecurrence(dateIso, 1);
  }

  if (preset === 'biweekly') {
    return createDefaultRecurrence(dateIso, 2);
  }

  return alignRecurrenceToDate(currentRecurrence, dateIso) ?? createDefaultRecurrence(dateIso, 1);
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
