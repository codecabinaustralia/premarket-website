// components/Shimmer.js
export default function Shimmer() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
      <div className="h-4 bg-gray-300 rounded w-1/3 mx-auto"></div>
    </div>
  );
}