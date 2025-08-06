'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '../firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import FAQSection from '../components/faq.js';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51Rss7dDcMpgqKXQPB3MThRe6T8ufaYzVfgdICmLxTTlbjvwyJ3GCz3CFQNdpddGJvjzDfSuVCmVg7r9NSo5IdIwm00kBZqWNAu');

const EmbeddedCheckoutWrapper = ({ fetchClientSecret }) => (
  <EmbeddedCheckoutProvider
    stripe={stripePromise}
    options={{ fetchClientSecret }}
  >
    <EmbeddedCheckout />
  </EmbeddedCheckoutProvider>
);

const fetchAgentFromFirestore = async (agentId) => {
  const docRef = doc(db, 'agents', agentId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export default function AgentLanding() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agent');

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    if (!agentId) return;
    const fetchData = async () => {
      try {
        const data = await fetchAgentFromFirestore(agentId);
        if (data) {
          setAgent(data);
        } else {
          console.warn('No agent found for ID:', agentId);
        }
      } catch (error) {
        console.error('Error fetching agent:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [agentId]);

  const handleSubscribe = async (priceId) => {
    try {
      const response = await fetch('https://us-central1-premarket-homes.cloudfunctions.net/api/stripe/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, agentId }),
      });

      const data = await response.json();
      console.log('Stripe session response:', data);

      if (data?.client_secret?.client_secret) {
        const secret = data.client_secret.client_secret;
        setClientSecret(() => () => Promise.resolve(secret));
      } else {
        console.error('❌ No client_secret returned:', data);
      }
    } catch (error) {
      console.error('❌ Subscription error:', error);
    }
  };

  if (loading || !agent) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900"></div>
      </div>
    );
  }

  const {
    logo,
    primaryColor,
    secondaryColor,
    fullName,
    companyName,
    photo,
    website,
    tagline,
  } = agent;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans p-4">
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">

        <div
          className="flex flex-wrap sm:flex-nowrap px-6 items-center justify-center space-x-4 py-10 rounded-lg text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {logo && (
            <Image src={logo} alt="logo" width={160} height={160} className="rounded" unoptimized />
          )}
          <div className="ml-auto flex space-x-3 items-center">
            {photo && (
              <Image
                src={photo}
                alt={fullName}
                width={80}
                height={80}
                className="rounded-full"
                unoptimized
              />
            )}
            <div>
              <h4 className="text-xl font-semibold">{fullName}</h4>
              <h1 className="text-lg">{companyName}</h1>
              <p className="text-xs">{tagline}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center px-6">
          <h1 className="font-bold text-lg">Welcome</h1>
          <h2 className="text-2xl sm:text-7xl font-bold mb-6">
            We have something very valuable for you.
          </h2>
          <p className="text-xl font-bold mb-6">
            We've partnered with Premarket to help you gain confidence before going to market. Access property data, community, and join outreach campaigns to connect with real buyers.
          </p>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto">
            Enjoy community, campaign tools like podcasts, and discounts to services that help you build momentum.
          </p>

          <button
            onClick={() => handleSubscribe('price_1RssKFDcMpgqKXQPBPafZpc6')}
            className="bg-black text-white px-6 py-3 mt-6 rounded-full font-semibold hover:bg-gray-700 transition"
          >
            Get Started by Adding Your Property
          </button>

          {clientSecret && (
            <div className="mt-12">
              <Suspense fallback={<div>Loading checkout...</div>}>
                <EmbeddedCheckoutWrapper fetchClientSecret={clientSecret} />
              </Suspense>
            </div>
          )}

          <h3 className="text-lg sm:text-5xl mt-16 font-semibold" style={{ color: secondaryColor }}>
            Don't get left behind. Join hundreds of Aussie agents already using Premarket.
          </h3>

          <div className="mt-16 text-sm text-gray-500">
            Visit us at{' '}
            <a href={website} target="_blank" rel="noopener noreferrer" className="underline hover:text-black">
              {website}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
