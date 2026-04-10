import { apiClient } from './client';

export type McpCapability =
  | 'marketplace.read'
  | 'bookings.read'
  | 'bookings.create'
  | 'bookings.manage'
  | 'payments.charge'
  | 'reviews.write';

export interface McpGrant {
  id: string;
  clientId: string;
  status: 'active' | 'revoked';
  capabilities: McpCapability[];
  spendLimitCents: number | null;
  dailySpendLimitCents: number | null;
  weeklySpendLimitCents: number | null;
  approvalRequiredAboveCents: number | null;
  tokenAudience: string | null;
  resourceIndicator: string | null;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}

export interface UpdateMcpGrantInput {
  clientId: string;
  capabilities: McpCapability[];
  spendLimitCents?: number | null;
  dailySpendLimitCents?: number | null;
  weeklySpendLimitCents?: number | null;
  approvalRequiredAboveCents?: number | null;
  tokenAudience?: string | null;
  resourceIndicator?: string | null;
}

export interface McpPendingApproval {
  id: string;
  clientId: string;
  toolName: string;
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'needs_requote' | 'booking_conflict';
  amountCents: number | null;
  cleanerId: string | null;
  holdId: string | null;
  bookingId: string | null;
  requestedStartTime: string | null;
  requestedEndTime: string | null;
  expiresAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface McpAuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
}

export async function getMcpGrants(): Promise<McpGrant[]> {
  const response = await apiClient.get('/mcp/grants');
  return response.data.grants ?? [];
}

export async function upsertMcpGrant(input: UpdateMcpGrantInput): Promise<McpGrant> {
  const response = await apiClient.post('/mcp/grants', input);
  return response.data.grant;
}

export async function revokeMcpGrant(clientId: string): Promise<void> {
  await apiClient.delete(`/mcp/grants/${clientId}`);
}

export async function revokeAllMcpGrants(): Promise<{
  revokedGrants: number;
  revokedSessions: number;
}> {
  const response = await apiClient.post('/mcp/grants/revoke-all');
  return response.data;
}

export async function getMcpApprovals(): Promise<McpPendingApproval[]> {
  const response = await apiClient.get('/mcp/approvals');
  return response.data.approvals ?? [];
}

export async function approveMcpApproval(approvalId: string): Promise<unknown> {
  const response = await apiClient.post(`/mcp/approvals/${approvalId}/approve`);
  return response.data;
}

export async function denyMcpApproval(approvalId: string): Promise<unknown> {
  const response = await apiClient.post(`/mcp/approvals/${approvalId}/deny`);
  return response.data;
}

export async function getMcpAuditLogs(limit: number = 20): Promise<McpAuditLog[]> {
  const response = await apiClient.get('/mcp/audit-logs', {
    params: { limit },
  });
  return response.data.auditLogs ?? [];
}
