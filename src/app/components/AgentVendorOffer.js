'use client';

import { motion } from 'framer-motion';

export default function AgentVendorOffer() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-emerald-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-emerald-500/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Vendor-Paid Option
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            <span className="block">$200 Pre-Market Campaign.</span>
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              The Easiest Yes You&apos;ll Ever Get.
            </span>
          </h2>
          <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
            Vendors are used to being asked for $5,000–$15,000 in marketing before a single buyer walks through the door.
            This is a different conversation entirely.
          </p>
        </motion.div>

        {/* Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Old way */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-400">The old conversation</h3>
            </div>
            <div className="space-y-4 text-slate-300">
              <p>&ldquo;We need $8,000 for a marketing campaign before we list...&rdquo;</p>
              <p>&ldquo;That covers REA, Domain, brochures, photography...&rdquo;</p>
              <p>&ldquo;No guarantees, but it&apos;s what the market expects...&rdquo;</p>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-red-400 font-semibold">Result: Vendor hesitates. Shops around. Lists with someone cheaper.</p>
            </div>
          </motion.div>

          {/* New way */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-emerald-500/10 backdrop-blur-sm rounded-2xl p-8 border border-emerald-500/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-emerald-400">The new conversation</h3>
            </div>
            <div className="space-y-4 text-slate-200">
              <p>&ldquo;Before we spend a cent on marketing, let&apos;s test the market.&rdquo;</p>
              <p>&ldquo;For $200, we run a pre-market campaign. Real buyers. Real opinions.&rdquo;</p>
              <p>&ldquo;You&apos;ll see exactly what the market thinks before committing to anything.&rdquo;</p>
            </div>
            <div className="mt-6 pt-6 border-t border-emerald-500/20">
              <p className="text-sm text-emerald-400 font-semibold">Result: Vendor says yes immediately. You win the listing. They feel smart.</p>
            </div>
          </motion.div>
        </div>

        {/* Value props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16"
        >
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Instant credibility',
                desc: 'You\'re not asking for money — you\'re offering a $200 market test. That\'s a completely different conversation.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                title: 'Data before decisions',
                desc: 'The vendor gets buyer opinions, interest levels, and market feedback before spending thousands on a full campaign.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                ),
                title: '$200 vs $10,000+',
                desc: 'A fraction of the cost. Zero risk. And if the numbers look good, the vendor is already sold on going to market with you.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white mb-4">
                  {item.icon}
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-8 lg:p-12 shadow-2xl shadow-emerald-500/20 max-w-3xl mx-auto">
            <p className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Think about it from the vendor&apos;s side.
            </p>
            <p className="text-lg text-white/90 leading-relaxed mb-8">
              &ldquo;For $200, you&apos;ll know what real buyers think your home is worth — before you commit to anything.&rdquo;
              <br />
              <span className="text-emerald-200 font-semibold">That&apos;s not a cost. That&apos;s a no-brainer.</span>
            </p>
            <motion.a
              href="/join"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-emerald-900 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Offering This to Vendors
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
