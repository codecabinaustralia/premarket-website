
// components/Footer.js

import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                <div>
                  <Image
                    src="https://premarket.homes/assets/logo.png"
                    alt="Premarket Logo"
                    width={140}
                    height={35}
                    className="mb-4 brightness-0 invert"
                    unoptimized
                  />
                  <p className="text-slate-400 text-sm">
                    Discover exclusive pre-market properties before they hit the market.
                  </p>
                </div>
    
                <div>
                  <h3 className="font-bold mb-4">Company</h3>
                  <ul className="space-y-2 text-slate-400 text-sm">
                    <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  </ul>
                </div>
    
                <div>
                  <h3 className="font-bold mb-4">Resources</h3>
                  <ul className="space-y-2 text-slate-400 text-sm">
                    <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                  </ul>
                </div>
    
                <div>
                  <h3 className="font-bold mb-4">Download App</h3>
                  <div className="space-y-3">
                    <a
                      href="https://apps.apple.com/au/app/premarket-homes/id6742205449"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Image
                        src="https://www.airtasker.com/images/homepage/apple-store-2022.svg"
                        alt="Download on the App Store"
                        width={130}
                        height={43}
                      />
                    </a>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.premarkethomes.app&hl=en"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Image
                        src="https://www.airtasker.com/images/homepage/google-play-2022.svg"
                        alt="Get it on Google Play"
                        width={130}
                        height={43}
                      />
                    </a>
                  </div>
                </div>
              </div>
    
              <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
                <p>&copy; {new Date().getFullYear()} Premarket. All rights reserved.</p>
              </div>
            </div>
          </footer>
  );
}