'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '../firebase/clientApp';
import { collection, query, where, orderBy, getDocs, limit, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import Nav from '../components/Nav';
import FooterLarge from '../components/FooterLarge';
import Link from 'next/link';

export default function PropertiesDirectory() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef(null);

  // Filter states
  const [filters, setFilters] = useState({
    propertyType: 'all', // all, house, apartment
    minPrice: '',
    maxPrice: '',
    bedrooms: 'any',
    sortBy: 'newest', // newest, oldest, priceHigh, priceLow
  });

  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      // Build query
      let q = query(
        collection(db, 'properties'),
        where('active', '==', true),
        where('visibility', '==', true),
        limit(50)
      );

      // Apply property type filter
      if (filters.propertyType !== 'all') {
        const typeValue = filters.propertyType === 'house' ? 0 : 1;
        q = query(q, where('propertyType', '==', typeValue));
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'newest':
          q = query(q, orderBy('created', 'desc'));
          break;
        case 'oldest':
          q = query(q, orderBy('created', 'asc'));
          break;
        case 'priceHigh':
          q = query(q, orderBy('price', 'desc'));
          break;
        case 'priceLow':
          q = query(q, orderBy('price', 'asc'));
          break;
        default:
          q = query(q, orderBy('created', 'desc'));
      }

      const snapshot = await getDocs(q);
      let propertiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply client-side filters
      if (filters.minPrice) {
        propertiesData = propertiesData.filter(p => {
          const price = parsePrice(p.price);
          return price >= Number(filters.minPrice);
        });
      }

      if (filters.maxPrice) {
        propertiesData = propertiesData.filter(p => {
          const price = parsePrice(p.price);
          return price <= Number(filters.maxPrice);
        });
      }

      if (filters.bedrooms !== 'any') {
        propertiesData = propertiesData.filter(p => {
          return p.bedrooms >= Number(filters.bedrooms);
        });
      }

      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const parsePrice = (priceValue) => {
    if (!priceValue) return 0;
    if (typeof priceValue === 'number') return priceValue;
    if (typeof priceValue === 'string') {
      const cleaned = priceValue.replace(/[^\d.]/g, '');
      return parseFloat(cleaned) || 0;
    }
    return 0;
  };

  const formatMoney = (val) => {
    if (!val) return '$0';
    const price = parsePrice(val);
    return `$${Math.round(price).toLocaleString()}`;
  };

  const formatCompact = (val) => {
    const price = parsePrice(val);
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toFixed(0)}`;
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollPosition = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollPosition / itemHeight);
    
    if (newIndex !== currentIndex && newIndex < properties.length) {
      setCurrentIndex(newIndex);
    }
  };

  const scrollToProperty = (index) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const itemHeight = container.clientHeight;
    container.scrollTo({
      top: index * itemHeight,
      behavior: 'smooth'
    });
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
    setCurrentIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  const resetFilters = () => {
    const defaultFilters = {
      propertyType: 'all',
      minPrice: '',
      maxPrice: '',
      bedrooms: 'any',
      sortBy: 'newest',
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setShowFilters(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Nav />
        <div className="flex flex-col items-center justify-center h-[80vh] px-4">
          <div className="text-center">
            <svg className="w-24 h-24 text-gray-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">No properties found</h2>
            <p className="text-gray-400 mb-6">Try adjusting your filters</p>
            <button
              onClick={resetFilters}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-full transition-all"
            >
              Reset Filters
            </button>
          </div>
        </div>
        <FooterLarge />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Fixed Navigation */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <Nav />
      </div>

      {/* Filter Button - Fixed Top Right */}
      <button
        onClick={() => setShowFilters(true)}
        className="fixed top-24 right-4 z-40 bg-gray-800/90 backdrop-blur-sm hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>

      {/* Property Counter - Fixed Top Left */}
      <div className="fixed top-24 left-4 z-40 bg-gray-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg">
        <span className="font-bold">{currentIndex + 1}</span>
        <span className="text-gray-400"> / {properties.length}</span>
      </div>

      {/* Scroll Navigation Dots - Fixed Right Side */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 flex flex-col gap-2">
        {properties.slice(Math.max(0, currentIndex - 2), Math.min(properties.length, currentIndex + 3)).map((_, idx) => {
          const actualIndex = Math.max(0, currentIndex - 2) + idx;
          return (
            <button
              key={actualIndex}
              onClick={() => scrollToProperty(actualIndex)}
              className={`w-2 h-2 rounded-full transition-all ${
                actualIndex === currentIndex
                  ? 'bg-orange-600 scale-150'
                  : 'bg-gray-600 hover:bg-gray-400'
              }`}
            />
          );
        })}
      </div>

      {/* Main Content - Desktop Layout */}
      <div className="h-screen flex">
        {/* Left: Main Scroll Container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full lg:w-2/3 h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {properties.map((property, index) => (
            <PropertyCard
              key={property.id}
              property={property}
              isActive={index === currentIndex}
              formatMoney={formatMoney}
              formatCompact={formatCompact}
            />
          ))}
        </div>

        {/* Right: Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden lg:block w-1/3 h-screen bg-gray-900 border-l border-gray-800 overflow-y-auto">
          <DesktopSidebar 
            property={properties[currentIndex]}
            formatMoney={formatMoney}
            formatCompact={formatCompact}
            totalProperties={properties.length}
            currentIndex={currentIndex}
          />
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filter Content */}
            <div className="p-6 space-y-6">
              {/* Property Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Property Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'house', label: 'House' },
                    { value: 'apartment', label: 'Apartment' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTempFilters({ ...tempFilters, propertyType: option.value })}
                      className={`py-3 rounded-lg font-semibold transition-all ${
                        tempFilters.propertyType === option.value
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={tempFilters.minPrice}
                    onChange={(e) => setTempFilters({ ...tempFilters, minPrice: e.target.value })}
                    className="bg-gray-700 text-white placeholder-gray-400 px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={tempFilters.maxPrice}
                    onChange={(e) => setTempFilters({ ...tempFilters, maxPrice: e.target.value })}
                    className="bg-gray-700 text-white placeholder-gray-400 px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Minimum Bedrooms
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {['any', '1', '2', '3', '4+'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setTempFilters({ 
                        ...tempFilters, 
                        bedrooms: option === '4+' ? '4' : option 
                      })}
                      className={`py-3 rounded-lg font-semibold transition-all ${
                        tempFilters.bedrooms === (option === '4+' ? '4' : option)
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Sort By
                </label>
                <select
                  value={tempFilters.sortBy}
                  onChange={(e) => setTempFilters({ ...tempFilters, sortBy: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="priceHigh">Price: High to Low</option>
                  <option value="priceLow">Price: Low to High</option>
                </select>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 grid grid-cols-2 gap-3">
              <button
                onClick={resetFilters}
                className="py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PriceOpinionSlider({ property, formatMoney, formatCompact }) {
  const [priceOpinion, setPriceOpinion] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [savedOfferId, setSavedOfferId] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    if (!property) return;
    
    const { min, max } = computeInitialRange(property);
    setMinPrice(min);
    setMaxPrice(max);
    
    // Set initial value to midpoint
    const mid = Math.round(((min + max) / 2) / 1000) * 1000;
    setPriceOpinion(mid);
  }, [property]);

  // Save price opinion when slider is released
  useEffect(() => {
    if (!isSliding && priceOpinion > 0 && property?.id) {
      savePriceOpinion();
    }
  }, [isSliding]);

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

    let basePrice = toDouble(data.price);
    
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
    
    if (basePrice === 0) {
      basePrice = 1000000;
    }

    const min = Math.round((basePrice * 0.75) / 1000) * 1000;
    const max = Math.round((basePrice * 1.25) / 1000) * 1000;

    return { min, max };
  };

  const getSessionId = () => {
    if (typeof window === 'undefined') return null;
    
    let sessionId = sessionStorage.getItem('premarketSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('premarketSessionId', sessionId);
    }
    return sessionId;
  };

  const savePriceOpinion = async () => {
    try {
      const sessionId = getSessionId();
      
      const offerData = {
        type: 'opinion',
        propertyId: property.id,
        sessionId: sessionId,
        offerAmount: Math.round(priceOpinion),
        updatedAt: serverTimestamp(),
        fromWeb: true,
      };

      if (savedOfferId) {
        const offerRef = doc(db, 'offers', savedOfferId);
        await updateDoc(offerRef, offerData);
      } else {
        offerData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'offers'), offerData);
        setSavedOfferId(docRef.id);
      }

      setShowThankYou(true);
      setTimeout(() => setShowThankYou(false), 3000);
    } catch (error) {
      console.error('Error saving price opinion:', error);
    }
  };

  if (!property) return null;

  return (
    <div className="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 rounded-xl p-5 border border-orange-800/50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your Price Opinion
          </h3>
          {showThankYou && (
            <div className="flex items-center gap-1 text-green-400 animate-fade-in">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-bold">Saved!</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Help the homeowner understand market sentiment
        </p>

        {/* Big Price Display */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-orange-500 mb-1">
            {formatMoney(priceOpinion)}
          </div>
          <div className="text-xs text-gray-400">
            Drag the slider to adjust
          </div>
        </div>

        {/* Slider */}
        <div className="mb-4">
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
          <div className="flex justify-between mt-2 text-xs">
            <div className="text-left">
              <div className="text-gray-500 font-semibold">Low</div>
              <div className="font-bold text-gray-300">{formatCompact(minPrice)}</div>
            </div>
            <div className="text-right">
              <div className="text-gray-500 font-semibold">High</div>
              <div className="font-bold text-gray-300">{formatCompact(maxPrice)}</div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="space-y-2 mt-4">
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
            <div className="flex items-start gap-2">
              <div className="text-lg">🏡</div>
              <div>
                <h4 className="text-xs font-bold text-white mb-1">Help the Homeowner</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Your opinion gives them confidence to list at the right price
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-900/30 rounded-lg p-3 border border-orange-800/50">
            <div className="flex items-start gap-2">
              <div className="text-lg">⚡</div>
              <div>
                <h4 className="text-xs font-bold text-orange-300 mb-1">Get First Access</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Register interest to be <strong>first in line</strong> when it goes to market
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          💡 No signup required to leave your opinion
        </p>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          border: 2px solid #ea580c;
        }

        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          border: 2px solid #ea580c;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

function DesktopSidebar({ property, formatMoney, formatCompact, totalProperties, currentIndex }) {
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  if (!property) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <p className="text-gray-500">No property selected</p>
      </div>
    );
  }

  const displayPropertyType = property.propertyType === 0 ? 'House' : 
                              property.propertyType === 1 ? 'Apartment' : 
                              'Property';

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

  const propertyData = getNestedValue(property.propertyJob, 'property_data');
  const priceEstimate = getNestedValue(property.propertyJob, 'price_estimate');
  const rentalEstimate = getNestedValue(property.propertyJob, 'rental_estimate');
  const areaStats = getNestedValue(property.propertyJob, 'area_statistics');

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Header */}
    

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pt-24">
        {/* Price Opinion Slider */}
        <PriceOpinionSlider property={property} formatMoney={formatMoney} formatCompact={formatCompact} />

        {/* Description */}
        {property.description && (
          <div>
            <h3 className="text-lg font-bold text-white mb-3">About This Property</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {property.description}
            </p>
          </div>
        )}

        {/* Additional Property Details */}
        {(propertyData?.year_built || propertyData?.land_size) && (
          <div className="grid grid-cols-2 gap-3">
            {propertyData?.year_built && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Year Built</div>
                <div className="text-lg font-bold text-white">{propertyData.year_built}</div>
              </div>
            )}
            {propertyData?.land_size && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Land Size</div>
                <div className="text-lg font-bold text-white">{propertyData.land_size}m²</div>
              </div>
            )}
          </div>
        )}

        {/* Price Estimate */}
        {priceEstimate && (
          <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-xl p-4 border border-purple-800/50">
            <h3 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Price Insights
            </h3>
            {priceEstimate.last_sold_price && (
              <div className="mb-2">
                <div className="text-xs text-purple-300">Last Sold</div>
                <div className="text-xl font-bold text-white">
                  {formatMoney(priceEstimate.last_sold_price)}
                </div>
              </div>
            )}
            {priceEstimate.price_growth_since_last_sold !== undefined && (
              <div className="text-sm">
                <span className={priceEstimate.price_growth_since_last_sold >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {priceEstimate.price_growth_since_last_sold >= 0 ? '+' : ''}{priceEstimate.price_growth_since_last_sold.toFixed(1)}%
                </span>
                <span className="text-gray-400"> since purchase</span>
              </div>
            )}
          </div>
        )}

        {/* Rental Estimate */}
        {rentalEstimate?.estimated_rental_income && (
          <div className="bg-gradient-to-br from-orange-900/30 to-yellow-900/30 rounded-xl p-4 border border-orange-800/50">
            <h3 className="text-sm font-bold text-orange-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Rental Estimate
            </h3>
            <div className="text-2xl font-bold text-white mb-1">
              {formatMoney(rentalEstimate.estimated_rental_income)}/wk
            </div>
            {rentalEstimate.rental_yield && (
              <div className="text-sm text-orange-300">
                Yield: <span className="font-bold">{rentalEstimate.rental_yield.toFixed(2)}%</span>
              </div>
            )}
          </div>
        )}

        {/* Area Statistics */}
        {areaStats && (
          <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-4 border border-blue-800/50">
            <h3 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {areaStats.suburb || 'Area Statistics'}
            </h3>
            <div className="space-y-2">
              {areaStats.median_price && (
                <div>
                  <div className="text-xs text-blue-300">Median Price</div>
                  <div className="text-xl font-bold text-white">
                    {formatMoney(areaStats.median_price)}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {areaStats.past_12_month_growth !== undefined && (
                  <div className="bg-gray-800/50 rounded p-2">
                    <div className="text-xs text-gray-400">12mo Growth</div>
                    <div className="text-sm font-bold text-green-400">
                      {areaStats.past_12_month_growth >= 0 ? '+' : ''}{areaStats.past_12_month_growth.toFixed(1)}%
                    </div>
                  </div>
                )}
                {areaStats.population && (
                  <div className="bg-gray-800/50 rounded p-2">
                    <div className="text-xs text-gray-400">Population</div>
                    <div className="text-sm font-bold text-white">
                      {areaStats.population.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Images */}
        {property.imageUrls && property.imageUrls.length > 1 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-3">More Photos</h3>
            <div className="grid grid-cols-2 gap-2">
              {property.imageUrls.slice(1, 5).map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={url}
                    alt={`${property.title} - ${index + 2}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-6 space-y-3">
        {/* <Link
          href={`/find-property?propertyId=${property.id}`}
          className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg text-center"
        >
          View Full Details
        </Link> */}
        <button
          onClick={() => setShowDownloadModal(true)}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download App</span>
        </button>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Download Premarket
              </h3>
              <p className="text-gray-300 mb-6">
                Get full access to exclusive pre-market properties in the app
              </p>

              <div className="space-y-3 mb-6">
                <a
                  href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Image
                    src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
                    alt="Download on the App Store"
                    width={200}
                    height={60}
                    className="mx-auto"
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
                    width={200}
                    height={60}
                    className="mx-auto"
                  />
                </a>
              </div>

              <p className="text-sm text-gray-400">
                100% free • No hidden fees • Early access to properties
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property, isActive, formatMoney, formatCompact }) {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  const displayPropertyType = property.propertyType === 0 ? 'House' : 
                              property.propertyType === 1 ? 'Apartment' : 
                              'Property';

  return (
    <div className="h-screen snap-start snap-always relative flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        {property.imageUrls && property.imageUrls[0] && (
          <Image
            src={property.imageUrls[0]}
            alt={property.title || property.address}
            fill
            className="object-cover"
            unoptimized
            priority={isActive}
          />
        )}
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-end p-6 pb-8">
        {/* Property Info */}
        <div className="space-y-3">
          {/* Property Type Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full">
            <span className="text-xs font-bold text-white">{displayPropertyType}</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            {property.title || property.address}
          </h2>

          {/* Address */}
          <div className="flex items-center gap-2 text-white/90">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{property.address}</span>
          </div>

          {/* Price */}
          <div className="text-3xl md:text-4xl font-bold text-white">
            {formatMoney(property.price)}
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-3">
            {property.bedrooms && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-md rounded-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm font-bold text-white">{property.bedrooms} Beds</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-md rounded-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                <span className="text-sm font-bold text-white">{property.bathrooms} Baths</span>
              </div>
            )}
            {property.carSpaces && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-md rounded-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <span className="text-sm font-bold text-white">{property.carSpaces} Cars</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Link
              href={`/find-property?propertyId=${property.id}`}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>View Details</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <button
              onClick={() => setShowDownloadModal(true)}
              className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-bold p-4 rounded-xl transition-all shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Download Premarket
              </h3>
              <p className="text-gray-300 mb-6">
                Get full access to exclusive pre-market properties in the app
              </p>

              <div className="space-y-3 mb-6">
                <a
                  href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Image
                    src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
                    alt="Download on the App Store"
                    width={200}
                    height={60}
                    className="mx-auto"
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
                    width={200}
                    height={60}
                    className="mx-auto"
                  />
                </a>
              </div>

              <p className="text-sm text-gray-400">
                100% free • No hidden fees • Early access to properties
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}