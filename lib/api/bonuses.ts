import { apiClient } from './client';

export type BonusPeriodType = 'monthly' | 'yearly';
export type BonusPeriodStatus = 'pending' | 'calculating' | 'distributed' | 'cancelled';

export interface BonusPeriod {
  id: string;
  type: BonusPeriodType;
  year: number;
  month: number | null;
  gmvCents: number;
  poolAmountCents: number;
  status: BonusPeriodStatus;
  calculatedAt?: string | null;
  distributedAt?: string | null;
}

export interface CleanerBonusSummary {
  period: BonusPeriod;
  topPercent: number;
  cleaner: {
    cleanerId: string;
    cleanerName: string;
    score: number;
    rank: number;
    totalRanked: number;
    eligible: boolean;
    estimatedBonusCents?: number | null;
  };
}

export interface BonusAward {
  id: string;
  bonusPeriodId: string;
  year: number;
  month: number | null;
  score: number;
  amountCents: number;
  status: 'pending' | 'paid' | 'failed' | string;
  paidAt?: string | null;
}

export async function getCurrentBonusPeriod(): Promise<BonusPeriod> {
  const response = await apiClient.get('/bonuses/current');
  return response.data.period ?? response.data;
}

export async function getCleanerBonusSummary(): Promise<CleanerBonusSummary> {
  const response = await apiClient.get('/cleaner/bonuses/summary');
  return response.data;
}

export async function getCleanerBonusAwards(params?: {
  limit?: number;
}): Promise<{ awards: BonusAward[] }> {
  const response = await apiClient.get('/cleaner/bonuses/awards', { params });
  return response.data;
}

