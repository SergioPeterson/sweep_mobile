import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveMcpApproval,
  denyMcpApproval,
  getMcpApprovals,
  getMcpAuditLogs,
  getMcpGrants,
  revokeAllMcpGrants,
  revokeMcpGrant,
  type McpAuditLog,
  type McpCapability,
  type McpGrant,
  upsertMcpGrant,
} from '@/lib/api/mcp';
import { colors } from '@/lib/constants/colors';
import {
  formatCurrencyFromCents,
  formatMcpApprovalStatus,
  formatMcpCapabilityLabel,
  formatMcpGrantStatus,
  formatRelativeDateTime,
} from '@/lib/mcp/presentation';
import {
  hasAtLeastOneMcpCapability,
  MCP_CAPABILITY_OPTIONS,
  toggleMcpCapability,
} from '@/lib/mcp/settings';
import { Button, Card } from '@/components/ui';

function toInputValue(cents: number | null): string {
  return cents == null ? '' : String(cents / 100);
}

function parseDollarInput(value: string): number | null | undefined {
  if (value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return Math.round(parsed * 100);
}

function describeAuditLog(log: McpAuditLog): string {
  if (!log.metadata || typeof log.metadata !== 'object' || Array.isArray(log.metadata)) {
    return log.action.replace(/^mcp\./, '').replaceAll('.', ' ');
  }

  const metadata = log.metadata as Record<string, unknown>;
  const toolName = typeof metadata.toolName === 'string' ? metadata.toolName : null;
  const clientId = typeof metadata.clientId === 'string' ? metadata.clientId : null;
  const outcome = typeof metadata.outcome === 'string' ? metadata.outcome : null;

  if (toolName) {
    return `${toolName}${outcome ? ` · ${outcome}` : ''}${clientId ? ` · ${clientId}` : ''}`;
  }

  if (clientId) {
    return `${clientId} · ${log.action.replace(/^mcp\./, '').replaceAll('.', ' ')}`;
  }

  return log.action.replace(/^mcp\./, '').replaceAll('.', ' ');
}

function LimitField({
  label,
  helper,
  value,
  onChangeText,
}: {
  label: string;
  helper: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.limitField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder="Leave blank for no limit"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <Text style={styles.fieldHelper}>{helper}</Text>
    </View>
  );
}

function GrantEditorCard({
  grant,
  saving,
  revoking,
  onSave,
  onRevoke,
}: {
  grant: McpGrant;
  saving: boolean;
  revoking: boolean;
  onSave: (input: {
    capabilities: McpCapability[];
    spendLimitCents: number | null;
    dailySpendLimitCents: number | null;
    weeklySpendLimitCents: number | null;
    approvalRequiredAboveCents: number | null;
  }) => Promise<void>;
  onRevoke: () => Promise<void>;
}) {
  const [capabilities, setCapabilities] = useState<McpCapability[]>(grant.capabilities);
  const [spendLimit, setSpendLimit] = useState(toInputValue(grant.spendLimitCents));
  const [dailyLimit, setDailyLimit] = useState(toInputValue(grant.dailySpendLimitCents));
  const [weeklyLimit, setWeeklyLimit] = useState(toInputValue(grant.weeklySpendLimitCents));
  const [approvalThreshold, setApprovalThreshold] = useState(
    toInputValue(grant.approvalRequiredAboveCents),
  );

  useEffect(() => {
    setCapabilities(grant.capabilities);
    setSpendLimit(toInputValue(grant.spendLimitCents));
    setDailyLimit(toInputValue(grant.dailySpendLimitCents));
    setWeeklyLimit(toInputValue(grant.weeklySpendLimitCents));
    setApprovalThreshold(toInputValue(grant.approvalRequiredAboveCents));
  }, [grant]);

  const parsedSpendLimit = parseDollarInput(spendLimit);
  const parsedDailyLimit = parseDollarInput(dailyLimit);
  const parsedWeeklyLimit = parseDollarInput(weeklyLimit);
  const parsedApprovalThreshold = parseDollarInput(approvalThreshold);
  const hasInvalidCapabilitySelection = !hasAtLeastOneMcpCapability(capabilities);
  const hasInvalidValue = [
    parsedSpendLimit,
    parsedDailyLimit,
    parsedWeeklyLimit,
    parsedApprovalThreshold,
  ].some((value) => value === undefined);

  return (
    <Card style={styles.grantCard}>
      <View style={styles.grantHeader}>
        <View style={styles.clientBadge}>
          <Text style={styles.clientBadgeText}>{grant.clientId}</Text>
        </View>
        <Text style={styles.grantTitle}>{formatMcpGrantStatus(grant.status)}</Text>
        <Text style={styles.grantSubtitle}>
          Connected {formatRelativeDateTime(grant.createdAt)} · Updated{' '}
          {formatRelativeDateTime(grant.updatedAt)}
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>Per booking: {formatCurrencyFromCents(grant.spendLimitCents)}</Text>
        <Text style={styles.summaryText}>Daily: {formatCurrencyFromCents(grant.dailySpendLimitCents)}</Text>
        <Text style={styles.summaryText}>Weekly: {formatCurrencyFromCents(grant.weeklySpendLimitCents)}</Text>
      </View>

      <View style={styles.chipRow}>
        {grant.capabilities.map((capability) => (
          <View key={capability} style={styles.capabilityChip}>
            <Text style={styles.capabilityChipText}>{formatMcpCapabilityLabel(capability)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Granted capabilities</Text>
      <Text style={styles.sectionDescription}>
        Turn off anything you do not want this client to do autonomously.
      </Text>

      <View style={styles.capabilityList}>
        {MCP_CAPABILITY_OPTIONS.map((option) => {
          const checked = capabilities.includes(option.value);
          return (
            <View key={option.value} style={styles.capabilityRow}>
              <View style={styles.capabilityCopy}>
                <Text style={styles.capabilityLabel}>{option.label}</Text>
                <Text style={styles.capabilityDescription}>{option.description}</Text>
              </View>
              <Switch
                value={checked}
                onValueChange={() =>
                  setCapabilities((current) => toggleMcpCapability(current, option.value))
                }
                trackColor={{ false: colors.slate300, true: colors.forest200 }}
                thumbColor={checked ? colors.forest700 : colors.white}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.limitGrid}>
        <LimitField
          label="Per-booking limit (USD)"
          value={spendLimit}
          onChangeText={setSpendLimit}
          helper="Hard stop for any single autonomous booking."
        />
        <LimitField
          label="Approval threshold (USD)"
          value={approvalThreshold}
          onChangeText={setApprovalThreshold}
          helper="Anything above this waits for explicit approval."
        />
        <LimitField
          label="Daily limit (USD)"
          value={dailyLimit}
          onChangeText={setDailyLimit}
          helper="Rolling 24-hour cap across this agent."
        />
        <LimitField
          label="Weekly limit (USD)"
          value={weeklyLimit}
          onChangeText={setWeeklyLimit}
          helper="Rolling 7-day cap across this agent."
        />
      </View>

      {hasInvalidValue ? (
        <View style={[styles.inlineNotice, styles.errorNotice]}>
          <Text style={styles.errorNoticeText}>Enter whole-dollar values or leave fields blank.</Text>
        </View>
      ) : null}
      {hasInvalidCapabilitySelection ? (
        <View style={[styles.inlineNotice, styles.warningNotice]}>
          <Text style={styles.warningNoticeText}>
            Keep at least one capability enabled or revoke the agent entirely.
          </Text>
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <Button
          title={saving ? 'Saving...' : 'Save limits'}
          size="sm"
          disabled={saving || hasInvalidValue || hasInvalidCapabilitySelection}
          loading={saving}
          onPress={() =>
            void onSave({
              capabilities,
              spendLimitCents: parsedSpendLimit ?? null,
              dailySpendLimitCents: parsedDailyLimit ?? null,
              weeklySpendLimitCents: parsedWeeklyLimit ?? null,
              approvalRequiredAboveCents: parsedApprovalThreshold ?? null,
            })
          }
          style={styles.flexButton}
        />
        <Button
          title={revoking ? 'Revoking...' : 'Revoke access'}
          variant="destructive"
          size="sm"
          disabled={revoking}
          loading={revoking}
          onPress={() => void onRevoke()}
          style={styles.flexButton}
        />
      </View>
    </Card>
  );
}

export function AgentAccessSection() {
  const queryClient = useQueryClient();

  const grantsQuery = useQuery({
    queryKey: ['mcp', 'grants'],
    queryFn: getMcpGrants,
  });
  const approvalsQuery = useQuery({
    queryKey: ['mcp', 'approvals'],
    queryFn: getMcpApprovals,
    refetchInterval: 30_000,
  });
  const auditLogsQuery = useQuery({
    queryKey: ['mcp', 'audit-logs'],
    queryFn: () => getMcpAuditLogs(20),
  });

  const upsertGrantMutation = useMutation({
    mutationFn: upsertMcpGrant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp', 'grants'] });
      queryClient.invalidateQueries({ queryKey: ['mcp', 'audit-logs'] });
    },
  });
  const revokeGrantMutation = useMutation({
    mutationFn: revokeMcpGrant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp', 'grants'] });
      queryClient.invalidateQueries({ queryKey: ['mcp', 'audit-logs'] });
    },
  });
  const revokeAllMutation = useMutation({
    mutationFn: revokeAllMcpGrants,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp', 'grants'] });
      queryClient.invalidateQueries({ queryKey: ['mcp', 'audit-logs'] });
    },
  });
  const approveApprovalMutation = useMutation({
    mutationFn: approveMcpApproval,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp', 'approvals'] });
      queryClient.invalidateQueries({ queryKey: ['mcp', 'grants'] });
      queryClient.invalidateQueries({ queryKey: ['mcp', 'audit-logs'] });
    },
  });
  const denyApprovalMutation = useMutation({
    mutationFn: denyMcpApproval,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp', 'approvals'] });
      queryClient.invalidateQueries({ queryKey: ['mcp', 'audit-logs'] });
    },
  });

  const grants = grantsQuery.data ?? [];
  const approvals = approvalsQuery.data ?? [];
  const auditLogs = auditLogsQuery.data ?? [];
  const activeGrants = grants.filter((grant) => grant.status === 'active');
  const pendingApprovals = approvals.filter((approval) => approval.status === 'pending');

  if (grantsQuery.isLoading || approvalsQuery.isLoading || auditLogsQuery.isLoading) {
    return (
      <Card>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.forest700} />
          <Text style={styles.loadingText}>Loading agent controls...</Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.heroCard}>
        <Text style={styles.kicker}>MCP guardrails</Text>
        <Text style={styles.heroTitle}>Agent access</Text>
        <Text style={styles.heroBody}>
          Review connected AI clients, tune their autonomous spending limits, and step in when
          Sweep needs a human approval before a booking moves forward.
        </Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Connected agents</Text>
            <Text style={styles.statValue}>{activeGrants.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending approvals</Text>
            <Text style={styles.statValue}>{pendingApprovals.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Recent MCP events</Text>
            <Text style={styles.statValue}>{auditLogs.length}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderCopy}>
          <Text style={styles.sectionTitle}>Connected agents</Text>
          <Text style={styles.sectionDescription}>
            Sweep only allows approved clients to connect. Each grant below reflects the
            capabilities you already consented to during authorization.
          </Text>
        </View>
        <Button
          title={revokeAllMutation.isPending ? 'Revoking...' : 'Revoke all'}
          variant="destructive"
          size="sm"
          disabled={revokeAllMutation.isPending || activeGrants.length === 0}
          loading={revokeAllMutation.isPending}
          onPress={() =>
            Alert.alert(
              'Revoke all agents',
              'Revoke every connected agent and clear all active sessions?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Revoke all',
                  style: 'destructive',
                  onPress: () => revokeAllMutation.mutate(),
                },
              ],
            )
          }
        />
      </View>

      {grants.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>No agents connected yet</Text>
          <Text style={styles.emptyBody}>
            Once you authorize an approved MCP client, it will appear here with its capabilities
            and spending guardrails.
          </Text>
        </Card>
      ) : (
        grants.map((grant) => (
          <GrantEditorCard
            key={`${grant.id}:${grant.updatedAt}:${grant.revokedAt ?? 'active'}`}
            grant={grant}
            saving={
              upsertGrantMutation.isPending &&
              upsertGrantMutation.variables?.clientId === grant.clientId
            }
            revoking={
              revokeGrantMutation.isPending &&
              revokeGrantMutation.variables === grant.clientId
            }
            onSave={async (limits) => {
              await upsertGrantMutation.mutateAsync({
                clientId: grant.clientId,
                capabilities: limits.capabilities,
                spendLimitCents: limits.spendLimitCents,
                dailySpendLimitCents: limits.dailySpendLimitCents,
                weeklySpendLimitCents: limits.weeklySpendLimitCents,
                approvalRequiredAboveCents: limits.approvalRequiredAboveCents,
                tokenAudience: grant.tokenAudience,
                resourceIndicator: grant.resourceIndicator,
              });
            }}
            onRevoke={async () => {
              Alert.alert('Revoke agent', `Revoke ${grant.clientId}?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Revoke',
                  style: 'destructive',
                  onPress: () => revokeGrantMutation.mutate(grant.clientId),
                },
              ]);
            }}
          />
        ))
      )}

      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.sectionTitle}>Pending approvals</Text>
        <Text style={styles.sectionDescription}>
          Requests above your configured limits wait here until you approve or deny them.
        </Text>
      </View>

      {approvals.length === 0 ? (
        <Card>
          <Text style={styles.emptyBody}>No approval requests are waiting right now.</Text>
        </Card>
      ) : (
        approvals.map((approval) => (
          <Card key={approval.id} style={styles.approvalCard}>
            <View style={styles.clientBadge}>
              <Text style={styles.clientBadgeText}>{approval.clientId}</Text>
            </View>
            <Text style={styles.grantTitle}>{formatMcpApprovalStatus(approval.status)}</Text>
            <Text style={styles.grantSubtitle}>
              {approval.toolName.replaceAll('_', ' ')} · Expires{' '}
              {formatRelativeDateTime(approval.expiresAt)}
            </Text>
            <Text style={styles.amountLabel}>
              Amount: {formatCurrencyFromCents(approval.amountCents)}
            </Text>
            <Text style={styles.approvalMeta}>
              Cleaner: {approval.cleanerId ?? 'Unknown'}
            </Text>
            <Text style={styles.approvalMeta}>
              Start: {formatRelativeDateTime(approval.requestedStartTime)}
            </Text>
            <Text style={styles.approvalMeta}>
              End: {formatRelativeDateTime(approval.requestedEndTime)}
            </Text>

            {approval.status === 'pending' ? (
              <View style={styles.buttonRow}>
                <Button
                  title={approveApprovalMutation.isPending ? 'Approving...' : 'Approve'}
                  size="sm"
                  disabled={
                    approveApprovalMutation.isPending &&
                    approveApprovalMutation.variables === approval.id
                  }
                  loading={
                    approveApprovalMutation.isPending &&
                    approveApprovalMutation.variables === approval.id
                  }
                  onPress={() => approveApprovalMutation.mutate(approval.id)}
                  style={styles.flexButton}
                />
                <Button
                  title={denyApprovalMutation.isPending ? 'Denying...' : 'Deny'}
                  variant="secondary"
                  size="sm"
                  disabled={
                    denyApprovalMutation.isPending &&
                    denyApprovalMutation.variables === approval.id
                  }
                  loading={
                    denyApprovalMutation.isPending &&
                    denyApprovalMutation.variables === approval.id
                  }
                  onPress={() => denyApprovalMutation.mutate(approval.id)}
                  style={styles.flexButton}
                />
              </View>
            ) : null}
          </Card>
        ))
      )}

      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.sectionTitle}>Recent activity</Text>
        <Text style={styles.sectionDescription}>
          Every MCP action is logged so you can understand what an agent tried to do and how Sweep
          responded.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.auditColumn}>
          {auditLogs.length === 0 ? (
            <Card style={styles.auditCard}>
              <Text style={styles.emptyBody}>No MCP activity has been recorded for this account yet.</Text>
            </Card>
          ) : (
            auditLogs.map((log) => (
              <Card key={log.id} style={styles.auditCard}>
                <Text style={styles.auditTitle}>{describeAuditLog(log)}</Text>
                <Text style={styles.auditSubtitle}>
                  {log.action.replace(/^mcp\./, '').replaceAll('.', ' ')}
                </Text>
                <Text style={styles.auditTime}>{formatRelativeDateTime(log.createdAt)}</Text>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  heroCard: {
    gap: 12,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.forest700,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.foreground,
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.slate600,
  },
  statRow: {
    gap: 12,
  },
  statCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.slate100,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate500,
  },
  statValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
  },
  sectionHeader: {
    gap: 12,
  },
  sectionHeaderCopy: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.slate600,
  },
  grantCard: {
    gap: 12,
  },
  grantHeader: {
    gap: 6,
  },
  clientBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.slate100,
  },
  clientBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate600,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  grantTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  grantSubtitle: {
    fontSize: 12,
    color: colors.slate500,
  },
  summaryCard: {
    gap: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.slate100,
  },
  summaryText: {
    fontSize: 13,
    color: colors.slate600,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capabilityChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.forest100,
  },
  capabilityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.forest800,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  capabilityList: {
    gap: 10,
  },
  capabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.slate100,
  },
  capabilityCopy: {
    flex: 1,
    gap: 4,
  },
  capabilityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  capabilityDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.slate600,
  },
  limitGrid: {
    gap: 12,
  },
  limitField: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  fieldHelper: {
    fontSize: 11,
    color: colors.slate500,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.foreground,
    backgroundColor: colors.white,
  },
  inlineNotice: {
    padding: 12,
    borderRadius: 12,
  },
  errorNotice: {
    backgroundColor: '#FEF2F2',
  },
  errorNoticeText: {
    fontSize: 12,
    color: colors.error,
  },
  warningNotice: {
    backgroundColor: '#FFFBEB',
  },
  warningNoticeText: {
    fontSize: 12,
    color: colors.warning,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: colors.slate600,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.slate600,
  },
  approvalCard: {
    gap: 6,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  approvalMeta: {
    fontSize: 12,
    color: colors.slate600,
  },
  auditColumn: {
    gap: 10,
    width: 320,
  },
  auditCard: {
    gap: 4,
  },
  auditTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  auditSubtitle: {
    fontSize: 12,
    color: colors.slate600,
  },
  auditTime: {
    fontSize: 12,
    color: colors.slate500,
  },
});
