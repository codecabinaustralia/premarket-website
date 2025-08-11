'use client';
import { useModal } from '../context/ModalContext';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '../firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import FAQSection from '../components/faq.js';
import PropertyFormModal from '../components/FormBranded';

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
  const { setShowModal } = useModal();
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
      <PropertyFormModal />

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
          <h2 className="text-2xl sm:text-8xl tracking-tight font-bold mb-6">
            We have a secret sauce most sellers never get to try
          </h2>
          <p className="text-xl mb-6 text-teal-600"> Selling your home isn’t just about putting up a listing — it’s about building momentum before you hit the market. That’s why, together with Premarket Australia Pty Ltd, we’re giving you a <strong>free, no-risk premarket campaign</strong> — our gift to you. Your property will be showcased directly to real, motivated buyers without open homes, without spending a cent, and without obligation. The goal? To quietly build interest, uncover genuine buyer intent, and position you for a stronger sale when you decide the time is right. </p>
          <p className="text-base leading-relaxed max-w-2xl mx-auto">
            Add your property below and together we'll test the market.</p>

          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-white px-6 py-8 mt-20 rounded cursor-pointer font-semibold hover:bg-gray-700 transition"
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


          {/* Header Section */}
          <div className="flex flex-wrap mt-20 sm:flex-nowrap sm:items-center justify-center mb-4 sm:mb-0">

            <div className="hidden sm:block text-gray-500 text-xs">
              Powered By
            </div>
            <img
              src="https://firebasestorage.googleapis.com/v0/b/premarket-homes.firebasestorage.app/o/agents%2Fsneakpeek%20(1).png?alt=media&token=54065973-ddba-4be8-9052-b8c4c696337a"
              className="sm:mx-0 w-32 my-6"
              alt="Premarket logo"
            />

          </div>

        </div>
      </div>
    </div>
  );
}
