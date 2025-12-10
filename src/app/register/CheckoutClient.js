'use client';
import { useModal } from '../context/ModalContext';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '../firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import PropertyFormModal from '../components/FormBranded';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { Home, TrendingUp, Users, CheckCircle } from 'lucide-react';

const stripePromise = loadStripe(
  'pk_test_51Rss7dDcMpgqKXQPB3MThRe6T8ufaYzVfgdICmLxTTlbjvwyJ3GCz3CFQNdpddGJvjzDfSuVCmVg7r9NSo5IdIwm00kBZqWNAu'
);

const EmbeddedCheckoutWrapper = ({ fetchClientSecret }) => (
  <EmbeddedCheckoutProvider
    stripe={stripePromise}
    options={{ fetchClientSecret }}
  >
    <EmbeddedCheckout />
  </EmbeddedCheckoutProvider>
);

// ------------------------------------------------------
// 🔥 Fetch user data
// ------------------------------------------------------
const fetchUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn('❌ No user found for ID:', userId);
      return null;
    }

    return { id: userSnap.id, ...userSnap.data() };
  } catch (err) {
    console.error('🔥 Error fetching user:', err);
    return null;
  }
};

// ------------------------------------------------------
// ⚡ Component
// ------------------------------------------------------
export default function AgentLanding() {
  const { setShowModal } = useModal();
  const searchParams = useSearchParams();
  const userId = searchParams.get('agent');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      try {
        const data = await fetchUser(userId);
        if (data) {
          setUser(data);
        } else {
          console.warn('No user found for ID:', userId);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  // ------------------------------------------------------
  // Stripe Checkout
  // ------------------------------------------------------
  const handleSubscribe = async (priceId) => {
    try {
      const response = await fetch(
        'https://us-central1-premarket-homes.cloudfunctions.net/api/stripe/session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId, agentId: userId })
        }
      );

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

  // ------------------------------------------------------
  // Loading State
  // ------------------------------------------------------
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
          <p className="text-gray-600">Please check your link and try again.</p>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------
  // User Data
  // ------------------------------------------------------
  const {
    fullName,
    email,
    photo,
    companyName,
    bio
  } = user;

  // ------------------------------------------------------
  // UI
  // ------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyFormModal />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-6 sm:space-y-0">
            {/* Agent Info */}
            <div className="flex items-center space-x-4">
              {photo && (
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 p-1">
                    <Image
                      src={photo}
                      alt={fullName}
                      width={80}
                      height={80}
                      className="rounded-xl object-cover w-full h-full"
                      unoptimized
                    />
                  </div>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                {companyName && (
                  <p className="text-gray-600 font-medium">{companyName}</p>
                )}
                {email && (
                  <p className="text-sm text-gray-500">{email}</p>
                )}
              </div>
            </div>

            {/* CTA Button - Mobile */}
            <button
              onClick={() => setShowModal(true)}
              className="sm:hidden w-full px-8 py-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-semibold rounded-2xl hover:shadow-lg transition-all duration-200"
            >
              List Your Property
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Main Headline */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Unlock the power of <span className="text-orange-600">pre-market selling</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get your property in front of serious buyers before it officially hits the market — completely free, no risk, no obligation.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-3xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Real Buyers</h3>
            <p className="text-gray-600 leading-relaxed">
              Connect directly with motivated buyers who are actively looking in your area.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
              <TrendingUp className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Build Momentum</h3>
            <p className="text-gray-600 leading-relaxed">
              Create buzz and gauge interest before your official launch for a stronger sale.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Zero Risk</h3>
            <p className="text-gray-600 leading-relaxed">
              No cost, no commitment. Test the market quietly and confidently.
            </p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-12 mb-16 border border-orange-200">
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            How It Works
          </h3>
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                1
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Add Your Property</h4>
                <p className="text-gray-700">
                  Fill out a quick form with your property details and photos.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                2
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">We Showcase It</h4>
                <p className="text-gray-700">
                  Your property gets featured in our next pre-market campaign to qualified buyers.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                3
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Get Results</h4>
                <p className="text-gray-700">
                  We track interest and keep you updated on buyer activity and feedback.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-3 px-12 py-6 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold text-xl rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
          >
            <Home className="w-6 h-6" />
            <span>Get Started Now</span>
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Takes less than 5 minutes • No credit card required
          </p>
        </div>

        {clientSecret && (
          <div className="mt-16 bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
            <Suspense fallback={
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }>
              <EmbeddedCheckoutWrapper fetchClientSecret={clientSecret} />
            </Suspense>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Powered by</span>
              <img
                src="https://firebasestorage.googleapis.com/v0/b/premarket-homes.firebasestorage.app/o/agents%2Fsneakpeek%20(1).png?alt=media&token=54065973-ddba-4be8-9052-b8c4c696337a"
                className="h-8"
                alt="Premarket logo"
              />
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Premarket Australia Pty Ltd
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}