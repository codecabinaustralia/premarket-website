import BuyersAgentsClient from './BuyersAgentsClient';

export const metadata = {
  title: "For Buyer's Agents — Win Deals Before They're Public | Premarket",
  description:
    "See premarket properties before they hit the portals, submit professional pricing on behalf of clients, and register strong interest to lock in first-mover advantage.",
  keywords: [
    "buyers agent australia",
    "off market property buyers agent",
    "premarket property listings",
    "buyer agent CRM",
    "first mover advantage real estate",
  ],
  alternates: { canonical: 'https://premarket.homes/solutions/buyers-agents' },
  openGraph: {
    title: "For Buyer's Agents — Win Deals Before They're Public | Premarket",
    description:
      "Get clients in front of properties before the rest of the market arrives. Premarket gives buyer's agents the data and access to win.",
    url: 'https://premarket.homes/solutions/buyers-agents',
    type: 'website',
  },
};

export default function BuyersAgentsPage() {
  return <BuyersAgentsClient />;
}
