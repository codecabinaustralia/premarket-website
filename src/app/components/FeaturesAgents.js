'use client';

import { useRef, useState } from 'react';
import { useScroll, useTransform, motion, AnimatePresence } from 'framer-motion';

const stages = [
  {
    tag: "Win Before You Compete",
    title: "Walk In With The Unfair Advantage",
    text: "Imagine presenting to a vendor knowing every other agent is offering the exact same thing at the exact same price. Now imagine offering a free Premarket campaign that gives them real market data before they commit to anything. The fight is over before it starts.",
    benefits: [
      "Offer genuine value upfront—not just promises and marketing talk",
      "Get Form 6 or agency/seller/marketing agreements signed 10X easier when there's no risk",
      "Stand out instantly while competitors blend together with identical pitches",
      "Build trust immediately by putting the vendor's needs first"
    ],
    image: "https://premarketvideos.b-cdn.net/assets/z3.jpeg",
    video: "https://premarketvideos.b-cdn.net/assets/1113(1).mov",
    type: "mp4",
    gradient: "from-orange-500 to-amber-600"
  },
  {
    tag: "Fish Upstream",
    title: "Capture Listings Before They Hit The Market",
    text: "Why wait for vendors to appear on realestate.com.au and domain.com.au where they're bombarded by every agent in town? Premarket Agent Pro actively pushes vendors who weren't ready to list straight to your doorstep—turning hesitant homeowners into warm leads before your competitors even know they exist.",
    benefits: [
      "Agent Pro delivers exclusive seller leads directly to you before they go public",
      "Turn Premarket into a powerful prospect engine and lead generator",
      "Position yourself as the trusted advisor before they speak to anyone else",
      "Build your pipeline with motivated sellers testing the waters",
      "Capture opportunities while other agents are chasing saturated leads"
    ],
    image: "https://premarketvideos.b-cdn.net/assets/z3.jpeg",
    gradient: "from-teal-500 to-cyan-600"
  },
  {
    tag: "Confidence Creates Commitment",
    title: "Give Vendors The Certainty They Need To List",
    text: "Most vendors are hesitant because they don't know what their property is really worth. Premarket removes that uncertainty. Present a comprehensive report with real buyer interest, genuine price opinions, and registered contacts—giving them the confidence to go to market with you.",
    benefits: [
      "Deliver a detailed market report backed by actual buyer engagement",
      "Show real registered buyers and their contact details for immediate follow-up",
      "Reduce time on market with a head start—your campaign hits the ground running",
      "Sometimes properties sell during Premarket without ever going public"
    ],
    image: "https://premarketvideos.b-cdn.net/assets/z2.jpeg",
    gradient: "from-purple-500 to-indigo-600"
  },
  {
    tag: "Your Terms, Your Timeline",
    title: "Premarket Works With Your Process",
    text: "We're not a listing platform—we don't negotiate or interfere with your agreements. Many agents secure Form 6, Form 2, or agency agreements before running a Premarket campaign. Because there's no cost and no obligation for the vendor, getting that 'Yes' is dramatically easier.",
    benefits: [
      "Integrate Premarket into your existing sales process seamlessly",
      "Get agreements signed when you need them—before or after the campaign",
      "Vendors say 'Yes' more easily because there's zero risk on their side",
      "You control the relationship, negotiations, and terms—not a third party"
    ],
    image: "https://premarketvideos.b-cdn.net/assets/z4.jpeg",
    gradient: "from-purple-500 to-indigo-600"
  }
];


