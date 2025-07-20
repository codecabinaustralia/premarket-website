'use client';

import { useState } from 'react';
import Image from 'next/image';

const testimonials = [
  {
    name: "Sarah Thompson",
    role: "Homeowner",
    quote: "Premarket gave me real confidence. I saw offers roll in before I even listed.",
    image: "assets/testimonials/1.png"
  },
  {
    name: "James Walker",
    role: "Buyer",
    quote: "Being first in line changed everything. I secured a deal before agents even knew.",
    image: "assets/testimonials/2.png"
  },
  {
    name: "Emily Chen",
    role: "Homeowner",
    quote: "The insights were game-changing. I knew my market, my value, and my options.",
    image: "assets/testimonials/3.png"
  },
  {
    name: "Daniel Rees",
    role: "Buyer",
    quote: "I connected with sellers directly. No competition, just opportunity.",
    image: "assets/testimonials/4.png"
  },
  {
    name: "Ava Smith",
    role: "Homeowner",
    quote: "The buyer demand was real. I ended up getting three offers in a week.",
    image: "assets/testimonials/5.png"
  },
  {
    name: "Liam Johnson",
    role: "Buyer",
    quote: "It felt like insider access. No noise, just homes and real sellers.",
    image: "assets/testimonials/6.png"
  },
  {
    name: "Zara Ali",
    role: "Homeowner",
    quote: "I didn't feel rushed. I saw the market and made a smart move.",
    image: "assets/testimonials/7.png"
  },
  {
    name: "Noah Nguyen",
    role: "Buyer",
    quote: "A seamless experience — I was chatting with owners the same day I joined.",
    image: "assets/testimonials/8.png"
  },
  {
    name: "Grace Williams",
    role: "Homeowner",
    quote: "Premarket let me test the waters. I got offers before hiring anyone.",
    image: "assets/testimonials/9.png"
  }
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = testimonials[activeIndex];

  return (
    <section className="flex flex-col md:flex-row w-full bg-white py-20 justify-center">
      {/* Left Side – Image Grid */}
      <div className="hidden sm:grid p-20 grid-cols-3 gap-2">
        {testimonials.map((t, i) => (
          <div
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`rounded-xl overflow-hidden cursor-pointer transition duration-300 border-2 ${
              i === activeIndex ? 'border-transparent' : 'border-transparent'
            }`}
          >
            <img
              src={t.image}
              alt={t.name}
      
              className={`w-20 h-20 rounded-xl grayscale ${
                i === activeIndex ? 'grayscale-0' : 'grayscale'
              } transition duration-300`}
            />
          </div>
        ))}
      </div>

      {/* Right Side – Testimonial Content */}
      <div className="w-full md:w-1/3 px-8 flex flex-col justify-center mt-10 md:mt-0">
        <img
          src="https://www.pikpng.com/pngl/b/328-3285377_how-to-apply-trustpilot-5-star-logo-clipart.png"
          alt="Trustpilot"
          width={200}
          className="mb-4"
        />
        <p className="text-2xl font-medium text-gray-900 leading-relaxed mb-4">
          “{active.quote}”
        </p>
        <p className="text-sm text-gray-800 font-semibold">{active.name}</p>
       <div> <span className="mt-1 bg-gray-700 text-white text-xs px-3 py-1 rounded-full">
          {active.role}
        </span></div>
      </div>
    </section>
  );
}
