import { apiClient } from './client';

export type CleanerServiceType =
  | 'standard'
  | 'deep_clean'
  | 'move_in_out'
  | 'inside_fridge'
  | 'inside_oven'
  | 'inside_cabinets'
  | 'laundry'
  | 'windows';

export interface Cleaner {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  bio: string;
  canAcceptBookings?: boolean;
  baseRate?: number;
  hourlyRate?: number;
  minHours?: number;
  rating: number;
  reviewCount: number;
  radiusMeters?: number;
  serviceRadius?: number;
  distance?: number;
  location?: { lat: number; lng: number };
}

export interface SearchCleanersParams {
  lat: number;
  lng: number;
  radiusMeters?: number;
  minRating?: number;
  maxRate?: number;
  services?: string[];
  sortBy?: 'distance' | 'rating' | 'price';
  limit?: number;
  cursor?: string;
  date?: string;
  duration?: number;
}

export interface CleanerProfilePayload {
  bio: string;
  baseRate: number;
  minHours: number;
  radiusMeters: number;
  location: {
    lat: number;
    lng: number;
    address?: string;
    zip: string;
  };
  services: Array<{ type: CleanerServiceType; priceAddon: number }>;
}

export interface CleanerAvailabilityPayload {
  timezone: string;
  weeklySchedule: Partial<
    Record<
      'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
      Array<{ start: string; end: string }>
    >
  >;
}

export interface DashboardBooking {
  id: string;
  customer: string;
  startTime: string;
  endTime: string;
  hours: number;
  total: number;
  status: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    unit?: string;
  };
  accessInstructions?: string;
  services: string[];
}

export interface CleanerDashboardResponse {
  stats: {
    monthlyEarnings: number;
    weeklyEarnings: number;
    upcomingBookings: number;
    rating: number;
    reviewCount: number;
    totalJobs: number;
    completionRate: number;
  };
  earnings: {
    thisWeek: number;
    thisMonth: number;
    pendingPayout: number;
  };
  todaysBookings: DashboardBooking[];
  upcomingBookings: DashboardBooking[];
}

export interface EarningsTransaction {
  id: string;
  customer: string;
  completedAt: string;
  hours: number;
  amount: number;
  payoutStatus: string;
  paidAt: string | null;
}

export interface CleanerEarningsResponse {
  summary: {
    thisWeek: number;
    thisMonth: number;
    pendingPayout: number;
    totalAllTime: number;
  };
  transactions: EarningsTransaction[];
}

export interface CleanerProfileResponse {
  cleaner: {
    id: string;
    firstName: string;
    lastName: string;
    bio: string;
    baseRate: number;
    hourlyRate: number;
    minHours: number;
    radiusMeters: number;
    locationAddress: string;
    locationZip: string;
    photoUrl: string | null;
    rating: number;
    reviewCount: number;
    status: string;
    stripeOnboardingComplete: boolean;
    services: Array<{ type: string; addon: number }>;
    weeklySchedule: Record<string, Array<{ start: string; end: string }>>;
  };
}

export interface CleanerReview {
  id: string;
  customer: string;
  rating: number;
  text: string;
  response: string | null;
  date: string;
  verified: boolean;
}

export interface CleanerReviewsResponse {
  reviews: CleanerReview[];
  meta: {
    total: number;
    averageRating: number;
    limit: number;
    offset: number;
  };
}

export async function searchCleaners(params: SearchCleanersParams): Promise<Cleaner[]> {
  const response = await apiClient.get('/search/cleaners', {
    params: { ...params, services: params.services?.join(',') },
  });
  return response.data.cleaners ?? response.data;
}

export async function getCleanerById(id: string): Promise<Cleaner> {
  const response = await apiClient.get(`/cleaners/${id}`);
  return response.data.cleaner ?? response.data;
}

export async function getCleanerProfile(): Promise<CleanerProfileResponse> {
  const response = await apiClient.get('/cleaner/profile');
  return response.data;
}

export async function getCleanerReviews(
  cleanerId: string,
  params?: { limit?: number; offset?: number },
): Promise<CleanerReviewsResponse> {
  const response = await apiClient.get(`/cleaners/${cleanerId}/reviews`, { params });
  return response.data;
}

export async function getCleanerAvailability(
  cleanerId: string,
  date: string,
  duration?: number,
): Promise<{
  slots: Array<{
    id?: string;
    startTime?: string;
    endTime?: string;
    start?: string;
    end?: string;
    available: boolean;
  }>;
}> {
  const response = await apiClient.get(`/cleaners/${cleanerId}/availability`, {
    params: { date, duration },
  });
  return response.data;
}

export async function saveCleanerProfile(
  payload: CleanerProfilePayload,
): Promise<{ cleaner: { id: string; bio: string; baseRate: number; status: string } }> {
  const response = await apiClient.post('/cleaner/profile', payload);
  return response.data;
}

export async function saveCleanerAvailability(
  payload: CleanerAvailabilityPayload,
): Promise<{
  availability: {
    timezone: string;
    weeklySchedule: Record<string, Array<{ start: string; end: string }>>;
  };
}> {
  const response = await apiClient.post('/cleaner/availability', payload);
  return response.data;
}

export async function startStripeConnect(): Promise<{ url: string; expiresAt: string }> {
  const response = await apiClient.post('/cleaner/stripe-connect', {});
  return response.data;
}

export async function getCleanerDashboard(): Promise<CleanerDashboardResponse> {
  const response = await apiClient.get('/cleaner/dashboard');
  return response.data;
}

export async function getCleanerEarnings(
  params?: { period?: string },
): Promise<CleanerEarningsResponse> {
  const response = await apiClient.get('/cleaner/earnings', { params });
  return response.data;
}
