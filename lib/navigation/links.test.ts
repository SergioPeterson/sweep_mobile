import { describe, expect, it } from 'bun:test';
import { getMobileRouteForNotificationLink } from '@/lib/navigation/links';

describe('mobile notification link routing', () => {
  it('maps customer booking detail links into the mobile booking detail route', () => {
    expect(getMobileRouteForNotificationLink('/customer/bookings/booking_123')).toBe(
      '/(customer)/booking/booking_123',
    );
  });

  it('maps customer booking message links back to the booking detail when messages are not yet a dedicated screen', () => {
    expect(
      getMobileRouteForNotificationLink(
        'https://app.sweepcleaning.com/customer/bookings/booking_123/messages',
      ),
    ).toBe('/(customer)/booking/booking_123');
  });

  it('maps settings and notification inbox links for each role', () => {
    expect(getMobileRouteForNotificationLink('/customer/settings')).toBe(
      '/(customer)/settings',
    );
    expect(getMobileRouteForNotificationLink('/customer/notifications')).toBe(
      '/(customer)/notifications',
    );
    expect(getMobileRouteForNotificationLink('/cleaner/settings')).toBe(
      '/(cleaner)/settings',
    );
    expect(getMobileRouteForNotificationLink('/cleaner/notifications')).toBe(
      '/(cleaner)/notifications',
    );
  });

  it('returns null for unsupported links', () => {
    expect(getMobileRouteForNotificationLink('/admin/bookings/booking_123')).toBeNull();
    expect(getMobileRouteForNotificationLink(null)).toBeNull();
  });
});
