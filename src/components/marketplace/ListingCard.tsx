'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { Star, Eye, Sparkles, Heart, ShoppingBag, Check } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { ProtectedImage } from './ProtectedImage';

interface ListingCardProps {
  listing: any;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const { isFavorited, toggleFavorite } = useWishlist();
  const { addToCart, isInCart } = useCart();
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const favorited = isFavorited(listing.id);
  const inCart = isInCart(listing.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isTogglingFav) return;
    setIsTogglingFav(true);
    try {
      await toggleFavorite(listing.id);
    } catch (err) {
    } finally {
      setIsTogglingFav(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      price: listing.price,
      isFree: listing.isFree || listing.price === 0,
      previewUrl: listing.previewUrl || `/api/preview/${listing.id}`,
      categoryName: listing.category?.name,
      sellerId: listing.sellerId || listing.seller?.id,
      sellerName: listing.seller?.businessName || listing.seller?.name,
    });
  };

  const sellerName = listing.seller?.businessName || listing.seller?.name || 'Creator';
  const sellerId = listing.sellerId || listing.seller?.id;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-100/60 hover:border-indigo-200 animate-fade-in-up">
      {/* Preview Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <ProtectedImage
          src={listing.previewUrl || `/api/preview/${listing.id}`}
          alt={listing.title}
        />
        
        {/* Category Pill */}
        <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 hidden xs:flex items-center gap-1 rounded-full bg-white/90 px-1.5 sm:px-2.5 py-0.5 text-[9px] sm:text-[11px] font-bold text-indigo-600 backdrop-blur-md shadow-xs border border-slate-200/60 max-w-[90px] sm:max-w-[130px] truncate">
          <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 text-indigo-600" />
          <span className="truncate">{listing.category?.name || 'Asset'}</span>
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label="Save to Wishlist"
          className={`absolute top-1.5 right-1.5 sm:top-3 sm:right-3 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95 border ${
            favorited
              ? 'bg-rose-50 text-rose-600 border-rose-200'
              : 'bg-white/90 text-slate-700 hover:text-rose-500 border-slate-200/60'
          }`}
        >
          <Heart
            className={`h-3 w-3 sm:h-4 sm:w-4 transition-colors ${
              favorited ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
            }`}
          />
        </button>

        {/* Price Tag / Free Badge */}
        <div className="absolute bottom-1.5 right-1.5 sm:bottom-3 sm:right-3 rounded-lg sm:rounded-xl bg-slate-900/90 backdrop-blur-md px-1.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black text-white shadow-md">
          {listing.isFree || listing.price === 0 ? (
            <span className="text-emerald-400 font-extrabold tracking-wider">FREE</span>
          ) : (
            <span>₹{listing.price.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col justify-between p-2 sm:p-4 space-y-1 sm:space-y-3">
        <Link href={`/marketplace/${listing.slug || listing.id}`} className="block group-hover:text-indigo-600 transition-colors">
          <h3 className="text-[11px] sm:text-base font-extrabold text-slate-900 line-clamp-1 leading-tight">
            {listing.title}
          </h3>
          <p className="mt-0.5 text-[9px] sm:text-xs text-slate-500 line-clamp-1 sm:line-clamp-2 leading-relaxed font-normal">
            {listing.description}
          </p>
        </Link>

        {/* Seller Info & Rating - Desktop only */}
        <div className="hidden sm:flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          {sellerId ? (
            <Link
              href={`/seller-profile/${sellerId}`}
              className="flex items-center gap-2 group/seller max-w-[140px] truncate"
            >
              <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-100 group-hover/seller:bg-indigo-600 group-hover/seller:text-white transition-colors shrink-0">
                {sellerName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-700 font-semibold truncate group-hover/seller:text-indigo-600 transition-colors">
                {sellerName}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 max-w-[140px] truncate">
              <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-100 shrink-0">
                S
              </div>
              <span className="text-xs text-slate-700 font-semibold truncate">
                {sellerName}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold shrink-0">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{listing.ratingAvg > 0 ? listing.ratingAvg.toFixed(1) : '5.0'}</span>
          </div>
        </div>

        {/* Action Buttons: View Details & Add to Cart (Desktop full, Mobile clean single button) */}
        <div className="pt-0.5 sm:pt-1">
          {/* Mobile minimal button */}
          <Link
            href={`/marketplace/${listing.slug || listing.id}`}
            className="sm:hidden flex w-full items-center justify-center gap-1 rounded-lg bg-slate-900 py-1.5 text-[9px] font-bold text-white shadow-2xs hover:bg-indigo-600 transition-colors"
          >
            <Eye className="h-2.5 w-2.5" />
            <span>View Details</span>
          </Link>

          {/* Desktop full buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href={`/marketplace/${listing.slug || listing.id}`}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-800 transition-all border border-slate-200/80 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 min-h-[44px]"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{listing.isFree ? 'Free Download' : 'View Details'}</span>
            </Link>

            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-xs font-bold transition-all border shrink-0 min-h-[44px] ${
                inCart
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
              }`}
              title={inCart ? 'In Cart' : 'Add to Cart'}
            >
              {inCart ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <ShoppingBag className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
