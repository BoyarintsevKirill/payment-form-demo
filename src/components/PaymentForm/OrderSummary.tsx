import type { OrderSummary as OrderSummaryType } from '@/types/payment';
import { calculateTotal } from '@/utils/order';
import styles from './OrderSummary.module.css';

interface OrderSummaryProps {
  order: OrderSummaryType;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function OrderSummary({ order }: OrderSummaryProps) {
  const total = calculateTotal(order);

  return (
    <div className={styles.summary}>
      <h3 className={styles.title}>Ваш заказ</h3>

      <ul className={styles.items}>
        {order.items.map((item) => (
          <li key={item.name} className={styles.item}>
            <span className={styles.itemName}>{item.name}</span>
            <span className={styles.itemPrice}>
              {formatCurrency(item.price, order.currency)}
            </span>
          </li>
        ))}
      </ul>

      {order.fee > 0 && (
        <div className={styles.row}>
          <span className={styles.feeLabel}>Комиссия</span>
          <span className={styles.feeValue}>
            {formatCurrency(order.fee, order.currency)}
          </span>
        </div>
      )}

      <div className={styles.divider} />

      <div className={styles.total}>
        <span>Итого</span>
        <span className={styles.totalValue}>
          {formatCurrency(total, order.currency)}
        </span>
      </div>
    </div>
  );
}
