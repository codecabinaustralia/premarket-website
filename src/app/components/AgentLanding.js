'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

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


const App = ({fetchClientSecret}) => {
  const options = {fetchClientSecret};

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
const params = useParams();
        const agentId = params.id;


    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const docRef = doc(db, 'agents', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    console.log("docSnap.data()", docSnap.data())
                    setAgent(docSnap.data());
                } else {
                    console.warn('No agent found for ID!!:', id);
                }
            } catch (err) {
                console.error('Error loading agent:', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchAgent();
        }
    }, [id]);

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
            body: JSON.stringify({ priceId, agentId}),
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

                <div className='flex flex-wrap sm:flex-nowrap sm:items-center mb-4 sm:mb-0'>
                    <img src='https://firebasestorage.googleapis.com/v0/b/premarket-homes.firebasestorage.app/o/agents%2Fsneakpeek%20(1).png?alt=media&token=54065973-ddba-4be8-9052-b8c4c696337a' className='mx-auto sm:mx-0 w-56 my-6' />
                    <div className='hidden sm:block ml-4 -mt-6 sm:mt-0 sm:ml-auto text-gray-900 text-sm'>
                        www.premarket.homes
                    </div>

                </div>

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

                        {/* {qrcode && (
                            <div className="flex justify-center items-center -mt-16 sm:-mt-20 mb-10">
                                <Image
                                    src={qrcode}
                                    alt="QR Code"
                                    width={160}
                                    height={160}
                                    className="border-4 border-white shadow-lg rounded-xl"
                                    unoptimized
                                />
                            </div>
                        )} */}

                        


                        <h1 className='font-bold text-lg'>Hi {fullName.split(" ")[0]}</h1>
                        <h2 className="text-2xl sm:text-7xl font-bold mb-6">We built a super powerful prospect nurturing machine.</h2>
                        <h2 className="text-xl sm:text-2xl text-teal-600 px-0 sm:px-20 font-bold mb-6">Share your magic link with prospects or drop your QR code on flyers, signs, or socials. We’ll take it from there—nurturing and turning curiosity into committed clients. Some may even show up with buyers ready to move.</h2>
                        <p className="text-lg leading-relaxed max-w-2xl mx-auto">
                            Every agent knows the drill—barely a sip into your coffee and someone’s already asking, “What’s my place worth?, How's the market” Instead of brushing them off or burning time on cold leads, give them something of real value.
                            Prospects enter their property into a structured premarket journey—starting with a clear go-to-market goal. We handle everything from there: drop them into our buyer campaigns, invite them to private groups where they can access masterclasses, premium services, and real-time market insights. Every step is designed to build trust, momentum, and intent. You don’t pitch, chase, or convince. You just hand them a QR code, their properties will be added to your profile, you'll get regular reports and buyer intent on each prospect — and when they’re primed, motivated, and market-ready, you'll have everything you need to close the deal.</p>

                    </div>

                                           

                   <iframe
  className="sm:block hidden mx-auto my-10"
  width="560"
  height="315"
  src="https://www.youtube.com/embed/H-uq5JUKEac?si=fVIodKIBgHNA22ZS"
  title="YouTube video player"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerPolicy="strict-origin-when-cross-origin"
  allowFullScreen
></iframe>

<iframe
  className="sm:hidden mx-auto my-10"
  width="560"
  height="315"
  src="https://www.youtube.com/embed/H-uq5JUKEac?si=fVIodKIBgHNA22ZS"
  title="YouTube video player"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerPolicy="strict-origin-when-cross-origin"
  allowFullScreen
