// app/page.js - Agent-Focused Homepage
import Nav from './components/Nav';
import AgentHero from './components/AgentHero';
import AgentProblem from './components/AgentProblem';
import AgentSolution from './components/AgentSolution';
import AgentHowItWorks from './components/AgentHowItWorks';
import AgentReframe from './components/AgentReframe';
import AgentTestimonials from './components/AgentTestimonials';
import AgentAIImageEditing from './components/AgentAIImageEditing';
import AgentGuarantee from './components/AgentGuarantee';
import AgentFinalCTA from './components/AgentFinalCTA';
import StickyCTA from './components/StickyCTA';
import AgentFooter from './components/AgentFooter';
import SchemaOrganization from './components/SchemaOrganization';
import SchemaWebsite from './components/SchemaWebsite';

export const metadata = {
  title: "Premarket - Win More Listings with Pre-Market Campaigns | Real Estate Agents Australia",
  description: "Stop asking for marketing money before earning trust. Premarket gives agents unlimited premarket campaigns to gather buyer feedback, build authority, and win listings faster. Built for agents, by agents.",
  keywords: "premarket for agents, real estate agent tools, win more listings, pre-market campaigns, buyer feedback, listing tool australia, agent platform, real estate technology",
  openGraph: {
    title: "Win More Listings with Premarket | Built for Real Estate Agents",
    description: "Offer vendors unlimited premarket campaigns. Collect real buyer feedback. Walk into conversations with proof, not promises. The pre-market system agents have been missing.",
    url: 'https://premarket.homes',
    siteName: 'Premarket',
    images: [
      {
        url: 'https://premarket.homes/assets/og-image-agents.jpg',
        width: 1200,
        height: 630,
        alt: 'Premarket - Win More Listings',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Premarket - Win More Listings with Pre-Market Campaigns',
    description: 'The pre-market system built exclusively for real estate agents. Build trust faster, win listings easier.',
    images: ['https://premarket.homes/assets/twitter-image-agents.jpg'],
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

// FAQ data for Schema markup - Agent focused
const agentFAQs = [
  {
    question: "How does Premarket help agents win more listings?",
    answer: "Premarket gives agents unlimited premarket campaigns to offer vendors before asking for marketing spend. You collect real buyer feedback and price opinions, then return with data and proof—not just promises. This builds trust faster and reduces vendor resistance, helping you secure more listings."
  },
  {
    question: "How long does it take to set up a pre-market campaign?",
    answer: "Adding a property to Premarket takes about 30 seconds. You can do it before your appraisal meeting or even during the meeting itself. The platform is designed to be fast and effortless for busy agents."
  },
  {
    question: "What kind of buyer feedback do agents receive?",
    answer: "Agents receive anonymous price opinions from real buyers, registered interest from qualified prospects, and detailed engagement metrics. This data gives you concrete evidence of market interest to share with vendors."
  },
  {
    question: "Is Premarket really free for agents?",
    answer: "Yes — Premarket is 100% free for every agent. There are no subscription fees, no credit card required, and no limits on campaigns. Sign up in seconds and start running premarket campaigns immediately."
  }
];

export default function Home() {
  return (
    <>
      {/* Schema Markup for SEO */}
      <SchemaOrganization />
      <SchemaWebsite />

      {/* Agent-focused FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": agentFAQs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })
        }}
      />

      {/* Software Application Schema for Agents */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Premarket - Agent Platform",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web, iOS, Android",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "AUD",
              "description": "Unlimited premarket campaigns for real estate agents"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "127",
              "bestRating": "5",
              "worstRating": "1"
            },
            "description": "Pre-market campaign platform for Australian real estate agents. Win more listings by offering unlimited premarket campaigns that collect buyer feedback and build vendor trust."
          })
        }}
      />

      <Nav isHomepage={true} />

      <main>
        <AgentHero />
        <AgentProblem />
        <AgentSolution />
        <AgentHowItWorks />
        <AgentReframe />
        <AgentTestimonials />
        <AgentAIImageEditing />
        <AgentGuarantee />
        <AgentFinalCTA />
      </main>

      <StickyCTA />
      <AgentFooter />
    </>
  );
}
