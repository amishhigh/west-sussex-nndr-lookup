export const currency = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

export const compactCurrency = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const numberFormat = new Intl.NumberFormat('en-GB');

export function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
