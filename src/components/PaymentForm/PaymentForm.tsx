import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/components/ui/FormField';
import { CardIcon, LockIcon, CheckIcon, Spinner } from '@/components/ui/Icons';
import { OrderSummary } from './OrderSummary';
import { paymentSchema, type PaymentFormInput, type PaymentFormOutput } from '@/validation/payment';
import { submitPayment } from '@/api/payment';
import type {
  OrderSummary as OrderSummaryType,
  FormStatus,
  PaymentResponse,
} from '@/types/payment';
import { calculateTotal, formatCurrency } from '@/utils/order';
import { formatCardNumber, formatExpiry, formatCvv } from '@/utils/formatters';
import { detectCardBrand, brandLabels } from '@/utils/card';
import styles from './PaymentForm.module.css';

interface PaymentFormProps {
  order: OrderSummaryType;
  onSuccess?: (response: PaymentResponse) => void;
  onError?: (error: string) => void;
}

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
    mode: 'onChange',
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

  if (status === 'success') {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <CheckIcon />
          <h2 className={styles.successTitle}>Оплата прошла успешно</h2>
          <p className={styles.successText}>Чек отправлен на вашу почту</p>
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
        <fieldset className={styles.fieldset} disabled={isLoading}>
          <legend className={styles.legend}>Данные карты</legend>

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
        </fieldset>

        <fieldset className={styles.fieldset} disabled={isLoading}>
          <legend className={styles.legend}>Контакт</legend>

          <FormField
            label="Email для чека"
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            disabled={isLoading}
            {...register('email')}
          />
        </fieldset>

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
              <Spinner className={styles.spinner} /> Обработка...
            </>
          ) : (
            `Оплатить ${formatCurrency(total, order.currency)}`
          )}
        </button>

        <p className={styles.secure}>
          <LockIcon /> Безопасное соединение. Данные карты защищены.
        </p>
      </form>

      <details className={styles.demoHint} aria-label="Тестовые сценарии для разработки">
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
