import { apiClient } from './client';

export interface AdminDashboardStats {
  totalUsers: number;
  totalCleaners: number;
  activeCleaners: number;
  totalBookings: number;
  bookingsToday: number;
  bookingsThisWeek: number;
  gmv: number;
  platformRevenue: number;
  averageBookingValue: number;
  openDisputes: number;
  newUsersThisMonth: number;
  newCleanersThisMonth: number;
}

export interface AdminRecentBooking {
  id: string;
  customer: string;
  cleaner: string;
  date: string;
  total: number;
  status: string;
}

export interface AdminDashboardResponse {
  stats: AdminDashboardStats;
  recentBookings: AdminRecentBooking[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'cleaner' | 'admin';
  joinedAt: string;
  bookings: number;
  status: 'active' | 'suspended' | 'deleted';
}

export interface AdminDispute {
  id: string;
  bookingId: string | null;
  customer: string;
  cleaner: string;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
  total: number;
}

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  const response = await apiClient.get('/admin/dashboard');
  return response.data;
}

export async function getAdminUsers(params?: {
  role?: string;
  search?: string;
}): Promise<AdminUser[]> {
  const response = await apiClient.get('/admin/users', { params });
  return response.data.users ?? response.data;
}

export async function suspendUser(userId: string): Promise<void> {
  await apiClient.post(`/admin/users/${userId}/suspend`);
}

export async function getAdminDisputes(params?: {
  status?: string;
}): Promise<AdminDispute[]> {
  const response = await apiClient.get('/admin/disputes', { params });
  return response.data.disputes ?? response.data;
}

export async function resolveDispute(
  disputeId: string,
  resolution: string,
  notes?: string,
): Promise<void> {
  await apiClient.post(`/admin/disputes/${disputeId}/resolve`, { resolution, notes });
}
