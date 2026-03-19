// app/v2/page.js - Homepage V2: Price Education backed by data
import Nav from '../components/Nav';
import HomepageV2 from '../components/HomepageV2';
import StickyCTA from '../components/StickyCTA';
import AgentFooter from '../components/AgentFooter';
import SchemaOrganization from '../components/SchemaOrganization';
import SchemaWebsite from '../components/SchemaWebsite';

export const metadata = {
  title: "Premarket - Price Education Backed by Data | Real Estate Agents Australia",
  description: "Stop guessing what a property is worth. Premarket gives agents real buyer price opinions so you can educate sellers with evidence, not opinions. The only platform with live buyer data.",
  keywords: "price education, real estate data, buyer price opinions, listing tool australia, agent platform, real estate technology, property valuation, buyer feedback",
  openGraph: {
    title: "Price Education Backed by Data | Premarket",
    description: "A home is worth what a buyer would pay. Not what the house across the street sold for 2 months ago. Get real buyer data before your next listing conversation.",
    url: 'https://premarket.homes/v2',
    siteName: 'Premarket',
    images: [
      {
        url: 'https://premarket.homes/assets/og-image-agents.jpg',
        width: 1200,
        height: 630,
        alt: 'Premarket - Price Education Backed by Data',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  alternates: {
    canonical: 'https://premarket.homes/v2',
  },
  robots: {
    index: false,
    follow: false,
  },
};

const agentFAQs = [
  {
    question: "How does Premarket help agents educate sellers on price?",
    answer: "Premarket collects real price opinions from actual buyers. Instead of walking into a vendor meeting with comparable sales and your professional opinion, you walk in with live buyer data — what buyers would genuinely pay for the property. The pricing conversation shifts from your opinion vs their expectation to evidence."
  },
  {
    question: "How is Premarket different from CoreLogic or Pricefinder?",
    answer: "CoreLogic and Pricefinder use historical settlement data to estimate current values — they look backward. Premarket captures what buyers would pay right now, directly from the buyers themselves. It's forward-looking, real-time, and sourced from actual market participants rather than statistical models."
  },
  {
    question: "How long does it take to set up a campaign?",
    answer: "About 2 minutes. Add the property, upload phone photos (our AI enhances them), and share the link to your buyer network. You can do it before your appraisal meeting or even during the meeting itself."
  },
  {
    question: "Is Premarket free for agents?",
    answer: "Yes — Premarket is 100% free for every agent. No subscription fees, no credit card required, and no limits on campaigns. Vendors pay a small $200 campaign fee for the market intelligence report."
  }
];

export default function HomeV2() {
  return (
    <>
      <SchemaOrganization />
      <SchemaWebsite />

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

      <Nav isHomepage={true} />

      <main>
        <HomepageV2 />
      </main>

      <StickyCTA />
      <AgentFooter />
    </>
  );
}
