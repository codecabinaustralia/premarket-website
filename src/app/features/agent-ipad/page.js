import AgentIpadClient from './AgentIpadClient';

export const metadata = {
  title: 'Agent iPad App — Capture Buyer Feedback in the Field | Premarket',
  description:
    'A purpose-built iPad app for real estate agents. Capture buyer price opinions, feedback and contact details right at the open home — and watch your campaign data update in real time.',
  keywords: [
    'real estate ipad app',
    'agent ipad app australia',
    'open home feedback ipad',
    'real estate field app',
    'premarket agent app',
  ],
  alternates: { canonical: 'https://premarket.homes/features/agent-ipad' },
  openGraph: {
    title: 'Agent iPad App | Premarket',
    description:
      'Capture buyer feedback in the field. Built for the open home, the appraisal, and everywhere in between.',
    url: 'https://premarket.homes/features/agent-ipad',
    type: 'website',
  },
};

export default function AgentIpadPage() {
  return <AgentIpadClient />;
}
