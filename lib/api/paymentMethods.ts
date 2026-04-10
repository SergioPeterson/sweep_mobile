import { apiClient } from './client';

export interface SavedPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface SavedPaymentMethodsResponse {
  hasCustomer: boolean;
  defaultPaymentMethodId: string | null;
  paymentMethods: SavedPaymentMethod[];
}

export async function getSavedPaymentMethods(): Promise<SavedPaymentMethodsResponse> {
  const response = await apiClient.get('/payment-methods');
  return response.data;
}

export async function createPaymentMethodSetupIntent(): Promise<{
  setupIntentId: string;
  clientSecret: string;
}> {
  const response = await apiClient.post('/payment-methods/setup-intent');
  return response.data;
}

export async function syncSavedPaymentMethod(params: {
  setupIntentId: string;
  setDefault?: boolean;
}): Promise<{
  paymentMethod: SavedPaymentMethod;
}> {
  const response = await apiClient.post('/payment-methods/sync', params);
  return response.data;
}

export async function setDefaultPaymentMethod(
  paymentMethodId: string,
): Promise<{ success: boolean; defaultPaymentMethodId: string | null }> {
  const response = await apiClient.post(`/payment-methods/${paymentMethodId}/default`);
  return response.data;
}

export async function deletePaymentMethod(
  paymentMethodId: string,
): Promise<{ success: boolean; defaultPaymentMethodId: string | null }> {
  const response = await apiClient.delete(`/payment-methods/${paymentMethodId}`);
  return response.data;
}
