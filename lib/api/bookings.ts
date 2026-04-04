import { apiClient } from './client';
import type { BookingRecurrence } from '../booking/recurrence';

export interface Booking {
  id: string;
  customerId: string;
  cleanerId: string;
  cleanerName?: string;
  status:
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled_by_customer'
    | 'cancelled_by_cleaner'
    | 'disputed';
  startTime: string;
  endTime: string;
  recurrence?: BookingRecurrence | null;
  hours?: number;
  total: number;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    unit?: string;
  };
  accessInstructions?: string;
  reviewId?: string;
  createdAt: string;
}

export interface HoldPricing {
  baseRateCents: number;
  hours: number;
  subtotalCents: number;
  serviceAddonsCents: number;
  platformFeeCents: number;
  totalCents: number;
  cleanerPayoutCents: number;
}

export interface BookingHold {
  id: string;
  cleanerId: string;
  cleanerName?: string;
  cleanerRate?: number;
  startTime: string;
  endTime: string;
  recurrence?: BookingRecurrence | null;
  expiresAt: string;
  pricing: HoldPricing;
}

export async function getBookings(): Promise<Booking[]> {
  const response = await apiClient.get('/me/bookings');
  return response.data.bookings ?? response.data;
}

export async function getBookingById(id: string): Promise<Booking> {
  const response = await apiClient.get(`/bookings/${id}`);
  return response.data.booking ?? response.data;
}

export async function cancelBooking(
  id: string,
  reason: string = 'Customer requested cancellation',
): Promise<void> {
  await apiClient.post(`/bookings/${id}/cancel`, { reason });
}

export async function startBooking(id: string): Promise<void> {
  await apiClient.post(`/bookings/${id}/start`, {});
}

export async function completeBooking(id: string): Promise<void> {
  await apiClient.post(`/bookings/${id}/complete`, {});
}

export async function createHold(params: {
  cleanerId: string;
  startTime: string;
  endTime: string;
  recurrence?: BookingRecurrence | null;
}): Promise<BookingHold> {
  const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const response = await apiClient.post('/booking/holds', params, {
    headers: { 'X-Idempotency-Key': idempotencyKey },
  });
  return response.data.hold;
}

export async function getHold(holdId: string): Promise<BookingHold> {
  const response = await apiClient.get(`/booking/holds/${holdId}`);
  return response.data.hold;
}

export async function createPaymentIntent(
  holdId: string,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const response = await apiClient.post('/payments/create-intent', { holdId });
  return response.data;
}

export async function confirmBooking(params: {
  holdId: string;
  paymentIntentId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    unit?: string;
  };
  accessInstructions?: string;
}): Promise<Booking> {
  const response = await apiClient.post('/booking/confirm', params);
  return response.data.booking;
}
