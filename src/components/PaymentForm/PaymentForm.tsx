import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/components/ui/FormField';
import { OrderSummary } from './OrderSummary';
import { paymentSchema, type PaymentFormInput, type PaymentFormOutput } from '@/validation/payment';
import { submitPayment } from '@/api/payment';
import type {
  OrderSummary as OrderSummaryType,
  FormStatus,
  PaymentResponse,
} from '@/types/payment';
import { calculateTotal, formatCurrency } from '@/utils/order';
import styles from './PaymentForm.module.css';

// --- Input formatting helpers ---

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(value: string, prevValue: string): string {
  // If user is deleting the slash character, remove the digit before it too
  if (prevValue.endsWith('/') && value.length < prevValue.length) {
    return value.replace(/\D/g, '').slice(0, 1);
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

function formatCvv(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

// --- Card brand detection ---

type CardBrand = 'visa' | 'mastercard' | 'mir' | 'unknown';

function detectCardBrand(number: string): CardBrand {
  const digits = number.replace(/\s/g, '');
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)) return 'mastercard';
  if (/^220[0-4]/.test(digits)) return 'mir';
  return 'unknown';
}

const brandLabels: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  mir: 'МИР',
  unknown: '',
};

// --- Icons ---

function CardIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="3" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill="var(--color-success)" opacity="0.12" />
      <path d="M15 24l6 6 12-12" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return <span className={styles.spinner} aria-hidden="true" />;
}

// --- Props ---

interface PaymentFormProps {
  order: OrderSummaryType;
  onSuccess?: (response: PaymentResponse) => void;
  onError?: (error: string) => void;
}

// --- Component ---

export function PaymentForm({ order, onSuccess, onError }: PaymentFormProps) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [txnId, setTxnId] = useState('');

  const total = calculateTotal(order);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
  } = useForm<PaymentFormInput, unknown, PaymentFormOutput>({
    resolver: zodResolver(paymentSchema),
    mode: 'onTouched',
    defaultValues: {
      cardHolder: '',
      cardNumber: '',
      expiry: '',
      cvv: '',
      email: '',
      termsAccepted: false,
    },
  });

  const cardNumber = watch('cardNumber');
  const brand = detectCardBrand(cardNumber);

  const onSubmit = useCallback(
    async (data: PaymentFormOutput) => {
      setStatus('loading');
      setErrorMessage('');

      const [expiryMonth = '', rawYear = ''] = data.expiry.split('/');
      const expiryYear = `20${rawYear}`;

      try {
        const response = await submitPayment({
          cardHolder: data.cardHolder.trim(),
          cardNumber: data.cardNumber,
          expiryMonth,
          expiryYear,
          cvv: data.cvv,
          email: data.email.trim(),
          amount: total,
          currency: order.currency,
        });

        if (response.status === 'success') {
          setTxnId(response.transactionId);
          setStatus('success');
          onSuccess?.(response);
        } else {
          setErrorMessage(response.message);
          setStatus('error');
          onError?.(response.message);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Произошла непредвиденная ошибка';
        setErrorMessage(message);
        setStatus('error');
        onError?.(message);
      }
    },
    [total, order.currency, onSuccess, onError]
  );

  const handleRetry = useCallback(() => {
    setStatus('idle');
    setErrorMessage('');
  }, []);

  // --- Success state ---
  if (status === 'success') {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <CheckIcon />
          <h2 className={styles.successTitle}>Оплата прошла успешно</h2>
          <p className={styles.successText}>
            Чек отправлен на вашу почту
          </p>
          <p className={styles.txnId}>Транзакция: {txnId}</p>
        </div>
      </div>
    );
  }

  const isLoading = status === 'loading';

  return (
    <div className={styles.container}>
      <OrderSummary order={order} />

      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-label="Форма оплаты"
      >
        <h2 className={styles.formTitle}>Данные карты</h2>

        <FormField
          label="Имя на карте"
          placeholder="IVAN IVANOV"
          autoComplete="cc-name"
          error={errors.cardHolder?.message}
          disabled={isLoading}
          {...register('cardHolder')}
        />

        <Controller
          name="cardNumber"
          control={control}
          render={({ field }) => (
            <FormField
              label="Номер карты"
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              autoComplete="cc-number"
              icon={<CardIcon />}
              error={errors.cardNumber?.message}
              disabled={isLoading}
              value={field.value}
              onChange={(e) => field.onChange(formatCardNumber(e.target.value))}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />

        {brand !== 'unknown' && (
          <p className={styles.brandBadge}>{brandLabels[brand]}</p>
        )}

        <div className={styles.row}>
          <Controller
            name="expiry"
            control={control}
            render={({ field }) => (
              <FormField
                label="Срок (MM/YY)"
                placeholder="01/28"
                inputMode="numeric"
                autoComplete="cc-exp"
                error={errors.expiry?.message}
                disabled={isLoading}
                value={field.value}
                onChange={(e) =>
                  field.onChange(formatExpiry(e.target.value, field.value))
                }
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />

          <Controller
            name="cvv"
            control={control}
            render={({ field }) => (
              <FormField
                label="CVV"
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
                type="password"
                icon={<LockIcon />}
                error={errors.cvv?.message}
                disabled={isLoading}
                value={field.value}
                onChange={(e) => field.onChange(formatCvv(e.target.value))}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        </div>

        <FormField
          label="Email для чека"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          disabled={isLoading}
          {...register('email')}
        />

        <label className={styles.checkbox} htmlFor="terms-checkbox">
          <input
            type="checkbox"
            id="terms-checkbox"
            disabled={isLoading}
            aria-invalid={!!errors.termsAccepted}
            aria-describedby={errors.termsAccepted ? 'terms-error' : undefined}
            {...register('termsAccepted')}
          />
          <span className={styles.checkboxLabel}>
            Я согласен с{' '}
            <a href="#terms" className={styles.link}>
              условиями оплаты
            </a>
          </span>
        </label>
        {errors.termsAccepted && (
          <p id="terms-error" className={styles.checkboxError} role="alert">
            {errors.termsAccepted.message}
          </p>
        )}

        {status === 'error' && (
          <div className={styles.errorBanner} role="alert">
            <p>{errorMessage}</p>
            <button
              type="button"
              className={styles.retryLink}
              onClick={handleRetry}
            >
              Попробовать снова
            </button>
          </div>
        )}

        <button
          type="submit"
          className={styles.submitButton}
          disabled={!isValid || isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner /> Обработка...
            </>
          ) : (
            `Оплатить ${formatCurrency(total, order.currency)}`
          )}
        </button>

        <p className={styles.secure}>
          <LockIcon /> Безопасное соединение. Данные карты защищены.
        </p>
      </form>

      <details className={styles.demoHint}>
        <summary>Тестовые сценарии</summary>
        <ul>
          <li><strong>Успешная оплата</strong> -- любая карта, проходящая Luhn (напр. 4242 4242 4242 4242)</li>
          <li><strong>Карта отклонена</strong> -- номер, заканчивающийся на 0000</li>
          <li><strong>Ошибка сервера</strong> -- номер, заканчивающийся на 9999</li>
          <li><strong>Определение бренда</strong> -- начните с 4 (Visa), 51-55 (Mastercard), 2200 (МИР)</li>
        </ul>
      </details>
    </div>
  );
}
