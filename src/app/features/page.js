import FeaturesHubClient from './FeaturesHubClient';

export const metadata = {
  title: 'Features — Reports, Data Metrics, Reminders, Price Opinions, Agent iPad | Premarket',
  description:
    'Explore everything that makes Premarket the most data-rich way to test, list and sell property in Australia. Live reports, eight PHI metrics, smart reminders, and a purpose-built iPad app.',
  keywords: [
    'premarket features',
    'live vendor report',
    'real estate phi metrics',
    'price opinions software',
    'agent ipad app',
    'real estate data analytics',
  ],
  alternates: { canonical: 'https://premarket.homes/features' },
  openGraph: {
    title: 'Features — Reports, Data Metrics, Reminders & More | Premarket',
    description:
      'A purpose-built data layer for real estate. Reports, metrics, reminders, price opinions and the Agent iPad app.',
    url: 'https://premarket.homes/features',
    type: 'website',
  },
};

export default function FeaturesPage() {
  return <FeaturesHubClient />;
}
