// /app/checkout/return/page.jsx
import { Suspense } from 'react';
import Client from './Client';

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Client />
    </Suspense>
  );
}
