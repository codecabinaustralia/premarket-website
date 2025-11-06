'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebase/clientApp';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function PropertyPageClient() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const auth = getAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Price opinion state
  const [priceOpinion, setPriceOpinion] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registerInterest, setRegisterInterest] = useState(false);
  const [savedOfferId, setSavedOfferId] = useState(null);
  
  // Signup form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [signupError, setSignupError] = useState('');

  useEffect(() => {
    if (!propertyId) return;
    const fetchProperty = async () => {
      try {
        const docRef = doc(db, 'properties', propertyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProperty(data);
          
          // Calculate price range
          const { min, max, mid } = computeInitialRange(data);
          setMinPrice(min);
          setMaxPrice(max);
          setPriceOpinion(mid);
        }
      } catch (err) {
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId]);

  const computeInitialRange = (data) => {
    const toDouble = (v) => {
      if (!v) return 0;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const cleaned = v.replace(/[^\d.]/g, '');
        return parseFloat(cleaned) || 0;
      }
      return 0;
    };

    // Try to get from propertyJob first
    const priceEstimate = data.propertyJob?.price_estimate;
    if (priceEstimate) {
      const low = toDouble(priceEstimate.low);
      const high = toDouble(priceEstimate.high);
      const mid = toDouble(priceEstimate.mid);
      if (low > 0 && high > 0) {
        return { min: low, max: high, mid: mid > 0 ? mid : (low + high) / 2 };
      }
    }

    const price = toDouble(data.price);
    const guide = toDouble(data.priceGuide);
    const toPrice = toDouble(data.toPrice);
    const minField = toDouble(data.priceMin);
    const maxField = toDouble(data.priceMax);

    const min = minField > 0 ? minField :
                guide > 0 ? guide * 0.85 :
                price > 0 ? price * 0.9 : 900000;

    const max = maxField > 0 ? maxField :
                toPrice > 0 ? toPrice :
                guide > 0 ? guide * 1.15 :
                price > 0 ? price * 1.1 : 1100000;

    const mid = (min + max) / 2;
    return { min: Math.round(min), max: Math.round(max), mid: Math.round(mid) };
  };

  const formatMoney = (val) => {
    if (!val) return '$0';
    return `$${Math.round(val).toLocaleString()}`;
  };

  const formatCompact = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const getNestedValue = (obj, path) => {
    if (!obj) return null;
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    return current;
  };

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const handleSubmitOpinion = async () => {
    setSubmitting(true);
    try {
      // Save the offer without userId
      const offerData = {
        type: 'opinion',
        propertyId: propertyId,
        offerAmount: Math.round(priceOpinion),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        fromWeb: true,
      };

      if (registerInterest) {
        offerData.registerInterest = true;
      }

      const docRef = await addDoc(collection(db, 'offers'), offerData);
      setSavedOfferId(docRef.id);

      // Show signup modal
      setShowSignupModal(true);
    } catch (error) {
      console.error('Error submitting opinion:', error);
      alert('Failed to submit opinion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    setSubmitting(true);

    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      const userId = userCredential.user.uid;

      // Create user document
      await addDoc(collection(db, 'users'), {
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        pro: false,
        created: serverTimestamp(),
        tags: ['new'],
        avatar: '',
        uid: userId,
      });

      // Update the saved offer with userId
      if (savedOfferId) {
        const offerRef = doc(db, 'offers', savedOfferId);
        await updateDoc(offerRef, {
          userId: userId,
          updatedAt: serverTimestamp(),
        });
      }

      // Success - redirect or show success message
      alert('Account created successfully! Download the app to see more properties.');
      setShowSignupModal(false);
    } catch (error) {
      console.error('Signup error:', error);
      setSignupError(error.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-600">
        Property not found.
      </div>
    );
  }

  const {
    title,
    address,
    description,
    bedrooms,
    bathrooms,
    carSpaces,
    squareFootage,
    price,
    videoUrl,
    aiVideo,
    imageUrls = [],
    propertyJob,
    propertyType,
  } = property;

  // Extract data from propertyJob using helper function
  const propertyData = getNestedValue(propertyJob, 'property_data');
  const priceEstimate = getNestedValue(propertyJob, 'price_estimate');
  const rentalEstimate = getNestedValue(propertyJob, 'rental_estimate');
  const areaStats = getNestedValue(propertyJob, 'area_statistics');

  const displayVideoUrl = aiVideo?.url || videoUrl;
  const displayPropertyType = propertyType === 0 ? 'House' : 
                              propertyType === 1 ? 'Apartment' : 
                              propertyData?.property_type || 'Property';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Image
            src="https://premarket.homes/assets/logo.png"
            alt="Premarket Logo"
            width={160}
            height={40}
            unoptimized
          />

          {/* Store buttons - visible on desktop */}
          <div className="hidden md:flex space-x-3">
            <a
              href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
                alt="Download on the App Store"
                width={120}
                height={40}
              />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="https://www.airtasker.com/images/homepage/google-play-2022.svg"
                alt="Get it on Google Play"
                width={120}
                height={40}
              />
            </a>
          </div>
        </div>
      </header>

      {/* Full Width Pre-Market Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4 border border-white/30">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-sm font-bold text-white">PRE-MARKET EXCLUSIVE</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            See Properties Before They Hit the Market
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
            This property is available exclusively on Premarket. Download the app to discover more hidden gems.
          </p>
        </div>
      </div>

      {/* Property Info and Price Opinion Container */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 mb-12">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Left: Property Details */}
            <div className="p-8 lg:p-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full mb-4">
                <span className="text-xs font-semibold text-slate-700">{displayPropertyType}</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-3 leading-tight text-slate-900">
                {title}
              </h2>
              
              <div className="flex items-center gap-2 text-slate-600 mb-6">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{address}</span>
              </div>

              {/* Property Features */}
              <div className="flex flex-wrap gap-3 mb-8">
                {bedrooms && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="font-semibold text-slate-900">{bedrooms} Beds</span>
                  </div>
                )}
                {bathrooms && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                    <span className="font-semibold text-slate-900">{bathrooms} Baths</span>
                  </div>
                )}
                {carSpaces && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    <span className="font-semibold text-slate-900">{carSpaces} Cars</span>
                  </div>
                )}
                {squareFootage && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <span className="font-semibold text-slate-900">{squareFootage}m²</span>
                  </div>
                )}
              </div>

              {/* Image Gallery Grid */}
              {imageUrls.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Property Photos</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {imageUrls.slice(0, 8).map((url, index) => (
                      <div
                        key={index}
                        onClick={() => openLightbox(index)}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                      >
                        <Image
                          src={url}
                          alt={`${title} - ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          unoptimized
                        />
                        {index === 7 && imageUrls.length > 8 && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">+{imageUrls.length - 8}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Property Details */}
              {(propertyData?.year_built || propertyData?.land_size) && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {propertyData?.year_built && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="text-xs text-slate-600 mb-1">Year Built</div>
                      <div className="text-lg font-bold text-slate-900">{propertyData.year_built}</div>
                    </div>
                  )}
                  {propertyData?.land_size && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="text-xs text-slate-600 mb-1">Land Size</div>
                      <div className="text-lg font-bold text-slate-900">{propertyData.land_size}m²</div>
                    </div>
                  )}
                </div>
              )}

              {/* Key Metrics */}
              {(priceEstimate || rentalEstimate) && (
                <div className="grid grid-cols-2 gap-4">
                  {priceEstimate?.last_sold_price && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                      <div className="text-xs text-blue-700 mb-1 font-semibold">Last Sold</div>
                      <div className="text-xl font-bold text-blue-900">{formatMoney(priceEstimate.last_sold_price)}</div>
                    </div>
                  )}
                  {rentalEstimate?.rental_yield && (
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
                      <div className="text-xs text-orange-700 mb-1 font-semibold">Rental Yield</div>
                      <div className="text-xl font-bold text-orange-900">{rentalEstimate.rental_yield.toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Price Opinion Slider */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 lg:p-12 border-l border-slate-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  Your Price Opinion
                </h3>
                <p className="text-sm text-slate-600">
                  What do you think this property is worth?
                </p>
              </div>

              {/* Big Price Display */}
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-teal-600">
                  {formatMoney(priceOpinion)}
                </div>
              </div>

              {/* Slider */}
              <div className="mb-6">
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  step={1000}
                  value={priceOpinion}
                  onChange={(e) => setPriceOpinion(Number(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-orange-400 via-yellow-400 to-green-500 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                
                {/* Min/Max Labels */}
                <div className="flex justify-between mt-3 text-sm">
                  <div className="text-left">
                    <div className="text-xs text-slate-500 font-semibold">Low</div>
                    <div className="font-bold text-slate-700">{formatCompact(minPrice)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-semibold">High</div>
                    <div className="font-bold text-slate-700">{formatCompact(maxPrice)}</div>
                  </div>
                </div>
              </div>

              {/* Register Interest Toggle */}
              <div className="mb-6 bg-white rounded-xl p-4 border border-slate-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-800">Register your interest</div>
                      <div className="text-xs text-slate-600">Get notified when this property goes to market</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={registerInterest}
                    onChange={(e) => setRegisterInterest(e.target.checked)}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                  />
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitOpinion}
                disabled={submitting}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Submit Opinion</span>
                  </>
                )}
              </button>

              <p className="text-xs text-center text-slate-500 mt-4">
                Submit your opinion to unlock exclusive pre-market properties
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Details Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
   

        {/* About Property and Map Side by Side */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* About This Property */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">About This Property</h2>
            <div className="relative">
              <p className={`text-slate-700 leading-relaxed ${!showFullDescription ? 'line-clamp-6' : ''}`}>
                {description}
              </p>
              {!showFullDescription && description && description.length > 300 && (
                <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>
            {description && description.length > 300 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-teal-600 font-semibold mt-4 hover:text-teal-700 transition-colors inline-flex items-center gap-1"
              >
                {showFullDescription ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Show Less
                  </>
                ) : (
                  <>
                    Read More
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Map */}
          {address && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Location
                </h3>
                <p className="text-sm text-slate-600 mt-1">{address}</p>
              </div>
              <iframe
                width="100%"
                height="350"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(address)}`}
              />
            </div>
          )}
        </div>

        {/* Investment Analysis */}
        {(rentalEstimate || areaStats || priceEstimate) && (
          <div className="space-y-8 mb-12">
            <h2 className="text-3xl font-bold text-slate-800">Investment Analysis</h2>
            
            {/* Price Estimate Details */}
            {priceEstimate && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-8 border border-purple-200">
                <h3 className="text-xl font-bold text-purple-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Price History & Growth
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {priceEstimate.last_sold_price && (
                    <div className="bg-white/70 rounded-lg p-4">
                      <div className="text-sm text-purple-700 mb-1">Last Sold Price</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {formatMoney(priceEstimate.last_sold_price)}
                      </div>
                      {priceEstimate.last_sold_date && (
                        <div className="text-xs text-purple-600 mt-1">
                          {new Date(priceEstimate.last_sold_date).toLocaleDateString('en-AU', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {priceEstimate.price_growth_since_last_sold !== undefined && (
                    <div className="bg-white/70 rounded-lg p-4">
                      <div className="text-sm text-purple-700 mb-1">Growth Since Purchase</div>
                      <div className={`text-2xl font-bold ${priceEstimate.price_growth_since_last_sold >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                        {priceEstimate.price_growth_since_last_sold >= 0 ? '+' : ''}{priceEstimate.price_growth_since_last_sold.toFixed(1)}%
                      </div>
                    </div>
                  )}
                  {priceEstimate.price_growth_since_last_month !== undefined && (
                    <div className="bg-white/70 rounded-lg p-4">
                      <div className="text-sm text-purple-700 mb-1">Monthly Growth</div>
                      <div className={`text-2xl font-bold ${priceEstimate.price_growth_since_last_month >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                        {priceEstimate.price_growth_since_last_month >= 0 ? '+' : ''}{priceEstimate.price_growth_since_last_month.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {/* Rental Estimate */}
              {rentalEstimate?.estimated_rental_income && (
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl shadow-lg p-8 border border-orange-200">
                  <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Rental Estimate
                  </h3>
                  <div className="text-4xl font-bold text-orange-900 mb-2">
                    {formatMoney(rentalEstimate.estimated_rental_income)}/wk
                  </div>
                  {rentalEstimate.rental_yield && (
                    <div className="text-lg text-orange-800 mb-4">
                      Rental Yield: <span className="font-bold">{rentalEstimate.rental_yield.toFixed(2)}%</span>
                    </div>
                  )}
                  {rentalEstimate.low_range && rentalEstimate.high_range && (
                    <div className="mt-4">
                      <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-600 rounded-full mb-2" />
                      <div className="flex justify-between text-sm text-orange-800 font-semibold">
                        <span>{formatMoney(rentalEstimate.low_range)}</span>
                        <span>{formatMoney(rentalEstimate.high_range)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Area Statistics */}
              {areaStats && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-8 border border-blue-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {areaStats.suburb || 'Area Statistics'}
                  </h3>
                  {areaStats.median_price && (
                    <div className="mb-4">
                      <div className="text-sm text-blue-700 mb-1">Median Price</div>
                      <div className="text-3xl font-bold text-blue-900">
                        {formatMoney(areaStats.median_price)}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {areaStats.past_12_month_growth !== undefined && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs text-blue-700 mb-1">12mo Growth</div>
                        <div className="text-lg font-bold text-teal-600">
                          {areaStats.past_12_month_growth >= 0 ? '+' : ''}{areaStats.past_12_month_growth.toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {areaStats.population && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs text-blue-700 mb-1">Population</div>
                        <div className="text-lg font-bold text-blue-900">
                          {areaStats.population.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {areaStats.median_age && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs text-blue-700 mb-1">Median Age</div>
                        <div className="text-lg font-bold text-blue-900">
                          {areaStats.median_age} yrs
                        </div>
                      </div>
                    )}
                    {areaStats.median_household_income && (
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="text-xs text-blue-700 mb-1">Median Income</div>
                        <div className="text-lg font-bold text-blue-900">
                          ${areaStats.median_household_income}/wk
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Demographics */}
            {(areaStats?.household_type || areaStats?.occupancy) && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Local Demographics</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {areaStats.household_type && (
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-100 rounded-lg">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600 mb-1">Household Type</div>
                        <div className="text-lg font-semibold text-slate-800">{areaStats.household_type}</div>
                      </div>
                    </div>
                  )}
                  {areaStats.occupancy && (
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600 mb-1">Occupancy</div>
                        <div className="text-lg font-semibold text-slate-800">{areaStats.occupancy}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        
      </div>

      {/* About Premarket App Section */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 rounded-full mb-6">
                <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                <span className="text-sm font-bold text-teal-600">EXCLUSIVE ACCESS</span>
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Discover Properties Before They Hit The Market
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Premarket connects you with exclusive off-market properties and pre-listings before they reach public platforms. Get first access to hidden opportunities and make informed decisions with comprehensive property data.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">Early Access</h3>
                    <p className="text-slate-600">View properties weeks before they hit the market</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">AI-Powered Insights</h3>
                    <p className="text-slate-600">Get detailed investment analysis and price estimates</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">Direct Agent Contact</h3>
                    <p className="text-slate-600">Connect directly with selling agents</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Image
                    src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
                    alt="Download on the App Store"
                    width={160}
                    height={53}
                  />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Image
                    src="https://www.airtasker.com/images/homepage/google-play-2022.svg"
                    alt="Get it on Google Play"
                    width={160}
                    height={53}
                  />
                </a>
              </div>
            </div>

            {/* Video Player */}
            <div className="relative">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-8 border-white">
                {displayVideoUrl ? (
                  <video
                    src={displayVideoUrl}
                    className="w-full aspect-[9/16] object-cover"
                    controls
                    playsInline
                    poster={imageUrls[0] || ''}
                  />
                ) : (
                  <div className="w-full aspect-[9/16] bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center">
                    <Image
                      src="https://premarket.homes/assets/logo.png"
                      alt="Premarket"
                      width={200}
                      height={50}
                      className="brightness-0 invert"
                      unoptimized
                    />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-teal-200 rounded-full blur-3xl opacity-30" />
              <div className="absolute -top-6 -left-6 w-72 h-72 bg-cyan-200 rounded-full blur-3xl opacity-30" />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your Dream Home?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of buyers discovering exclusive pre-market properties
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Image
                src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
                alt="Download on the App Store"
                width={160}
                height={53}
              />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Image
                src="https://www.airtasker.com/images/homepage/google-play-2022.svg"
                alt="Get it on Google Play"
                width={160}
                height={53}
              />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Image
                src="https://premarket.homes/assets/logo.png"
                alt="Premarket Logo"
                width={140}
                height={35}
                className="mb-4 brightness-0 invert"
                unoptimized
              />
              <p className="text-slate-400 text-sm">
                Discover exclusive pre-market properties before they hit the market.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Download App</h3>
              <div className="space-y-3">
                <a
                  href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Image
                    src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
                    alt="Download on the App Store"
                    width={130}
                    height={43}
                  />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Image
                    src="https://www.airtasker.com/images/homepage/google-play-2022.svg"
                    alt="Get it on Google Play"
                    width={130}
                    height={43}
                  />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Premarket. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowSignupModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                Opinion Submitted!
              </h3>
              <p className="text-slate-600">
                Create your account to unlock exclusive pre-market properties
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              {signupError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {signupError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-xs text-center text-slate-500 mt-4">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && imageUrls.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
          }}
          tabIndex={0}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-semibold">
            {currentImageIndex + 1} / {imageUrls.length}
          </div>

          {/* Previous Button */}
          {imageUrls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div 
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={imageUrls[currentImageIndex]}
              alt={`${title} - Image ${currentImageIndex + 1}`}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
              unoptimized
            />
          </div>

          {/* Next Button */}
          {imageUrls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Thumbnail Strip */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 bg-black/50 p-3 rounded-full max-w-[90vw] overflow-x-auto">
              {imageUrls.map((url, index) => (
                <div
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 transition-all ${
                    index === currentImageIndex ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 3px solid #0d9488;
        }

        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 3px solid #0d9488;
        }
      `}</style>
    </div>
  );
}