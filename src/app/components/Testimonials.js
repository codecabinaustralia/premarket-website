'use client';

import { useState } from 'react';
import Image from 'next/image';

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Homeowner – Sydney",
    quote: "I was nervous about listing my home, but Premarket let me test the waters first. Got 12 genuine buyer opinions and saved thousands by knowing exactly what my home was worth before committing to an agent.",
    image: "assets/testimonials/1.png"
  },
  {
    name: "David Chen",
    role: "First Home Buyer – Melbourne",
    quote: "Finally found properties before they hit the market! Made an offer on my dream home before it even went to auction. Best part? No bidding wars.",
    image: "assets/testimonials/2.png"
  },
  {
    name: "Emma Roberts",
    role: "Homeowner – Brisbane",
    quote: "Thought I'd have to spend $15k on marketing and open homes. Premarket showed me I had genuine buyers interested without spending a cent. Saved money and avoided the stress.",
    image: "assets/testimonials/3.png"
  },
  {
    name: "Michael Torres",
    role: "Property Investor – Perth",
    quote: "As an investor, getting early access to off-market properties is gold. I've secured two investment properties through Premarket before they hit realestate.com.au. No competition, better prices.",
    image: "assets/testimonials/4.png"
  },
  {
    name: "Lisa Nguyen",
    role: "Homeowner – Adelaide",
    quote: "I wasn't sure if it was the right time to sell. The free report showed me real buyer interest and actual price opinions – not just agent estimates. Gave me the confidence to list at the right price.",
    image: "assets/testimonials/5.png"
  },
  {
    name: "James Patterson",
    role: "Buyer – Gold Coast",
    quote: "Tired of fishing through the same listings as everyone else. Premarket gave me exclusive access to homes that weren't even advertised yet. Found my forever home in just 3 weeks.",
    image: "assets/testimonials/6.png"
  },
  {
    name: "Rachel Kumar",
    role: "Homeowner – Canberra",
    quote: "No open homes, no strangers walking through my house every weekend, and I still got multiple genuine offers. Premarket made selling so much easier and more private.",
    image: "assets/testimonials/7.png"
  },
  {
    name: "Tom Wilson",
    role: "Investor – Newcastle",
    quote: "Being able to give my price opinion and show genuine interest before a property goes public is a game-changer. I've beaten other buyers to the punch three times now.",
    image: "assets/testimonials/8.png"
  },
  {
    name: "Jessica Brown",
    role: "Homeowner – Hobart",
    quote: "The detailed report showed me exactly what buyers were willing to pay – not what marketing brochures claimed. Armed with real data, I sold for $50k more than the initial agent estimate.",
    image: "assets/testimonials/9.png"
  }
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-200 mb-6">
            <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-bold text-amber-700">What Our Users Say</span>
          </div>
          <h2 className="text-4xl sm:text-5xl interBold text-gray-900 mb-4">
            Real Stories From Real People
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hear from homeowners and buyers who've used Premarket to save money, make smarter decisions, and get ahead of the market.
          </p>
        </div>

        {/* Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Quote Icon */}
              <div className="mb-6">
                <svg className="w-10 h-10 text-orange-500 opacity-50" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M10 8c-3.314 0-6 2.686-6 6v10h10V14h-6c0-2.21 1.79-4 4-4V8zm16 0c-3.314 0-6 2.686-6 6v10h10V14h-6c0-2.21 1.79-4 4-4V8z" />
                </svg>
              </div>

              {/* Quote Text */}
              <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                "{testimonial.quote}"
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100 flex-shrink-0">
                  <Image
                    src={`/${testimonial.image}`}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg border border-gray-100">
            <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-gray-900">Trusted by 10,000+ Australians</span>
          </div>
        </div>
      </div>
    </section>
  );
}