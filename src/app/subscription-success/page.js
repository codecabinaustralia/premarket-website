'use client';

import Link from 'next/link';
import FooterLarge from '../components/FooterLarge';
import Nav from '../components/Nav';

export default function PrivacyPolicy() {
  return (
    <div>
    <Nav />
    <div className="max-w-4xl mx-auto px-4 py-10 text-gray-900">
     
     <div className="flex justify-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      {/* Main Heading */}
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
        Welcome to Premarket!
      </h1>
      
      <p className="text-xl text-center text-gray-600 mb-12">
        Your subscription is now active
      </p>

      {/* Success Message Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-100">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">
          Thank you for joining the change
        </h2>
        <p className="text-lg text-gray-700 mb-4 leading-relaxed">
          You're now part of an exclusive network of forward-thinking agents who are revolutionizing the way properties come to market.
        </p>
        <p className="text-lg text-gray-700 mb-4 leading-relaxed">
          With Premarket, you'll gain early access to motivated sellers, build your pipeline before properties hit the market, and close deals faster than ever before.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed">
          Let's work together to take your career to the next level.
        </p>
      </div>

      {/* What's Next Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">
          What's next?
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-700">Start browsing pre-market properties in your area</span>
          </li>
          <li className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-700">Connect with motivated sellers before the competition</span>
          </li>
          <li className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-700">Access exclusive insights and market analytics</span>
          </li>
        </ul>
      </div>

      {/* CTA Button */}
      {/* <div className="text-center">
        <Link
          href="premarket://open"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          Open Premarket App
        </Link>
        <p className="text-sm text-gray-500 mt-4">
          Ready to get started? Open the app and explore your opportunities.
        </p>
      </div> */}

    </div>
    <FooterLarge />
    </div>
  );
}
