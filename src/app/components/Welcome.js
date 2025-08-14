'use client';
import { useModal } from '../context/ModalContext';
import { useState } from 'react';

export default function Welcome() {
  const { setShowModal } = useModal();
  const [showVideo, setShowVideo] = useState(false);

  const openVideo = () => setShowVideo(true);
  const closeVideo = () => setShowVideo(false);

  return (
    <section className="bg-white py-10 relative">
      <div className="container mx-auto px-8 sm:px-20">
        <div className="flex flex-col md:flex-row items-center justify-between">


          <div className="sm:order-2 w-full relative px-4 sm:px-40">

            {/* <img src="../assets/video.png" className='rounded-3xl' /> */}
           

<iframe
  className="rounded-2xl mx-auto my-10"
  width="100%"
  height={470}
  src="https://www.youtube.com/embed/H-uq5JUKEac"
  title="YouTube video player"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerPolicy="strict-origin-when-cross-origin"
  allowFullScreen
></iframe>
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
