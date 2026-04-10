import { apiClient } from './client';

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  phone: string | null;
  phoneVerified: boolean;
  smsRemindersEnabled: boolean;
  smsBookingConfirmationsEnabled: boolean;
  smsBookingCancellationsEnabled: boolean;
  bookingUpdatesEnabled: boolean;
  reminderNotificationsEnabled: boolean;
  tipNotificationsEnabled: boolean;
  payoutNotificationsEnabled: boolean;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export async function getNotificationPreferences(): Promise<{
  preferences: NotificationPreferences;
}> {
  const response = await apiClient.get('/notifications/preferences');
  return response.data;
}

export async function updateNotificationPreferences(
  params: Partial<NotificationPreferences>,
): Promise<{
  preferences: NotificationPreferences;
}> {
  const response = await apiClient.put('/notifications/preferences', params);
  return response.data;
}

export async function getNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<{
  notifications: AppNotification[];
}> {
  const response = await apiClient.get('/notifications', { params });
  return response.data;
}

export async function markNotificationRead(notificationId: string): Promise<{
  success: boolean;
}> {
  const response = await apiClient.post(`/notifications/${notificationId}/read`);
  return response.data;
}

export async function markAllNotificationsRead(): Promise<{
  updatedCount: number;
}> {
  const response = await apiClient.post('/notifications/read-all');
  return response.data;
}
