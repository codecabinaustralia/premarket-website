// app/page.js
import Hero from './components/Hero';
import Features from './components/Features';
import FooterLarge from './components/FooterLarge';
import Testimonials from './components/Testimonials';
import FAQHomeOwners from './components/FAQHomeOwners';
import SchemaOrganization from './components/SchemaOrganization';
import SchemaWebsite from './components/SchemaWebsite';
import SchemaFAQ from './components/SchemaFAQ';
import SchemaMobileApp from './components/SchemaMobileApp';

export const metadata = {
  title: "Premarket - Test the Market Before Selling Your Home | Free Property Valuation Australia",
  description: "Get real buyer feedback and price opinions before listing your property. Free premarket campaign for Australian homeowners. No agent fees, no open homes, no risk. Test the market in 24 hours.",
  keywords: "premarket, off market property, test the market, property price opinion, sell property australia, free property listing, buyer feedback, premarket homes",
  openGraph: {
    title: "Test the Market Before Selling Your Home | Premarket Australia",
    description: "Free premarket campaigns for Australian homeowners. Get genuine buyer interest and price opinions before committing to an agent.",
    url: 'https://premarket.homes',
    siteName: 'Premarket',
    images: [
      {
        url: 'https://premarket.homes/assets/og-image-homeowners.jpg',
        width: 1200,
        height: 630,
        alt: 'Premarket - Test Your Property Market Value',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Test the Market Before Selling | Premarket Australia',
    description: 'Get real buyer feedback on your property before listing. Free, no obligation.',
    images: ['https://premarket.homes/assets/twitter-image-homeowners.jpg'],
  },
  alternates: {
    canonical: 'https://premarket.homes',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// FAQ data for Schema markup
const homeownerFAQs = [
  {
    question: "Is there any cost to list my property on Premarket?",
    answer: "No. Premarket is 100% free for Australian homeowners. There are no listing fees, no marketing costs, and no obligation to sell. You can test the market risk-free."
  },
  {
    question: "How long does it take to get buyer feedback?",
    answer: "Most Australian homeowners start receiving genuine price opinions from buyers within 24-48 hours of creating their free premarket listing."
  },
  {
    question: "What happens after I receive buyer feedback on my property?",
    answer: "You're in complete control. Use the real buyer feedback and price opinions to decide if you want to list with an agent, pursue a private sale, or stay in your home. There's absolutely no pressure or obligation."
  },
  {
    question: "Do I need professional photos to list on Premarket?",
    answer: "No. You can take your own photos and list your Australian property in minutes. Many homeowners successfully test the market without professional photography."
  }
];

export default function Home() {
  return (
    <>
      {/* Schema Markup for SEO */}
      <SchemaOrganization />
      <SchemaWebsite />
      <SchemaFAQ faqs={homeownerFAQs} />
      <SchemaMobileApp />

      <main>
        <Hero />
        <Features />
        <FAQHomeOwners />
        <Testimonials />
      </main>
      <FooterLarge />
    </>
  );
}
