export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatExpiry(value: string, prevValue: string): string {
  // If user is deleting the slash, keep remaining digits as-is
  if (prevValue.endsWith('/') && value.length < prevValue.length) {
    return value.replace(/\D/g, '');
  }

  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  if (digits.length === 2 && value.length >= prevValue.length) {
    return `${digits}/`;
  }
  return digits;
}

export function formatCvv(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}
