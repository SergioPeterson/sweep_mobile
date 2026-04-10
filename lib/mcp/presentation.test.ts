import { describe, expect, it } from 'bun:test';
import {
  formatCurrencyFromCents,
  formatMcpApprovalStatus,
  formatMcpCapabilityLabel,
  formatMcpGrantStatus,
} from './presentation';

describe('mcp presentation helpers', () => {
  it('formats MCP capability labels', () => {
    expect(formatMcpCapabilityLabel('payments.charge')).toBe(
      'Charge saved payment methods',
    );
  });

  it('formats approval and grant statuses', () => {
    expect(formatMcpApprovalStatus('needs_requote')).toBe('Needs requote');
    expect(formatMcpGrantStatus('active')).toBe('Active');
  });

  it('formats currency limits from cents', () => {
    expect(formatCurrencyFromCents(15000)).toBe('$150');
    expect(formatCurrencyFromCents(null)).toBe('No limit');
  });
});
