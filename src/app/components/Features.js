'use client';

import { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

const stages = [
  {
    title: "It takes just minutes to prepare your campaign",
    text: "Add your property, images and we'll do the rest. It's up to use to get buyers ready as they prepare to express real interest on your properties. ",
    image: "/assets/screenshots/1.png"
  },
  {
    title: "Campaign Launch",
    text: "Your campaign goes live. Buyers are circling like seagulls on a hot chip — they can now see your property and if we've done our job right you'll start getting real offers.",
    image: "/assets/screenshots/2.png"
  },
  {
    title: "Start collecting your own valuable data",
    text: "Receive real-time insights on buyer interest, agent opinions, engagement, and market trends. This data is invaluable for deciding when the time is right to sell or to hold.",
    image: "/assets/screenshots/3.png"
  },
  {
    title: "Accept or decline offers with zero obligation",
    text: "If you receive an offer that meets your expectations, you can accept it and proceed with the sale using our Premarket Edge services or you can hire a vetted agent in your area. If not, you can continue to gather data and insights.",
    image: "/assets/screenshots/4.png"
  },
  {
    title: "Campaign End",
    text: "Your report card includes everything you need — popularity, buyer intent, pricing insights, and market trends. Whether you sell now or keep testing demand, you’ll be making smart, informed moves with Premarket.",
    image: "/assets/screenshots/5.png"
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
        <div className="w-full sm:w-1/2 flex mt-20 sm:mt-0 sm:items-center justify-center p-12 relative h-full">
        
          {stages.map((stage, i) => {
            const progress = useTransform(index, val => val - i * slideMultiplier);
            const opacity = useTransform(progress, [-0.5, 0, 0.5], [0, 1, 0]);
            return (
              
              <motion.div key={i} className="absolute max-w-lg" style={{ opacity }}>
                <div className='relative top-0 left-0 mb-4'><span className='whitespace-nowrap bg-purple-900 text-white rounded-full p-2'>What to expect from your campaign</span></div>
                <h2 className="text-3xl sm:text-5xl leading-tight font-bold tracking-tight text-gray-900 mb-4 leading-tight">
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
