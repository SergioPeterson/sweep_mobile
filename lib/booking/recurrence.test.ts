import { describe, expect, test } from 'bun:test';
import {
  alignRecurrenceToDate,
  getBookingRecurrencePreset,
  normalizeBookingRecurrence,
  setBookingRecurrencePreset,
  toggleRecurrenceDay,
} from './recurrence';

describe('booking recurrence helpers', () => {
  test('detects the expected recurrence preset', () => {
    expect(getBookingRecurrencePreset(null)).toBe('one_time');
    expect(
      getBookingRecurrencePreset({
        intervalWeeks: 1,
        daysOfWeek: ['friday'],
      }),
    ).toBe('weekly');
    expect(
      getBookingRecurrencePreset({
        intervalWeeks: 2,
        daysOfWeek: ['friday'],
      }),
    ).toBe('biweekly');
    expect(
      getBookingRecurrencePreset({
        intervalWeeks: 1,
        daysOfWeek: ['monday', 'wednesday'],
      }),
    ).toBe('custom');
  });

  test('sets a preset from the selected booking date', () => {
    expect(setBookingRecurrencePreset('2026-04-10', 'one_time', null)).toBeNull();
    expect(setBookingRecurrencePreset('2026-04-10', 'weekly', null)).toEqual({
      intervalWeeks: 1,
      daysOfWeek: ['friday'],
    });
    expect(setBookingRecurrencePreset('2026-04-10', 'biweekly', null)).toEqual({
      intervalWeeks: 2,
      daysOfWeek: ['friday'],
    });
  });

  test('aligns a single-day recurrence to the newly selected visit date', () => {
    expect(
      alignRecurrenceToDate(
        {
          intervalWeeks: 2,
          daysOfWeek: ['monday'],
        },
        '2026-04-10',
      ),
    ).toEqual({
      intervalWeeks: 2,
      daysOfWeek: ['friday'],
    });
  });

  test('adds the first-visit day to a custom recurrence when needed', () => {
    expect(
      alignRecurrenceToDate(
        {
          intervalWeeks: 1,
          daysOfWeek: ['monday', 'wednesday'],
        },
        '2026-04-10',
      ),
    ).toEqual({
      intervalWeeks: 1,
      daysOfWeek: ['monday', 'wednesday', 'friday'],
    });
  });

  test('keeps at least one custom day selected', () => {
    expect(
      toggleRecurrenceDay(
        {
          intervalWeeks: 1,
          daysOfWeek: ['monday'],
        },
        'monday',
      ),
    ).toEqual({
      intervalWeeks: 1,
      daysOfWeek: ['monday'],
    });

    expect(
      toggleRecurrenceDay(
        {
          intervalWeeks: 1,
          daysOfWeek: ['monday'],
        },
        'friday',
      ),
    ).toEqual({
      intervalWeeks: 1,
      daysOfWeek: ['monday', 'friday'],
    });
  });

  test('normalizes duplicate and unsorted recurrence days', () => {
    expect(
      normalizeBookingRecurrence({
        intervalWeeks: 0,
        daysOfWeek: ['friday', 'monday', 'friday'],
      }),
    ).toEqual({
      intervalWeeks: 1,
      daysOfWeek: ['monday', 'friday'],
    });
  });
});
