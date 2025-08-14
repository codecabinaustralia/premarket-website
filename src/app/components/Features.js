'use client';

import { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

const stages = [
  {
    tag: "Your Mission",
    title: "Turn Prospects Into Confident Sellers",
    text: "Premarket gives you a fresh way to meet homeowners before they meet your competitors. With zero advertising spend, you can nurture them from ‘just curious’ to committed sellers — while holding all the cards on commission, contract terms, and client relationship.",
    image: "/assets/screenshots/1.png"
  },
  {
    tag: "Distribute",
    title: "Put Your Brand in Every Doorstep & Newsfeed",
    text: "Send your unique QR code to your community—drop it in letterboxes, print it on flyers, stick it on your office door, or text it straight to your database. It’s your gift to homeowners: a free way to test the market while you position yourself as their go-to agent.",
    image: "/assets/screenshots/1.png"
  },
  {
    tag: "Manage prospect confidence",
    title: "Effortless Onboarding for Homeowners",
    text: "When a homeowner scans your code, they fill out a quick 2-minute form. Their property is instantly featured in the Premarket app. A simple marketing contract is agreed on, and you’re set to start engaging genuine buyers on their behalf—without the hassle of a formal listing.",
    image: "/assets/screenshots/2.png"
  },
  {
    tag: "Engage with buyers",
    title: "Engage Real Buyers Without the Red Tape",
    text: "Qualified buyers will start asking questions—and sometimes, they’ll submit handshake offers. You present these to your prospect, building excitement and trust. Premarket stays completely out of the transaction process, meaning no interference with your commission or contracts.",
    image: "/assets/screenshots/3.png"
  },
  {
    tag: "Win and convert",
    title: "Leverage Data to Win the Listing",
    text: "At the end of the campaign, you’ll receive a detailed performance report for each property—showing buyer activity, questions asked, and any offers made. This becomes powerful evidence to help you convert curious homeowners into committed sellers.",
    image: "/assets/screenshots/4.png"
  }
];


export default function CampaignStory() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const slideMultiplier = 1;
  const extendedRange = (stages.length - 1) * slideMultiplier;
  const index = useTransform(scrollYProgress, [0, 1], [0, extendedRange]);

  return (
    <section className="relative w-full h-[600vh] bg-white" ref={containerRef}>
      <div className="sticky top-0 h-screen w-full flex flex-wrap sm:flex-nowrap p-10 sm:p-0">

        {/* Sidebar Navigation */}
        <div className="hidden w-20 sm:flex flex-col justify-center items-center pl-4">
          {stages.map((stage, i) => {
            const isActive = useTransform(index, val => Math.round(val / slideMultiplier) === i);
            const dotColor = useTransform(isActive, v => v ? "#111827" : "#D1D5DB");
            const dotScale = useTransform(isActive, v => v ? 1.4 : 1);
            return (
              <motion.div key={i} className="flex flex-col items-center">
                <motion.div
                  className="w-3 h-3 rounded-full mb-2"
                  style={{ backgroundColor: dotColor, scale: dotScale }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Left Text Section */}
        <div className="w-full sm:w-1/2 flex mt-20 sm:mt-0 sm:items-center justify-center relative h-full">
        
          {stages.map((stage, i) => {
            const progress = useTransform(index, val => val - i * slideMultiplier);
            const opacity = useTransform(progress, [-0.5, 0, 0.5], [0, 1, 0]);
            return (
              
              <motion.div key={i} className="absolute max-w-lg" style={{ opacity }}>
                <span className='whitespace-nowrap bg-amber-600 text-white rounded-full p-2'>
                  {stage.tag}
                </span>
                <h2 className="mt-2 text-3xl sm:text-5xl leading-tight font-bold tracking-tight text-gray-900 mb-4 leading-tight">
                  {stage.title}
                </h2>
                <p className="text-lg text-gray-600">{stage.text}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Right Image Stack */}
<div className="hidden sm:block w-full sm:w-1/2 relative h-full overflow-hidden">
  {stages.map((stage, i) => {
    const progress = useTransform(index, val => val - i * slideMultiplier);
    const y = useTransform(progress, [-1, 0, 1], ['100%', '0%', '-100%']); // bottom to top
    const opacity = useTransform(progress, [-0.5, 0, 0.5], [0, 1, 0]); // fade in/out

    return (
      <motion.div
        key={i}
        className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
        style={{ zIndex: i, opacity, y }} // removed scale
      >
        <div className="p-20 w-full h-full">
          <img
            src={stage.image}
            alt={`Stage ${i + 1}`}
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      </motion.div>
    );
  })}
</div>

      </div>
    </section>
  );
}
