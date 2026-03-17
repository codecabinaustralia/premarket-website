'use client';

import { motion } from 'framer-motion';

export default function AgentIPadOpenHomes() {
  const stats = [
    { value: '73%', label: 'of vendors overprice their property at first listing', source: 'CoreLogic 2024' },
    { value: '44%', label: 'of overpriced listings require a price reduction before selling', source: 'Domain Research' },
    { value: '2.3x', label: 'longer on market when initially overpriced vs correctly priced', source: 'REA Group Data' },
  ];

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-orange-500/5 to-yellow-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            iPad at Open Homes
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            <span className="block">Stop Having the Awkward</span>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Price Conversation
            </span>
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Top agents are handing buyers the iPad at open homes and events.
            Instead of telling the vendor their price is too high,{' '}
            <span className="font-semibold text-slate-900">they let the market do it for them.</span>
          </p>
        </motion.div>

        {/* iPad mockup + explanation */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
          {/* Left — iPad visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative mx-auto max-w-md">
              {/* iPad frame */}
              <div className="bg-slate-900 rounded-[2rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[1.5rem] overflow-hidden">
                  {/* Screen content */}
                  <div className="p-5">
                    {/* Mini header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <span className="font-bold text-slate-900 text-sm">Premarket</span>
                    </div>
                    {/* Property card */}
                    <div className="bg-slate-100 rounded-xl h-28 mb-3 flex items-center justify-center">
                      <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 mb-1">42 Harbour Street, Mosman</p>
                    <p className="text-[10px] text-slate-500 mb-4">4 bed &middot; 3 bath &middot; 2 car</p>

                    {/* Price opinion prompt */}
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 mb-3">
                      <p className="text-xs font-bold text-slate-900 mb-2">What do you think this property is worth?</p>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white rounded-lg px-3 py-2 border border-orange-200">
                          <p className="text-[10px] text-slate-400">Your opinion</p>
                          <p className="text-sm font-bold text-slate-900">$2,850,000</p>
                        </div>
                        <button className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg">
                          Submit
                        </button>
                      </div>
                    </div>

                    {/* Mini stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-slate-900">24</p>
                        <p className="text-[9px] text-slate-500">Opinions</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-orange-600">$2.7M</p>
                        <p className="text-[9px] text-slate-500">Median</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-slate-900">8</p>
                        <p className="text-[9px] text-slate-500">Interested</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Home button */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-600 rounded-full" />
            </div>
          </motion.div>

          {/* Right — How it works */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              Hand them the iPad. Let the data do the talking.
            </h3>

            <div className="space-y-6">
              {[
                {
                  step: '1',
                  title: 'Buyer walks through the open home',
                  desc: 'They love the kitchen, check out the backyard, open every cupboard. The usual.',
                },
                {
                  step: '2',
                  title: 'You hand them the iPad before they leave',
                  desc: '"Before you go — what do you reckon this place is worth?" Takes 10 seconds.',
                },
                {
                  step: '3',
                  title: 'Opinions stack up. The truth emerges.',
                  desc: 'After 20+ opinions, you have a data-backed median price. Not your opinion — the market\'s.',
                },
                {
                  step: '4',
                  title: 'You walk into the vendor meeting with proof',
                  desc: '"24 buyers came through. The median opinion is $2.7M." No awkward conversation. Just facts.',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-slate-600 text-sm mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">
            The overpricing problem is real
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center"
              >
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-700 font-medium mb-2">{stat.label}</p>
                <p className="text-xs text-slate-400">{stat.source}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 lg:p-10 shadow-2xl text-center text-white">
            <p className="text-xl lg:text-2xl font-bold mb-3">
              You&apos;re not the bad guy anymore.
            </p>
            <p className="text-lg text-white/90 leading-relaxed max-w-2xl mx-auto">
              You didn&apos;t say their price was too high. 24 real buyers did.
              That&apos;s not your opinion — it&apos;s market evidence. And that changes every vendor conversation you&apos;ll ever have.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
