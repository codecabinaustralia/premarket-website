// pages/index.js
'use client';

import Head from 'next/head';
import Header from '../components/Header';
import HeroBuyers from '../components/HeroBuyers';
import Logos from '../components/Logos';
import FeaturesBuyers from '../components/FeaturesBuyers';
import Roles from '../components/Roles';
import CallToAction from '../components/CallToAction';
import FooterLarge from '../components/FooterLarge';
import Testimonials from '../components/Testimonials';
import StatBox from '../components/Stats';
import Welcome from '../components/Welcome';
import Pricing from '../components/Pricing';
import PropertyFormModal from '../components/Form';
import { useModal } from '../context/ModalContext';
import Countdown from '../components/Countdown';

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
       
        <HeroBuyers />
        {/* <Logos /> */}
        {/* <Welcome /> */}
        <FeaturesBuyers />
        <StatBox />
        {/* <Roles /> */}
        <Testimonials />
        {/* <Pricing /> */}
     
        {/* <CallToAction /> */}
      </main>
      <FooterLarge />
    </>
  );
}
