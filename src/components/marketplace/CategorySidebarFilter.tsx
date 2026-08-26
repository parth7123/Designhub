'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SlidersHorizontal, X, Check, Star, Sparkles } from 'lucide-react';
import { AdPlacement } from '../ads/AdPlacement';

interface CategorySidebarFilterProps {
  categories: any[];
  currentCategory?: string;
  currentSubcategory?: string;
  currentSearch?: string;
  currentPricing?: string;
  currentSortBy?: string;
  currentMaxPrice?: string;
  currentMinRating?: string;
}

export const CategorySidebarFilter: React.FC<CategorySidebarFilterProps> = ({
  categories,
  currentCategory = 'all',
  currentSubcategory = '',
  currentSearch,
  currentPricing = 'all',
  currentSortBy = 'newest',
  currentMaxPrice = '',
  currentMinRating = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState(currentSubcategory);
  const [pricing, setPricing] = useState(currentPricing);
  const [sortBy, setSortBy] = useState(currentSortBy);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
  const [minRating, setMinRating] = useState(currentMinRating);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sync state when props change
  useEffect(() => {
    setSelectedCategory(currentCategory || 'all');
    setSelectedSubcategory(currentSubcategory || '');
    setPricing(currentPricing || 'all');
    setSortBy(currentSortBy || 'newest');
    setMaxPrice(currentMaxPrice || '');
    setMinRating(currentMinRating || '');
  }, [currentCategory, currentSubcategory, currentPricing, currentSortBy, currentMaxPrice, currentMinRating]);

  const parentCategories = categories.filter((c) => !c.parentId);
  const activeParent = parentCategories.find((c) => c.slug === selectedCategory);
  const availableSubcategories = activeParent
    ? categories.filter((c) => c.parentId === activeParent.id)
    : [];

  const handleCategoryChange = (catSlug: string) => {
    setSelectedCategory(catSlug);
    setSelectedSubcategory('');
  };

  // Count active filters
  let activeFilterCount = 0;
  if (selectedCategory && selectedCategory !== 'all') activeFilterCount++;
  if (selectedSubcategory) activeFilterCount++;
  if (pricing && pricing !== 'all') activeFilterCount++;
  if (maxPrice) activeFilterCount++;
  if (minRating) activeFilterCount++;
  if (sortBy && sortBy !== 'newest') activeFilterCount++;

  const hasActiveFilters = activeFilterCount > 0 || currentSearch;

  // Filter Form Content JSX with custom pill buttons (no native select popup positioning bugs on mobile!)
  const filterFormContent = (
    <form method="GET" className="space-y-5 text-xs" onSubmit={() => setIsMobileOpen(false)}>
      {currentSearch && <input type="hidden" name="search" value={currentSearch} />}
      <input type="hidden" name="category" value={selectedCategory} />
      <input type="hidden" name="subcategory" value={selectedSubcategory} />
      <input type="hidden" name="pricing" value={pricing} />
      <input type="hidden" name="sortBy" value={sortBy} />
      <input type="hidden" name="minRating" value={minRating} />

      {/* Category Pills / Select */}
      <div className="space-y-2">
        <label className="text-slate-900 font-extrabold block">Category</label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {parentCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.slug)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory Pills (if available) */}
      {availableSubcategories.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <label className="text-slate-900 font-extrabold block">Subcategory</label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => setSelectedSubcategory('')}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                !selectedSubcategory
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Subcategories
            </button>
            {availableSubcategories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubcategory(sub.slug)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                  selectedSubcategory === sub.slug
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Type Segmented Control */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <label className="text-slate-900 font-extrabold block">Pricing Type</label>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setPricing('all')}
            className={`rounded-lg py-2 text-[11px] font-bold transition-all ${
              pricing === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setPricing('paid')}
            className={`rounded-lg py-2 text-[11px] font-bold transition-all ${
              pricing === 'paid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paid Only
          </button>
          <button
            type="button"
            onClick={() => setPricing('free')}
            className={`rounded-lg py-2 text-[11px] font-bold transition-all ${
              pricing === 'free' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Free Assets
          </button>
        </div>
      </div>

      {/* Sort By Segmented Chips */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <label className="text-slate-900 font-extrabold block">Sort By</label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'newest', label: 'Newest Releases' },
            { id: 'popular', label: 'Most Popular' },
            { id: 'rating', label: 'Highest Rated' },
            { id: 'price_asc', label: 'Price: Low → High' },
            { id: 'price_desc', label: 'Price: High → Low' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSortBy(item.id)}
              className={`rounded-xl px-2.5 py-2 text-[11px] font-bold text-left transition-all flex items-center justify-between border ${
                sortBy === item.id
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{item.label}</span>
              {sortBy === item.id && <Check className="h-3.5 w-3.5 text-indigo-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Max Price Input */}
      <div className="space-y-1.5 pt-1 border-t border-slate-100">
        <label className="text-slate-900 font-extrabold block">Max Price (₹)</label>
        <input
          type="number"
          name="maxPrice"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="e.g. 2000"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-600 min-h-[44px]"
        />
      </div>

      {/* Minimum Rating Segmented Chips */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <label className="text-slate-900 font-extrabold block">Minimum Rating</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: '', label: 'Any Rating' },
            { id: '4.0', label: '4.0★ & Above' },
            { id: '4.5', label: '4.5★ & Above' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMinRating(item.id)}
              className={`rounded-xl py-2 px-1 text-[11px] font-bold text-center transition-all border ${
                minRating === item.id
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="w-full rounded-2xl bg-indigo-600 py-3.5 font-extrabold text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 min-h-[46px] text-sm">
        Apply Filters
      </button>
    </form>
  );

  return (
    <>
      {/* ─── Mobile View (< lg): Compact Trigger Bar ─── */}
      <div className="lg:hidden col-span-full mb-2">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="w-full flex items-center justify-between rounded-2xl bg-white border border-slate-200 p-3.5 shadow-2xs hover:bg-slate-50 transition-colors text-slate-900"
        >
          <div className="flex items-center gap-2 font-bold text-xs">
            <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
            <span>Filter & Sort Assets</span>
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                {activeFilterCount} Active
              </span>
            ) : (
              <span className="text-[11px] font-bold text-slate-500">Tap to customize</span>
            )}
          </div>
        </button>
      </div>

      {/* ─── Mobile Drawer Overlay (Slide-Up Bottom Sheet) ─── */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[99999] lg:hidden flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileOpen(false)}
          />

          <div className="relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl space-y-5 animate-slide-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-base text-slate-900 sticky top-0 bg-white z-20">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
                <span>Filter & Refine</span>
              </div>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <Link
                    href="/marketplace"
                    onClick={() => setIsMobileOpen(false)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Reset All
                  </Link>
                )}
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-full bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {filterFormContent}
          </div>
        </div>
      )}

      {/* ─── Desktop View (>= lg): Standard Left Sidebar ─── */}
      <aside className="hidden lg:block space-y-6 rounded-2xl border border-slate-200/80 bg-white p-5 h-fit shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-sm text-slate-900">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
            <span>Filter Assets</span>
          </div>
          {hasActiveFilters && (
            <Link href="/marketplace" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800">
              Reset
            </Link>
          )}
        </div>

        {filterFormContent}

        {/* Policy-Compliant Sidebar AdSense Placement */}
        <AdPlacement type="sidebar" slotId="catalog_sidebar_ad_001" />
      </aside>
    </>
  );
};
