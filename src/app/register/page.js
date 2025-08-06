'use client';

import { useEffect, useState } from 'react';
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


const App = ({ fetchClientSecret }) => {
    const options = { fetchClientSecret };

    return (
        <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={options}
        >
            <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
    )
}


export default function AgentLanding({ id }) {
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);
    var [clientSecret, setClientSecret] = useState(null);

    const searchParams = useSearchParams();
    const agentId = searchParams.get('agent');

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const docRef = doc(db, 'agents', agentId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    console.log("docSnap.data()", docSnap.data())
                    setAgent(docSnap.data());
                } else {
                    console.warn('No agent found for ID:', agentId);
                }
            } catch (err) {
                console.error('Error loading agent:', err);
            } finally {
                setLoading(false);
            }
        };

        if (agentId) {
            fetchAgent();
        }
    }, [agentId]);

    if (loading || !agent) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900"></div>
            </div>
        );
    }
    const handleSubscribe = async (priceId) => {
        try {

            const response = await fetch('https://us-central1-premarket-homes.cloudfunctions.net/api/stripe/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priceId, agentId }),
            });

            const data = await response.json(); // ✅ this parses the actual response body as JSON
            console.log('Stripe session response:', data);

            if (data.client_secret.client_secret) {
                clientSecret = data.client_secret.client_secret
                setClientSecret(() => () => Promise.resolve(data.client_secret.client_secret)); // ✅ embedded checkout requires a function that returns a Promise<string>
            } else {
                console.error('❌ No client_secret returned:', data);
            }
        } catch (error) {
            console.error('❌ Subscription error:', error);
        }
    };


    const {
        logo,
        primaryColor,
        secondaryColor,
        fullName,
        companyName,
        photo,
        website,
        tagline,
        qrcode,
    } = agent || {};

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 font-sans p-4" >
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">

                <div className="flex flex-wrap sm:flex-nowrap px-6 items-center justify-center sm:justify-space-between space-x-4 py-10 rounded-lg text-white" style={{ backgroundColor: primaryColor }}>
                    {logo && (
                        <Image
                            src={logo}
                            alt="logo"
                            width={160}
                            height={160}
                            className="rounded"
                            unoptimized
                        />
                    )}
                    <div className='flex-shrink ml-auto flex space-x-3 items-center'>
                        <div className='flex flex-wrap sm:flex-nowrap space-x-2 justify-center sm:justify-center text-center sm:text-left'>
                            {photo && (
                                <Image
                                    src={photo}
                                    alt={fullName}
                                    width={80}
                                    height={80}
                                    className="rounded sm:rounded-full mt-4 sm:mt-0"
                                    unoptimized
                                />
                            )}
                            <div>
                                <h4 className="text-xl font-semibold mb-2">{fullName}</h4>
                                <h1 className="text-lg font-semiBold">{companyName}</h1>
                                <p className="text-xs">{tagline}</p>
                            </div>

                        </div>


                    </div>
                </div>

                <div className="mt-12">
                    <div className='text-center px-6'>

                        <h1 className='font-bold text-lg'>Welcome</h1>
                        <h2 className="text-2xl sm:text-7xl font-bold mb-6">We have something very valuable for you.</h2>
                        <h2 className="text-xl font-bold mb-6">We have partnered with Premarket in order for you to get as much confidence as you can before hitting the market. You'll get access to a range of property data, community and also be entered into a series of out reach campaigns where we'll try our hardest to getr you real buyer intent.</h2>
                        <p className="text-lg leading-relaxed max-w-2xl mx-auto">
                        What you get - comunity , campaigns, tools etc such as podcasts....  and discounts to a range of different tools to help build momentumn.   
                        </p>

                         <button onClick={() => handleSubscribe('price_1RssKFDcMpgqKXQPBPafZpc6')} className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-700 transition">
                                Get Started By adding your property
                            </button>

                    </div>



                    <h3 className="text-lg sm:text-5xl mt-10 font-semibold" style={{ color: secondaryColor }}>
                        Don't get left behind, join hundreds of Aussie agents already using Premarket.
                    </h3>

   




                    <div className="mt-16 text-sm text-white/70">
                        Visit us at{' '}
                        <a href={website} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                            {website}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
