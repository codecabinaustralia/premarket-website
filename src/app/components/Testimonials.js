'use client';

import { useState } from 'react';
import Image from 'next/image';

const testimonials = [
  {
    name: "Sophie Turner",
    role: "Owner – Boutique Agency",
    quote: "Premarket shaved weeks off my usual campaign prep. Less time on admin, more time closing deals — my coffee budget’s never been higher.",
    image: "assets/testimonials/1.png"
  },
  {
    name: "Mark Evans",
    role: "Team Leader – Large Franchise",
    quote: "I’ve got 12 agents under me, and this is the first tool they’ve all agreed actually makes their lives easier.",
    image: "assets/testimonials/2.png"
  },
  {
    name: "Renee Adams",
    role: "Agent",
    quote: "I met a seller who’d been sitting on the fence for 2 years. Premarket got them moving in 2 weeks — and I got the listing.",
    image: "assets/testimonials/3.png"
  },
  {
    name: "Tom Harrington",
    role: "Agent – Small Town Office",
    quote: "We don’t have the budget the big guys do, but Premarket levels the playing field. I’ve picked up three listings from it already.",
    image: "assets/testimonials/4.png"
  },
  {
    name: "Josh Caruso",
    role: "Senior Agent",
    quote: "I’ve been in this game 18 years. This is the first time I’ve felt tech was giving back to the community, not just taking fees.",
    image: "assets/testimonials/5.png"
  },
  {
    name: "Linda Patel",
    role: "Junior Agent",
    quote: "As the new guy, I thought I’d be living on cold calls forever. Premarket handed me warm leads in my first week.",
    image: "assets/testimonials/6.png"
  },
  {
    name: "Clare O’Donnell",
    role: "Owner – Regional Agency",
    quote: "It’s like having a full-time marketing team without the payroll. I honestly thought it was too good to be true until the offers started rolling in.",
    image: "assets/testimonials/7.png"
  },
  {
    name: "Ben Murphy",
    role: "Agent",
    quote: "One of my sellers calls me ‘The Market Whisperer’ now. Truth is, Premarket just gave me the data before anyone else had it.",
    image: "assets/testimonials/8.png"
  },
  {
    name: "Hannah Lee",
    role: "Office Manager",
    quote: "From a back-office perspective, this cut our campaign setup time in half. Less paperwork, less chaos, more sales.",
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
