import type { PaymentRequest, PaymentResponse } from '@/types/payment';

const SIMULATED_DELAY_MS = 2000;

export async function submitPayment(
  data: PaymentRequest
): Promise<PaymentResponse> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

  // Симуляция: карта, заканчивающаяся на 0000, будет отклонена
  const lastFour = data.cardNumber.slice(-4);
  if (lastFour === '0000') {
    return {
      transactionId: '',
      status: 'declined',
      message: 'Карта отклонена банком. Попробуйте другую карту.',
    };
  }

  // Симуляция: карта, заканчивающаяся на 9999, вызовет ошибку сервера
  if (lastFour === '9999') {
    throw new Error('Ошибка сервера. Попробуйте позже.');
  }

  return {
    transactionId: `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    status: 'success',
    message: 'Оплата прошла успешно',
  };
}
