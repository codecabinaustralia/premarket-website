'use client';

import { motion } from 'framer-motion';

export default function AgentFinalCTA() {
  return (
    <section id="demo" className="py-20 lg:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6">
            <span className="block sm:inline">Let Us Show You How This Works —</span>{' '}
            <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
              Properly
            </span>
          </h2>

          <p className="text-xl lg:text-2xl text-slate-300 mb-4 leading-relaxed">
            15 minutes. No pitch deck. Just a live demo of how agents are using Premarket
            to win listings with less resistance and more confidence.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 mt-12"
          >
            <motion.a
              href="https://calendly.com/knockknock-premarket/30min"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-slate-900 bg-gradient-to-r from-orange-400 to-orange-300 rounded-lg shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 transition-all duration-300"
            >
              Book a Demo
              <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                See it live. Ask hard questions. Decide after.
              </p>
              <div className="grid sm:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-orange-400 font-bold text-lg mb-1">No pricing on this call</div>
                  <div className="text-sm text-slate-400">Just value</div>
                </div>
                <div>
                  <div className="text-orange-400 font-bold text-lg mb-1">No pressure</div>
                  <div className="text-sm text-slate-400">Just answers</div>
                </div>
                <div>
                  <div className="text-orange-400 font-bold text-lg mb-1">No commitment</div>
                  <div className="text-sm text-slate-400">Just clarity</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 pt-12 border-t border-white/10"
          >
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent mb-2">
                  500+
                </div>
                <div className="text-slate-400">Properties Listed</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent mb-2">
                  200+
                </div>
                <div className="text-slate-400">Active Agents</div>
              </div>
              <div>
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent mb-2">
                  24hr
                </div>
                <div className="text-slate-400">Avg. First Response</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
