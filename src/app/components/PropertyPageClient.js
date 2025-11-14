'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebase/clientApp';
import { doc, getDoc, addDoc, setDoc, collection, serverTimestamp, updateDoc, query, where, orderBy, limit, getDocs, increment } from 'firebase/firestore';
import Image from 'next/image';
import FooterLarge from '../components/FooterLarge';
import Nav from '../components/Nav';

// Generate a session ID for tracking price opinions
const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem('premarketSessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('premarketSessionId', sessionId);
  }
  return sessionId;
};

export default function PropertyPageClient() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const auth = getAuth();

  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [qualificationData, setQualificationData] = useState({
    isFirstHomeBuyer: false,
    isInvestor: false,
    buyerType: '',
    seriousnessLevel: '',
  });

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Price opinion state
  const [priceOpinion, setPriceOpinion] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [showPriceOpinionModal, setShowPriceOpinionModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registerInterest, setRegisterInterest] = useState(false);
  const [savedOfferId, setSavedOfferId] = useState(null);
  const [isSliding, setIsSliding] = useState(false);
  
  // Signup form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);

  const trackEvent = (eventName, eventParams = {}) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...eventParams
      });
    }
  };

  // Track page view when component mounts
  useEffect(() => {
    if (property) {
      trackEvent('property_view', {
        property_id: propertyId,
        property_title: property.title,
        property_address: property.address,
        property_price: property.price,
        page_path: window.location.pathname
      });
    }
  }, [property, propertyId]);

  // Save price opinion when slider is released
  useEffect(() => {
    if (!isSliding && priceOpinion > 0 && propertyId) {
      savePriceOpinion();
    }
  }, [isSliding]);
  
  useEffect(() => {
    if (!propertyId) return;
    const fetchProperty = async () => {
      try {
        const docRef = doc(db, 'properties', propertyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProperty(data);
          
          // Calculate price range based on property.price
          const { min, max } = computeInitialRange(data);
          setMinPrice(min);
          setMaxPrice(max);
          
          // Fetch previous offer to set initial slider value
          await fetchPreviousOffer(propertyId, min, max);

          // Increment the view count
          await incrementPropertyViews(propertyId);
        }
      } catch (err) {
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId]);

  const incrementPropertyViews = async (propId) => {
    try {
      const docRef = doc(db, 'properties', propId);
      
      // Use increment to atomically increase the views count
      await updateDoc(docRef, {
        'stats.views': increment(1),
        'stats.lastViewed': serverTimestamp()
      });
      
      console.log('Property view count incremented');
    } catch (error) {
      console.error('Error incrementing property views:', error);
      // Don't throw error - view counting shouldn't block page load
    }
  };

  const fetchPreviousOffer = async (propId, min, max) => {
    try {
      const sessionId = getSessionId();
      
      // First try to find a session-based offer
      const sessionQuery = query(
        collection(db, 'offers'),
        where('propertyId', '==', propId),
        where('sessionId', '==', sessionId),
        orderBy('updatedAt', 'desc'),
        limit(1)
      );
      
      const sessionSnapshot = await getDocs(sessionQuery);
      
      if (!sessionSnapshot.empty) {
        const previousOffer = sessionSnapshot.docs[0];
        setSavedOfferId(previousOffer.id);
        if (previousOffer.data().offerAmount) {
          const roundedOffer = Math.round(previousOffer.data().offerAmount / 1000) * 1000;
          setPriceOpinion(roundedOffer);
          return;
        }
      }
      
      // If no session offer found, use midpoint
      const mid = Math.round(((min + max) / 2) / 1000) * 1000;
      setPriceOpinion(mid);
    } catch (error) {
      console.error('Error fetching previous offer:', error);
      // Fallback to midpoint if error
      const mid = Math.round(((min + max) / 2) / 1000) * 1000;
      setPriceOpinion(mid);
    }
  };

  const savePriceOpinion = async () => {
    try {
      const sessionId = getSessionId();
      
      const offerData = {
        type: 'opinion',
        propertyId: propertyId,
        sessionId: sessionId,
        offerAmount: Math.round(priceOpinion),
        updatedAt: serverTimestamp(),
        fromWeb: true,
      };

      if (savedOfferId) {
        // Update existing offer
        const offerRef = doc(db, 'offers', savedOfferId);
        await updateDoc(offerRef, offerData);
        
        trackEvent('price_opinion_updated', {
          property_id: propertyId,
          opinion_amount: Math.round(priceOpinion),
          session_id: sessionId
        });
      } else {
        // Create new offer
        offerData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'offers'), offerData);
        setSavedOfferId(docRef.id);
        
        trackEvent('price_opinion_created', {
          property_id: propertyId,
          opinion_amount: Math.round(priceOpinion),
          session_id: sessionId
        });
      }

      // Show the modal
      setShowPriceOpinionModal(true);
    } catch (error) {
      console.error('Error saving price opinion:', error);
    }
  };

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

    // Get the base price from property.price
    let basePrice = toDouble(data.price);
    
    // If no price, try other sources
    if (basePrice === 0) {
      const priceEstimate = data.propertyJob?.price_estimate;
      if (priceEstimate) {
        basePrice = toDouble(priceEstimate.mid) || 
                    toDouble(priceEstimate.high) || 
                    toDouble(priceEstimate.low);
      }
    }
    
    if (basePrice === 0) {
      basePrice = toDouble(data.priceGuide);
    }
    
    // Default to 1M if still no price
    if (basePrice === 0) {
      basePrice = 1000000;
    }

    // Calculate min and max as 25% either side
    const min = Math.round((basePrice * 0.75) / 1000) * 1000;
    const max = Math.round((basePrice * 1.25) / 1000) * 1000;

    return { min, max };
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

  const handleQualificationSubmit = () => {
    if (!qualificationData.buyerType || !qualificationData.seriousnessLevel) {
      alert('Please complete all required fields');
      return;
    }

    // Track qualification form submission
    trackEvent('qualification_form_submitted', {
      property_id: propertyId,
      is_first_home_buyer: qualificationData.isFirstHomeBuyer,
      is_investor: qualificationData.isInvestor,
      buyer_type: qualificationData.buyerType,
      seriousness_level: qualificationData.seriousnessLevel
    });

    setShowQualificationModal(false);
    setShowSignupModal(true);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    setSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      const userId = userCredential.user.uid;

      await setDoc(doc(db, "users", userId), {
        uid: userId,
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: "",
        pro: false,
        agent: false,
        created: serverTimestamp(),
        tags: ["new"],
        avatar: "https://premarketvideos.b-cdn.net/assets/icon.png",
        activeCampaigns: 0,
        availableCampaigns: 1
      });

      // Track successful signup
      trackEvent('signup_completed', {
        property_id: propertyId,
        user_id: userId,
        registered_interest: registerInterest,
        signup_method: 'email'
      });

      // Update the saved offer with userId and qualification data
      if (savedOfferId) {
        const updateData = {
          userId: userId,
          updatedAt: serverTimestamp(),
        };

        if (registerInterest) {
          updateData.serious = true;
          updateData.isFirstHomeBuyer = qualificationData.isFirstHomeBuyer;
          updateData.isInvestor = qualificationData.isInvestor;
          updateData.buyerType = qualificationData.buyerType;
          updateData.seriousnessLevel = qualificationData.seriousnessLevel;
        }

        const offerRef = doc(db, 'offers', savedOfferId);
        await updateDoc(offerRef, updateData);
      }

      setShowThankYou(true);
    } catch (error) {
      console.error('Signup error:', error);
      setSignupError(error.message || 'Failed to create account');
      
      // Track signup error
      trackEvent('signup_error', {
        property_id: propertyId,
        error_message: error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterInterest = () => {
    setRegisterInterest(true);
    setShowPriceOpinionModal(false);
    setShowQualificationModal(true);
    
    trackEvent('register_interest_clicked', {
      property_id: propertyId
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600"></div>
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
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Nav />

      {/* Hero Video Section */}
      <div className="relative bg-gray-900">
        <div className="max-w-s mx-auto">
          <div className="relative sm:aspect-video h-screen sm:h-auto">
            <video
              src="https://premarketvideos.b-cdn.net/manualVideos/6b98cc64-ae9e-472c-8b3e-6e4fd08a55e0.mp4"
              className="sm:block hidden blur-lg w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Overlay Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4 max-w-4xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600/90 backdrop-blur-sm rounded-full mb-4 border border-orange-400">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-bold text-white">EXCLUSIVE PRE-MARKET PROPERTIES</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                  Properties Not Found On Any Other Website
                </h1>

                <video
              src="https://premarketvideos.b-cdn.net/manualVideos/6b98cc64-ae9e-472c-8b3e-6e4fd08a55e0.mp4"
              className="w-full sm:w-1/2 mx-auto rounded-lg shadow-lg my-4"
              autoPlay
         controls
              playsInline
            />

                <p className="text-3xl md:text-2xl text-white/95 mb-6 drop-shadow-md">
                  No Domain. No Realestate.com.au. Just Exclusive Pre-Market Listings.
                </p>
                <p className="text-base text-white/90 drop-shadow-md">
                  Leave your opinion • No obligation • Nobody will hassle you
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-800 mb-1">EXCLUSIVE PROPERTIES</h3>
              <p className="text-sm text-slate-600">Not found anywhere else</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-800 mb-1">No Obligation</h3>
              <p className="text-sm text-slate-600">Just leave an opinion and browse</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-800 mb-1">No Sales Calls</h3>
              <p className="text-sm text-slate-600">We don't every contact you</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-800 mb-1">Early Access</h3>
              <p className="text-sm text-slate-600">See properties before anyone else does</p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Info and Price Opinion Container */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Left: Property Details */}
            <div className="p-8 lg:p-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full mb-4">
                <span className="text-xs font-semibold text-slate-700">{displayPropertyType}</span>
              </div>
              
              <h2 className="text-xl md:text-xl bg-orange-100 rounded-xl p-4 font-bold mb-3 leading-tight text-orange-700">
                Leave your price opinion on the home
              </h2>

              <img src={imageUrls[0]} className='rounded-lg object-cover w-full h-56 my-4' />
              
              <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight text-slate-900">
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
                <div className="text-5xl font-bold text-orange-600">
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
                  onMouseDown={() => setIsSliding(true)}
                  onMouseUp={() => setIsSliding(false)}
                  onTouchStart={() => setIsSliding(true)}
                  onTouchEnd={() => setIsSliding(false)}
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

              <p className="text-xs text-center text-slate-500 mt-4 bg-white/50 rounded-lg p-3 border border-slate-200">
                💡 <strong>Move the slider</strong> to leave your price opinion. No signup required to browse!
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
                className="text-orange-600 font-semibold mt-4 hover:text-orange-700 transition-colors inline-flex items-center gap-1"
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
                  <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
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
                      <div className={`text-2xl font-bold ${priceEstimate.price_growth_since_last_sold >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                        {priceEstimate.price_growth_since_last_sold >= 0 ? '+' : ''}{priceEstimate.price_growth_since_last_sold.toFixed(1)}%
                      </div>
                    </div>
                  )}
                  {priceEstimate.price_growth_since_last_month !== undefined && (
                    <div className="bg-white/70 rounded-lg p-4">
                      <div className="text-sm text-purple-700 mb-1">Monthly Growth</div>
                      <div className={`text-2xl font-bold ${priceEstimate.price_growth_since_last_month >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
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
                        <div className="text-lg font-bold text-orange-600">
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full mb-6">
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                <span className="text-sm font-bold text-orange-600">EXCLUSIVE ACCESS</span>
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Discover Properties Before They Hit The Market
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Premarket connects you with exclusive off-market properties and pre-listings before they reach public platforms. Get first access to hidden opportunities and make informed decisions with comprehensive property data.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">Early Access</h3>
                    <p className="text-slate-600">View properties weeks before they hit the market</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">AI-Powered Insights</h3>
                    <p className="text-slate-600">Get detailed investment analysis and price estimates</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <a href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
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
                <a href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
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
                  <div className="w-full aspect-[9/16] bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center">
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
              <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-orange-200 rounded-full blur-3xl opacity-30" />
              <div className="absolute -top-6 -left-6 w-72 h-72 bg-amber-200 rounded-full blur-3xl opacity-30" />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            View More Exclusive Properties on Premarket
          </h2>
          <p className="text-xl mb-2 text-white/90">
            Get in first before they go to market
          </p>
          <p className="text-lg mb-8 text-white/80">
            100% free to use • No hidden fees • Access thousands of pre-market listings
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
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
            <a href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
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
      <FooterLarge />

      {/* Price Opinion Modal */}
      {showPriceOpinionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPriceOpinionModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-3">
                Opinion Saved!
              </h3>
              <div className="text-5xl font-bold text-orange-600 mb-4">
                {formatMoney(priceOpinion)}
              </div>
              <p className="text-slate-600 mb-6">
                You've left a price opinion for this property
              </p>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 mb-6 border border-orange-200">
              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Want to See More Exclusive Properties?
              </h4>
              <p className="text-sm text-slate-700 mb-4">
                Download the Premarket app to view <strong>exclusive properties not found on Domain, Realestate.com.au or anywhere else</strong>. No obligation, completely free!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Image
                    src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
                    alt="Download on the App Store"
                    width={140}
                    height={47}
                  />
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Image
                    src="https://www.airtasker.com/images/homepage/google-play-2022.svg"
                    alt="Get it on Google Play"
                    width={140}
                    height={47}
                  />
                </a>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h4 className="font-bold text-slate-800 mb-3 text-center">
                Seriously Interested in This Property?
              </h4>
              <p className="text-sm text-slate-600 mb-4 text-center">
                Register your interest to be <strong>first in line</strong> when they decide to go to market
              </p>
              <button
                onClick={handleRegisterInterest}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>Register My Interest</span>
              </button>
              <p className="text-xs text-center text-slate-500 mt-3">
                Optional • We'll only notify you about this specific property
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Qualification Modal */}
      {showQualificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowQualificationModal(false);
                setRegisterInterest(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                You Expressed Your Interest
              </h3>
              <p className="text-slate-600">
                Help us understand your circumstance to better facilitate
              </p>
            </div>

            <div className="space-y-6">
              {/* First Home Buyer Toggle */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold text-slate-800">
                    Are you a first home buyer?
                  </span>
                  <input
                    type="checkbox"
                    checked={qualificationData.isFirstHomeBuyer}
                    onChange={(e) => setQualificationData({
                      ...qualificationData,
                      isFirstHomeBuyer: e.target.checked
                    })}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                  />
                </label>
              </div>

              {/* Investor Toggle */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-semibold text-slate-800">
                    Are you an investor?
                  </span>
                  <input
                    type="checkbox"
                    checked={qualificationData.isInvestor}
                    onChange={(e) => setQualificationData({
                      ...qualificationData,
                      isInvestor: e.target.checked
                    })}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                  />
                </label>
              </div>

              {/* Buyer Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-3">
                  Are you a cash buyer or have approved finance? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'cash', label: 'Cash Buyer' },
                    { value: 'approved_finance', label: 'Approved Finance' },
                    { value: 'pre_approval', label: 'Pre-Approval' },
                    { value: 'not_yet', label: 'Not Yet' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setQualificationData({
                        ...qualificationData,
                        buyerType: option.value
                      })}
                      className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                        qualificationData.buyerType === option.value
                          ? 'border-orange-600 bg-orange-50 text-orange-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seriousness Level */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-3">
                  How serious are you about this property? *
                </label>
                <select
                  value={qualificationData.seriousnessLevel}
                  onChange={(e) => setQualificationData({
                    ...qualificationData,
                    seriousnessLevel: e.target.value
                  })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-slate-800"
                >
                  <option value="">Select your interest level</option>
                  <option value="just_browsing">Just Browsing</option>
                  <option value="interested">Interested</option>
                  <option value="very_interested">Very Interested</option>
                  <option value="ready_to_buy">Ready to Buy</option>
                </select>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleQualificationSubmit}
                disabled={!qualificationData.buyerType || !qualificationData.seriousnessLevel}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Continue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowSignupModal(false);
                setShowThankYou(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {showThankYou ? (
              <div className="text-center">
                <h3 className="text-3xl font-bold text-slate-800 mb-3">
                  Thank You!
                </h3>
                <p className="text-lg text-slate-600 mb-6">
                  Your account has been created successfully. Download the app to discover more exclusive pre-market properties.
                </p>

                <div className="bg-teal-50 mb-6 text-left text-teal-700 rounded-lg p-4 text-sm leading-relaxed">
                  <strong className="block text-lg mb-1">Are you a homeowner/investor?</strong>
                  <p className="mb-3 text-xs">
                    Did you know you can run your own <strong>Premarket campaign for FREE</strong>?  
                    Get the confidence you need before committing to an agent.
                  </p>

                  <ul className="list-disc text-xs list-inside space-y-1">
                    <li className="mb-3"><strong>Leasing a property?</strong> No worries — Premarket means no intrusive marketing and no scaring tenants.</li>
                    <li className="mb-3"><strong>Curious about your property's true value?</strong> Skip the generic market reports and get real interest directly from buyers.</li>
                    <li className="mb-3"><strong>Completely free.</strong> Set up and go live in minutes with your own premarket campaign.</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
                  <h4 className="font-bold text-slate-800 mb-3">Download Premarket App</h4>
                  <div className="flex flex-col gap-3">
                    <a href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mx-auto"
                    >
                      <Image
                        src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
                        alt="Download on the App Store"
                        width={160}
                        height={53}
                      />
                    </a>
                    <a href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mx-auto"
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

                <p className="text-sm text-slate-500">
                  Access exclusive properties before they hit the market
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    Create Your Account
                  </h3>
                  <p className="text-slate-600">
                    Get notified when this property goes to market
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
                        className="text-gray-900 placeholder-gray-300 w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
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
                        className="text-gray-900 placeholder-gray-300 w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
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
                      className="text-gray-900 placeholder-gray-300 w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
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
                      className="text-gray-900 placeholder-gray-300 w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
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
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Creating Account...' : 'Create Account'}
                  </button>
                </form>

                <p className="text-xs text-center text-slate-500 mt-4">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
              </>
            )}
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
          border: 3px solid #ea580c;
        }

        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 3px solid #ea580c;
        }
      `}</style>
    </div>
  );
}