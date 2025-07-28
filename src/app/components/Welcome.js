'use client';
import { useModal } from '../context/ModalContext';
import { useState } from 'react';

export default function Welcome() {
  const { setShowModal } = useModal();
  const [showVideo, setShowVideo] = useState(false);

  const openVideo = () => setShowVideo(true);
  const closeVideo = () => setShowVideo(false);

  return (
    <section className="bg-white py-20 relative">
      <div className="container mx-auto px-8 sm:px-20">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mt-4 sm:mt-0 order-2 sm:order-1 md:w-1/2 sm:p-8 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              We run 30 day campaigns for properties that aren’t on the market — and send them directly to our buyer network.
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Campaigns are designed to provide a safe, no-obligation environment so serious buyers can express interest and make real offers on homes before they hit the market.
              Homeowners get to test demand, gauge their property's true value, and even sell — without the broken promises of a traditional real estate listing.
            </p>
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-blue-700 font-bold cursor-pointer hover:bg-blue-900 text-white px-6 py-3 rounded-lg transition">
              Start your free 30 day campaign
            </button>
          </div>

          <div className="sm:order-2 md:w-1/2 sm:px-10 -mt-10 relative">
            <img
              src="assets/video.png"
              className="cursor-pointer shadow-lg mx-auto w-full rounded-lg object-cover"
              alt='video'
              onClick={openVideo}
            />
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {showVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="relative w-full max-w-3xl">
            <button 
              onClick={closeVideo}
              className="absolute cursor-pointer -top-10 right-0 text-white text-3xl font-bold">
              &times;
            </button>
            <iframe
              width="100%"
              height="500"
              src="https://www.youtube.com/embed/JXvNfwjWEC0?autoplay=1"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="rounded-lg shadow-lg"
            ></iframe>
          </div>
        </div>
      )}
    </section>
  );
}
