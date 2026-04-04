export const formatUsd = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);

export const formatUsdFromCents = (cents: number): string =>
  formatUsd(cents / 100);
