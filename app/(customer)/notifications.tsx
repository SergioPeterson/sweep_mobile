import { NotificationList } from '@/components/notifications/NotificationList';

export default function CustomerNotificationsScreen() {
  return (
    <NotificationList
      title="Notifications"
      description="Booking confirmations, cleaner arrival reminders, dispute updates, and tip confirmations all live here."
    />
  );
}
