'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function AgentTestimonials() {
  const [activeVideo, setActiveVideo] = useState(null);
  const videoRef = useRef(null);

  const videoTestimonials = [
    {
      name: 'Rebecca Leo',
      agency: 'Gold Coast',
      video: 'https://premarketvideos.b-cdn.net/assets/testimonial1.mp4',
      thumbnail: 'https://premarketvideos.b-cdn.net/assets/bec1.webp'
    },
    {
      name: 'Greg Costello',
      agency: 'Kingscliff',
      video: 'https://premarketvideos.b-cdn.net/assets/testimonial2.mp4',
      thumbnail: 'https://premarketvideos.b-cdn.net/assets/greg1.jpg'
    }
  ];

  const testimonials = [
    {
      name: 'Rebecca Leo',
      agency: 'Gold Coast',
      quote: 'I\'d been doing pre-market for years — badly. Just phone calls and hope. Premarket gave me a system. My last three appraisals, I walked in with buyer feedback already in hand. Signed all three.',
      avatar: 'B',
      video: 'https://premarketvideos.b-cdn.net/assets/testimonial1.mp4'
    },
    {
      name: 'Greg Costello',
      agency: 'Kingscliff',
      quote: 'The moment I stopped asking vendors for marketing money and started offering unlimited premarket campaigns, everything changed. Less resistance. Better conversations. More listings.',
      avatar: 'G',
      video: 'https://premarketvideos.b-cdn.net/assets/testimonial2.mp4'
    }
  ];

  useEffect(() => {
    if (activeVideo && videoRef.current) {
      videoRef.current.play();
    }
  }, [activeVideo]);

  // Handle escape key and body scroll lock
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setActiveVideo(null);
      }
    };

    if (activeVideo) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [activeVideo]);

  const closeModal = () => {
    setActiveVideo(null);
  };

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Agents Are Already{' '}
            <span className="bg-gradient-to-r from-[#e48900] to-[#c64500] bg-clip-text text-transparent">
              Winning Listings
            </span>{' '}
            With Premarket
          </h2>
        </motion.div>

        {/* Video Testimonials */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {videoTestimonials.map((video, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative group cursor-pointer"
              onClick={() => setActiveVideo(video)}
            >
              <div className="relative aspect-video bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl overflow-hidden shadow-lg">
                {/* Video thumbnail */}
                <Image
                  src={video.thumbnail}
                  alt={`${video.name} testimonial`}
                  fill
                  className="object-cover"
                />

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors duration-300">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl group-hover:bg-gradient-to-br group-hover:from-[#e48900] group-hover:to-[#c64500] transition-all duration-300"
                  >
                    <svg className="w-8 h-8 text-slate-900 group-hover:text-white transition-colors ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </motion.div>
                </div>

                {/* Bottom gradient with name */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-white font-medium">{video.name}</p>
                  <p className="text-white/80 text-sm">{video.agency}</p>
                </div>
              </div>

              {/* Video caption */}
              <div className="mt-4">
                <p className="text-sm text-slate-600 text-center">
                  See how real agents are using Premarket to win more listings
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Written Testimonials */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 h-full hover:shadow-xl hover:border-slate-300 transition-all duration-300">
                {/* Quote icon */}
                <div className="absolute top-6 right-6 text-orange-200">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.956.76-3.022.66-1.065 1.515-1.867 2.558-2.403L9.373 5c-.8.396-1.56.898-2.26 1.505-.71.607-1.34 1.305-1.9 2.094s-.98 1.68-1.25 2.69-.346 2.04-.217 3.1c.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.368l.002.003zm9.124 0c0-.88-.23-1.618-.69-2.217-.326-.42-.77-.692-1.327-.817-.56-.124-1.074-.13-1.54-.022-.16-.94.09-1.95.75-3.02.66-1.06 1.514-1.86 2.557-2.4L18.49 5c-.8.396-1.555.898-2.26 1.505-.708.607-1.34 1.305-1.894 2.094-.556.79-.97 1.68-1.24 2.69-.273 1-.345 2.04-.217 3.1.165 1.4.615 2.52 1.35 3.35.732.833 1.646 1.25 2.742 1.25.967 0 1.768-.29 2.402-.876.627-.576.942-1.365.942-2.368v.01z" />
                  </svg>
                </div>

                {/* Testimonial text */}
                <div className="relative z-10">
                  <p className="text-slate-700 text-lg leading-relaxed mb-6">
                    &quot;{testimonial.quote}&quot;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e48900] to-[#c64500] flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{testimonial.name}</p>
                      <p className="text-sm text-slate-600">{testimonial.agency}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Video player */}
              <video
                ref={videoRef}
                src={activeVideo.video}
                controls
                autoPlay
                className="w-full h-full rounded-2xl shadow-2xl"
              />

              {/* Video info */}
              <div className="absolute -bottom-12 left-0 text-white">
                <p className="font-medium">{activeVideo.name}</p>
                <p className="text-white/70 text-sm">{activeVideo.agency}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
