// app/buyers/page.js
import HeroBuyers from '../components/HeroBuyers';
import FeaturesBuyers from '../components/FeaturesBuyers';
import FooterLarge from '../components/FooterLarge';
import Testimonials from '../components/Testimonials';
import StatBox from '../components/Stats';
import SchemaOrganization from '../components/SchemaOrganization';
import SchemaWebsite from '../components/SchemaWebsite';

export const metadata = {
  title: "Off-Market Properties Australia | Exclusive Access to Pre-Market Listings | Premarket",
  description: "Find exclusive off-market properties across Australia before they hit realestate.com.au or Domain. Get early access to pre-market listings in Sydney, Melbourne, Brisbane & more. Free for buyers.",
  keywords: "off market properties australia, pre-market listings, exclusive property listings, private property sales, off-market properties sydney, off-market properties melbourne, properties before market",
  openGraph: {
    title: "Find Off-Market Properties Before Anyone Else | Premarket Australia",
    description: "Access exclusive pre-market property listings across Australia. See properties before they go public on major real estate sites.",
    url: 'https://premarket.homes/buyers',
    siteName: 'Premarket',
    images: [
      {
        url: 'https://premarket.homes/assets/og-image-buyers.jpg',
        width: 1200,
        height: 630,
        alt: 'Exclusive Off-Market Properties in Australia',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Off-Market Properties Australia | Premarket',
    description: 'Access exclusive pre-market listings before they hit the major sites. Free for buyers.',
    images: ['https://premarket.homes/assets/twitter-image-buyers.jpg'],
  },
  alternates: {
    canonical: 'https://premarket.homes/buyers',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BuyersPage() {
  return (
    <>
      {/* Schema Markup for SEO */}
      <SchemaOrganization />
      <SchemaWebsite />

      <main>
        <HeroBuyers />
        <FeaturesBuyers />
        <StatBox />
        <Testimonials />
      </main>
      <FooterLarge />
    </>
  );
}
