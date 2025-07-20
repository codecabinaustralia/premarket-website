'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const roles = [
  {
    title: "Homeowners",
    subtitle: "Real data. Real offers. Smarter decisions.",
    description:
      "Discover what your home is truly worth — based on buyer interest, agent insights, and real-time demand. Go to market with confidence, use Premarket Edge to sell directly, or stay in the loop with future campaigns. Treat your home like the asset it is — informed, strategic, and always ahead of the curve.",
    gradient: "from-[#f43f5e] via-[#ec4899] to-[#8b5cf6]"
  },
  {
    title: "Buyers",
    subtitle: "Beat the market. Be first in line. Win the deals others miss.",
    description:
      "Get access to properties before agents even knock. No competition, no bidding wars — just you and a motivated seller. Being first means more options, better prices, and the chance to secure the deal of a lifetime before anyone else even knows it's on the radar.",
    gradient: "from-[#34d399] via-[#06b6d4] to-[#3b82f6]"
  },
  {
    title: "Agents",
    subtitle: "Advise early. Build trust. Win listings with results.",
    description:
      "Evaluate homes before they hit the market. Offer real insights and earn the trust of homeowners testing the waters. When the timing’s right, you’re already top of mind — because you engaged early and delivered value before anyone else.",
    gradient: "from-[#facc15] via-[#f97316] to-[#ef4444]"
  }
];

export default function Roles() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {roles.map((role, i) => (
          <HoverCard key={i} role={role} />
        ))}
      </div>
    </section>
  );
}

function HoverCard({ role }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="perspective"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <motion.div
        className="relative w-full h-80"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
      >

        
        {/* Gradient peeking background */}
        <div className={`absolute w-2/3 h-2/3 inset-0 rounded-lg bg-gradient-to-br ${role.gradient} z-0`} />

        {/* Front */}
        <div className="mt-4 ml-2 absolute inset-0 bg-white shadow-xl rounded-lg p-6 flex flex-col items-start justify-between backface-hidden z-10">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{role.title}</h3>
            <p className="text-gray-600 text-xl">{role.subtitle}</p>
          </div>
          <button className="mt-6 bg-black text-white px-4 py-2 rounded-full text-sm font-medium">
            Read more
          </button>
        </div>

        {/* Back */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${role.gradient} text-white rounded-lg p-6 flex items-center justify-center text-center backface-hidden z-20`}
          style={{ transform: 'rotateY(180deg)' }}
        >
          <p className="text-sm leading-tight">{role.description}</p>
        </div>
      </motion.div>
    </div>
  );
}
