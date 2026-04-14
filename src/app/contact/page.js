import ContactClient from './ContactClient';

export const metadata = {
  title: 'Contact Premarket — Sales, Support & General Enquiries',
  description:
    "Talk to the Premarket team. Sales, support and general enquiries — we'll get back to you within one business day. Or email knockknock@premarket.homes directly.",
  keywords: ['contact premarket', 'premarket support', 'premarket sales'],
  alternates: { canonical: 'https://premarket.homes/contact' },
  openGraph: {
    title: 'Contact Premarket',
    description: "We'll get back to you within one business day.",
    url: 'https://premarket.homes/contact',
    type: 'website',
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
