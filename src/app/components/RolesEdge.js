// components/PremarketEdgeTasks.js
export default function PremarketEdgeTasks() {
  return (
    <div className="bg-gray-100 w-full">
        <div className="container mx-auto p-20">

        
    <div className="flex flex-col md:flex-row gap-6">
      
      {/* What you need to do */}
      <div className="bg-white rounded-2xl shadow p-10 flex-1">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">What you need to do</h2>
       <div className="inter text-2xl text-gray-500">Once a handshake offer is made, all that’s left for the owner is to manage inspections, answer a few final questions, and agree on the final sale terms—Premarket Edge handles everything else.</div>
      </div>

      {/* What Premarket Edge does */}
      <div className="rainbow-border bg-gray-900 text-white rounded-2xl shadow p-10 flex-1 relative">
       <div className="card-inner text-gray-900 py-20 px-10">
        <h2 className="text-5xl font-bold mb-4">What Premarket Edge does for you</h2>
        <ul className="space-y-1 list-disc list-inside inter">
          <li>Conveyancing</li>
          <li>Mortgage Brokering</li>
          <li>Support</li>
          <li>Title Deed Retrieval</li>
          <li>Section 32 / Vendor Disclosure Statement</li>
          <li>Contract of Sale</li>
          <li>Building & Pest Inspections Guidance</li>
          <li>Settlement Coordination</li>
        </ul>
      </div>
      </div>
    </div>
    </div>
    </div>
  );
}
