'use client';

import { useState } from 'react';
import Image from 'next/image';
import Nav from '../components/Nav';

export default function HowItWorksPage() {
  const [activeRole, setActiveRole] = useState('seller'); // 'seller' or 'buyer'

  const sellerStages = [
    {
      tag: "For Homeowners",
      title: "Test The Market Risk-Free",
      text: "Premarket gives homeowners confidence to make informed decisions. Test the market before committing to an agent—no open homes, no marketing spend, no pressure.",
      benefits: [
        "Save thousands on unnecessary marketing costs",
        "Make money by getting accurate market valuations",
        "Zero commitment until you're ready to sell",
        "Complete control over your property information"
      ],
      image: "https://premarketvideos.b-cdn.net/assets/1.png",
      gradient: "from-teal-500 to-cyan-600"
    },
    {
      tag: "Real Buyer Feedback",
      title: "Discover What Buyers Actually Think",
      text: "Forget guessing games with agent estimates. Get first-hand feedback from real buyers who are actively looking in your area.",
      benefits: [
        "Receive genuine price opinions from interested buyers",
        "Understand true market demand for your property",
        "Connect with pre-qualified, motivated buyers",
        "Make informed decisions based on real data"
      ],
      image: "https://premarketvideos.b-cdn.net/assets/d209f92b32b172368fb3da2a8bcfb315_1762476048.png",
      gradient: "from-orange-500 to-amber-600"
    },
    {
      tag: "Powerful Reports",
      title: "Real Data From Real Buyers",
      text: "Homeowners receive comprehensive reports showing what buyers are actually willing to pay—not what agents or marketing materials claim.",
      benefits: [
        "Understand true market demand for your property",
        "Connect with genuine, pre-qualified buyers",
        "Cut costs by eliminating unnecessary open homes",
        "Save time with targeted, interested buyers only"
      ],
      image: "https://premarketvideos.b-cdn.net/assets/9298ea3a6ad1f132a9df763bbb32931a_1762476464.png",
      gradient: "from-purple-500 to-indigo-600"
    }
  ];

  const buyerStages = [
    {
      tag: "Early Access",
      title: "See Properties Before They Go Public",
      text: "Premarket lets you discover homes before anyone else. These properties are testing the market before going live with an agent or big campaign—giving you a first look at real opportunities.",
      benefits: [
        "Get early access to properties before they hit the major sites",
        "Be first in line to make offers or express interest",
        "Understand seller motivation before the crowd does",
        "Avoid bidding wars by acting early"
      ],
      image: "https://premarketvideos.b-cdn.net/assets/a1.jpeg",
      gradient: "from-orange-500 to-amber-600"
    },
    {
      tag: "For Active Buyers & Investors",
      title: "Get Alerts for New Premarket Listings",
      text: "When a homeowner lists their property on Premarket, you'll be the first to know. Give your price opinion, register your interest, and get ahead of the competition.",
      benefits: [
        "Receive instant alerts when new off-market homes are listed",
        "Share your price opinions on properties you like",
        "Register your interest before they go public",
        "Engage directly with genuine, motivated sellers"
      ],
      image: "https://premarketvideos.b-cdn.net/assets/a2.jpeg",
      gradient: "from-teal-500 to-cyan-600"
    },
    {
      tag: "Exclusive Advantage",
      title: "Be the First to See Real Opportunity",
      text: "Premarket gives you priority access to genuine opportunities—homes that aren't yet on realestate.com.au or domain.com.au. Be proactive and make smarter investment decisions.",
      benefits: [
        "See properties before public advertising begins",
        "Spot undervalued or unlisted opportunities early",
        "Connect directly with homeowners testing the market",
        "Stay ahead with data-driven insights on local activity"
      ],
      image: "https://premarketvideos.b-cdn.net/assets/a3.jpeg",
      gradient: "from-purple-500 to-indigo-600"
    }
  ];

  const activeStages = activeRole === 'seller' ? sellerStages : buyerStages;

  return (
    <div className="relative bg-white min-h-screen">
      <Nav />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-700 to-gray-900  py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-amber-200 mb-6 shadow-sm">
              <span className="text-sm font-bold text-amber-700">
                Simple, Transparent, Effective
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl interBold text-white mb-6">
              How It Works
            </h1>
            
            <p 
              className="text-xl sm:text-2xl interMedium bg-clip-text text-transparent mb-8"
              style={{
                backgroundImage: `linear-gradient(to right, #e92204ff, #e48900ff)`,
              }}
            >
              Either save money or make money by running a free premarket campaign on your home
            </p>

            <p className="text-lg text-white max-w-3xl mx-auto leading-relaxed">
              Get real buyer feedback and interest giving you the confidence to go to market or stay put. 
              <div className="font-semibold text-white"> No open homes, no fees, no risk.</div>
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-20 -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-200 rounded-full blur-3xl opacity-20 -z-10" />
      </div>

      {/* Role Selector */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center py-6">
            <div className="inline-flex bg-gray-100 rounded-full p-1 gap-1">
              <button
                onClick={() => setActiveRole('seller')}
                className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                  activeRole === 'seller'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                I'm a Homeowner
              </button>
              <button
                onClick={() => setActiveRole('buyer')}
                className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                  activeRole === 'buyer'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                I'm a Buyer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Step Process Overview */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl interBold text-gray-900 mb-4">
              {activeRole === 'seller' ? 'Three Simple Steps' : 'Your Path to Success'}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {activeRole === 'seller' 
                ? 'Discover your property\'s true market value without any commitment'
                : 'Get ahead of the competition with exclusive early access'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center shadow-lg">
                    {activeRole === 'seller' ? (
                      <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    ) : (
                      <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="inline-block px-3 py-1 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 rounded-full text-xs font-bold mb-4">
                  STEP 1
                </div>
                <h3 className="text-2xl interBold text-gray-900 mb-4">
                  {activeRole === 'seller' ? 'List For Free' : 'Browse Off-Market'}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {activeRole === 'seller' 
                    ? 'Create your listing in minutes. Add photos, details, and let buyers know your property is available for premarket feedback.'
                    : 'Explore exclusive properties before they hit realestate.com.au or domain.com.au. See what\'s available before the crowd.'
                  }
                </p>
              </div>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-orange-200 rounded-full blur-2xl opacity-20 -z-10" />
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center shadow-lg">
                    {activeRole === 'seller' ? (
                      <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="inline-block px-3 py-1 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 rounded-full text-xs font-bold mb-4">
                  STEP 2
                </div>
                <h3 className="text-2xl interBold text-gray-900 mb-4">
                  {activeRole === 'seller' ? 'Receive Feedback' : 'Share Your Opinion'}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {activeRole === 'seller' 
                    ? 'Buyers share their price opinions and express genuine interest. Watch as real market data comes in from active buyers.'
                    : 'Give your honest price opinion on properties you like. Express interest and connect with motivated sellers.'
                  }
                </p>
              </div>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-teal-200 rounded-full blur-2xl opacity-20 -z-10" />
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-lg">
                    {activeRole === 'seller' ? (
                      <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ) : (
                      <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="inline-block px-3 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-full text-xs font-bold mb-4">
                  STEP 3
                </div>
                <h3 className="text-2xl interBold text-gray-900 mb-4">
                  {activeRole === 'seller' ? 'Make Your Decision' : 'Act Fast'}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {activeRole === 'seller' 
                    ? 'Get your comprehensive market report. Decide whether to go to market with confidence or stay put—entirely up to you.'
                    : 'Be first to make offers or connect with sellers. Beat the competition before properties go public on major platforms.'
                  }
                </p>
              </div>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-purple-200 rounded-full blur-2xl opacity-20 -z-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stages */}
      <div className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-32">
            {activeStages.map((stage, index) => (
              <div 
                key={index}
                className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Content */}
                <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-200 mb-4">
                    <span className="text-sm font-bold text-amber-700">{stage.tag}</span>
                  </div>
                  
                  <h2 className="text-4xl sm:text-5xl interBold text-gray-900 mb-6">
                    {stage.title}
                  </h2>
                  
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    {stage.text}
                  </p>

                  {/* Benefits List */}
                  <div className="space-y-4">
                    {stage.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-4 group">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${stage.gradient} flex items-center justify-center mt-1`}>
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-gray-700 text-lg group-hover:text-gray-900 transition-colors">
                          {benefit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image */}
                <div className={`relative ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                    <div className="relative w-full aspect-[4/5]">
                      <Image
                        src={stage.image}
                        alt={stage.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${stage.gradient} opacity-10`} />
                  </div>

                  {/* Decorative Elements */}
                  <div className={`absolute -z-10 w-72 h-72 bg-gradient-to-br ${stage.gradient} rounded-full blur-3xl opacity-20 ${
                    index % 2 === 0 ? '-bottom-12 -right-12' : '-top-12 -left-12'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl interBold mb-4">
              Why Premarket Works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Real results from real users across Australia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
              <div className="text-5xl sm:text-6xl interBold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-4">
                100%
              </div>
              <p className="text-xl text-gray-300">
                Free to List
              </p>
              <p className="text-sm text-gray-400 mt-2">
                No hidden fees or obligations
              </p>
            </div>

            <div className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
              <div className="text-5xl sm:text-6xl interBold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                24hrs
              </div>
              <p className="text-xl text-gray-300">
                Average Response Time
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Get feedback fast
              </p>
            </div>

            <div className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
              <div className="text-5xl sm:text-6xl interBold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                $0
              </div>
              <p className="text-xl text-gray-300">
                Marketing Costs
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Save thousands on campaigns
              </p>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl opacity-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-10" />
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl interBold text-white mb-6">
            Ready to Get Started?
          </h2>
          
          <p className="text-xl sm:text-2xl text-white/90 mb-10 leading-relaxed">
            {activeRole === 'seller' 
              ? 'Join thousands of homeowners who\'ve discovered their property\'s true value'
              : 'Join thousands of buyers getting exclusive early access to properties'
            }
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <a
              href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              <Image
                src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
                alt="Download on the App Store"
                width={190}
                height={40}
              />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform hover:scale-105"
            >
              <Image
                src="https://www.airtasker.com/images/homepage/google-play-2022.svg"
                alt="Get it on Google Play"
                width={190}
                height={40}
              />
            </a>
          </div>

          <p className="text-white/80 text-sm">
            Available on iOS and Android • Free to download
          </p>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-full" />
          <div className="absolute top-40 right-20 w-16 h-16 border-2 border-white rounded-full" />
          <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-white rounded-full" />
          <div className="absolute bottom-40 right-1/3 w-12 h-12 border-2 border-white rounded-full" />
        </div>
      </div>

      {/* FAQ Preview Section */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl interBold text-gray-900 mb-4">
              Common Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Premarket
            </p>
          </div>

          <div className="space-y-6">
            {activeRole === 'seller' ? (
              <>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg interBold text-gray-900 mb-2">
                    Is there any cost to list my property?
                  </h3>
                  <p className="text-gray-600">
                    No. Premarket is 100% free for homeowners. There are no listing fees, no marketing costs, and no obligation to sell.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg interBold text-gray-900 mb-2">
                    What happens after I receive feedback?
                  </h3>
                  <p className="text-gray-600">
                    You're in complete control. Use the feedback to decide if you want to list with an agent, sell privately, or stay in your home. No pressure whatsoever.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg interBold text-gray-900 mb-2">
                    How long does it take to get results?
                  </h3>
                  <p className="text-gray-600">
                    Most homeowners start receiving price opinions within 24-48 hours of listing. You can view all feedback in real-time through the app.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg interBold text-gray-900 mb-2">
                    Are these properties really off-market?
                  </h3>
                  <p className="text-gray-600">
                    Yes. All properties on Premarket are testing the market before going live with agents or on major sites like realestate.com.au and domain.com.au.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg interBold text-gray-900 mb-2">
                    Can I make an offer on a property?
                  </h3>
                  <p className="text-gray-600">
                    Absolutely. You can express interest, give your price opinion, and connect directly with motivated homeowners through the app.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg interBold text-gray-900 mb-2">
                    How do I get notified of new listings?
                  </h3>
                  <p className="text-gray-600">
                    Enable notifications in the app to receive instant alerts when new properties are listed in your preferred areas.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}