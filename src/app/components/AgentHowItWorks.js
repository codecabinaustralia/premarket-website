'use client';

import { motion } from 'framer-motion';

export default function AgentHowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Add the Property',
      description: 'Before your appraisal — or during the meeting itself. Takes 30 seconds.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      number: '02',
      title: 'Offer Unlimited Premarket Campaigns',
      description: 'Instead of asking for $3,000 in marketing spend, you offer something that costs the vendor nothing. Watch their resistance disappear.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      number: '03',
      title: 'Buyers Submit Price Opinions and Interest',
      description: 'Real buyers from a verified network see the property. They tell you what they\'d pay. They register genuine interest.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      number: '04',
      title: 'Return With Proof, Not Promises',
      description: 'You walk back into the conversation with data: price feedback, buyer interest, real momentum.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-green-500 to-green-600'
    },
    {
      number: '05',
      title: 'Vendor Commits With Confidence',
      description: 'They\'ve seen what you can do. They trust you. The listing is yours.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      gradient: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, rgb(0 0 0) 1px, transparent 0)`,
        backgroundSize: '48px 48px'
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            <span className="block sm:inline">How Agents Use Premarket to</span>{' '}
            <span className="bg-gradient-to-r from-[#e48900] to-[#c64500] bg-clip-text text-transparent">
              Win Listings Earlier
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            A proven process that turns skeptical vendors into confident clients
          </p>
        </motion.div>

        <div className="space-y-8 lg:space-y-12 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                {/* Number and Icon */}
                <div className="flex-shrink-0 flex items-center gap-4">
                  <div className="text-6xl lg:text-7xl font-bold text-slate-100">
                    {step.number}
                  </div>
                  <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white shadow-lg`}>
                    {step.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white rounded-xl p-6 lg:p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300">
                  <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute left-[88px] top-[100px] w-0.5 h-[calc(100%+3rem)] bg-gradient-to-b from-slate-200 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom emphasis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-br from-slate-50 to-orange-50/50 rounded-2xl p-8 lg:p-12 border border-slate-200">
            <p className="text-2xl lg:text-3xl font-bold text-slate-900 text-center mb-4">
              This isn&apos;t more work.
            </p>
            <p className="text-xl lg:text-2xl text-slate-700 text-center leading-relaxed">
              It replaces the work you already hate doing — the awkward follow-ups,
              the &quot;any update?&quot; calls, the slow death of a vendor who ghosted you.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
