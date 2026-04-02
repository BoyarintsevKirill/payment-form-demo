import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './FormField.module.css';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, icon, id, className, ...inputProps }, ref) => {
    const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${fieldId}-error`;

    return (
      <div className={`${styles.field} ${className ?? ''}`}>
        <label className={styles.label} htmlFor={fieldId}>
          {label}
        </label>
        <div className={`${styles.inputWrapper} ${error ? styles.inputError : ''}`}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input
            ref={ref}
            id={fieldId}
            className={styles.input}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...inputProps}
          />
        </div>
        {error && (
          <p className={styles.error} id={errorId} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
