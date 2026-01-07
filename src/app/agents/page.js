// app/agents/page.js
import HeroAgents from '../components/HeroAgents';
import FeaturesAgents from '../components/FeaturesAgents';
import FooterLarge from '../components/FooterLarge';
import TestimonialAgents from '../components/TestimonialsAgents';
import FAQ from '../components/faq';
import Pricing from '../components/Pricing';
import SchemaOrganization from '../components/SchemaOrganization';
import SchemaWebsite from '../components/SchemaWebsite';
import SchemaService from '../components/SchemaService';

export const metadata = {
  title: "Real Estate Agent Leads Australia | Win More Listings with Premarket | Agent Pro",
  description: "Win 10x more listings by offering free premarket campaigns to vendors. Get exclusive seller leads before they hit market. Australian real estate agents using Premarket generate qualified leads and win vendor trust. Start free.",
  keywords: "real estate agent leads, property leads australia, win listings, vendor leads, real estate CRM, premarket campaign, agent marketing tools, listing generation",
  openGraph: {
    title: "Win More Real Estate Listings | Premarket Agent Pro Australia",
    description: "Generate exclusive seller leads and win more listings by offering free premarket campaigns. Used by top Australian agents.",
    url: 'https://premarket.homes/agents',
    siteName: 'Premarket',
    images: [
      {
        url: 'https://premarket.homes/assets/og-image-agents.jpg',
        width: 1200,
        height: 630,
        alt: 'Premarket Agent Pro - Win More Listings',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real Estate Agent Leads | Premarket Agent Pro',
    description: 'Win 10x more listings with free premarket campaigns. Generate qualified vendor leads.',
    images: ['https://premarket.homes/assets/twitter-image-agents.jpg'],
  },
  alternates: {
    canonical: 'https://premarket.homes/agents',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AgentsPage() {
  return (
    <>
      {/* Schema Markup for SEO */}
      <SchemaOrganization />
      <SchemaWebsite />
      <SchemaService />

      <main>
        <HeroAgents />
        <FeaturesAgents />
        <FAQ />
        <TestimonialAgents />
        <Pricing />
      </main>
      <FooterLarge />
    </>
  );
}
