// components/FAQ.js
export default function FAQ() {
  const faqs = [
    {
      question: "Do I need a Form 2, Form 6 or agency agreement?",
      answer: "We recommend getting these as it helps prevent issues and ensures aligned intentions. The beauty of offering Premarket is it's easier to get a 'yes' — you're not asking prospects to commit to any costs upfront.",
      color: "bg-blue-50 border-blue-200",
      icon: "📋"
    },
    {
      question: "Do I need professional photos?",
      answer: "No. Premarket means pre-market — this is before professional photos. We're tapping into the 'real' mindset. We aren't trying to sell during premarket; we're building vendor confidence so they choose you as their agent. Professional photos are optional but not required.",
      color: "bg-purple-50 border-purple-200",
      icon: "📸"
    },
    {
      question: "Do you charge commission or hidden fees?",
      answer: "No hidden costs. We charge a transparent yearly fee — the same cost as a premium listing on major real estate websites. We want this to be a no-brainer, because it is. Our mission is to transform the real estate ecosystem, not maximize profits.",
      color: "bg-green-50 border-green-200",
      icon: "💰"
    },
    {
      question: "How do I start a campaign?",
      answer: "Imagine pitching a free premarket campaign while your competition offers pipe dreams and market reports. The fight is over before it begins. Simply take photos (or use existing ones), add the property to Premarket, and it goes out to our growing buyer network. You'll receive real opinions in real-time.",
      color: "bg-amber-50 border-amber-200",
      icon: "🚀"
    },
    {
      question: "What do I do with registered buyers?",
      answer: "These are serious buyers. As an Agent Pro member, you get access to their contact details. Reporting back with real buyer information is a major win for vendors, giving them confidence to go to market with you.",
      color: "bg-rose-50 border-rose-200",
      icon: "👥"
    },
    {
      question: "How long does a premarket campaign run?",
      answer: "Campaigns typically run for 2-4 weeks, giving you enough time to gauge genuine buyer interest and collect valuable market feedback. You control the timeline and can adjust based on the response you're getting.",
      color: "bg-indigo-50 border-indigo-200",
      icon: "⏱️"
    },
    {
      question: "What makes Premarket different from traditional appraisals?",
      answer: "Traditional appraisals are one agent's opinion. Premarket gives you real buyer interest, actual price opinions, and tangible engagement data. You're walking into the listing presentation with proof, not promises.",
      color: "bg-teal-50 border-teal-200",
      icon: "🎯"
    },
    {
      question: "Can I use Premarket for off-market properties?",
      answer: "Absolutely. Premarket is perfect for testing the market discreetly. Vendors can gauge interest without publicly listing, giving them confidence in pricing and market readiness before making any commitments.",
      color: "bg-cyan-50 border-cyan-200",
      icon: "🔒"
    },
    {
      question: "What information do I get from buyer interactions?",
      answer: "You'll see who viewed the property, price opinions submitted, saved properties, and for Agent Pro members, full contact details of registered buyers. This data becomes your unfair advantage in listing presentations.",
      color: "bg-orange-50 border-orange-200",
      icon: "📊"
    },
    {
      question: "Is there a limit to how many properties I can add?",
      answer: "Agent Basic allows unlimited prospects with 1 live campaign at a time. Agent Pro members can run unlimited campaigns simultaneously, perfect for busy agents managing multiple opportunities.",
      color: "bg-violet-50 border-violet-200",
      icon: "🏘️"
    },
    {
      question: "How quickly can I get started?",
      answer: "Immediately after signing up. The platform is designed for speed — you can have your first campaign live within minutes. No complicated setup, no training required. Just add property details and photos, and you're ready to go.",
      color: "bg-pink-50 border-pink-200",
      icon: "⚡"
    },
    {
      question: "What support do you provide?",
      answer: "We offer onboarding support, campaign optimization tips, and ongoing customer success guidance. For Custom Elite members, you get dedicated account management and team training to maximize your ROI.",
      color: "bg-emerald-50 border-emerald-200",
      icon: "🤝"
    }
  ];

  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-extrabold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg sm:text-xl text-gray-600">
            Everything you need to know about using Premarket to win more listings
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`${faq.color} border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-default`}
            >
              <div className="text-4xl mb-4">{faq.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                {faq.question}
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Footer */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6 text-lg">
            Still have questions?
          </p>
          
           <a href="https://calendly.com/knockknock-premarket/30min?month=2025-08"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-8 rounded-lg transition-colors shadow-md"
          >
            Book a Call with Our Team
          </a>
        </div>
      </div>
    </div>
  );
}