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

  const numericPrice = price ? parseInt(price.replace(/,/g, '')) : null;
  const minPrice = numericPrice ? Math.round(numericPrice * 0.75) : null;
  const maxPrice = numericPrice ? Math.round(numericPrice * 1.25) : null;

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

        {/* Store buttons - hidden on desktop */}
        <div className="hidden md:flex space-x-4">
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

      {/* Video or Image with overlay CTA */}
      <div className="relative w-full max-h-[700px] overflow-hidden">
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
            className="w-full h-[700px] object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-[400px] bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">No Media Available</span>
          </div>
        )}

        {/* CTA Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-xl mt-6 md:text-xl font-bold inter text-white drop-shadow-lg">
            Have you tried Premarket yet?
          </h2>
          <h2 className="text-4xl md:text-7xl font-bold interBold text-white drop-shadow-lg">
            Unlock Exclusive Access <br /> to Properties Before <br /> They Hit the Market
          </h2>
          <h2 className="text-xl mt-6 md:text-xl font-bold inter text-white drop-shadow-lg">
            Just like this one
          </h2>

          {/* Valuation Gradient in Header */}
          {minPrice && maxPrice && (
            <div className="mt-6 w-3/4 max-w-xl">
              <div className="relative w-full h-6 rounded-full bg-gradient-to-r from-orange-400 via-yellow-400 to-green-500">
                {/* Midpoint indicator */}
                <div
                  className="absolute top-0 h-6 w-1 bg-white rounded-full"
                  style={{ left: '50%' }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-white mt-2 font-semibold">
                <span>{formatPrice(minPrice.toString())}</span>
                <span>{formatPrice(maxPrice.toString())}</span>
              </div>
              <p className="text-center mt-4 font-bold text-white drop-shadow">
                Give your evaluation by downloading Premarket
              </p>
            </div>
          )}
        </div>
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

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto mt-12 bg-teal-600 text-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Exclusive on Premarket</h2>
        <p className="text-lg mb-6">
          Download the Premarket app and see properties, videos and images before they even hit the market.
        </p>

        <div className="flex justify-center space-x-4">
          <a
            href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
              alt="Download on the App Store"
              width={150}
              height={50}
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
              width={150}
              height={50}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