export default function CampaignStory() {
  const containerRef = useRef(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const videoRefs = useRef({});

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const slideMultiplier = 1;
  const extendedRange = (stages.length - 1) * slideMultiplier;
  const index = useTransform(scrollYProgress, [0, 1], [0, extendedRange]);

  const handlePlayVideo = (stageIndex) => {
    setPlayingVideo(stageIndex);
    if (videoRefs.current[stageIndex]) {
      videoRefs.current[stageIndex].play();
    }
  };

  const handleVideoEnd = (stageIndex) => {
    setPlayingVideo(null);
  };

  return (
    <section className="relative w-full bg-gradient-to-b from-white via-gray-50 to-white" ref={containerRef} style={{ height: `${stages.length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full flex flex-col lg:flex-row items-center overflow-hidden">

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
        <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 lg:px-16 gap-4 lg:gap-16 py-4 lg:py-0">
          
          {/* Right: Image/Video Stack - Now FIRST on mobile */}
          <div className="w-full lg:w-1/2 relative h-[35vh] sm:h-[40vh] lg:h-[80vh] flex items-center justify-center order-1 lg:order-2">
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
                    <div className="relative w-full h-full p-2 sm:p-4 lg:p-8">
                      {/* Gradient Glow */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${stage.gradient} opacity-20 blur-3xl rounded-3xl`} />
                      
                      {/* Image/Video Container */}
                      <div className="relative w-full h-full rounded-xl lg:rounded-3xl overflow-hidden shadow-2xl border-2 lg:border-4 border-white">
                        {stage.type === "mp4" && stage.video ? (
                          <>
                            {/* Video Player */}
                            <video
                              ref={el => videoRefs.current[i] = el}
                              src={stage.video}
                              className="w-full h-full object-cover"
                              controls={playingVideo === i}
                              onEnded={() => handleVideoEnd(i)}
                              playsInline
                              preload="metadata"
                            />
                            
                            {/* Play Button Overlay */}
                            <AnimatePresence>
                              {playingVideo !== i && (
                                <motion.button
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ duration: 0.3 }}
                                  onClick={() => handlePlayVideo(i)}
                                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer group"
                                >
                                  <div className={`w-16 h-16 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br ${stage.gradient} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform`}>
                                    <svg 
                                      className="w-8 h-8 lg:w-12 lg:h-12 text-white ml-1" 
                                      fill="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </motion.button>
                              )}
                            </AnimatePresence>
                          </>
                        ) : (
                          <>
                            {/* Static Image */}
                            <img
                              src={stage.image}
                              alt={stage.title}
                              className="w-full h-full object-cover"
                              loading={i === 0 ? 'eager' : 'lazy'}
                            />
                            
                            {/* Overlay Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Left: Text Content - Now SECOND on mobile */}
          <div className="w-full lg:w-1/2 flex items-center justify-center relative min-h-[50vh] lg:h-full order-2 lg:order-1">
            {stages.map((stage, i) => {
              const progress = useTransform(index, val => val - i * slideMultiplier);
              const opacity = useTransform(progress, [-0.4, -0.2, 0, 0.2, 0.4], [0, 0.5, 1, 0.5, 0]);
              const scale = useTransform(progress, [-0.4, 0, 0.4], [0.9, 1, 0.9]);
              const y = useTransform(progress, [-0.4, 0, 0.4], [50, 0, -50]);

              return (
                <motion.div
                  key={i}
                  className="absolute max-w-2xl px-2 sm:px-4"
                  style={{ opacity, scale, y }}
                >
                  {/* Tag */}
                  <motion.div
                    className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4 lg:mb-6 bg-gradient-to-r ${stage.gradient} text-white shadow-lg`}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs sm:text-sm font-bold">{stage.tag}</span>
                  </motion.div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl interBold text-gray-900 mb-3 sm:mb-4 lg:mb-6 leading-tight">
                    {stage.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6 lg:mb-8 leading-relaxed">
                    {stage.text}
                  </p>

                  {/* Benefits List */}
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {stage.benefits.map((benefit, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-2 sm:gap-3 group"
                      >
                        <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br ${stage.gradient} flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform`}>
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-xs sm:text-sm lg:text-base text-gray-700 font-medium">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile Progress Dots */}
        <div className="lg:hidden absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
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