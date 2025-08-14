// components/Features.js
import { useModal } from '../context/ModalContext';
export default function Pricing() {
  const { setShowModal } = useModal();
  
  return (
    <div className="bg-gray-100">
        <div className=" sm:p-20 container mx-auto">
        <div className="text-4xl sm:text-7xl font-extrabold text-gray-900 mb-2 text-center pt-10 sm:pt-0 px-6 sm:px-0">
            Turn community into sellers
            <div className="mt-3 sm:mt-6 text-sm sm:text-xl inter text-gray-500">Supercharged automated engine that turns prospects into real clients</div>
            </div>
<div className="p-10 sm:p-0 flex-wrap sm:flex-wrap-none flex items-center justify-center space-x-0 sm:mt-10">

  <div className="w-full sm:w-96 bg-white shadow-2xl p-8 rounded-l-lg sm:py-20 sm:my-10 sm:mb-0">
    <h2 className="text-3xl font-bold mb-2 text-gray-900">Small Agent</h2>
    <div className="text-3xl font-extrabold text-gray-900 mb-2">$249<span className="text-sm interBold font-normal">/month</span></div>
    <div><span className="text-sm inter bg-amber-600 text-white rounded-full py-2 px-3 font-normal">Paid annually $2,988</span></div>
    
    <ul className="space-y-2 mt-4 mb-6 text-gray-700 inter">
      <li>Single login to Premarket app</li>
      <li>Upto 20 prospect each month per team</li>
      <li>View buyer interest</li>
      <li>Property demand</li>
      <li>Direct buyer chat</li>
      <li>Handshake offers</li>
      <li>End of campaign report cards</li>
    </ul>
    <button onClick={() => setShowModal(true)} className="border-2 border-amber-600 hover:bg-gray-100 text-amber-600 font-bold py-4 cursor-pointer px-4 rounded w-full">
      Book a demo
    </button>
  </div>
  
  <div className="w-full mt-6 sm:mt-0 sm:w-96 bg-white shadow-2xl p-8 rounded-lg py-20 mb-6 sm:mb-0">
    <h2 className="text-3xl font-bold mb-2 text-gray-900">Agent Pro</h2>
    <div className="text-5xl font-extrabold text-gray-900 mb-2">$499<span className="text-sm interBold font-normal">/month</span></div>
    <div><span className="text-sm inter bg-amber-600 text-white rounded-full py-2 px-3 font-normal">Paid annually $5,988</span></div>
    
    <ul className="space-y-2 mt-4 mb-6 text-gray-700 inter">
      <li><span className='interBold'>Premarket Kit </span>- includes prospect QRcode cards and door stickers</li>
      <li>Team Access to Premarket app</li>
      <li>Upto 100 prospect each month per team</li>
      <li>View buyer interest</li>
      <li>Property demand</li>
      <li>Direct buyer chat</li>
      <li>Handshake offers</li>
      <li>End of campaign report cards</li>
    </ul>
    <button onClick={() => setShowModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 cursor-pointer px-4 rounded w-full">
      Book a demo
    </button>
  </div>

  <div className="w-full sm:w-56 bg-gray-900 p-8 rounded sm:rounded-r-lg">
    <h2 className="text-3xl font-bold text-white">Custom</h2>
    <div className="text-white mt-2"><span className="text-sm inter bg-gray-700 text-white rounded-full py-2 px-3 font-normal">Paid based on scale</span></div>
    <ul className="space-y-2 mb-6 text-white inter mt-6">
      <li>Add multiple teams</li>
      <li>Add unlimted prospects</li>
      <li>Extend trial campaigns</li>
      <li>Custom Design</li>
      <li>First Class Support</li>
    </ul>

     <button onClick={() => setShowModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 cursor-pointer px-4 rounded w-full">
      Book a demo
    </button>
   
</div>
</div>
</div>
    </div>

  );
}
