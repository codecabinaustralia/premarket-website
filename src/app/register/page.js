import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={<div>Loading checkout...</div>}>
      <CheckoutClient />
    </Suspense>
  );
}
