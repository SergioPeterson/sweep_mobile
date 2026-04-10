import { NotificationList } from '@/components/notifications/NotificationList';

export default function CleanerNotificationsScreen() {
  return (
    <NotificationList
      title="Notifications"
      description="New bookings, morning schedule summaries, tips, and payout alerts are all collected here."
    />
  );
}
