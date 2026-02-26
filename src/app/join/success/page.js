'use client';

import { useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

function SuccessContent() {
  useEffect(() => {
    // Clear session storage on success
    sessionStorage.removeItem('agentSignupUid');
  }, []);

  return (
    <>
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/30"
      >
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
        Welcome to Premarket
      </h1>
      <p className="text-xl text-slate-600 mb-8">
        Your free account is ready to go
      </p>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-2xl p-6 mb-8 border border-slate-200">
        <h3 className="font-bold text-slate-900 mb-3">You&apos;re all set!</h3>
        <p className="text-slate-600 mb-4">
          Download the Premarket app to start creating pre-market campaigns and winning more listings.
        </p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Unlimited pre-market campaigns
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Real buyer price opinions
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Qualified buyer lead capture
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Full access — always free
          </li>
        </ul>
      </div>

      {/* Download Section */}
      <h3 className="font-bold text-slate-900 mb-4 text-lg">
        Download the App to Get Started
      </h3>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        {/* iOS */}
        <motion.a
          href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <div className="text-left">
            <div className="text-xs opacity-80">Download on the</div>
            <div className="text-lg font-semibold">App Store</div>
          </div>
        </motion.a>

        {/* Android */}
        <motion.a
          href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
          </svg>
          <div className="text-left">
            <div className="text-xs opacity-80">Get it on</div>
            <div className="text-lg font-semibold">Google Play</div>
          </div>
        </motion.a>
      </div>

      {/* Help */}
      <p className="text-sm text-slate-500">
        Need help getting started?{' '}
        <a href="mailto:support@premarket.homes" className="text-orange-600 hover:underline">
          Contact Support
        </a>
      </p>
    </>
  );
}

export default function AgentSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg text-center"
      >
        {/* Logo */}
        <Image
          src="https://premarketvideos.b-cdn.net/assets/logo.png"
          alt="Premarket"
          width={150}
          height={38}
          className="mx-auto mb-8"
          unoptimized
        />

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-8 h-8 text-orange-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          }>
            <SuccessContent />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
