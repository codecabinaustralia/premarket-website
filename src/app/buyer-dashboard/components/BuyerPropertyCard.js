'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Bed, Bath, Car, MapPin } from 'lucide-react';
import LikeButton from '../../components/LikeButton';

function formatPrice(price) {
  if (!price) return 'Price on request';
  const n = Number(price);
  if (Number.isNaN(n)) return price;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

export default function BuyerPropertyCard({ property, delay = 0 }) {
  if (!property) return null;
  const image = property.imageUrls?.[0];
  const address =
    property.showSuburbOnly
      ? property.address || property.suburb || 'Suburb'
      : property.formattedAddress || property.address || 'Address unavailable';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm shadow-slate-900/[0.03] hover:shadow-xl hover:shadow-slate-900/[0.08] hover:border-slate-300 transition-shadow"
    >
      <Link
        href={`/find-property?propertyId=${property.id}`}
        className="block"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="relative aspect-[4/3] bg-slate-100">
          {image ? (
            <Image
              src={image}
              alt={address}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <MapPin className="w-10 h-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>

      <div className="absolute top-4 right-4">
        <LikeButton propertyId={property.id} size="sm" variant="overlay" />
      </div>

      <div className="p-5">
        {property.title && (
          <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1.5 truncate">
            {property.title}
          </div>
        )}
        <div className="text-base font-semibold text-slate-900 truncate mb-2">
          {address}
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 mb-4">
          {formatPrice(property.price)}
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
          {property.bedrooms != null && (
            <span className="inline-flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-slate-400" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="inline-flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-slate-400" />
              {property.bathrooms}
            </span>
          )}
          {property.carSpaces != null && (
            <span className="inline-flex items-center gap-1.5">
              <Car className="w-4 h-4 text-slate-400" />
              {property.carSpaces}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
