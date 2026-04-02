import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckoutPage } from '@/pages/CheckoutPage';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <CheckoutPage />
  </StrictMode>
);
