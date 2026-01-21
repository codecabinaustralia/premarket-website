import Image from 'next/image';

export default function AgentFooter() {
  return (
    <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="text-center mb-8">
          <Image
            src="https://premarket.homes/assets/logo.png"
            alt="Premarket Logo"
            width={140}
            height={35}
            className="mx-auto mb-6 brightness-0 invert"
            unoptimized
          />

          <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent mb-2">
            Built for agents. By agents. Nothing else.
          </p>

          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Premarket is the only pre-market platform designed exclusively for real estate agents
            who want to win more listings with less resistance.
          </p>
        </div>

        {/* Contact Section */}
        <div className="text-center mb-12">
          <a
            href="mailto:knockknock@premarket.homes"
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            knockknock@premarket.homes
          </a>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
          <p>&copy; 2026 Premarket. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
