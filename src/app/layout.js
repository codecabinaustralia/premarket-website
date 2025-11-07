import { Poppins, Inter, Anton } from "next/font/google";
import { ModalProvider } from './context/ModalContext';
import Script from 'next/script';

import "./globals.css";

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

const inter = Inter({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-inter',
});

const antons = Anton({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-anton',
});

export const metadata = {
  title: "Premarket",
  description: "Social Network for Australia. Sell smarter. See who's interested before you list.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${antons.variable} antialiased bg-white`}>
        <ModalProvider>
          {children}
        </ModalProvider>

        {/* Tawk.to Live Chat Script */}
        <Script
          id="tawk-to-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/690d9d7462ef6419564dc9b1/1j9eiu4lf';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}