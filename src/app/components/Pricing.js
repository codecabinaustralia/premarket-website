// components/Features.js
'use client';

import { useModal } from '../context/ModalContext';

export default function Pricing() {
  const { setShowModal } = useModal();
  
  return (
    <div className="bg-gray-50 py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Agents using Premarket are winning 10x more listings
          </h2>
          <p className="text-base sm:text-xl text-gray-600 max-w-4xl mx-auto">
            Then paying 10x less on non-measurable marketing strategies such as bus stops, billboards and magazine ads.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          {/* Agent Basic */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Agent Basic</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-extrabold text-gray-900">$233</span>
                <span className="text-gray-500 ml-2">/month</span>
              </div>
              <span className="inline-block bg-amber-600 text-white text-sm rounded-full py-2 px-4">
                Paid annually $2,796
              </span>
            </div>
            
            <ul className="space-y-3 mb-8 flex-grow text-gray-700">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>
                  Add unlimited prospects{' '}
                  <span className="bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full">
                    Limited Offer
                  </span>
                </span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Receive buyer contact details</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Receive price opinions</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Run 1 live campaign at a time</span>
              </li>
            </ul>
            
            
              <a target="_blank"
              rel="noopener noreferrer"
              href="https://calendly.com/knockknock-premarket/30min?month=2025-08"
              className="block text-center bg-white hover:bg-amber-700 hover:text-white text-amber-700 border-2 border-amber-700 font-bold py-4 px-6 rounded-lg transition-colors"
            >
              TRY FREE
            </a>
          </div>

          {/* Agent Pro - Featured */}
          <div className="bg-white rounded-xl shadow-2xl hover:shadow-3xl transition-shadow p-8 lg:scale-105 lg:-my-4 border-2 border-amber-500 flex flex-col relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-amber-500 text-white text-xs whitespace-nowrap font-bold px-6 py-2 rounded-full shadow-lg">
                BEST RETURN ON INVESTMENT
              </span>
            </div>
            
            <div className="mb-6 mt-2">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Agent Pro</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-extrabold text-gray-900">$499</span>
                <span className="text-gray-500 ml-2">/month</span>
              </div>
              <span className="inline-block bg-amber-600 text-white text-sm rounded-full py-2 px-4">
                Paid annually $5,988
              </span>
            </div>
            
            <ul className="space-y-3 mb-8 flex-grow text-gray-700">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>
                  <span className="font-bold">Premarket Lead Generator</span> — Become a recommended partner and be front and center in vendor reports
                </span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>Run unlimited campaigns simultaneously</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                <span>All features from Agent Basic</span>
              </li>
            </ul>
            
            
              <a target="_blank"
              rel="noopener noreferrer"
              href="https://calendly.com/knockknock-premarket/30min?month=2025-08"
              className="block text-center bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-6 rounded-lg transition-colors shadow-md"
            >
              TRY FREE
            </a>
          </div>

          {/* Custom Elite */}
          <div className="bg-gray-900 rounded-xl shadow-lg hover:shadow-2xl transition-shadow p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-3">Custom Elite</h3>
              <span className="inline-block bg-gray-700 text-white text-sm rounded-full py-2 px-4">
                Paid based on scale
              </span>
            </div>
            
            <p className="text-gray-300 mb-8 flex-grow leading-relaxed">
              Talk to our sales team about custom agency pricing, onboarding and membership for franchises and business owners.
            </p>
            
            
              <a target="_blank"
              rel="noopener noreferrer"
              href="https://calendly.com/knockknock-premarket/30min?month=2025-08"
              className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors"
            >
              Book a call
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}