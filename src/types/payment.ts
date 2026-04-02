export interface OrderItem {
  name: string;
  price: number;
}

export interface OrderSummary {
  items: OrderItem[];
  fee: number;
  currency: string;
}

export interface PaymentFormData {
  cardHolder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  email: string;
  termsAccepted: boolean;
}

export interface PaymentRequest {
  cardHolder: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  email: string;
  amount: number;
  currency: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: 'success' | 'declined' | 'error';
  message: string;
}

export type FormStatus = 'idle' | 'loading' | 'success' | 'error';
