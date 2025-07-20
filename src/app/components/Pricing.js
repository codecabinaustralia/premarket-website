// components/Features.js

export default function Pricing() {

  return (
    <div className="bg-gray-100">
        <div className=" sm:p-20 container mx-auto">
        <div className="text-4xl sm:text-7xl font-extrabold text-gray-900 mb-2 text-center p-10 sm:p-0">
            Join the next campaign 
            <div className="mt-6 text-xl inter text-gray-500">Present your property to hundreds of keen buyers instantly</div>
            </div>
<div className="p-10 sm:p-0 flex-wrap sm:flex-wrap-none flex items-center justify-center space-x-0 mt-10">

  <div className="w-full sm:w-96 bg-white shadow-2xl p-8 rounded-lg py-20 mb-6 sm:mb-0">
    <h2 className="text-3xl font-bold mb-2 text-gray-900">First Campaign</h2>
    <div className="text-5xl font-extrabold text-gray-900 mb-2">Free</div>
    
    <ul className="space-y-2 mb-6 text-gray-700">
        <li>30 Day Campaign</li>
        <li>Property Report Card</li>
      <li>Exposure to buyer database</li>
      <li>Property and region insights</li>
      <li>In app messenger</li>      
      <li>Accept or reject offers</li>      
      <li>Go to market options*</li>      
    </ul>
    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
      Start your free campaign
    </button>
    <span className="block text-sm text-gray-500 mt-4">No credit card required</span>
  </div>

  <div className="w-full sm:w-72 bg-gray-900 p-8 rounded sm:rounded-r-lg">
    <h2 className="text-3xl font-bold mb-2 text-white">Buyer</h2>
    <div className="text-5xl font-extrabold text-white mb-2">$19</div>
    <div><span className="text-sm font-normal">for your first campaign</span></div>
    <div className="text-sm font-extrabold text-white mb-2">then $599<span className="text-sm">/year</span></div>
    <ul className="space-y-2 mb-6 text-white">
      <li>Exclusive access to properties not on the market yet</li>
      <li>Make unlimited handshake offers on all properties</li>
      <li>Priority support for any deals</li>
      <li>Notifications and alerts</li>
    </ul>
    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
      Sign Up
    </button>
  </div>
</div>
</div>
    </div>

  );
}
