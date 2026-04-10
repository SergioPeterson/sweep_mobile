import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors } from '@/lib/constants/colors';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import { getMobileRouteForNotificationLink } from '@/lib/navigation/links';
import { Button, Card, EmptyState } from '@/components/ui';

interface NotificationListProps {
  title: string;
  description: string;
}

function formatNotificationTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function NotificationList({ title, description }: NotificationListProps) {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => getNotifications({ limit: 50 }),
  });
  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notifications.filter((notification) => notification.readAt === null).length;

  const handleOpenNotification = async (notificationId: string, linkUrl: string | null) => {
    await markReadMutation.mutateAsync(notificationId);

    const route = getMobileRouteForNotificationLink(linkUrl);
    if (route) {
      router.push(route as never);
      return;
    }

    if (linkUrl && /^https?:\/\//i.test(linkUrl)) {
      await Linking.openURL(linkUrl);
    }
  };

  if (notificationsQuery.isLoading) {
    return (
      <Card style={styles.loadingCard}>
        <ActivityIndicator size="small" color={colors.forest700} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </Card>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={notificationsQuery.isFetching}
          onRefresh={() => {
            void notificationsQuery.refetch();
          }}
          tintColor={colors.forest700}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.unreadPill}>
            <Text style={styles.unreadText}>{unreadCount} unread</Text>
          </View>
          <Button
            title="Mark all as read"
            size="sm"
            variant="secondary"
            disabled={unreadCount === 0}
            onPress={() => {
              void markAllMutation.mutateAsync();
            }}
            loading={markAllMutation.isPending}
          />
        </View>
      </View>

      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          subtitle="Booking updates, reminders, and payout alerts will show up here."
        />
      ) : (
        <View style={styles.list}>
          {notifications.map((notification) => {
            const isUnread = notification.readAt === null;

            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  isUnread && styles.notificationCardUnread,
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  void handleOpenNotification(notification.id, notification.linkUrl);
                }}
              >
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {isUnread ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.notificationBody}>{notification.body}</Text>
                <Text style={styles.notificationTime}>
                  {formatNotificationTime(notification.createdAt)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
  },
  loadingText: {
    fontSize: 14,
    color: colors.slate600,
  },
  header: {
    gap: 12,
  },
  headerCopy: {
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.slate600,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  unreadPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unreadText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate600,
  },
  list: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  notificationCardUnread: {
    borderColor: colors.forest200,
    backgroundColor: colors.forest50,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.forest700,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.slate600,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.muted,
  },
});
