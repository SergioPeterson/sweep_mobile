import { describe, expect, it } from 'bun:test';
import {
  hasAtLeastOneMcpCapability,
  normalizeMcpCapabilities,
  toggleMcpCapability,
} from './settings';

describe('mcp settings helpers', () => {
  it('normalizes capability selections into canonical order', () => {
    expect(
      normalizeMcpCapabilities([
        'payments.charge',
        'marketplace.read',
        'bookings.create',
      ]),
    ).toEqual(['marketplace.read', 'bookings.create', 'payments.charge']);
  });

  it('toggles capabilities on and off', () => {
    expect(toggleMcpCapability(['marketplace.read'], 'bookings.read')).toEqual([
      'marketplace.read',
      'bookings.read',
    ]);

    expect(
      toggleMcpCapability(
        ['marketplace.read', 'bookings.read'],
        'marketplace.read',
      ),
    ).toEqual(['bookings.read']);
  });

  it('requires at least one capability to remain selected', () => {
    expect(hasAtLeastOneMcpCapability([])).toBe(false);
    expect(hasAtLeastOneMcpCapability(['marketplace.read'])).toBe(true);
  });
});
