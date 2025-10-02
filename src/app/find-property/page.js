import { Suspense } from 'react';
import PropertyPageClient from '../../components/PropertyPageClient';

export default function FindPropertyPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading property...</div>}>
      <PropertyPageClient />
    </Suspense>
  );
}