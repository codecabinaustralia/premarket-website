import RemindersClient from './RemindersClient';

export const metadata = {
  title: 'Smart Reminders — Re-engage Buyers Automatically | Premarket',
  description:
    'Premarket reminders nudge buyers, follow up on viewings, and keep every campaign moving forward — automatically. Less admin, more deals.',
  keywords: [
    'real estate buyer follow up',
    'automated reminders agent',
    'campaign automation real estate',
    'buyer engagement reminders',
  ],
  alternates: { canonical: 'https://premarket.homes/features/reminders' },
  openGraph: {
    title: 'Smart Reminders | Premarket',
    description:
      'Smart, automated nudges that re-engage buyers and keep every campaign moving.',
    url: 'https://premarket.homes/features/reminders',
    type: 'website',
  },
};

export default function RemindersPage() {
  return <RemindersClient />;
}
