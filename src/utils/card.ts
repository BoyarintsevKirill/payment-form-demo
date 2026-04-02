export type CardBrand = 'visa' | 'mastercard' | 'mir' | 'unknown';

export function detectCardBrand(number: string): CardBrand {
  const digits = number.replace(/\s/g, '');
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)) return 'mastercard';
  if (/^220[0-4]/.test(digits)) return 'mir';
  return 'unknown';
}

export const brandLabels: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  mir: 'МИР',
  unknown: '',
};
