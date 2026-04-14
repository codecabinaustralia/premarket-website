import PriceOpinionsClient from './PriceOpinionsClient';

export const metadata = {
  title: 'Price Opinions — Anonymous Buyer Pricing | Premarket',
  description:
    'Aggregate anonymous price opinions from real buyers into a clear, trustworthy market signal. The most polite negotiation tool ever invented for real estate.',
  keywords: [
    'real estate price opinions',
    'anonymous buyer pricing',
    'crowdsourced property valuation',
    'real estate negotiation tool',
    'buyer feedback platform',
  ],
  alternates: { canonical: 'https://premarket.homes/features/price-opinions' },
  openGraph: {
    title: 'Price Opinions | Premarket',
    description:
      'Anonymous buyer pricing aggregated into a clear market signal. Real evidence, not opinions.',
    url: 'https://premarket.homes/features/price-opinions',
    type: 'website',
  },
};

export default function PriceOpinionsPage() {
  return <PriceOpinionsClient />;
}
