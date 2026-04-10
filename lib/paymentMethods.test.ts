import { describe, expect, it } from 'bun:test';
import {
  formatSavedPaymentMethodLabel,
  getFallbackPaymentMethodId,
} from '@/lib/paymentMethods';

describe('mobile payment method helpers', () => {
  it('prefers the default payment method id when present', () => {
    expect(
      getFallbackPaymentMethodId({
        hasCustomer: true,
        defaultPaymentMethodId: 'pm_default',
        paymentMethods: [{ id: 'pm_other', brand: 'visa', last4: '1111', expMonth: 4, expYear: 2030, isDefault: false }],
      }),
    ).toBe('pm_default');
  });

  it('falls back to the first saved payment method when there is no explicit default', () => {
    expect(
      getFallbackPaymentMethodId({
        hasCustomer: true,
        defaultPaymentMethodId: null,
        paymentMethods: [
          { id: 'pm_first', brand: 'visa', last4: '1111', expMonth: 4, expYear: 2030, isDefault: false },
          { id: 'pm_second', brand: 'amex', last4: '2222', expMonth: 8, expYear: 2031, isDefault: false },
        ],
      }),
    ).toBe('pm_first');
  });

  it('returns null when there are no saved payment methods', () => {
    expect(
      getFallbackPaymentMethodId({
        hasCustomer: false,
        defaultPaymentMethodId: null,
        paymentMethods: [],
      }),
    ).toBeNull();
  });

  it('formats saved payment method labels for display', () => {
    expect(
      formatSavedPaymentMethodLabel({
        brand: 'visa',
        last4: '4242',
        expMonth: 4,
        expYear: 2030,
      }),
    ).toBe('VISA ending in 4242 · 04/2030');
  });
});
