import HowItWorksClient from './HowItWorksClient';

export const metadata = {
  title: "How Premarket Works | Test the Market Before Selling Your Australian Property",
  description: "Learn how Premarket helps Australian homeowners test the market and buyers find off-market properties. Get buyer feedback in 24 hours, access exclusive pre-market listings, and make informed property decisions.",
  keywords: "how premarket works, test property market, off-market process, pre-market listings explained, property market testing australia",
  openGraph: {
    title: "How Premarket Works | Off-Market Property Platform Australia",
    description: "Simple 3-step process for homeowners and buyers to test the market or find exclusive off-market properties across Australia.",
    url: 'https://premarket.homes/how-it-works',
    siteName: 'Premarket',
    locale: 'en_AU',
    type: 'website',
  },
  alternates: {
    canonical: 'https://premarket.homes/how-it-works',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
