import Image from 'next/image';
import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <Image
            src="https://premarketvideos.b-cdn.net/assets/logo.png"
            alt="Premarket Logo"
            width={140}
            height={35}
            className="h-7 w-auto mb-6"
            unoptimized
          />

          <nav className="flex flex-wrap justify-center gap-6 mb-8 text-sm font-medium text-slate-600">
            <Link href="/listings" className="hover:text-slate-900 transition-colors">
              Browse Properties
            </Link>
            <Link href="/v2" className="hover:text-slate-900 transition-colors">
              For Agents
            </Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">
              Terms
            </Link>
          </nav>

          <a
            href="mailto:knockknock@premarket.homes"
            className="text-slate-400 hover:text-slate-600 transition-colors text-sm mb-8"
          >
            knockknock@premarket.homes
          </a>

          <div className="border-t border-slate-100 pt-6 w-full text-center text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Premarket. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
