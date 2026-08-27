import React from 'react';
import Link from 'next/link';
import { db } from '../lib/db';
import { ListingCard } from '../components/marketplace/ListingCard';
import { AdPlacement } from '../components/ads/AdPlacement';
import { VectorHeroIllustration } from '../components/hero/VectorHeroIllustration';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Lock,
  UploadCloud,
  Tag,
  Banknote,
  CheckCircle2,
  Sparkles,
  Layers,
  Sparkle,
  Award,
  Zap,
  Globe
} from 'lucide-react';

export const revalidate = 0;

export default async function HomePage() {
  const heroSetting = await db.adminSetting.findUnique({
    where: { key: 'hero_image_url' },
  });
  const heroImageUrl = heroSetting?.value || null;

  const categories = await db.category.findMany({
    take: 8,
    include: { _count: { select: { listings: true } } },
    orderBy: { displayOrder: 'asc' },
  });

  const featuredListings = await db.listing.findMany({
    where: { status: 'APPROVED' },
    orderBy: { ratingAvg: 'desc' },
    take: 4,
    include: {
      category: { select: { name: true } },
      seller: { select: { name: true, businessName: true, avatarUrl: true } },
    },
  });

  const trendingListings = await db.listing.findMany({
    where: { status: 'APPROVED' },
    orderBy: { downloadCount: 'desc' },
    take: 4,
    include: {
      category: { select: { name: true } },
      seller: { select: { name: true, businessName: true, avatarUrl: true } },
    },
  });

  // Featured domain categories requested by user
  const featuredDomains = [
    {
      title: 'Hotfix Designs',
      slug: 'hotfix-design',
      desc: 'Rhinestone & hotfix motif pattern ZIP files for garment creation',
      icon: Sparkles,
      color: 'from-amber-500/10 to-rose-500/10 text-amber-900 border-amber-200/80',
    },
    {
      title: 'Embroidery Designs',
      slug: 'embroidery',
      desc: 'Multi-head machine stitch files, embroidery vectors & motifs',
      icon: Layers,
      color: 'from-purple-500/10 to-indigo-500/10 text-purple-900 border-purple-200/80',
    },
    {
      title: 'Jacquard Designs',
      slug: 'jacquard',
      desc: 'Textile weaving patterns, sari borders & Jacquard loom designs',
      icon: Globe,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-900 border-emerald-200/80',
    },
    {
      title: 'Beads Designs',
      slug: 'beads',
      desc: 'Handbeaded artwork, sequins, and machine bead ornament files',
      icon: Award,
      color: 'from-rose-500/10 to-pink-500/10 text-rose-900 border-rose-200/80',
    },
  ];

  return (
    <div className="space-y-16 pb-16 bg-[#FBF8F3]">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content (7 Cols) */}
          <div className="lg:col-span-7 space-y-7">
            {/* Eyebrow Tag */}
            <div className="inline-flex items-center gap-2.5 rounded-full bg-stone-900/5 px-4 py-1.5 border border-stone-300/80">
              <span className="h-2 w-2 rounded-full bg-[#8b263e] animate-pulse"></span>
              <span className="text-[11px] font-extrabold tracking-[0.2em] text-[#8b263e] uppercase">
                — WORK FROM HOME CREATOR MARKETPLACE
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-serif tracking-tight leading-[1.02] text-slate-900 font-bold">
                Design, Upload & Earn — <span className="italic font-serif text-[#8b263e] font-normal">Right From Home</span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="max-w-2xl text-base sm:text-lg text-slate-700 leading-relaxed font-sans font-normal">
              Are you a freelance or professional pattern designer? Securely upload your <strong>Hotfix</strong>, <strong>Embroidery</strong>, <strong>Jacquard</strong>, and <strong>Beads</strong> designs in a ZIP file. Join a trusted marketplace, reach active buyers, and start earning today with 100% security and transparent payouts.
            </p>

            {/* Search Input */}
            <form action="/marketplace" method="GET" className="max-w-xl pt-1">
              <div className="relative flex items-center rounded-2xl border-2 border-slate-900 bg-white p-2 shadow-lg focus-within:ring-2 focus-within:ring-[#8b263e]">
                <Search className="h-5 w-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search hotfix, embroidery, jacquard, or bead patterns..."
                  className="w-full bg-transparent px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-sans font-medium"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#8b263e] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#721d32] transition-colors shrink-0"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md hover:bg-[#8b263e] transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register?role=seller"
                className="inline-flex items-center gap-2 rounded-xl bg-white border-2 border-slate-900 px-7 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-900 shadow-sm hover:bg-slate-900 hover:text-white transition-all"
              >
                <span>Start Selling Today</span>
              </Link>
            </div>

            {/* Quick Trust Highlights under Hero */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-bold text-slate-600 border-t border-stone-200/80">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 100% Gated ZIP Storage
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Instant Bank Payouts
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Admin Verified Sellers
              </span>
            </div>

          </div>

          {/* Right Hero Showcase */}
          <div className="lg:col-span-5 relative flex justify-center">
            <VectorHeroIllustration customImageUrl={heroImageUrl} />
          </div>

        </div>
      </section>

      {/* 2. Highlighted Categories: Hotfix, Embroidery, Jacquard, Beads */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-300/80 pb-4 gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8b263e]">FEATURED DOMAINS</span>
              <h2 className="text-3xl font-serif text-slate-900 font-bold mt-1">Specialized Pattern Categories</h2>
              <p className="text-xs text-slate-600 mt-1">Find production-ready pattern ZIP files crafted for textile & apparel manufacturing</p>
            </div>
            <Link href="/marketplace" className="text-xs font-bold tracking-wider text-[#8b263e] hover:text-[#751d32] uppercase flex items-center gap-1">
              Browse All Categories <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Domain Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDomains.map((domain, idx) => {
              const IconComp = domain.icon;
              return (
                <Link
                  key={idx}
                  href={`/marketplace?search=${encodeURIComponent(domain.title)}`}
                  className={`group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl flex flex-col justify-between ${domain.color}`}
                >
                  <div className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 border border-stone-200 group-hover:scale-110 transition-transform">
                      <IconComp className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#8b263e] transition-colors">{domain.title}</h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">{domain.desc}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-xs font-extrabold text-[#8b263e] uppercase tracking-wider">
                    <span>Explore Patterns</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 3. Trust & Security Section (Highest Platform Reliability) */}
        <section className="rounded-3xl border border-stone-300/80 bg-stone-900 text-white p-8 sm:p-12 space-y-8 shadow-xl relative overflow-hidden">
          {/* Subtle Glow background */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#8b263e]/20 blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-400">100% TRUST & SECURITY GUARANTEE</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">Why Designers Trust Metusk.com</h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              We protect creator intellectual property and ensure every transaction is fast, transparent, and completely risk-free.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3 backdrop-blur-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Gated Cloud Storage</h3>
              <p className="text-xs text-stone-300 leading-relaxed">Your original ZIP design files are stored behind encrypted server proxies. Buyers only receive download access after confirmed payment.</p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3 backdrop-blur-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Banknote className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Transparent Payouts</h3>
              <p className="text-xs text-stone-300 leading-relaxed">Instant split transfers credited directly to your bank account via Razorpay Route on every single sale without hidden delays.</p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3 backdrop-blur-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Verified Creator Accounts</h3>
              <p className="text-xs text-stone-300 leading-relaxed">Every seller studio undergoes admin KYC verification to eliminate fraud and maintain highest asset quality standards.</p>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3 backdrop-blur-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Watermarked Previews</h3>
              <p className="text-xs text-stone-300 leading-relaxed">All preview images are displayed with high-resolution protection to safeguard original artwork from unauthorized copying.</p>
            </div>
          </div>
        </section>

        {/* 4. How It Works Section for Sellers */}
        <section className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#8b263e]">SIMPLE 3-STEP SELLER WORKFLOW</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">How To Start Selling On Metusk.com</h2>
            <p className="text-xs sm:text-sm text-slate-600">Turn your pattern designs into passive recurring income in under 5 minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative rounded-3xl border border-stone-200 bg-white p-8 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-[#8b263e]">01</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-900 border border-stone-200">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Step 1: Upload Your Design ZIP File</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Package your vector, machine embroidery, or hotfix pattern files into a ZIP archive along with preview screenshots. Up to 200MB file limit supported.
                </p>
              </div>
              <div className="pt-4 border-t border-stone-100">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  ✓ Encrypted Server Storage
                </span>
              </div>
            </div>

            <div className="relative rounded-3xl border border-stone-200 bg-white p-8 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-[#8b263e]">02</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-900 border border-stone-200">
                    <Tag className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Step 2: Set Your Price and Publish</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your desired selling price in Rupees (₹) or offer free downloads to build your studio following. Customize tags, description, and subcategory.
                </p>
              </div>
              <div className="pt-4 border-t border-stone-100">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  ✓ Full Pricing Autonomy
                </span>
              </div>
            </div>

            <div className="relative rounded-3xl border border-stone-200 bg-white p-8 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-[#8b263e]">03</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-900 border border-stone-200">
                    <Zap className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Step 3: Start Earning Instantly as Buyers Download</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Whenever a buyer purchases your pattern, payment is processed securely via Razorpay and your earnings are transferred directly to your bank account.
                </p>
              </div>
              <div className="pt-4 border-t border-stone-100">
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                  ✓ Automated Bank Transfer
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Policy-Compliant Ad Placement */}
        <AdPlacement type="banner" slotId="home_hero_banner_001" />

        {/* 5. Featured Releases Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-stone-300/60 pb-4">
            <div>
              <h2 className="text-2xl font-serif text-slate-900 font-bold">Featured Releases</h2>
              <p className="text-xs text-slate-600 mt-0.5">Top-rated design patterns created by verified studios</p>
            </div>
            <Link href="/marketplace?sortBy=rating" className="text-xs font-bold tracking-wider text-[#8b263e] hover:text-[#751d32] uppercase flex items-center gap-1">
              Browse Top Rated <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {featuredListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>

        {/* Policy-Compliant In-Feed Ad Gap */}
        <AdPlacement type="in-feed" slotId="home_in_feed_001" />

        {/* 6. Trending Patterns Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-stone-300/60 pb-4">
            <div>
              <h2 className="text-2xl font-serif text-slate-900 font-bold">Trending Patterns</h2>
              <p className="text-xs text-slate-600 mt-0.5">Popular hotfix, embroidery, and Jacquard assets downloaded this week</p>
            </div>
            <Link href="/marketplace?sortBy=popular" className="text-xs font-bold tracking-wider text-[#8b263e] hover:text-[#751d32] uppercase flex items-center gap-1">
              Browse Trending <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {trendingListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>

        {/* 7. Creator Onboarding CTA Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-stone-300 bg-white p-8 sm:p-12 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2">
              <span className="h-[1px] w-6 bg-[#8b263e]"></span>
              <span className="text-[10px] font-extrabold tracking-[0.2em] text-[#8b263e] uppercase">
                READY TO MONETIZE YOUR ARTWORK?
              </span>
            </div>
            <h3 className="text-3xl font-serif text-slate-900 font-bold">Join India's Most Trusted Digital Pattern Marketplace</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans font-normal">
              Publish your Hotfix, Embroidery, Jacquard, and Beads designs in a secure ZIP format today. Reach thousands of active apparel manufacturers and pattern buyers.
            </p>
          </div>

          <Link
            href="/register?role=seller"
            className="shrink-0 rounded-2xl bg-slate-900 px-8 py-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg hover:bg-[#8b263e] transition-all hover:scale-105"
          >
            Start Selling Today
          </Link>
        </section>

      </div>
    </div>
  );
}
