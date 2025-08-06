'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '../../firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function CheckoutReturn() {
  const [status, setStatus] = useState('checking');
  const [email, setEmail] = useState(null);
  const [agentId, setAgentId] = useState(null);
  const [agentData, setAgentData] = useState(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');


  // 1. Check Stripe session
  useEffect(() => {
    if (!sessionId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(
          `https://us-central1-premarket-homes.cloudfunctions.net/api/stripe/session_status?session_id=${sessionId}`
        );

        if (!res.ok) {
          const text = await res.text();
          console.error('❌ Response error:', res.status, text);
          throw new Error(`Bad response: ${res.status}`);
        }

        const session = await res.json();

        if (session.session.status === 'complete') {
          setStatus('complete');
          setEmail(session.session.customer_email || null);
          const agentIdFromStripe = session.session.metadata.agentId || null;
          setAgentId(agentIdFromStripe);
        } else if (session.session.status === 'open') {
          setStatus('open');
        } else {
          setStatus('checking');
        }
      } catch (err) {
        console.error('❌ Error checking session status:', err);
        setStatus('error');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // 2. Fetch agent data
  useEffect(() => {
    if (!agentId) return;

    const fetchAgent = async () => {
      try {
        const docRef = doc(db, 'agents', agentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAgentData(docSnap.data());
        } else {
          console.error('Agent not found');
        }
      } catch (error) {
        console.error('Error fetching agent:', error);
      }
    };

    fetchAgent();
  }, [agentId]);

  function CopyButton({ color }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition"
      style={{ backgroundColor: color }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}


  // 3. Redirect if still open
  useEffect(() => {
    if (status === 'open') {
      router.push('/your-embedded-checkout-page');
    }
  }, [status, router]);

  // 4. Render UI
  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center text-center bg-gray-100 text-gray-800">
        ⏳ Checking your payment status...
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center text-center bg-gray-100 text-red-600">
        ❌ There was an error checking your session.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans p-4">
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">

        {/* Header Section */}
        <div className="flex flex-wrap sm:flex-nowrap sm:items-center mb-4 sm:mb-0">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/premarket-homes.firebasestorage.app/o/agents%2Fsneakpeek%20(1).png?alt=media&token=54065973-ddba-4be8-9052-b8c4c696337a"
            className="mx-auto sm:mx-0 w-56 my-6"
            alt="Premarket logo"
          />
          <div className="hidden sm:block ml-4 -mt-6 sm:mt-0 sm:ml-auto text-gray-900 text-sm">
            www.premarket.homes
          </div>
        </div>

        {/* Agent Info */}
        {agentData && (
          <div
            className="flex flex-wrap sm:flex-nowrap px-6 items-center justify-center sm:justify-between space-x-4 py-10 rounded-lg text-white"
            style={{ backgroundColor: agentData.primaryColor }}
          >
            {agentData.logo && (
              <Image
                src={agentData.logo}
                alt="logo"
                width={160}
                height={160}
                className="rounded"
                unoptimized
              />
            )}

            <div className="flex-shrink ml-auto flex space-x-3 items-center">
              <div className="flex flex-wrap sm:flex-nowrap space-x-2 text-center sm:text-left">
                {agentData.photo && (
                  <Image
                    src={agentData.photo}
                    alt={agentData.fullName}
                    width={80}
                    height={80}
                    className="rounded sm:rounded-full mt-4 sm:mt-0"
                    unoptimized
                  />
                )}
                <div>
                  <h4 className="text-xl font-semibold mb-2">{agentData.fullName}</h4>
                  <h1 className="text-lg font-semibold">{agentData.companyName}</h1>
                  <p className="text-xs">{agentData.tagline}</p>
                </div>
              </div>
            </div>
          </div>
       )}

        {/* QR Code */}
        {agentData?.qrcode && (
          <div className="flex justify-center items-center mt-6 sm:-mt-20 mb-10">
            <Image
              src={agentData.qrcode}
              alt="QR Code"
              width={160}
              height={160}
              className="border-4 border-white shadow-lg rounded-xl"
              unoptimized
            />
          </div>
        )}
        {/* Thank You / Email */}

{agentData && (
        <div className="text-left mt-10 px-10 sm:px-40">
          <h1 className="text-4xl font-bold text-teal-600 mb-4">Welcome {agentData.fullName}, You've just unlocked the most powerful prospect-nurturing machine. 🧠✨</h1>
          <p className="text-lg mb-4 font-bold text-xl">Now it’s time to put it to work.</p>

<p className="text-lg mb-4">Share the QR code or link below with any potential seller, buyer, or nosy neighbour you meet. Print it on flyers, slap it on signs, text it to phones, or beam it straight into inboxes—your call.</p>

<p className="text-lg mb-4">Want to see what your prospects see? <a className='text-teal-600 cursor-pointer' target="_blank" href={`https://www.premarket.homes/register?agent=${agentId}`}>Just visit the link yourself.</a></p>

<p className="text-lg mb-4">Every signup flows straight into your Premarket app, so make sure it’s installed and ready. This is your new secret weapon—use it wisely.</p>


        </div>
          )}

        {agentData && (
  <div className="mt-8 mb-40 text-center">
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-xl mx-auto">
      <input
        type="text"
        value={typeof window !== 'undefined' ? `https://www.premarket.homes/register?agent=${agentId}` : ''}
        disabled
        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-700"
      />
      <CopyButton color={agentData.primaryColor} />
    </div>
  </div>
)}

      </div>

       <div className="flex flex-wrap items-center justify-center mb-4 sm:mb-0 text-xs text-gray-600">
        Powered By
          <img
            src="https://firebasestorage.googleapis.com/v0/b/premarket-homes.firebasestorage.app/o/agents%2Fsneakpeek%20(1).png?alt=media&token=54065973-ddba-4be8-9052-b8c4c696337a"
            className="w-32 my-6"
            alt="Premarket logo"
          />
    
        </div>

    </div>
  );
}
