import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { WishlistProvider } from '../context/WishlistContext';
import { CartProvider } from '../context/CartContext';
import { CartDrawer } from '../components/cart/CartDrawer';
import { PageProgress } from '../components/layout/PageProgress';
import { ScreenshotProtection } from '../components/layout/ScreenshotProtection';
import { ChunkErrorRecovery } from '../components/layout/ChunkErrorRecovery';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'DesignHub — Multi-Vendor Digital Design Marketplace',
  description: 'Buy and sell premium digital design files, Figma UI kits, 3D assets, vector icon packs, and web templates with instant Razorpay Route payouts and hidden cloud storage.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1066955028311078"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${plusJakarta.variable} ${playfair.variable} font-sans bg-[#FBF8F3] text-slate-900 antialiased min-h-screen flex flex-col`}>
        <ChunkErrorRecovery />
        <ScreenshotProtection />
        <WishlistProvider>
          <CartProvider>
            <PageProgress />
            <Navbar />
            <main className="flex-1 animate-fade-in">{children}</main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}
