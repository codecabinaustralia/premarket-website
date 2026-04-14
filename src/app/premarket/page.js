import PremarketExplainerClient from './PremarketExplainerClient';

export const metadata = {
  title: 'What is Premarket? — Real Buyer Evidence Before You List | Premarket',
  description:
    'Premarket is how Australian property gets sold without open homes, expensive photography or guesswork. We collect real, anonymous buyer evidence before a single dollar of marketing is spent.',
  keywords: [
    'what is premarket',
    'premarket australia',
    'sell house without open homes',
    'no photography property selling',
    'real buyer feedback',
    'private home sale australia',
  ],
  alternates: { canonical: 'https://premarket.homes/premarket' },
  openGraph: {
    title: 'What is Premarket? | Premarket',
    description:
      'No open homes. No photography first. Just real buyer evidence before you commit to selling.',
    url: 'https://premarket.homes/premarket',
    type: 'website',
  },
};

export default function PremarketPage() {
  return <PremarketExplainerClient />;
}
