// pages/index.js
'use client';

import Head from 'next/head';
import Header from './components/Header';
import Hero from './components/Hero';
import Logos from './components/Logos';
import Features from './components/Features';
import Roles from './components/Roles';
import CallToAction from './components/CallToAction';
import FooterLarge from './components/FooterLarge';
import Testimonials from './components/Testimonials';
import StatBox from './components/Stats';
import FAQHomeOwners from './components/FAQHomeOwners';
import Pricing from './components/Pricing';
import PropertyFormModal from './components/Form';
import { useModal } from './context/ModalContext';
import Countdown from './components/Countdown';

export default function Home() {
  const { showModal } = useModal();

  return (
    <>
      <Head >
        <title>Premarket Homes</title>
        <meta name="description" content="Premarket Homes - Test the market before you sell." />
      </Head>
      {/* <Header /> */}
        {/* <div className="fixed top-0 left-0 w-full z-50">
              <Countdown />
            </div> */}
      
      {/* <PropertyFormModal /> */}
      
        <main>
       
        <Hero />
        {/* <Logos /> */}
        {/* <Welcome /> */}
        <Features />
        <FAQHomeOwners />
        {/* <Roles /> */}
        <Testimonials />
        {/* <Pricing /> */}
     
        {/* <CallToAction /> */}
      </main>
      <FooterLarge />
    </>
  );
}
