'use client';

import Link from 'next/link';
import FooterLarge from '../components/FooterLarge';
import Nav from '../components/Nav';

export default function PrivacyPolicy() {
  return (
    <div>
    <Nav />
    <div className="max-w-4xl mx-auto px-4 py-16 text-gray-900">
        {/* Cancelled Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Subscription Not Completed
        </h1>
        
        <p className="text-xl text-center text-gray-600 mb-12">
          Your payment could not be processed
        </p>

        {/* Info Message Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            What happened?
          </h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            It looks like your payment didn't go through. This can happen for a variety of reasons, such as:
          </p>
          <ul className="space-y-2 mb-6 ml-4">
            <li className="flex items-start text-gray-700">
              <span className="text-orange-600 mr-2">•</span>
              <span>Payment method was declined</span>
            </li>
            <li className="flex items-start text-gray-700">
              <span className="text-orange-600 mr-2">•</span>
              <span>Insufficient funds</span>
            </li>
            <li className="flex items-start text-gray-700">
              <span className="text-orange-600 mr-2">•</span>
              <span>Billing information mismatch</span>
            </li>
            <li className="flex items-start text-gray-700">
              <span className="text-orange-600 mr-2">•</span>
              <span>Session expired or was cancelled</span>
            </li>
          </ul>
          <p className="text-lg text-gray-700 leading-relaxed">
            Don't worry - no charges were made to your account.
          </p>
        </div>

        {/* Next Steps Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">
            Ready to try again?
          </h3>
          <p className="text-gray-700 mb-6 leading-relaxed">
            Head back to the Premarket app and restart the subscription process. Make sure to verify your payment details before proceeding.
          </p>
          <div className="space-y-3">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">Double-check your card details</span>
            </div>
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">Ensure your billing address is correct</span>
            </div>
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">Try a different payment method if needed</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="text-center space-y-4">

          <p className="text-sm text-gray-500">
            Questions? Contact our support team at{' '}
            <a href="mailto:support@premarket.com" className="text-blue-600 hover:underline">
              support@premarket.com
            </a>
          </p>
        </div>

    
      </div>
    <FooterLarge />
    </div>
  );
}
