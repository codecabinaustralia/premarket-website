'use client';

import { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

const stages = [
  {
    tag: "For Homeowners",
    title: "Test The Market Risk-Free",
    text: "Changing real estate. Experience the new way. Get confidence from real buyers—no guestimates from banks or agents. The price of a property is what buyers are willing to pay.",
    benefits: [
      "Get real feedback from genuine buyers, not estimates",
      "Understand true market demand before committing",
      "No pressure, no obligation—test the market your way",
      "Make informed decisions with actual buyer interest"
    ],
    image: "https://premarketvideos.b-cdn.net/assets/j1.jpeg",
    gradient: "from-teal-500 to-cyan-600"
  },
  {
    tag: "For Homeowners",
    title: "Take Your Own Photos",
    text: "No need for professional photos. Get live in minutes, get feedback in hours—not months. Skip the traditional hassle and test your property the modern way.",
    benefits: [
      "Upload photos yourself and go live instantly",
      "Start receiving buyer feedback within hours",
      "Skip the wait and expense of professional staging",
      "Test the market on your timeline, not an agent's"
    ],
    image: "https://premarketvideos.b-cdn.net/assets/j2.jpeg",
    gradient: "from-orange-500 to-amber-600"
  },
  {
    tag: "For Homeowners",
    title: "Save Thousands & Stay In Control",
    text: "Save thousands and countless hours of open homes. Choose an agent when you're ready, or stay put and try again another time. No obligation. Free.",
    benefits: [
      "Avoid expensive marketing costs and open homes",
      "Only commit to an agent when you're confident",
      "Try the market without any financial risk",
      "Stay put if the timing isn't right—it's your choice"
    ],
    image: "https://premarketvideos.b-cdn.net/assets/j3.jpeg",
    gradient: "from-purple-500 to-indigo-600"
  },
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
    <section className=" my-10 relative w-full bg-gradient-to-b from-white via-gray-50 to-white" ref={containerRef} style={{ height: `${stages.length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full flex flex-col lg:flex-row items-center">

        {/* Progress Indicator (Desktop) */}
        <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col gap-4 z-10">
          {stages.map((stage, i) => {
            const progress = useTransform(index, val => val - i * slideMultiplier);
            const isActive = useTransform(progress, [-0.3, 0, 0.3], [false, true, false]);
            const height = useTransform(isActive, v => v ? '40px' : '12px');
            const opacity = useTransform(isActive, v => v ? 1 : 0.3);
            
            return (
              <motion.div
                key={i}
                className={`w-1 rounded-full bg-gradient-to-b ${stage.gradient}`}
                style={{ height, opacity }}
              />
            );
          })}
        </div>

        {/* Content Container */}
        <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center px-4 sm:px-8 lg:px-16 gap-8 lg:gap-16">
          
          {/* Left: Text Content */}
          <div className="w-full lg:w-1/2 flex items-center justify-center relative h-[60vh] lg:h-full">
            {stages.map((stage, i) => {
              const progress = useTransform(index, val => val - i * slideMultiplier);
              const opacity = useTransform(progress, [-0.4, -0.2, 0, 0.2, 0.4], [0, 0.5, 1, 0.5, 0]);
              const scale = useTransform(progress, [-0.4, 0, 0.4], [0.9, 1, 0.9]);
              const y = useTransform(progress, [-0.4, 0, 0.4], [50, 0, -50]);

              return (
                <motion.div
                  key={i}
                  className="absolute max-w-2xl px-4"
                  style={{ opacity, scale, y }}
                >
                  {/* Tag */}
                  <motion.div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-gradient-to-r ${stage.gradient} text-white shadow-lg`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-bold">{stage.tag}</span>
                  </motion.div>

                  {/* Title */}
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl interBold text-gray-900 mb-6 leading-tight">
                    {stage.title}
                  </h2>

                  {/* Description */}
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    {stage.text}
                  </p>

                  {/* Benefits List */}
                  <div className="space-y-4">
                    {stage.benefits.map((benefit, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3 group"
                      >
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${stage.gradient} flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform`}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Image Stack */}
          <div className="w-full lg:w-1/2 relative h-[40vh] lg:h-[80vh] flex items-center justify-center">
            <div className="relative w-full h-full max-w-lg">
              {stages.map((stage, i) => {
                const progress = useTransform(index, val => val - i * slideMultiplier);
                const opacity = useTransform(progress, [-0.4, -0.2, 0, 0.2, 0.4], [0, 0.5, 1, 0.5, 0]);
                const scale = useTransform(progress, [-0.4, 0, 0.4], [0.85, 1, 0.85]);
                const rotateY = useTransform(progress, [-0.4, 0, 0.4], [15, 0, -15]);
                const y = useTransform(progress, [-0.4, 0, 0.4], ['10%', '0%', '-10%']);

                return (
                  <motion.div
                    key={i}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      opacity,
                      scale,
                      rotateY,
                      y,
                      zIndex: stages.length - Math.abs(i - Math.round(index.get() / slideMultiplier))
                    }}
                  >
                    <div className="relative w-full h-full p-4 lg:p-8">
                      {/* Gradient Glow */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${stage.gradient} opacity-20 blur-3xl rounded-3xl`} />
                      
                      {/* Image Container */}
                      <div className="relative w-full h-full rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                        <img
                          src={stage.image}
                          alt={stage.title}
                          className="w-full h-full object-cover"
                          loading={i === 0 ? 'eager' : 'lazy'}
                        />
                        
                        {/* Overlay Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Progress Dots */}
        <div className="lg:hidden absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {stages.map((stage, i) => {
            const progress = useTransform(index, val => val - i * slideMultiplier);
            const isActive = useTransform(progress, [-0.3, 0, 0.3], [false, true, false]);
            const scale = useTransform(isActive, v => v ? 1.5 : 1);
            const opacity = useTransform(isActive, v => v ? 1 : 0.4);
            
            return (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full bg-gradient-to-br ${stage.gradient}`}
                style={{ scale, opacity }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}