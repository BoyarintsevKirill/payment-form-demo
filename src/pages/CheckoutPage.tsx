import { PaymentForm } from '@/components/PaymentForm';
import type { OrderSummary, PaymentResponse } from '@/types/payment';
import styles from './CheckoutPage.module.css';

const order: OrderSummary = {
  items: [
    { name: 'Pro-подписка (1 год)', price: 4990 },
    { name: 'Дополнительное хранилище 50 ГБ', price: 1200 },
  ],
  fee: 0,
  currency: 'RUB',
};

function handleSuccess(response: PaymentResponse) {
  if (import.meta.env.DEV) console.log('[Checkout] Payment success:', response);
}

function handleError(error: string) {
  if (import.meta.env.DEV) console.error('[Checkout] Payment error:', error);
}

export function CheckoutPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>CloudApp</div>
      </header>

      <div className={styles.content}>
        <h1 className={styles.title}>Оформление заказа</h1>
        <PaymentForm
          order={order}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </main>
  );
}
