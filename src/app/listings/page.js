'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { db } from '../firebase/clientApp';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import Nav from '../components/Nav';
import AgentFooter from '../components/AgentFooter';

const PROPERTY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'House', label: 'House' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Land', label: 'Land' },
];

const BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5+' },
];

const PRICE_RANGES = [
  { value: '', label: 'Any Price' },
  { value: '0-500000', label: 'Under $500K' },
  { value: '500000-750000', label: '$500K - $750K' },
  { value: '750000-1000000', label: '$750K - $1M' },
  { value: '1000000-1500000', label: '$1M - $1.5M' },
  { value: '1500000-2000000', label: '$1.5M - $2M' },
  { value: '2000000-', label: '$2M+' },
];

// Animated education cards data
const BUYER_EDUCATION = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Exclusive Access",
    description: "These properties aren't on Domain or REA yet. You're seeing them before anyone else.",
    color: "from-orange-500 to-amber-500"
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Ready to Sell",
    description: "Every property is fully prepared. The owner is serious and testing market interest first.",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "First in Line",
    description: "Register interest now and be first to inspect when the property goes to market.",
    color: "from-violet-500 to-purple-500"
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Zero Obligation",
    description: "Share your price opinion freely. No commitments, no pressure, no sales calls.",
    color: "from-blue-500 to-cyan-500"
  }
];

function ListingsContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suburbs, setSuburbs] = useState([]);
  const [showAllSuburbs, setShowAllSuburbs] = useState(false);
  const [activeEducationCard, setActiveEducationCard] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuburb, setSelectedSuburb] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [minBedrooms, setMinBedrooms] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Initialize search from URL params
  useEffect(() => {
    const address = searchParams.get('address');
    const suburb = searchParams.get('suburb');
    if (address) setSearchQuery(address);
    if (suburb) setSelectedSuburb(suburb);
  }, [searchParams]);

  // Auto-rotate education cards
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveEducationCard((prev) => (prev + 1) % BUYER_EDUCATION.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mapbox geocoding autocomplete
  const fetchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&` +
        `country=au&` +
        `types=locality,place,neighborhood,address&` +
        `limit=5`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Debounce search input for autocomplete
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion) => {
    const placeName = suggestion.place_name.split(',')[0]; // Get first part (suburb name)
    setSearchQuery(placeName);
    setShowSuggestions(false);
  };

  // Fetch all properties
  const fetchProperties = async () => {
    setLoading(true);
    try {
      // Simple query - filter active properties
      const q = query(
        collection(db, 'properties'),
        where('active', '==', true)
      );

      const snapshot = await getDocs(q);
      console.log('Fetched properties:', snapshot.docs.length);

      // Filter visibility client-side and sort by created
      const docs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(doc => doc.visibility === true)
        .sort((a, b) => {
          const aTime = a.created?.toMillis?.() || 0;
          const bTime = b.created?.toMillis?.() || 0;
          return bTime - aTime;
        });

      console.log('Filtered properties:', docs.length);
      setProperties(docs);

      // Extract unique suburbs
      const suburbSet = new Set();
      docs.forEach(p => {
        const suburb = p.location?.suburb;
        if (suburb) suburbSet.add(suburb);
      });
      setSuburbs(Array.from(suburbSet).sort());
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Filter properties
  useEffect(() => {
    let filtered = [...properties];

    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(search) ||
        p.address?.toLowerCase().includes(search) ||
        p.location?.suburb?.toLowerCase().includes(search)
      );
    }

    if (selectedSuburb) {
      filtered = filtered.filter(p =>
        p.location?.suburb?.toLowerCase() === selectedSuburb.toLowerCase()
      );
    }

    if (propertyType) {
      filtered = filtered.filter(p => {
        const pType = p.propertyType === 0 ? 'House' : p.propertyType === 1 ? 'Apartment' : p.propertyJob?.property_data?.property_type;
        return pType?.toLowerCase() === propertyType.toLowerCase();
      });
    }

    if (minBedrooms) {
      filtered = filtered.filter(p => (p.bedrooms || 0) >= parseInt(minBedrooms));
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(v => v ? parseInt(v) : null);
      filtered = filtered.filter(p => {
        const price = parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0;
        if (min && price < min) return false;
        if (max && price > max) return false;
        return true;
      });
    }

    setFilteredProperties(filtered);
  }, [properties, searchQuery, selectedSuburb, propertyType, minBedrooms, priceRange]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSuburb('');
    setPropertyType('');
    setMinBedrooms('');
    setPriceRange('');
  };

  const activeFilterCount = [selectedSuburb, propertyType, minBedrooms, priceRange].filter(Boolean).length;

  const formatPrice = (price) => {
    if (!price) return 'Price on Application';
    const num = parseFloat(String(price).replace(/[^0-9.]/g, ''));
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toLocaleString()}`;
  };

  const displayedSuburbs = showAllSuburbs ? suburbs : suburbs.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />

      {/* Hero Section with Full-Width Gradient */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Background gradient decorations */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-4">
            <ol className="flex items-center gap-2 text-sm text-slate-400">
              <li>
                <a href="/" className="hover:text-white transition-colors">Home</a>
              </li>
              <li>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li className="text-white font-medium">Pre-Market Listings</li>
            </ol>
          </nav>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
              Exclusive <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">Pre-Market</span> Properties
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Browse properties before they hit Domain or REA. Get early access and be first in line.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative" ref={searchInputRef}>
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by suburb, address, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />

                {/* Autocomplete Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                    >
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors flex items-start gap-3 ${
                            index !== suggestions.length - 1 ? 'border-b border-slate-100' : ''
                          }`}
                        >
                          <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <div className="font-medium text-slate-900">
                              {suggestion.text || suggestion.place_name.split(',')[0]}
                            </div>
                            <div className="text-sm text-slate-500 truncate">
                              {suggestion.place_name}
                            </div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
              >
                Search
              </button>
            </div>
          </motion.form>

          {/* Suburb Quick Links */}
          {suburbs.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 text-center"
            >
              <span className="text-slate-400 text-sm mr-2">Popular:</span>
              {displayedSuburbs.map((suburb) => (
                <button
                  key={suburb}
                  onClick={() => setSelectedSuburb(selectedSuburb === suburb ? '' : suburb)}
                  className={`inline-block px-3 py-1 mr-2 mb-2 text-sm rounded-full transition-all ${
                    selectedSuburb === suburb
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {suburb}
                </button>
              ))}
              {suburbs.length > 5 && (
                <button
                  onClick={() => setShowAllSuburbs(!showAllSuburbs)}
                  className="text-orange-400 hover:text-orange-300 text-sm font-medium"
                >
                  {showAllSuburbs ? 'Show less' : `+${suburbs.length - 5} more`}
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 lg:top-20 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center gap-3 flex-wrap">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {PROPERTY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>

              <select
                value={minBedrooms}
                onChange={(e) => setMinBedrooms(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Bedrooms</option>
                {BEDROOM_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {PRICE_RANGES.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-orange-600 hover:text-orange-700 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="text-slate-600 text-sm">
              <span className="font-semibold text-slate-900">{filteredProperties.length}</span> properties
            </div>
          </div>

          {/* Mobile Filters Dropdown */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-3"
              >
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  {PROPERTY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>

                <select
                  value={minBedrooms}
                  onChange={(e) => setMinBedrooms(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="">Bedrooms</option>
                  {BEDROOM_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="col-span-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  {PRICE_RANGES.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="col-span-2 py-2 text-orange-600 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content - 2/3 Grid + Sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Property Grid - 2/3 */}
          <div className="lg:w-2/3">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No properties found</h3>
                <p className="text-slate-600 mb-6">Try adjusting your filters or search criteria</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-bold rounded-xl"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                {filteredProperties.map((property, index) => (
                  <motion.a
                    key={property.id}
                    href={`/find-property?propertyId=${property.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.03 }}
                    className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="aspect-[16/10] relative overflow-hidden">
                      {property.imageUrls?.[0] ? (
                        <Image
                          src={property.imageUrls[0]}
                          alt={property.title || 'Property'}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                          <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white rounded-full text-xs font-bold shadow-lg">
                          Pre-Market
                        </span>
                      </div>
                      {property.price && (
                        <div className="absolute bottom-3 right-3">
                          <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-slate-900 rounded-lg text-sm font-bold shadow-lg">
                            {formatPrice(property.price)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 text-lg mb-1 truncate group-hover:text-orange-600 transition-colors">
                        {property.title || 'Untitled Property'}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3 truncate flex items-center gap-1">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {property.showSuburbOnly
                          ? (property.address?.split(',')[1]?.trim() || property.location?.suburb || 'Suburb unavailable')
                          : (property.address || 'Address unavailable')}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-700">
                        {property.bedrooms && (
                          <span className="flex items-center gap-1">
                            <span className="font-semibold">{property.bedrooms}</span> bed
                          </span>
                        )}
                        {property.bathrooms && (
                          <span className="flex items-center gap-1">
                            <span className="font-semibold">{property.bathrooms}</span> bath
                          </span>
                        )}
                        {property.carSpaces && (
                          <span className="flex items-center gap-1">
                            <span className="font-semibold">{property.carSpaces}</span> car
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - 1/3 */}
          <div className="lg:w-1/3 space-y-6">
            {/* Animated Education Cards */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">What is Pre-Market?</h3>
              </div>
              <div className="p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeEducationCard}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4"
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${BUYER_EDUCATION[activeEducationCard].color} flex items-center justify-center text-white mb-4`}>
                      {BUYER_EDUCATION[activeEducationCard].icon}
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">{BUYER_EDUCATION[activeEducationCard].title}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{BUYER_EDUCATION[activeEducationCard].description}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Dots indicator */}
                <div className="flex justify-center gap-2 mt-4">
                  {BUYER_EDUCATION.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveEducationCard(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === activeEducationCard ? 'w-6 bg-orange-500' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Why Homeowners Use Premarket */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-2xl" />
              </div>
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-3">Why Homeowners Use Premarket</h3>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Test market interest before publicly listing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Find serious buyers without open homes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Gauge real buyer price expectations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Sell faster with qualified leads</span>
                  </li>
                </ul>
                <p className="text-xs text-slate-400 mt-4">
                  This means properties here are <strong className="text-white">serious listings</strong> from motivated sellers.
                </p>
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
              <h3 className="font-bold text-slate-900 text-lg mb-2">Get Notified First</h3>
              <p className="text-slate-600 text-sm mb-4">
                Create a free account and be the first to know when new pre-market properties become available.
              </p>
              <a
                href="/register"
                className="block w-full text-center py-3 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Create Free Account
              </a>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Platform Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-orange-600">{properties.length}</div>
                  <div className="text-xs text-slate-600">Active Listings</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-orange-600">{suburbs.length}</div>
                  <div className="text-xs text-slate-600">Suburbs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AgentFooter />
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
