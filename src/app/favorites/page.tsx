'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Sparkles, ArrowLeft } from 'lucide-react';
import { ListingCard } from '../../components/marketplace/ListingCard';
import { useWishlist } from '../../context/WishlistContext';

export default function FavoritesPage() {
  const { favoriteIds } = useWishlist();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/favorites');
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [favoriteIds.size]);

  // Filter items that are still favorited in WishlistContext
  const activeFavorites = favorites.filter((fav) => favoriteIds.has(fav.listingId || fav.listing?.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link href="/marketplace" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketplace
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Heart className="h-7 w-7 text-rose-500 fill-rose-500" />
            My Wishlist
          </h1>
          <p className="text-xs text-slate-500 mt-1">Saved design assets for your upcoming creative projects</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-200/60" />
          ))}
        </div>
      ) : activeFavorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
          <Sparkles className="h-8 w-8 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900">Your wishlist is currently empty</h3>
          <p className="text-xs text-slate-500 max-w-sm">Browse the marketplace and click the heart icon on any asset to save it here for later.</p>
          <Link href="/marketplace" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors">
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
          {activeFavorites.map((fav) => (
            <ListingCard
              key={fav.id}
              listing={fav.listing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
