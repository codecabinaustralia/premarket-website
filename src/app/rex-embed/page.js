'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/clientApp';
import {
  Eye,
  MessageSquare,
  Heart,
  TrendingUp,
  DollarSign,
  Users,
  ExternalLink,
  Loader2,
  Home,
  AlertCircle,
  Import,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[11px] text-slate-500 font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function RexEmbedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading...</p>
        </div>
      </div>
    }>
      <RexEmbedContent />
    </Suspense>
  );
}

function RexEmbedContent() {
  const searchParams = useSearchParams();
  const recordId = searchParams.get('record_id');
  const recordType = searchParams.get('type') || 'listing';

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [propertyId, setPropertyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!recordId) {
      setLoading(false);
      setError('No record ID provided');
      return;
    }

    async function lookupProperty() {
      try {
        const propsRef = collection(db, 'properties');
        const q = query(propsRef, where('integrations.rex.listingId', '==', recordId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setProperty(doc.data());
          setPropertyId(doc.id);
        }
      } catch (err) {
        console.error('Error looking up property:', err);
        setError('Failed to load property data');
      } finally {
        setLoading(false);
      }
    }

    lookupProperty();
  }, [recordId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading property data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-xs">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Property not found — show import CTA
  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-xs">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Home className="w-6 h-6 text-orange-500" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Not on Premarket yet</h2>
          <p className="text-xs text-slate-500 mb-4">
            Import this listing to Premarket to start collecting buyer opinions, price insights, and engagement metrics.
          </p>
          <a
            href={`/dashboard/integrations`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#e48900] to-[#c64500] rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
          >
            <Import className="w-4 h-4" />
            Import to Premarket
          </a>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-400">Powered by Premarket</p>
          </div>
        </div>
      </div>
    );
  }

  // Property found — show compact report
  const stats = property.stats || {};
  const views = stats.views || 0;
  const opinions = stats.opinions || stats.priceOpinions || 0;
  const likes = stats.likes || stats.favourites || 0;
  const price = property.price;
  const isLive = property.visibility === true;

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
          isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {isLive ? 'Live on Premarket' : 'Draft'}
        </span>
        {propertyId && (
          <a
            href={`/dashboard/property/${propertyId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
          >
            Full Report <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Property Title */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-900 truncate">{property.title || property.formattedAddress}</h2>
        <p className="text-xs text-slate-500 truncate">{property.formattedAddress}</p>
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard icon={Eye} label="Views" value={views} color="text-blue-500" />
        <StatCard icon={MessageSquare} label="Opinions" value={opinions} color="text-purple-500" />
        <StatCard icon={Heart} label="Likes" value={likes} color="text-red-500" />
      </div>

      {/* Price Card */}
      {price > 0 && (
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] text-slate-500 font-medium">Listed Price</span>
          </div>
          <p className="text-lg font-bold text-slate-900">${price.toLocaleString('en-AU')}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {propertyId && (
          <>
            <a
              href={`/dashboard/property/${propertyId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-3 py-2.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              View Full Report
            </a>
            <a
              href={`/dashboard/property/${propertyId}/report`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Send Report
            </a>
          </>
        )}
      </div>

      {/* Powered by */}
      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400">Powered by Premarket</p>
      </div>
    </div>
  );
}
