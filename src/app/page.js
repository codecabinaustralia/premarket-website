// pages/index.js
import Head from 'next/head';
import Header from './components/Header';
import Hero from './components/Hero';
import Logos from './components/Logos';
import Features from './components/Features';
import Roles from './components/Roles';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import Testimonials from './components/Testimonials';
import StatBox from './components/Stats';
import Welcome from './components/Welcome';
import Pricing from './components/Pricing';

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
        <Logos />
        <Welcome />
        <Features />
        <StatBox />
        <Roles />
        <Testimonials />
        <Pricing />
     
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
