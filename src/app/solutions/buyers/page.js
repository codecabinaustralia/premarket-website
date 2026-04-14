import BuyersClient from './BuyersClient';

export const metadata = {
  title: 'For Buyers — Early Access, Price Opinions & Smart Alerts | Premarket',
  description:
    'Save the homes you love, share an honest price opinion, and get notified the moment new properties — including premarket exclusives — hit the platform.',
  keywords: [
    'early access property listings australia',
    'premarket properties',
    'buyer price opinions',
    'house hunting australia',
    'register interest property',
    'off market home buyers',
  ],
  alternates: { canonical: 'https://premarket.homes/solutions/buyers' },
  openGraph: {
    title: 'For Buyers — Early Access & Real Price Opinions | Premarket',
    description:
      'Get notified the moment new properties hit the platform — including premarket exclusives you won\'t find on the portals.',
    url: 'https://premarket.homes/solutions/buyers',
    type: 'website',
  },
};

export default function BuyersPage() {
  return <BuyersClient />;
}
