import SolutionsHubClient from './SolutionsHubClient';

export const metadata = {
  title: 'Solutions for Home Owners, Buyers & Buyer\'s Agents | Premarket',
  description:
    'Premarket gives home owners real buyer evidence before they list, buyers early access and price opinions, and buyer\'s agents a first-mover advantage on every campaign.',
  keywords: [
    'premarket property',
    'home owners selling without going to market',
    'buyers early access australia',
    'buyer agent off-market',
    'real estate price opinions',
  ],
  alternates: { canonical: 'https://premarket.homes/solutions' },
  openGraph: {
    title: 'Solutions for Home Owners, Buyers & Buyer\'s Agents | Premarket',
    description:
      'One platform. Three audiences. Real buyer evidence before any property hits the open market.',
    url: 'https://premarket.homes/solutions',
    type: 'website',
  },
};

export default function SolutionsPage() {
  return <SolutionsHubClient />;
}
