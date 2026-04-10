import { describe, expect, test } from 'bun:test';
import { buildUpcomingDateKeys } from './date';

describe('booking date helpers', () => {
  test('builds consecutive day keys from a fixed start date', () => {
    expect(buildUpcomingDateKeys(4, new Date('2026-04-09T15:45:00.000Z'))).toEqual([
      '2026-04-09',
      '2026-04-10',
      '2026-04-11',
      '2026-04-12',
    ]);
  });

  test('always returns at least one date', () => {
    expect(buildUpcomingDateKeys(0, new Date('2026-04-09T15:45:00.000Z'))).toEqual([
      '2026-04-09',
    ]);
  });
});
