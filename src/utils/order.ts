import type { OrderSummary } from '@/types/payment';

export function calculateTotal(order: OrderSummary): number {
  return order.items.reduce((sum, item) => sum + item.price, 0) + order.fee;
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
