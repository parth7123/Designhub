import React from 'react';
import Link from 'next/link';
import { db } from '../lib/db';
import { ListingCard } from '../components/marketplace/ListingCard';
import { AdPlacement } from '../components/ads/AdPlacement';
import { VectorHeroIllustration } from '../components/hero/VectorHeroIllustration';
import { Search, ArrowRight, Layout, Box, Grid, Globe, Type, Store, Sparkles } from 'lucide-react';

export const revalidate = 0;

export default async function HomePage() {
  const heroSetting = await db.adminSetting.findUnique({
    where: { key: 'hero_image_url' },
  });
  const heroImageUrl = heroSetting?.value || null;

  const categories = await db.category.findMany({
    take: 6,
    include: { _count: { select: { listings: true } } },
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

  const getCategoryIcon = (iconName?: string | null) => {
    switch (iconName) {
      case 'Layout': return <Layout className="h-5 w-5 text-amber-900" />;
      case 'Box': return <Box className="h-5 w-5 text-purple-900" />;
      case 'Grid': return <Grid className="h-5 w-5 text-emerald-900" />;
      case 'Globe': return <Globe className="h-5 w-5 text-sky-900" />;
      case 'Type': return <Type className="h-5 w-5 text-burgundy-600" />;
      default: return <Sparkles className="h-5 w-5 text-burgundy-600" />;
    }
  };

  return (
    <div className="space-y-16 pb-16 bg-[#FBF8F3]">
      {/* Editorial Luxury Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Editorial Content (7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Top Vol Line */}
            <div className="flex items-center gap-3">
              <span className="h-[1px] w-8 bg-[#8b263e]"></span>
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#8b263e] uppercase">
                THE DESIGN MARKETPLACE, VOL. 01
              </span>
            </div>

            {/* Editorial Display Headline */}
            <div className="space-y-1">
              <h1 className="text-6xl sm:text-7xl lg:text-[84px] font-serif tracking-tight leading-[0.95] text-slate-900 font-normal">
                The Brief
              </h1>
              <h1 className="text-6xl sm:text-7xl lg:text-[84px] font-serif tracking-tight leading-[0.95] text-slate-900 font-normal">
                Designs <span className="italic font-serif font-normal text-[#8b263e]">Itself</span>
              </h1>
            </div>

            {/* Sub-description Body */}
            <p className="max-w-xl text-base sm:text-lg text-slate-700 leading-relaxed font-sans font-normal pt-2">
              Explore curated Figma UI kits, 3D renders, vector packs & web templates. Created by independent studios with instant Razorpay Route seller payouts and gated cloud storage. No blank artboard, no waiting on a deck.
            </p>

            {/* Search Input & Action Links */}
            <div className="space-y-6 pt-2">
              <form action="/marketplace" method="GET" className="max-w-md">
                <div className="relative flex items-center border-b-2 border-slate-900 pb-2">
                  <Search className="h-4 w-4 text-slate-600 mr-3 shrink-0" />
                  <input
                    type="text"
                    name="search"
                    placeholder="Search UI kits, 3D renders, Framer templates..."
                    className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-500 focus:outline-none font-sans"
                  />
                  <button type="submit" className="text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-[#8b263e] shrink-0 ml-2">
                    Search
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-6 pt-2">
                <Link
                  href="/marketplace"
                  className="group inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-[#8b263e] transition-colors border-b border-slate-900 pb-0.5 hover:border-[#8b263e]"
                >
                  <span>Open the catalog</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/register?role=seller"
                  className="text-xs font-semibold tracking-wider uppercase text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Become a Creator
                </Link>
              </div>
            </div>
          </div>

          {/* Right Showcase (5 Cols): Vector Illustration or Admin Custom Hero Banner */}
          <div className="lg:col-span-5 relative flex justify-center">
            <VectorHeroIllustration customImageUrl={heroImageUrl} />
          </div>

        </div>
      </section>

      {/* Main Content Sections */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Category Showcase Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-stone-300/60 pb-4">
            <div>
              <h2 className="text-2xl font-serif text-slate-900">Explore Categories</h2>
              <p className="text-xs text-slate-600 mt-0.5">Browse design resources organized by domain</p>
            </div>
            <Link href="/marketplace" className="text-xs font-bold tracking-wider text-[#8b263e] hover:text-[#751d32] uppercase flex items-center gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/marketplace?category=${cat.slug}`}
                className="group flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-6 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#8b263e]/40 hover:shadow-md"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[#FBF8F3] border border-stone-200 group-hover:scale-110 transition-transform">
                  {getCategoryIcon(cat.icon)}
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#8b263e]">{cat.name}</h3>
                <span className="mt-1 text-[11px] font-semibold text-slate-500">{cat._count.listings} assets</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Policy-Compliant Ad Placement */}
        <AdPlacement type="banner" slotId="home_hero_banner_001" />

        {/* Featured Listings Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-stone-300/60 pb-4">
            <div>
              <h2 className="text-2xl font-serif text-slate-900">Featured Releases</h2>
              <p className="text-xs text-slate-600 mt-0.5">Handpicked design systems and assets rated 4.8+ by buyers</p>
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

        {/* Trending Listings Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-stone-300/60 pb-4">
            <div>
              <h2 className="text-2xl font-serif text-slate-900">Trending This Week</h2>
              <p className="text-xs text-slate-600 mt-0.5">Popular design assets across the marketplace</p>
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

        {/* Editorial Creator Callout Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-stone-300 bg-white p-8 sm:p-12 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2">
              <span className="h-[1px] w-6 bg-[#8b263e]"></span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#8b263e] uppercase">
                FOR INDEPENDENT CREATORS
              </span>
            </div>
            <h3 className="text-3xl font-serif text-slate-900">Sell Your Design Assets & Earn Instant Payouts</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans font-normal">
              Upload your ZIP product files and preview images securely. Receive automated split payouts credited directly to your bank account on every sale via Razorpay Route.
            </p>
          </div>

          <Link
            href="/register?role=seller"
            className="shrink-0 rounded-xl bg-slate-900 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#8b263e] transition-all"
          >
            Start Selling Today
          </Link>
        </section>

      </div>
    </div>
  );
}
