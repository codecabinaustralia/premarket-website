'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, MapPin, Building2, Globe, Map } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const TYPE_CONFIG = {
  address: { label: 'Street', icon: Building2, color: 'bg-violet-500/20 text-violet-400' },
  locality: { label: 'Suburb', icon: MapPin, color: 'bg-orange-500/20 text-orange-400' },
  place: { label: 'City', icon: Map, color: 'bg-blue-500/20 text-blue-400' },
  region: { label: 'State', icon: Globe, color: 'bg-emerald-500/20 text-emerald-400' },
  country: { label: 'Country', icon: Globe, color: 'bg-slate-500/20 text-slate-400' },
};

function extractSuburbState(feature) {
  const context = feature.context || [];
  let suburb = null;
  let state = null;

  const placeType = feature.place_type?.[0];

  // If the feature itself is a locality (suburb), use its text
  if (placeType === 'locality') {
    suburb = feature.text;
  }

  for (const ctx of context) {
    if (ctx.id?.startsWith('locality') && !suburb) suburb = ctx.text;
    if (ctx.id?.startsWith('place') && !suburb) suburb = ctx.text;
    if (ctx.id?.startsWith('region')) {
      // Mapbox returns full state name; extract short code if available
      state = ctx.short_code?.replace('AU-', '') || ctx.text;
    }
  }

  // If feature is a place (city), use it as suburb too
  if (!suburb && placeType === 'place') suburb = feature.text;
  // If feature is a region (state), use it
  if (!suburb && placeType === 'region') suburb = feature.text;

  return { suburb, state };
}

export default function LocationSearch({ onLocationSelect, searchRadius, onRadiusChange }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Fetch suggestions with 300ms debounce
  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.length < 2 || !MAPBOX_TOKEN) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?` +
        `access_token=${MAPBOX_TOKEN}&country=au&types=address,locality,place,region&limit=5`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
      setShowDropdown(true);
      setHighlightIndex(-1);
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, fetchSuggestions]);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSuggestion = useCallback((feature) => {
    const placeType = feature.place_type?.[0] || 'locality';
    const { suburb, state } = extractSuburbState(feature);

    const location = {
      name: feature.text,
      placeName: feature.place_name,
      lat: feature.center[1],
      lng: feature.center[0],
      placeType,
      suburb,
      state,
    };

    setQuery(feature.place_name);
    setShowDropdown(false);
    setSuggestions([]);
    onLocationSelect(location);
  }, [onLocationSelect]);

  const handleKeyDown = (e) => {
    if (!showDropdown || !suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        selectSuggestion(suggestions[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative" ref={containerRef}>
          <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2 z-10" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) {
                setSuggestions([]);
                setShowDropdown(false);
              }
            }}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search street, suburb, city, or state..."
            className="w-full pl-8 pr-2.5 py-2 rounded-md border border-slate-700 bg-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50"
          />

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {showDropdown && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50"
              >
                {suggestions.map((feature, i) => {
                  const placeType = feature.place_type?.[0] || 'locality';
                  const config = TYPE_CONFIG[placeType] || TYPE_CONFIG.locality;
                  const Icon = config.icon;

                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => selectSuggestion(feature)}
                      onMouseEnter={() => setHighlightIndex(i)}
                      className={`w-full px-3 py-2.5 text-left flex items-start gap-2.5 transition-colors ${
                        i === highlightIndex ? 'bg-slate-700/70' : 'hover:bg-slate-700/40'
                      } ${i !== suggestions.length - 1 ? 'border-b border-slate-700/50' : ''}`}
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-200 truncate">
                            {feature.text}
                          </span>
                          <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {feature.place_name}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={searchRadius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="text-[10px] font-mono border border-slate-700 bg-slate-800 text-slate-400 rounded-md px-1.5 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          >
            <option value={2}>2km</option>
            <option value={5}>5km</option>
            <option value={10}>10km</option>
            <option value={20}>20km</option>
          </select>
        </div>
      </div>
    </div>
  );
}