></iframe>

                   

                    <div className="text-center">
                        <h3 className="px-0 sm:px-20 text-2xl sm:text-5xl mt-10 font-semibold" style={{ color: secondaryColor }}>
                            Premarket is a supercharged automated engine that turns prospects into real clients and this is how we do it.
                        </h3>

                        <p className="mt-4 text-lg max-w-2xl text-center mx-auto leading-relaxed">
                           We first set an achieveable "Go to market goal" for each prospect. Then we hook them into a powerful set of value packed tools and services which keeps them on track to their goal.
                        </p>

                        <div className="mt-8 text-left max-w-2xl mx-auto text-lg leading-relaxed">
                            <h4 className="text-2xl font-bold mb-2">What you get</h4>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                                <li><strong>Stay connected</strong> to every homeowner you've ever spoken to.</li>
                                <li><strong>Build momentum</strong> with warm buyers before listings go live.</li>
                                <li><strong>Show real proof of demand</strong> to help vendors list faster and with confidence.</li>
                                <li><strong>Win back time</strong> by letting Premarket handle the busy work—while you close deals.</li>
                            </ul>

                            {/* <h4 className="text-2xl font-bold mt-6 mb-2">Why it matters:</h4> */}
                            <h4 className="text-2xl font-bold mt-6 mb-2">What your prospects get</h4>
                            <div className="list-disc list-inside space-y-2 text-sm">
                                <strong>Entry into our 30 day campaigns</strong><br /><br />
                                <strong>Access to our Premarket community</strong> <br />Packed with podcasts, valuable content and direct communication with other home owners, investors and buyers.<br /><br />
                                <strong>Access to Masterclasses</strong> <br />Geared to help prepare homeowners for sale<br /><br />
                                <strong>Initate email funnel</strong> Designed to keep prospects on track with their "go to market goal"
                            </div>
                        </div>
                    </div>


                    <div className="mt-12 rounded-lg p-6 sm:p-10 text-white" style={{ backgroundColor: primaryColor }}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-6 sm:space-y-0 sm:space-x-10">

                            {/* Left section: Agent name and heading */}
                            <div className="text-center sm:text-left flex-shrink-0">
                                <p className="text-sm font-medium">{fullName}</p>
                                <h2 className="font-bold text-2xl sm:text-3xl whitespace-nowrap">Scan to Try the Demo</h2>
                            </div>

                            {/* Middle section: Description */}
                            <div className="text-center sm:text-left flex-grow">
                                <p className="text-md sm:text-base">Scan the QR code below to see a live demo of what your clients will see.</p>
                            </div>

                            {/* Right section: QR Code */}
                            {qrcode && (
                                <div className="flex justify-center sm:justify-end items-center flex-shrink-0">
                                    <Image
                                        src={qrcode}
                                        alt="QR Code"
                                        width={160}
                                        height={160}
                                        className="border-4 border-white rounded-xl"
                                        unoptimized
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                     <img
                        src='/assets/agentApp.png'
                        alt="Premakret for agents"
                        className="w-full object-cover"
                        />



                    <div className="flex flex-col md:flex-row justify-center gap-0 mt-16 max-w-7xl mx-auto">
                        {/* Base Package */}
                        <div className="flex-1 bg-white border border-gray-100 p-8 text-center rounded-l-xl shadow-md">
                            <h3 className="text-2xl font-semibold mb-2">Small Agent</h3>
                            <p className="text-gray-500 text-base mb-6">For solo agents getting started with warm prospecting</p>

                            <div className="text-4xl font-bold text-gray-900 mb-1">
                                $199<span className="text-base font-medium">/month</span>
                            </div>
                            <p className="text-sm text-gray-500">Paid annually – <span className="text-sm text-gray-400">$2,388/year</span></p>

                            <p className="text-xs text-gray-900 mb-8 mt-2 bg-gray-300 font-semibold rounded-lg p-2">Upto 10 prospects /month</p>

                            <ul className="text-left space-y-3 text-gray-700 mb-8">
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> Access to Premarket app</li>
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> Access 12 x campaigns each year</li>
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> View buyer interest</li>
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> Property demand</li>
                                <li className="flex items-start"><span className="text-green-500 mr-3 text-xl">✔</span> Direct buyer chat</li>
                                <li className="flex items-start"><span className="text-green-500 mr-3 text-xl">✔</span> Handshake offers</li>
                                <li className="flex items-start"><span className="text-green-500 mr-3 text-xl">✔</span> Property Report Card</li>
                            </ul>

                            <button onClick={() => handleSubscribe('price_1RssKFDcMpgqKXQPBPafZpc6')} className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-700 transition">
                                Get Started
                            </button>
                        </div>

                        {/* Popular Middle Package */}
                        <div className="flex-1 mt-20 sm:mt-0 bg-white border-y border-gray-100 p-10 text-center shadow-2xl z-10 relative scale-105">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                Most Popular
                            </div>
                            <h3 className="text-3xl font-bold mb-2">Agent Pro</h3>
                            <p className="text-gray-500 text-lg mb-6">For agents with a small team</p>

                            <div className="text-5xl font-extrabold mb-1 text-gray-900">
                                $499<span className="text-base font-medium">/month</span>
                            </div>
                            <p className="text-sm text-gray-500">Paid annually – <span className="text-sm text-gray-400">$5,988/year</span></p>

                            <p className="text-xs text-gray-900 mb-8 mt-2 bg-gray-300 font-semibold rounded-lg p-2">Upto 100 prospects /month</p>

                            <ul className="text-left space-y-4 text-gray-700 mb-8">
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> 1000 branded prospect cards with qr code</li>
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> Branded prospect window sticker with qr code</li>
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> Access to Premarket app</li>
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> Access 12 x campaigns each year</li>
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> View buyer interest</li>
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> Property demand</li>
                                <li className="flex items-start"><span className="text-green-500 mr-3 text-xl">✔</span> Direct buyer chat</li>
                                <li className="flex items-start"><span className="text-green-500 mr-3 text-xl">✔</span> Handshake offers</li>
                                <li className="flex items-start"><span className="text-green-500 mr-3 text-xl">✔</span> Property Report Card</li>
                            </ul>

                            <button onClick={() => handleSubscribe('price_1RssM8DcMpgqKXQPYL1JhlPy')} className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-700 transition">
                                Get Started Now
                            </button>
                        </div>

                        {/* Enterprise Package */}
                        <div className="flex-1 mt-20 sm:mt-0  bg-white border border-gray-100 p-8 text-center rounded-r-xl shadow-md">
                            <h3 className="text-2xl font-semibold mb-2">Enterprise</h3>
                            <p className="text-gray-500 text-base mb-6">Custom solutions for agencies and networks</p>

                            <div className="text-4xl font-bold text-gray-900 mb-1">Custom</div>
                            <p className="text-sm text-gray-500">Paid annually – based on scale</p>

                            <p className="text-xs text-gray-900 mb-8 mt-2 bg-gray-300 font-semibold rounded-lg p-2">Add unlimited prospects across all your teams</p>

                            <ul className="text-left space-y-3 text-gray-700 mb-8">
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> Access to Premarket app</li>
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> Access 12 x campaigns each year</li>
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> View buyer interest</li>
                                <li className="flex items-start"><span className="text-green-500 mr-2">✔</span> Property demand</li>
                                <li className="flex items-start"><span className="text-green-500 mr-3 text-xl">✔</span> Direct buyer chat</li>
                                <li className="flex items-start"><span className="text-green-500 mr-3 text-xl">✔</span> Handshake offers</li>
                                <li className="flex items-start"><span className="text-green-500 mr-3 text-xl">✔</span> Property Report Card</li>
                            </ul>

                            <a href="mailto:knockknock@premarket.homes">
                                <button className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-700 transition">
                                    Contact Us
                                </button>
                            </a>
                        </div>
                    </div>

                    {clientSecret && (
                        <div className="h-screen w-full fixed top-0 left-0 z-50 bg-white">
                            
                          
                            <div className="w-full h-full bg-white p-20 overflow-y-scroll relative">
                                <div onClick={() => setClientSecret(null)} className="text-3xl absolute top-0 right-0 m-4 cursor-pointer text-2xl font-bold">
  ×
</div>

  <img src='https://firebasestorage.googleapis.com/v0/b/premarket-homes.firebasestorage.app/o/agents%2Fsneakpeek%20(1).png?alt=media&token=54065973-ddba-4be8-9052-b8c4c696337a' className='mx-auto w-56 mb-4' />
                                <App fetchClientSecret={clientSecret} />
                            </div>
                        </div>
  
)}

                    <div className="mt-20 bg-blue-50 text-gray-800 rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-6">
                            <Image
                                src="https://i1.au.reastatic.net/600x600,gravity=north/4b8434490d46606d6165fd50b668a1197c67b4de81299d3f568ebcd51e6dc657/main.jpg" // replace with real agent image if needed
                                alt="Agent Photo"
                                width={180}
                                height={180}
                                className="rounded-full border-2 border-gray-300"
                                unoptimized
                            />
                            <div>
                                <p className="text-lg italic">
                                    "Before Premarket, following up with cold leads was the worst part of my job. I’d spend hours each week texting, calling, and checking in — most of the time with people who weren’t even close to ready. Since using Premarket, all of that has changed. Now Premarket run automated campaigns that keep me top-of-mind without me lifting a finger. When someone’s ready to move or there's a buyer interested I can then step in. Honestly it just made that whole part of my business way less stressful."
                                </p>
                                <p className="mt-4 font-semibold text-gray-900">Philip Chillemi — Gold Coast</p>
                            </div>
                        </div>
                    </div>

                    <FAQSection />

                    <div className="mt-12 rounded-lg p-6 sm:p-10 text-white" style={{ backgroundColor: primaryColor }}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-6 sm:space-y-0 sm:space-x-10">

                            {/* Left section: Agent name and heading */}
                            <div className="text-center sm:text-left flex-shrink-0">
                                <p className="text-sm font-medium">{fullName}</p>
                                <h2 className="font-bold text-2xl sm:text-3xl whitespace-nowrap">Scan to Try the Demo</h2>
                            </div>

                            {/* Middle section: Description */}
                            <div className="text-center sm:text-left flex-grow">
                                <p className="text-md sm:text-base">Scan the QR code below to see a live demo of what your clients will see.</p>
                            </div>

                            {/* Right section: QR Code */}
                            {qrcode && (
                                <div className="flex justify-center sm:justify-end items-center flex-shrink-0">
                                    <Image
                                        src={qrcode}
                                        alt="QR Code"
                                        width={160}
                                        height={160}
                                        className="border-4 border-white rounded-xl"
                                        unoptimized
                                    />
                                </div>
                            )}
                        </div>
                    </div>


                    <h3 className="text-center text-lg sm:text-5xl mt-10 font-semibold" style={{ color: secondaryColor }}>
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
