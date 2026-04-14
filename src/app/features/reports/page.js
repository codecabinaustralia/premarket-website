import ReportsClient from './ReportsClient';

export const metadata = {
  title: 'Live Vendor Reports — Built from Real Buyer Evidence | Premarket',
  description:
    'Premarket reports update in real time as buyers engage with a property. Price distribution, demand signals, engagement velocity — all in one beautifully formatted document you can share with vendors.',
  keywords: [
    'live vendor report',
    'property sales report',
    'real estate dashboard',
    'vendor reporting australia',
    'buyer feedback report',
  ],
  alternates: { canonical: 'https://premarket.homes/features/reports' },
  openGraph: {
    title: 'Live Vendor Reports | Premarket',
    description:
      'Reports built from real buyer evidence — auto-updating, beautifully formatted, ready to share.',
    url: 'https://premarket.homes/features/reports',
    type: 'website',
  },
};

export default function ReportsPage() {
  return <ReportsClient />;
}
