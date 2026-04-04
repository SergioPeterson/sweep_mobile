import type {
  CleanerAvailabilityPayload,
  CleanerProfilePayload,
  CleanerServiceType,
} from '../api/cleaners';

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface TimeRange {
  start: string;
  end: string;
}

export interface CleanerProfileFormValues {
  bio: string;
  baseRateDollars: number;
  minHours: number;
  serviceRadiusMiles: number;
  locationAddress?: string;
  locationZip: string;
  locationLat: number;
  locationLng: number;
  services: CleanerServiceType[];
}

export interface AvailabilityFormValues {
  timezone: string;
  weeklySchedule: Record<DayKey, TimeRange[]>;
}

export const CLEANER_SERVICE_OPTIONS: Array<{ value: CleanerServiceType; label: string }> = [
  { value: 'standard', label: 'Standard' },
  { value: 'deep_clean', label: 'Deep Clean' },
  { value: 'move_in_out', label: 'Move In/Out' },
  { value: 'inside_fridge', label: 'Inside Fridge' },
  { value: 'inside_oven', label: 'Inside Oven' },
  { value: 'inside_cabinets', label: 'Inside Cabinets' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'windows', label: 'Windows' },
];

export const DAY_LABELS: Array<{ key: DayKey; short: string; label: string }> = [
  { key: 'monday', short: 'Mo', label: 'Monday' },
  { key: 'tuesday', short: 'Tu', label: 'Tuesday' },
  { key: 'wednesday', short: 'We', label: 'Wednesday' },
  { key: 'thursday', short: 'Th', label: 'Thursday' },
  { key: 'friday', short: 'Fr', label: 'Friday' },
  { key: 'saturday', short: 'Sa', label: 'Saturday' },
  { key: 'sunday', short: 'Su', label: 'Sunday' },
];

const SF_ZIP_CODES = new Set([
  '94102', '94103', '94104', '94105', '94107', '94108', '94109',
  '94110', '94111', '94112', '94114', '94115', '94116', '94117',
  '94118', '94119', '94120', '94121', '94122', '94123', '94124',
  '94125', '94126', '94127', '94128', '94129', '94130', '94131',
  '94132', '94133', '94134', '94158',
]);

export const dollarsToCents = (value: number): number => Math.round(value * 100);
export const milesToMeters = (value: number): number => Math.round(value * 1609.34);
export const isValidSfZip = (value: string): boolean => SF_ZIP_CODES.has(value.trim());

export const createEmptyWeeklySchedule = (): Record<DayKey, TimeRange[]> => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
});

export const createDefaultWeeklySchedule = (): Record<DayKey, TimeRange[]> => ({
  monday: [{ start: '09:00', end: '17:00' }],
  tuesday: [{ start: '09:00', end: '17:00' }],
  wednesday: [{ start: '09:00', end: '17:00' }],
  thursday: [{ start: '09:00', end: '17:00' }],
  friday: [{ start: '09:00', end: '17:00' }],
  saturday: [],
  sunday: [],
});

export const toCleanerProfilePayload = (
  values: CleanerProfileFormValues,
): CleanerProfilePayload => ({
  bio: values.bio.trim(),
  baseRate: dollarsToCents(values.baseRateDollars),
  minHours: values.minHours,
  radiusMeters: milesToMeters(values.serviceRadiusMiles),
  location: {
    lat: values.locationLat,
    lng: values.locationLng,
    address: values.locationAddress?.trim() || undefined,
    zip: values.locationZip.trim(),
  },
  services: values.services.map((service) => ({ type: service, priceAddon: 0 })),
});

export const toCleanerAvailabilityPayload = (
  values: AvailabilityFormValues,
): CleanerAvailabilityPayload => ({
  timezone: values.timezone,
  weeklySchedule: values.weeklySchedule,
});

export interface OnboardingStatus {
  profileComplete: boolean;
  availabilitySet: boolean;
  stripeConnected: boolean;
  allComplete: boolean;
}

export const NEW_CLEANER_ONBOARDING_STATUS: OnboardingStatus = {
  profileComplete: false,
  availabilitySet: false,
  stripeConnected: false,
  allComplete: false,
};

export const deriveOnboardingStatus = (profile: {
  bio: string;
  baseRate: number;
  locationZip: string;
  services: Array<{ type: string }>;
  weeklySchedule: Record<string, Array<{ start: string; end: string }>>;
  stripeOnboardingComplete: boolean;
}): OnboardingStatus => {
  const profileComplete =
    profile.bio.length >= 10 &&
    profile.baseRate > 0 &&
    isValidSfZip(profile.locationZip) &&
    profile.services.length > 0;

  const availabilitySet = Object.values(profile.weeklySchedule).some(
    (slots) => slots.length > 0,
  );

  const stripeConnected = profile.stripeOnboardingComplete;

  return {
    profileComplete,
    availabilitySet,
    stripeConnected,
    allComplete: profileComplete && availabilitySet && stripeConnected,
  };
};
