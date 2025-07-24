'use client';
import { useModal } from '../context/ModalContext';

export default function Welcome() {
  const { setShowModal } = useModal();

  return (

    <section className="bg-white py-20">
      <div className="container mx-auto px-8 sm:px-20">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mt-4 sm:mt-0 order-2 sm:order-1 md:w-1/2 sm:p-8 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              We run 30 day campaigns for properties that aren’t on the market — and send them directly to our buyer network.
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Campaigns are designed to provid a safe, no-obligation environment so serious buyers can express interest and make real offers on homes before they hit the market.

              Homeowners get to test demand, gauge their property's true value, and even sell — without the broken promises of a traditional real estate listing.
            </p>
            <button onClick={() => setShowModal(true)} className="bg-blue-700 font-bold cursor-pointer hover:bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              Start your free 30 day campaign
            </button>
          </div>
          <div className="sm:order-2 md:w-1/2 px-10 -mt-10 relative">
          <div className="absolute z-50 bottom-0 right-10 m-10 text-white ">
            <div className="text-lg font-bold">Josh Reilly & Luke Wilson</div>
            <div>Founders </div>
            </div>
            <img src="/assets/ceo.png" alt="Welcome" className="w-full h-auto rounded-2xl shadow-lg" />
          </div>
        </div>
      </div>
    </section>
  )
}