export type PlatformRole = 'customer' | 'cleaner' | 'admin';

const DEFAULT_ROLE: PlatformRole = 'customer';

const HARDCODED_ROLE_BY_EMAIL: Record<string, PlatformRole> = {
  'sergiopeterson.dev@gmail.com': 'admin',
  'sergiopeter2020@gmail.com': 'cleaner',
  'sergiopeter2016@gmail.com': 'customer',
};

const DASHBOARD_ROUTE_BY_ROLE: Record<PlatformRole, string> = {
  customer: '/(customer)/search',
  cleaner: '/(cleaner)/dashboard',
  admin: '/(admin)/dashboard',
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const coercePlatformRole = (value: unknown): PlatformRole | null => {
  if (value === 'customer' || value === 'cleaner' || value === 'admin') {
    return value;
  }
  return null;
};

export const getHardcodedRoleForEmail = (
  email: string | null | undefined,
): PlatformRole | null => {
  if (!email) {
    return null;
  }
  return HARDCODED_ROLE_BY_EMAIL[normalizeEmail(email)] ?? null;
};

export const resolvePlatformRole = (params: {
  email?: string | null;
  publicMetadataRole?: unknown;
  unsafeMetadataRole?: unknown;
}): PlatformRole => {
  const { email, publicMetadataRole, unsafeMetadataRole } = params;

  const hardcodedRole = getHardcodedRoleForEmail(email);
  if (hardcodedRole) {
    return hardcodedRole;
  }

  return (
    coercePlatformRole(publicMetadataRole) ??
    coercePlatformRole(unsafeMetadataRole) ??
    DEFAULT_ROLE
  );
};

export const getDashboardRouteForRole = (
  role: PlatformRole,
): string => {
  return DASHBOARD_ROUTE_BY_ROLE[role];
};
