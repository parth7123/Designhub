import React from 'react';

// Base Skeleton block
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

// ─── Listing Card Skeleton ───────────────────────────────────────────────
export function ListingCardSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden border border-slate-100 bg-white shadow-sm animate-fade-in">
      {/* Image */}
      <div className="skeleton h-52 w-full rounded-none" />
      <div className="p-4 space-y-3">
        {/* Category pill */}
        <div className="skeleton h-4 w-20 rounded-full" />
        {/* Title */}
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        {/* Seller row */}
        <div className="flex items-center gap-2 pt-1">
          <div className="skeleton h-7 w-7 rounded-full" />
          <div className="skeleton h-3 w-24" />
        </div>
        {/* Price + button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="skeleton h-6 w-16" />
          <div className="skeleton h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// Grid of listing card skeletons
export function ListingGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Listing Detail Skeleton ─────────────────────────────────────────────
export function ListingDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: image */}
        <div className="space-y-4">
          <div className="skeleton h-[420px] w-full rounded-3xl" />
          <div className="flex gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton h-20 w-24 rounded-2xl" />
            ))}
          </div>
        </div>
        {/* Right: details */}
        <div className="space-y-5">
          <div className="skeleton h-4 w-24 rounded-full" />
          <div className="skeleton h-9 w-4/5" />
          <div className="skeleton h-5 w-2/3" />
          <div className="flex gap-3 mt-2">
            {[1,2,3].map(i => <div key={i} className="skeleton h-8 w-20 rounded-full" />)}
          </div>
          <div className="skeleton h-px w-full" />
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className={`skeleton h-4 w-${i % 2 === 0 ? 'full' : '5/6'}`} />)}
          </div>
          <div className="skeleton h-px w-full" />
          <div className="flex items-center gap-4">
            <div className="skeleton h-14 w-14 rounded-2xl" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-24" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <div className="skeleton h-12 flex-1 rounded-2xl" />
            <div className="skeleton h-12 w-12 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Seller Profile Skeleton ─────────────────────────────────────────────
export function SellerProfileSkeleton() {
  return (
    <div className="animate-fade-in space-y-8">
      {/* Header banner */}
      <div className="skeleton h-52 w-full rounded-3xl" />
      {/* Avatar + info */}
      <div className="flex items-end gap-5 -mt-14 px-6">
        <div className="skeleton h-24 w-24 rounded-2xl shrink-0" />
        <div className="space-y-2 pb-2 flex-1">
          <div className="skeleton h-6 w-48" />
          <div className="skeleton h-4 w-64" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 px-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton h-16 rounded-2xl" />
        ))}
      </div>
      {/* Listings */}
      <div className="px-6">
        <ListingGridSkeleton count={8} />
      </div>
    </div>
  );
}

// ─── Cart Page Skeleton ──────────────────────────────────────────────────
export function CartSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6 animate-fade-in">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-5">
              <div className="skeleton h-20 w-28 rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-4 w-20" />
              </div>
              <div className="skeleton h-10 w-28 rounded-xl shrink-0" />
            </div>
          ))}
        </div>
        <div className="skeleton h-64 rounded-3xl" />
      </div>
    </div>
  );
}

// ─── My Purchases Skeleton ───────────────────────────────────────────────
export function PurchasesSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6 animate-fade-in">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="rounded-3xl border border-slate-100 bg-white overflow-hidden">
            <div className="skeleton h-44 rounded-none" />
            <div className="p-4 space-y-3">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-10 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Inline text skeleton (for dynamic values) ───────────────────────────
export function TextSkeleton({ width = 'w-24', height = 'h-4' }: { width?: string; height?: string }) {
  return <div className={`skeleton ${width} ${height} inline-block align-middle`} />;
}
