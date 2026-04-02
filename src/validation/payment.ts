import { z } from 'zod';

function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\s/g, '');
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]!, 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

function isExpiryValid(expiry: string): boolean {
  const match = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1]!, 10);
  const year = parseInt(`20${match[2]!}`, 10);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

export const paymentSchema = z.object({
  cardHolder: z
    .string()
    .min(2, 'Укажите имя держателя карты')
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s\-'.]+$/, 'Имя содержит недопустимые символы'),

  cardNumber: z
    .string()
    .transform((val) => val.replace(/\s/g, ''))
    .pipe(
      z
        .string()
        .regex(/^\d{13,19}$/, 'Номер карты должен содержать 13-19 цифр')
        .refine(luhnCheck, 'Некорректный номер карты')
    ),

  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Формат: MM/YY')
    .refine(isExpiryValid, 'Срок действия карты истек'),

  cvv: z
    .string()
    .regex(/^\d{3,4}$/, 'CVV должен содержать 3 или 4 цифры'),

  email: z
    .string()
    .min(1, 'Укажите email')
    .email('Некорректный email'),

  termsAccepted: z
    .boolean()
    .refine((val) => val === true, { message: 'Необходимо принять условия' }),
});

export type PaymentFormInput = z.input<typeof paymentSchema>;
export type PaymentFormOutput = z.output<typeof paymentSchema>;
