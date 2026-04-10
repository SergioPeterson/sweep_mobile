import type {
  SavedPaymentMethod,
  SavedPaymentMethodsResponse,
} from '@/lib/api/paymentMethods';

export function getFallbackPaymentMethodId(
  data: SavedPaymentMethodsResponse | null | undefined,
): string | null {
  if (!data) {
    return null;
  }

  return data.defaultPaymentMethodId ?? data.paymentMethods[0]?.id ?? null;
}

export function formatSavedPaymentMethodLabel(
  paymentMethod: Pick<SavedPaymentMethod, 'brand' | 'last4' | 'expMonth' | 'expYear'>,
): string {
  return `${paymentMethod.brand.toUpperCase()} ending in ${paymentMethod.last4} · ${String(
    paymentMethod.expMonth,
  ).padStart(2, '0')}/${paymentMethod.expYear}`;
}
