export function getMobileRouteForNotificationLink(
  linkUrl: string | null | undefined,
): string | null {
  if (!linkUrl) {
    return null;
  }

  let pathname: string;
  try {
    pathname = new URL(linkUrl, 'https://sweep.local').pathname;
  } catch {
    return null;
  }

  const customerBookingMessagesMatch = pathname.match(
    /^\/customer\/bookings\/([^/]+)\/messages$/,
  );
  if (customerBookingMessagesMatch) {
    return `/(customer)/booking/${customerBookingMessagesMatch[1]}`;
  }

  const customerBookingMatch = pathname.match(/^\/customer\/bookings\/([^/]+)$/);
  if (customerBookingMatch) {
    return `/(customer)/booking/${customerBookingMatch[1]}`;
  }

  const customerNotificationsMatch = pathname.match(/^\/customer\/notifications$/);
  if (customerNotificationsMatch) {
    return '/(customer)/notifications';
  }

  const customerSettingsMatch = pathname.match(/^\/customer\/settings$/);
  if (customerSettingsMatch) {
    return '/(customer)/settings';
  }

  const cleanerNotificationsMatch = pathname.match(/^\/cleaner\/notifications$/);
  if (cleanerNotificationsMatch) {
    return '/(cleaner)/notifications';
  }

  const cleanerSettingsMatch = pathname.match(/^\/cleaner\/settings$/);
  if (cleanerSettingsMatch) {
    return '/(cleaner)/settings';
  }

  if (pathname === '/cleaner/dashboard') {
    return '/(cleaner)/dashboard';
  }

  return null;
}
