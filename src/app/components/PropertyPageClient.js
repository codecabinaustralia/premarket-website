'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function PropertyPageClient() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    const fetchProperty = async () => {
      try {
        const docRef = doc(db, 'properties', propertyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProperty({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900"></div>
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
    imageUrls = []
  } = property;

  const formatPrice = (val) => {
    if (!val) return null;
    return `$${parseInt(val.replace(/,/g, '')).toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-white shadow">
        <Image
          src="https://premarket.homes/assets/logo.png"
          alt="Premarket Logo"
          width={160}
          height={40}
          unoptimized
        />
      </div>

      {/* Video or Image */}
      <div className="relative w-full max-h-[500px] overflow-hidden">
        {videoUrl ? (
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            controls
            autoPlay
            muted
            loop
          />
        ) : imageUrls.length > 0 ? (
          <Image
            src={imageUrls[0]}
            alt={title}
            width={1200}
            height={500}
            className="w-full h-[500px] object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-[400px] bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">No Media Available</span>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg -mt-12 relative z-10">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{address}</p>

        <div className="flex flex-wrap gap-2 mt-4 text-gray-700">
          {bedrooms && <span className="tag">🛏 {bedrooms} Beds</span>}
          {bathrooms && <span className="tag">🛁 {bathrooms} Baths</span>}
          {carSpaces && <span className="tag">🚗 {carSpaces} Cars</span>}
          {squareFootage && <span className="tag">📐 {squareFootage} m²</span>}
        </div>

        {price && (
          <p className="text-2xl font-semibold text-teal-600 mt-4">
            {formatPrice(price)}
          </p>
        )}

        {/* Description */}
        <div className="relative mt-6">
          <p
            className={`text-gray-700 leading-relaxed transition-all ${
              showFullDescription ? '' : 'line-clamp-5'
            }`}
          >
            {description}
          </p>
          {!showFullDescription && (
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>
        <button
          className="text-teal-600 mt-2 font-semibold"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? 'Show Less' : 'Read More'}
        </button>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto mt-12 bg-teal-600 text-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Exclusive on Premarket</h2>
        <p className="text-lg mb-6">
          Download the Premarket app and see properties before they even hit the market.
        </p>

        <div className="flex justify-center space-x-4">
          <a href="https://apps.apple.com/au/app/premarket-homes/id6742205449" target="_blank" rel="noopener noreferrer">
            <Image
              src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
              alt="Download on the App Store"
              width={150}
              height={50}
            />
          </a>
          <a href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en" target="_blank" rel="noopener noreferrer">
            <Image
              src="https://www.airtasker.com/images/homepage/google-play-2022.svg"
              alt="Get it on Google Play"
              width={150}
              height={50}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
