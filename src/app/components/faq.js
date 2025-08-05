'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react'; // optional: for a nice arrow icon (or replace with emoji/icon)

const faqs = [
  {
    question: 'What do I need to do as an agent?',
    answer:
      'Once you sign up, you’ll receive your own unique QR code. Just share it with homeowners you meet. When they scan it and add their property, you’ll be notified. You’ll also get alerts when campaigns start and when buyers show interest. All you need is the Premarket app and your QR code — we handle the rest.',
  },
  {
    question: 'How many buyers do you have?',
    answer:
      'We’re growing a network of serious buyers across Australia — and more are joining daily. Buyers pay to join, which filters out casual browsers. You get access to a curated list of active, ready-to-move buyers.',
  },
  {
    question: 'What happens during a campaign?',
    answer:
      'Every 30 days, we launch a campaign that pushes your prospect’s property to our buyer network. Buyers can view, favourite, ask questions, and even make offers. You stay in control and get notified the moment there’s activity.',
  },
  {
    question: 'Who adds the properties?',
    answer:
      'The homeowner does — via the QR code you give them. They add their property details and images. You can offer help with photos, but the goal is simple: test buyer interest before spending money on full marketing.',
  },
  {
    question: 'Can I use Premarket for my existing pipeline?',
    answer:
      'Yes. It’s perfect for warming up cold leads. Drop them into a campaign and let buyer activity bring them back into the conversation.',
  },
  {
    question: 'Does this replace portals like realestate.com.au or Domain?',
    answer:
      'Nope — Premarket comes before that. It’s pre-market, not a replacement. It helps you validate interest and convert prospects into clients before committing to big portal campaigns.',
  },
  {
    question: 'How does Premarket help me close more listings?',
    answer:
      'By helping prospects dip their toe in without pressure. When they see buyer engagement, they’re far more likely to move forward — and you’re already their trusted agent.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="max-w-4xl mx-auto px-6 py-20">
      <h2 className="text-4xl font-bold text-center mb-12">FAQs for Agents</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md transition-all duration-300 overflow-hidden"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between text-left p-6 text-lg font-medium text-gray-900"
            >
              {faq.question}
              <ChevronDown
                className={`w-5 h-5 transform transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`px-6 pb-6 text-gray-700 transition-all duration-300 ${
                openIndex === index ? 'block' : 'hidden'
              }`}
            >
              {faq.answer}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
