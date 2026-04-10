import type { UserAddress } from '@/lib/api/addresses';

export interface InitialBookingAddressSelection {
  selectedAddressId: string | null;
  accessInstructions: string;
}

export function shouldLoadSavedAddresses(
  isAuthLoaded: boolean,
  isSignedIn: boolean | undefined,
): boolean {
  return isAuthLoaded && Boolean(isSignedIn);
}

export function getInitialBookingAddressSelection(
  addresses: UserAddress[],
  preferredAddressId: string | null,
): InitialBookingAddressSelection | null {
  if (addresses.length === 0) {
    return null;
  }

  const selectedAddress =
    (preferredAddressId
      ? addresses.find((address) => address.id === preferredAddressId)
      : null) ??
    addresses.find((address) => address.isDefault) ??
    addresses[0];

  return {
    selectedAddressId: selectedAddress.id,
    accessInstructions: selectedAddress.accessInstructions ?? '',
  };
}
