'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51OG4Sx2CS9oaniYak1bfqxMlOlJW90ZhPdSHqnCPZi0VRHvHnZLLZEtdvpNjpzxbT1qJqzPRSqEsRB3qJrOZg6Ol00XqKjxBvZ');

export default function AgentTerms() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const storedUid = sessionStorage.getItem('agentSignupUid');
    if (!storedUid) {
      router.push('/join');
      return;
    }
    setUid(storedUid);
  }, [router]);

  const handleContinue = async () => {
    if (!accepted || !uid) return;

    setLoading(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          priceId: 'price_1Sr6iz2CS9oaniYaYi3Vszci',
        }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        console.error('Checkout error:', error);
        alert('Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        console.error('Stripe error:', stripeError);
        alert('Payment redirect failed. Please try again.');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          {/* <Image
            src="https://premarket.homes/assets/logo.png"
            alt="Premarket"
            width={180}
            height={45}
            className="mx-auto mb-6"
            unoptimized
          /> */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Terms & Conditions
          </h1>
          <p className="text-slate-400 text-lg">
            Please review and accept to continue
          </p>
        </div>

        {/* Terms Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Terms Content */}
          <div className="h-80 overflow-y-auto mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 space-y-4">
            <h3 className="font-bold text-slate-900">Premarket Agent Pro Subscription Agreement</h3>

            <p>
              By subscribing to Premarket Agent Pro, you agree to the following terms:
            </p>

            <h4 className="font-semibold text-slate-900 mt-4">1. Subscription Service</h4>
            <p>
              Your subscription provides access to Premarket&apos;s agent tools, including unlimited pre-market campaigns,
              buyer feedback collection, and lead management features. The subscription is billed monthly and
              renews automatically until cancelled.
            </p>

            <h4 className="font-semibold text-slate-900 mt-4">2. Payment Terms</h4>
            <p>
              Payment is processed securely through Stripe. Your subscription will automatically renew each month.
              You may cancel at any time through your account settings or by contacting support.
            </p>

            <h4 className="font-semibold text-slate-900 mt-4">3. Refund Policy</h4>
            <p>
              We offer a satisfaction guarantee. If Premarket doesn&apos;t add measurable value to your listing
              conversations within the first 30 days, contact us for a full refund.
            </p>

            <h4 className="font-semibold text-slate-900 mt-4">4. Acceptable Use</h4>
            <p>
              You agree to use Premarket in accordance with all applicable laws and regulations.
              You will not misuse the platform, share your credentials, or engage in any activity
              that could harm other users or the platform.
            </p>

            <h4 className="font-semibold text-slate-900 mt-4">5. Data & Privacy</h4>
            <p>
              We collect and process data as described in our Privacy Policy. By using Premarket,
              you consent to this data collection and processing. We take your privacy seriously
              and implement industry-standard security measures.
            </p>

            <h4 className="font-semibold text-slate-900 mt-4">6. Intellectual Property</h4>
            <p>
              All content, features, and functionality of Premarket are owned by Premarket Australia
              and are protected by intellectual property laws. You are granted a limited license
              to use the platform for your real estate business.
            </p>

            <h4 className="font-semibold text-slate-900 mt-4">7. Limitation of Liability</h4>
            <p>
              Premarket is provided &quot;as is&quot; without warranties of any kind. We are not liable
              for any indirect, incidental, or consequential damages arising from your use of the platform.
            </p>

            <h4 className="font-semibold text-slate-900 mt-4">8. Changes to Terms</h4>
            <p>
              We may update these terms from time to time. Continued use of Premarket after changes
              constitutes acceptance of the new terms.
            </p>

            <p className="mt-6 text-slate-500">
              For the full Terms & Conditions, please visit{' '}
              <a href="/terms" target="_blank" className="text-orange-600 hover:underline">
                premarket.homes/terms
              </a>
            </p>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-4 cursor-pointer mb-8 p-4 rounded-xl border-2 border-slate-200 hover:border-orange-300 transition-colors">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-slate-700">
              I have read and agree to the{' '}
              <a href="/terms" target="_blank" className="text-orange-600 hover:underline font-medium">
                Terms & Conditions
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" className="text-orange-600 hover:underline font-medium">
                Privacy Policy
              </a>
            </span>
          </label>

          {/* Continue Button */}
          <motion.button
            onClick={handleContinue}
            disabled={!accepted || loading}
            whileHover={{ scale: !accepted || loading ? 1 : 1.02 }}
            whileTap={{ scale: !accepted || loading ? 1 : 0.98 }}
            className="w-full py-5 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-bold text-xl rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Redirecting to Payment...
              </span>
            ) : (
              'Continue to Payment'
            )}
          </motion.button>

          <p className="text-center text-sm text-slate-500 mt-4">
            Secure payment powered by Stripe
          </p>
        </div>
      </motion.div>
    </div>
  );
}
