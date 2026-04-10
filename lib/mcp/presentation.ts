import type { McpCapability, McpGrant, McpPendingApproval } from '@/lib/api/mcp';

const capabilityLabels: Record<McpCapability, string> = {
  'marketplace.read': 'Search marketplace',
  'bookings.read': 'Read bookings',
  'bookings.create': 'Create booking holds',
  'bookings.manage': 'Cancel and reschedule bookings',
  'payments.charge': 'Charge saved payment methods',
  'reviews.write': 'Submit reviews',
};

const approvalStatusLabels: Record<McpPendingApproval['status'], string> = {
  pending: 'Waiting for approval',
  approved: 'Approved',
  denied: 'Denied',
  expired: 'Expired',
  needs_requote: 'Needs requote',
  booking_conflict: 'Booking conflict',
};

export function formatMcpCapabilityLabel(capability: McpCapability): string {
  return capabilityLabels[capability];
}

export function formatMcpApprovalStatus(status: McpPendingApproval['status']): string {
  return approvalStatusLabels[status];
}

export function formatMcpGrantStatus(status: McpGrant['status']): string {
  return status === 'active' ? 'Active' : 'Revoked';
}

export function formatCurrencyFromCents(cents: number | null | undefined): string {
  if (cents == null) {
    return 'No limit';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatRelativeDateTime(value: string | null): string {
  if (!value) {
    return 'Not available';
  }

  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
