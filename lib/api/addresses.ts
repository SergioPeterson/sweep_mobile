import { apiClient } from './client';

export interface UserAddress {
  id: string;
  userId: string;
  label?: string;
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  accessInstructions?: string;
  isDefault: boolean;
  createdAt: string;
}

export async function getAddresses(): Promise<UserAddress[]> {
  const response = await apiClient.get('/me/addresses');
  return response.data.addresses;
}

export async function createAddress(params: {
  label?: string;
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  accessInstructions?: string;
  isDefault?: boolean;
}): Promise<UserAddress> {
  const response = await apiClient.post('/me/addresses', params);
  return response.data.address;
}

export async function deleteAddress(id: string): Promise<void> {
  await apiClient.delete(`/me/addresses/${id}`);
}
