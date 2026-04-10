import { describe, expect, test } from 'bun:test';
import {
  getInitialBookingAddressSelection,
  shouldLoadSavedAddresses,
} from './address';
import type { UserAddress } from '@/lib/api/addresses';

const baseAddress: UserAddress = {
  id: 'addr_1',
  userId: 'user_1',
  street: '1 Market St',
  city: 'San Francisco',
  state: 'CA',
  zip: '94105',
  isDefault: false,
  createdAt: '2026-04-09T00:00:00.000Z',
};

describe('booking address helpers', () => {
  test('loads saved addresses only when auth is ready and signed in', () => {
    expect(shouldLoadSavedAddresses(false, true)).toBe(false);
    expect(shouldLoadSavedAddresses(true, false)).toBe(false);
    expect(shouldLoadSavedAddresses(true, true)).toBe(true);
  });

  test('prefers a requested address id when present', () => {
    const result = getInitialBookingAddressSelection(
      [
        baseAddress,
        {
          ...baseAddress,
          id: 'addr_2',
          street: '500 Howard St',
          accessInstructions: 'Buzz unit 12',
          isDefault: true,
        },
      ],
      'addr_1',
    );

    expect(result).toEqual({
      selectedAddressId: 'addr_1',
      accessInstructions: '',
    });
  });

  test('falls back to the default address and its instructions', () => {
    const result = getInitialBookingAddressSelection(
      [
        baseAddress,
        {
          ...baseAddress,
          id: 'addr_2',
          street: '500 Howard St',
          accessInstructions: 'Use side gate',
          isDefault: true,
        },
      ],
      null,
    );

    expect(result).toEqual({
      selectedAddressId: 'addr_2',
      accessInstructions: 'Use side gate',
    });
  });
});
