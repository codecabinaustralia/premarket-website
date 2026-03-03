'use client';

import { useEffect, useState } from 'react';

import { db } from '../firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import FAQSection from '../components/faq.js';

export default function AgentLanding({ id }) {
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);


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
