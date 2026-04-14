import DataMetricsClient from './DataMetricsClient';

export const metadata = {
  title: 'PHI Data Metrics — Eight Live Indicators per Suburb | Premarket',
  description:
    'The Premarket Health Indicators (PHI) are eight live, real-time scores that quantify a suburb the way Bloomberg quantifies a stock — buyer demand, seller motivation, price realism and more.',
  keywords: [
    'premarket health indicators',
    'phi metrics real estate',
    'real estate data analytics australia',
    'suburb scoring',
    'bloomberg for property',
    'live property data',
  ],
  alternates: { canonical: 'https://premarket.homes/features/data-metrics' },
  openGraph: {
    title: 'PHI Data Metrics — Eight Live Indicators per Suburb | Premarket',
    description:
      'A Bloomberg terminal for residential property — built from real buyer evidence, not historical settlements.',
    url: 'https://premarket.homes/features/data-metrics',
    type: 'website',
  },
};

export default function DataMetricsPage() {
  return <DataMetricsClient />;
}
