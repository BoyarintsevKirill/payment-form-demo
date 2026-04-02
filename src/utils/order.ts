import type { OrderSummary } from '@/types/payment';

export function calculateTotal(order: OrderSummary): number {
  return order.items.reduce((sum, item) => sum + item.price, 0) + order.fee;
}
