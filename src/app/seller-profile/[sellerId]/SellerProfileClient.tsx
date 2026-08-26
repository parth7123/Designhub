'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ShieldCheck, Users, Sparkles, ArrowLeft, UserPlus, Check, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ListingCard } from '../../../components/marketplace/ListingCard';

interface SellerProfileClientProps {
  seller: any;
  listings: any[];
  followerCount: number;
  initialIsFollowing: boolean;
  stats: {
    totalListings: number;
    avgRating: number;
    totalReviews: number;
  };
}

export const SellerProfileClient: React.FC<SellerProfileClientProps> = ({
  seller,
  listings: initialListings,
  followerCount: initialFollowerCount,
  initialIsFollowing,
  stats,
}) => {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const handleFollowToggle = async () => {
    if (isTogglingFollow) return;
    setIsTogglingFollow(true);

    try {
      const res = await fetch(`/api/sellers/${seller.id}/follow`, {
        method: 'POST',
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/seller-profile/${seller.id}`);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        setFollowerCount(data.followerCount);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const sortedListings = [...initialListings].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'rating') return b.ratingAvg - a.ratingAvg;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const displayName = seller.businessName || seller.name;
  const initialLetter = displayName ? displayName.charAt(0).toUpperCase() : 'S';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Back Nav */}
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Marketplace
      </Link>

      {/* Creator Profile Hero Banner Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Avatar / Logo */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-lg shadow-indigo-600/20 border border-indigo-500 shrink-0">
              {seller.avatarUrl ? (
                <img src={seller.avatarUrl} alt={displayName} className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <span>{initialLetter}</span>
              )}
            </div>

            {/* Creator Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{displayName}</h1>
                {seller.status === 'SUSPENDED' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> Account Suspended
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified Seller
                  </span>
                )}
                {seller.warningNotice && seller.status !== 'SUSPENDED' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Warning Issued
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed font-normal">
                {seller.bio || 'Digital creator publishing premium design assets on DesignHub.'}
              </p>
              <span className="text-[11px] text-slate-400 font-medium block">
                Member since {new Date(seller.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Follow Button */}
          <div className="shrink-0">
            <button
              onClick={handleFollowToggle}
              disabled={isTogglingFollow}
              className={`w-full md:w-auto flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-xs font-bold transition-all shadow-md min-h-[44px] ${
                isFollowing
                  ? 'bg-slate-100 text-slate-800 border border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Follow Creator</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Public Warning / Suspended Governance Banner for Buyers */}
        {seller.status === 'SUSPENDED' && (
          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm text-rose-950">Creator Studio Account Suspended</h4>
              <p className="text-rose-800 mt-0.5 font-medium leading-relaxed">
                This creator account has been suspended by platform administration due to policy compliance review.
              </p>
            </div>
          </div>
        )}

        {seller.warningNotice && seller.status !== 'SUSPENDED' && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm text-amber-950">Official Platform Warning Issued</h4>
              <p className="text-amber-800 mt-0.5 font-medium leading-relaxed">
                Platform administrators have issued an active policy warning to this seller: <em>&ldquo;{seller.warningNotice}&rdquo;</em>
              </p>
            </div>
          </div>
        )}

        {/* Aggregate Stats Strip */}
        <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6 text-center">
          <div className="space-y-0.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalListings}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Live Assets</span>
          </div>
          <div className="space-y-0.5 border-x border-slate-100 px-2">
            <div className="flex items-center justify-center gap-1 text-amber-500 font-bold">
              <Star className="h-4 w-4 fill-amber-400" />
              <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '5.0'}</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Rating ({stats.totalReviews} reviews)</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{followerCount}</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Followers</span>
          </div>
        </div>
      </div>

      {/* Catalog Grid Header & Sorting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          Assets by {displayName}
        </h2>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs"
          >
            <option value="newest">Newest Releases</option>
            <option value="rating">Highest Rated</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      {sortedListings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
          This creator hasn't published any live assets yet.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
          {sortedListings.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      )}
    </div>
  );
};
