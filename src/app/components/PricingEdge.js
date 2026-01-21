// components/Features.js
'use client';

import { useModal } from '../context/ModalContext';

export default function Pricing() {
const { setShowModal } = useModal();

  return (
    <div className="bg-gray-100">
        <div className=" sm:p-20 container mx-auto">
        <div className="text-4xl sm:text-7xl font-extrabold text-gray-900 mb-2 text-center p-4 sm:p-10 sm:p-0">
            Ultra low fee
            <div className="sm:mt-6 text-xl inter text-gray-500">Save thousands by selling yourself</div>
            </div>
<div className="sm:p-10 flex-wrap sm:flex-wrap-none flex items-start justify-center space-x-0 sm:mt-10">

  <div className="w-full sm:w-96 bg-white shadow-2xl p-8 rounded-lg py-20 mb-6 sm:mb-0">
    <h2 className="text-3xl font-bold mb-2 text-gray-900">Fixed fee</h2>
    <div className="text-5xl font-extrabold text-gray-900 mb-2">$4900</div>
    
    <div className="my-4 text-lg font-bold border-t border-b border-gray-200 py-2 text-gray-900">Pay on deposit</div>

    <h2 className="text-lg font-bold mb-2 text-gray-900">All services inclusive</h2>
    <ul className="space-y-2 mb-6 text-gray-700">
      <li>Conveyancing</li>
      <li>Mortgage Brokering</li>
      <li>Support</li>
      <li>Title Deed Retrieval</li>
      <li>Section 32 / Vendor Disclosure Statement</li>
      <li>Contract of Sale</li>      
      <li>Building & Pest Inspections Guidence</li>      
      <li>Settlement Coordination</li>
      <li>Access to Utility Discounts</li>
      <li>Access to Removalist Discounts</li>
    </ul>
    <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
      Start your free campaign
    </button>
    <span className="block text-sm text-gray-500 mt-4">Pay only when deposit is made</span>
  </div>

  <div className="w-full sm:w-72 mt-10 bg-gray-900 p-8 rounded sm:rounded-r-lg">
    <h2 className="text-3xl font-bold mb-2 text-white">Important information</h2>
    <div className="text-xs text-white mb-2">

        The Premarket Edge fee covers only the services explicitly listed in our terms and conditions. Any additional services, government fees, or third-party charges — such as stamp duty, local council certificates, or additional legal work required during conveyancing or brokering — are not included and may be charged separately by the relevant providers.

    </div>

  </div>
</div>
</div>
    </div>

  );
}
