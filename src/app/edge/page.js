// pages/index.js
import Head from 'next/head';
import Header from '../components/Header';
import Hero from '../components/HeroEdge';
import Logos from '../components/Logos';
import Features from '../components/Features';
import Roles from '../components/RolesEdge';
import CallToAction from '../components/CallToAction';
import Footer from '../components/Footer';
import Testimonials from '../components/Testimonials';
import StatBox from '../components/StatsEdge';
import WelcomeEdge from '../components/WelcomeEdge';
import Pricing from '../components/PricingEdge';

export default function Home() {
  return (
    <>
      <Head>
        <title>Premarket Homes</title>
        <meta name="description" content="Premarket Homes - Test the market before you sell." />
      </Head>
      <Header />
      <main>
        <Hero />
         {/* <Logos /> */}
         <WelcomeEdge />
            <Roles />
        {/* <Features /> */}
        <StatBox />
         <Testimonials />
           <Pricing />
     
       
     
     
        <CallToAction />
      </main>
      {/* <Footer /> */}
    </>
  );
}
