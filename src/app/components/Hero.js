'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function Hero() {
  const sectionRef = useRef(null);
  const [gradientPos, setGradientPos] = useState('50%');

  // Background animation (kept from your existing version)
  useEffect(() => {
    const section = sectionRef.current;
    let posX = 0;
    let posY = 0;
    let velocityX = (Math.random() - 0.5) * 2;
    let velocityY = (Math.random() - 0.5) * 2;
    let animationFrame;

    const handleMouseMove = (e) => {
      const centerX = window.innerWidth / 2;
      const deltaX = (e.clientX - centerX) / centerX;
      velocityX = deltaX * 2;

      // 👇 Text gradient position control
      const percentX = (e.clientX / window.innerWidth) * 100;
      setGradientPos(`${percentX}%`);
    };

    const animate = () => {
      posX += velocityX;
      posY += velocityY;

      if (section) {
        section.style.backgroundPosition = `${posX}px ${posY}px`;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-white overflow-hidden"
      style={{
        backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAIAAACRXR/mAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAABnSURBVHja7M5RDYAwDEXRDgmvEocnlrQS2SwUFST9uEfBGWs9c97nbGtDcquqiKhOImLs/UpuzVzWEi1atGjRokWLFi1atGjRokWLFi1atGjRokWLFi1af7Ukz8xWp8z8AAAA//8DAJ4LoEAAlL1nAAAAAElFTkSuQmCC")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
      }}
    >
      {/* White radial overlay */}
      <div
        className="h-full w-full"
        
      >
        <div className="container mx-auto px-4 py-20 text-center relative z-10 pointer-events-auto">
          <div className="text-center h-full items-center flex w-full">
            <div className="w-full justify-center">


              {/* Gradient text with cursor-based background position */}
              <h2
                className="mt-8 leading-none text-4xl sm:text-[100px] interBold text-gray-900"
              >
                See Real <br className='sm:hidden' /><span className='px-5 bg-gradient-to-r from-pink-600 to-orange-700 text-white'>Buyer Demand</span> 
              </h2>


              <h2
                className="leading-none text-4xl sm:text-[100px] interBold bg-clip-text text-gray-900"

              >
                Before Going to Market
              </h2>

             

              <div className=" my-3 ">
                <h2 className="leading-none text-xl inter bg-clip-text text-transparent" style={{
                  backgroundImage: `linear-gradient(to right, #2384bb, #573ca3, #a73f79, #c1583b)`,
                  backgroundSize: `200%`,
                  backgroundPositionX: gradientPos,
                }}>
                  Skip the stress. Ditch the open homes. Forget the fees. <br className='hidden sm:block'/> Gain more confidence and run your free 30 Day campaign today
                </h2>
               
              </div>

              <div className="flex space-x-1 justify-center">
                <a href="https://apps.apple.com/au/app/premarket-homes/id6742205449">
                  <img src="./apple.png" className="mt-3 w-36" />
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en_AU">
                  <img src="./play.png" className="h-18" />
                </a>
              </div>

              <p className="text-sm mt-4 inter text-gray-500">
                No obligation, zero cost and real value
              </p>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
