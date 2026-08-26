'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Sparkles, ArrowLeft } from 'lucide-react';
import { ListingCard } from '../../components/marketplace/ListingCard';

export default function FollowingPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowingFeed = async () => {
    try {
      const res = await fetch('/api/following');
      const data = await res.json();
      setListings(data.listings || []);
    } catch (err) {
      console.error('Failed to fetch following feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowingFeed();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link href="/marketplace" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketplace
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-indigo-600" />
            Followed Creators Feed
          </h1>
          <p className="text-xs text-slate-500 mt-1">Latest design releases from creators you follow</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-200/60" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
          <Sparkles className="h-8 w-8 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900">No new releases from creators you follow</h3>
          <p className="text-xs text-slate-500 max-w-sm">Follow sellers on their public profile pages to receive real-time updates when they publish new assets.</p>
          <Link href="/marketplace" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors">
            Discover Creators
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
          {listings.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      )}
    </div>
  );
}
