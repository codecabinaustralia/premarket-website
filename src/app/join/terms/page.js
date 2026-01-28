'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { db } from '../../firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51OG4Sx2CS9oaniYak1bfqxMlOlJW90ZhPdSHqnCPZi0VRHvHnZLLZEtdvpNjpzxbT1qJqzPRSqEsRB3qJrOZg6Ol00XqKjxBvZ');

export default function AgentTerms() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState(null);
  const [terms, setTerms] = useState('');
  const [loadingTerms, setLoadingTerms] = useState(true);

  useEffect(() => {
    const storedUid = sessionStorage.getItem('agentSignupUid');
    if (!storedUid) {
      router.push('/join');
      return;
    }
    setUid(storedUid);

    // Fetch terms from Firebase
    const fetchTerms = async () => {
      try {
        const docRef = doc(db, 'settings', 'agentSignup');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().terms) {
          setTerms(docSnap.data().terms);
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
      } finally {
        setLoadingTerms(false);
      }
    };

    fetchTerms();
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
          priceId: 'price_1SuPmF2CS9oaniYaFavP4kMb',
          // priceId: 'price_1Sr6iz2CS9oaniYaYi3Vszci',
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
          <div className="h-80 overflow-y-auto mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700">
            {loadingTerms ? (
              <div className="flex items-center justify-center h-full">
                <svg className="animate-spin w-8 h-8 text-orange-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : terms ? (
              <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-900 prose-h2:text-lg prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-2 prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2 prose-p:text-slate-700 prose-p:leading-relaxed prose-ul:my-2 prose-li:my-1">
                <ReactMarkdown>{terms}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-slate-500">Terms and conditions could not be loaded. Please try again later.</p>
            )}
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
