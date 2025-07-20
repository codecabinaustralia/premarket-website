import { Poppins, Inter, Anton } from "next/font/google";
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
  description: "Social Network for Australia. Sell smarter. See who’s interested before you list.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${antons.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
