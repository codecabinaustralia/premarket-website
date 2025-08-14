'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function Hero() {
  const sectionRef = useRef(null);
  const [gradientPos, setGradientPos] = useState('50%');


  return (
    <section
      ref={sectionRef}
      className="relative bg-gradient-to-b from-white to-white overflow-hidden"

    >
      <div className=' shadow-xl border border-gray-100'>
        <div className='max-w-5xl mx-auto bg-white  py-4 px-10 flex items-center py-2'>
          <img src="./assets/logo.png" className='h-6' />

          <button
            className="px-4 py-3 ml-auto  rounded-lg text-white font-semibold text-sm cursor-pointer bg-gradient-to-r from-[#c64500ff] to-[#e48900] hover:opacity-90 transition"
          >
            Book a Demo
          </button>

        </div>
      </div>
      {/* White radial overlay */}
      <div
        className="h-full w-full bg-gray-100"

      >
        <div className="container mx-auto px-4 text-center relative z-10 pointer-events-auto">
          <div className="items-center flex w-full">
            <div className="w-full sm:w-2/3 mx-auto justify-start py-20">

            <span className='text-xs bg-amber-600 rounded-full text-white px-2 py-1 inter hidden sm:block'>Fastest Growing App for Australian Real Estate Agents</span>
            <span className='text-xs bg-amber-600 rounded-full text-white px-2 py-1 inter sm:hidden'>#1 App for Aussie Real Estate Agents</span>

              {/* Gradient text with cursor-based background position */}
              <h2
                className="mt-8 leading-none text-5xl sm:text-[60px] interBold text-gray-800"
              >
                We Turn Homeowners<br />Into Confident Sellers
              </h2>



              <div className="my-3 text-center">
                <h2
                  className="leading-tight text-lg sm:text-2xl inter bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to right, #a51600ff, #e48900ff)`,
                    backgroundSize: `200%`,
                    backgroundPositionX: gradientPos,
                  }}
                >
                  Gift your community a free ‘Premarket’ campaign<br className='sm:block hidden' />Earn their trust and be first in line when they’re ready to sell.
                </h2>

                <div className="mt-10 flex flex-wrap justify-center gap-3">
                  {/* Book a Demo - Solid Gradient */}
                  <button
                    className="px-6 py-5 rounded-lg text-white font-semibold text-lg cursor-pointer bg-gradient-to-r from-[#c64500ff] to-[#e48900] hover:opacity-90 transition"
                  >
                    Book a Demo
                  </button>

                  {/* How it works - Outline */}
                  <button
                    className="px-6 py-5 bg-white rounded-lg font-semibold text-lg cursor-pointer border-2 border-[#e48900] text-[#e48900] bg-transparent hover:bg-[#e48900] hover:text-white transition"
                  >
                    Learn More
                  </button>
                </div>
              </div>

             <div className='bg-white w-full sm:h-56 mt-10 rounded-xl shadow-xl grid grid-cols-1 sm:grid-cols-3'>
  <div className='col-span-1 border-b sm:border-r border-gray-200 text-center sm:text-left p-10'>
    <h2 className='inter text-gray-800 text-xl'>Share your custom link or QR code</h2>
    <div className='mt-2 inter text-gray-500 text-sm'>Homeowners add their property and accept a marketing agreement.</div>
  </div>

  <div className='col-span-1 border-b sm:border-r border-gray-200 text-center sm:text-left p-10'>
    <h2 className='inter text-gray-800 text-xl'>We run their free 30day campaign</h2>
    <div className='mt-2 inter text-gray-500 text-sm'>You stay in control, talking directly to interested buyers and getting real buyer intent.</div>
  </div>

  <div className='col-span-1 text-center sm:text-left p-10'>
    <h2 className='inter text-gray-800 text-xl'>Turn homeowners into confident sellers</h2>
    <div className='mt-2 inter text-gray-500 text-sm'>Show campaign results and give them the confidence to list with you.</div>
  </div>
</div>




            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
