import React from 'react';
import Link from 'next/link';
import { db } from '../../lib/db';
import { ListingCard } from '../../components/marketplace/ListingCard';
import { CategorySidebarFilter } from '../../components/marketplace/CategorySidebarFilter';
import { AdPlacement } from '../../components/ads/AdPlacement';
import { Search, Sparkles, Tag } from 'lucide-react';

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    category?: string;
    subcategory?: string;
    search?: string;
    pricing?: string; // 'all', 'free', 'paid'
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    sortBy?: string;
  }>;
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const { category, subcategory, search, pricing, minPrice, maxPrice, minRating, sortBy } = await searchParams;

  const categories = await db.category.findMany({
    include: {
      children: {
        orderBy: { name: 'asc' },
      },
      parent: true,
    },
    orderBy: { name: 'asc' },
  });

  const parentCategories = categories.filter((c) => !c.parentId);

  const andConditions: any[] = [];
  andConditions.push({ status: 'APPROVED' });

  if (subcategory && subcategory !== 'all') {
    andConditions.push({
      category: { slug: { equals: subcategory, mode: 'insensitive' } },
    });
  } else if (category && category !== 'all') {
    andConditions.push({
      OR: [
        { category: { slug: { equals: category, mode: 'insensitive' } } },
        { category: { parent: { slug: { equals: category, mode: 'insensitive' } } } },
      ],
    });
  }

  if (pricing === 'free') {
    andConditions.push({
      OR: [
        { isFree: true },
        { price: 0 },
      ],
    });
  } else if (pricing === 'paid') {
    andConditions.push({
      isFree: false,
      price: { gt: 0 },
    });
  }

  if (search && search.trim()) {
    const q = search.trim();
    andConditions.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  if (minPrice || maxPrice) {
    const priceCond: any = {};
    if (minPrice && !isNaN(parseFloat(minPrice))) priceCond.gte = parseFloat(minPrice);
    if (maxPrice && !isNaN(parseFloat(maxPrice))) priceCond.lte = parseFloat(maxPrice);
    andConditions.push({ price: priceCond });
  }

  if (minRating && !isNaN(parseFloat(minRating))) {
    andConditions.push({ ratingAvg: { gte: parseFloat(minRating) } });
  }

  const where = { AND: andConditions };

  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'price_asc') orderBy = { price: 'asc' };
  if (sortBy === 'price_desc') orderBy = { price: 'desc' };
  if (sortBy === 'rating') orderBy = { ratingAvg: 'desc' };
  if (sortBy === 'popular') orderBy = { downloadCount: 'desc' };

  const listings = await db.listing.findMany({
    where,
    orderBy,
    include: {
      category: { select: { name: true, slug: true, parent: { select: { name: true } } } },
      seller: { select: { id: true, name: true, businessName: true, avatarUrl: true } },
    },
  });

  // Find active category object
  const activeCategoryObj = categories.find((c) => c.slug === (subcategory || category));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Design Marketplace</h1>
          <p className="text-xs text-slate-500 mt-1">Discover, purchase, and download verified digital assets</p>
        </div>

        <form method="GET" className="flex items-center gap-2 max-w-md w-full">
          {category && <input type="hidden" name="category" value={category} />}
          {subcategory && <input type="hidden" name="subcategory" value={subcategory} />}
          {pricing && <input type="hidden" name="pricing" value={pricing} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder="Search title, description, or tags..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-xs min-h-[44px]"
            />
          </div>
          <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 min-h-[44px]">
            Search
          </button>
        </form>
      </div>

      {/* Main Categories Pills Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href={`/marketplace?category=all${search ? `&search=${search}` : ''}${pricing ? `&pricing=${pricing}` : ''}`}
            className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors min-h-[40px] flex items-center ${
              !category || category === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All Categories
          </Link>
          {parentCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/marketplace?category=${cat.slug}${search ? `&search=${search}` : ''}${pricing ? `&pricing=${pricing}` : ''}`}
              className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors min-h-[40px] flex items-center ${
                category === cat.slug || activeCategoryObj?.parentId === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Subcategories bar if parent or subcategory selected */}
        {activeCategoryObj && (activeCategoryObj.children?.length > 0 || activeCategoryObj.parentId) && (
          <div className="flex items-center gap-2 overflow-x-auto bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1 shrink-0">
              <Tag className="h-3.5 w-3.5 text-indigo-600" />
              Subcategories:
            </span>
            {categories
              .filter((c) => c.parentId === (activeCategoryObj.parentId || activeCategoryObj.id))
              .map((sub) => (
                <Link
                  key={sub.id}
                  href={`/marketplace?category=${activeCategoryObj.parentId ? activeCategoryObj.parent?.slug : activeCategoryObj.slug}&subcategory=${sub.slug}${search ? `&search=${search}` : ''}${pricing ? `&pricing=${pricing}` : ''}`}
                  className={`rounded-lg px-3 py-1 text-xs font-bold whitespace-nowrap transition-colors ${
                    subcategory === sub.slug || (category === sub.slug && !subcategory)
                      ? 'bg-indigo-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sub.name}
                </Link>
              ))}
          </div>
        )}
      </div>

      {/* Main Grid + Filters Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Dynamic Category & Subcategory Sidebar Filters */}
        <CategorySidebarFilter
          categories={categories}
          currentCategory={category}
          currentSubcategory={subcategory}
          currentSearch={search}
          currentPricing={pricing}
          currentSortBy={sortBy}
          currentMaxPrice={maxPrice}
          currentMinRating={minRating}
        />

        {/* Listings Grid */}
        <main className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Showing <strong className="text-slate-900">{listings.length}</strong> design assets</span>
          </div>

          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
              <Sparkles className="h-8 w-8 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900">No assets match your search criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm">Try resetting your category, subcategory, pricing, or price range filters to browse more design resources.</p>
              <Link href="/marketplace" className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs">
                Reset All Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 stagger-children">
              {listings.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <ListingCard listing={item} />
                  {(idx + 1) % 6 === 0 && (
                    <div className="col-span-3 sm:col-span-2 lg:col-span-3">
                      <AdPlacement type="in-feed" slotId={`catalog_in_feed_${idx}`} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
