
// components/Footer.js
export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6 text-xs">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <p>&copy; {new Date().getFullYear()} Premarket Australia. All rights reserved.</p>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-gray-400">Privacy Policy</a>
          <a href="#" className="hover:text-gray-400">Terms of Service</a>
          <a href="#" className="hover:text-gray-400">Contact Us</a>
              </div>
      </div>
    </footer>
  );
}