import type { McpCapability } from '@/lib/api/mcp';

export const MCP_CAPABILITY_OPTIONS: Array<{
  value: McpCapability;
  label: string;
  description: string;
}> = [
  {
    value: 'marketplace.read',
    label: 'Marketplace read',
    description: 'Search cleaners, view profiles, inspect availability, and price quotes.',
  },
  {
    value: 'bookings.read',
    label: 'Booking history',
    description: 'Read upcoming, completed, cancelled, and disputed bookings.',
  },
  {
    value: 'bookings.create',
    label: 'Create holds',
    description: 'Create booking holds within the guardrails you configure.',
  },
  {
    value: 'bookings.manage',
    label: 'Manage bookings',
    description: 'Cancel or reschedule existing bookings on your behalf.',
  },
  {
    value: 'payments.charge',
    label: 'Charge payments',
    description: 'Charge your saved payment method after all approval checks pass.',
  },
  {
    value: 'reviews.write',
    label: 'Write reviews',
    description: 'Submit ratings and reviews after completed jobs.',
  },
];

export function normalizeMcpCapabilities(
  capabilities: readonly McpCapability[],
): McpCapability[] {
  return MCP_CAPABILITY_OPTIONS.map((option) => option.value).filter((value) =>
    capabilities.includes(value),
  );
}

export function toggleMcpCapability(
  capabilities: readonly McpCapability[],
  capability: McpCapability,
): McpCapability[] {
  if (capabilities.includes(capability)) {
    return normalizeMcpCapabilities(
      capabilities.filter((value) => value !== capability),
    );
  }

  return normalizeMcpCapabilities([...capabilities, capability]);
}

export function hasAtLeastOneMcpCapability(
  capabilities: readonly McpCapability[],
): boolean {
  return normalizeMcpCapabilities(capabilities).length > 0;
}
