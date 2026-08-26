'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Download, Eye, ShieldCheck, Sparkles, CreditCard, MessageSquare, CheckCircle2, ArrowLeft, Heart, Share2, UserPlus, Check, ShoppingBag, ShieldAlert, AlertTriangle } from 'lucide-react';
import { CheckoutModal } from '../../../components/marketplace/CheckoutModal';
import { ShareModal } from '../../../components/marketplace/ShareModal';
import { AdPlacement } from '../../../components/ads/AdPlacement';
import { ListingCard } from '../../../components/marketplace/ListingCard';
import { ProtectedImage } from '../../../components/marketplace/ProtectedImage';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';

interface ClientProps {
  listing: any;
  relatedListings: any[];
}

export const ListingDetailClient: React.FC<ClientProps> = ({ listing, relatedListings }) => {
  const router = useRouter();
  const { isFavorited, toggleFavorite } = useWishlist();
  const { addToCart, isInCart } = useCart();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [msgSent, setMsgSent] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Gallery state for 1 to 4 preview images
  const galleryUrls: string[] = React.useMemo(() => {
    try {
      if (listing.previewUrls) {
        const parsed = JSON.parse(listing.previewUrls);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [listing.previewUrl || `/api/preview/${listing.id}`];
  }, [listing]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = galleryUrls[activeImageIndex] || galleryUrls[0];

  const favorited = isFavorited(listing.id);
  const inCart = isInCart(listing.id);

  const tags = JSON.parse(listing.tags || '[]');
  const fileSizeMb = (listing.fileSizeBytes / (1024 * 1024)).toFixed(1);
  const sellerId = listing.sellerId || listing.seller?.id;
  const sellerDisplayName = listing.seller?.businessName || listing.seller?.name || 'Verified Creator';

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (sellerId) {
        try {
          const followRes = await fetch(`/api/sellers/${sellerId}/follow`);
          if (followRes.ok) {
            const followData = await followRes.json();
            setIsFollowing(followData.isFollowing);
          }
        } catch (e) {}
      }
    };

    checkFollowStatus();
  }, [sellerId]);

  const handleFavoriteToggle = async () => {
    await toggleFavorite(listing.id);
  };

  const handleAddToCart = () => {
    addToCart({
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      price: listing.price,
      isFree: listing.isFree || listing.price === 0,
      previewUrl: listing.previewUrl || `/api/preview/${listing.id}`,
      categoryName: listing.category?.name,
      sellerId: sellerId,
      sellerName: sellerDisplayName,
    });
  };

  const handleFollowToggle = async () => {
    if (!sellerId) return;
    try {
      const res = await fetch(`/api/sellers/${sellerId}/follow`, {
        method: 'POST',
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/marketplace/${listing.slug || listing.id}`);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (err) {}
  };

  const handleFreeDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/downloads/${listing.id}`);
      if (res.status === 401) {
        router.push(`/login?redirect=/marketplace/${listing.slug || listing.id}`);
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to download free asset');
        return;
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${listing.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Asset.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert(err.message || 'Download error occurred');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: sellerId,
          content: messageContent,
          listingId: listing.id,
        }),
      });

      if (res.ok) {
        setMsgSent(true);
        setTimeout(() => {
          setShowMessageModal(false);
          setMsgSent(false);
          setMessageContent('');
        }, 1500);
      }
    } catch (err) {}
  };

  const canonicalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/marketplace/${listing.slug || listing.id}`
    : `/marketplace/${listing.slug || listing.id}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
      {/* Back Button & Action Bar */}
      <div className="flex items-center justify-between">
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Link>

        <div className="flex items-center gap-2">
          {/* Heart Favorite Button */}
          <button
            onClick={handleFavoriteToggle}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all shadow-2xs ${
              favorited
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart className={`h-4 w-4 ${favorited ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden sm:inline">{favorited ? 'Saved' : 'Wishlist'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Share2 className="h-4 w-4 text-indigo-600" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Preview & Description */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Preview Frame */}
          <div className="space-y-3">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm group select-none watermark-protected">
              <ProtectedImage
                src={activeImage}
                alt={listing.title}
                watermarkText="DESIGNHUB PROTECTED PREVIEW • DO NOT COPY"
              />
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1 text-xs font-bold text-indigo-600 backdrop-blur-md shadow-xs border border-slate-200/60">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                {listing.category?.name}
              </div>
              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white shadow-xs">
                <span>🛡️ Protected Canvas Preview</span>
              </div>
            </div>

            {/* Gallery Thumbnails (1 to 4 images) */}
            {galleryUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {galleryUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative aspect-[16/10] rounded-2xl overflow-hidden border-2 transition-all duration-200 bg-slate-100 shadow-2xs ${
                      activeImageIndex === index
                        ? 'border-indigo-600 ring-4 ring-indigo-500/20 scale-[1.02]'
                        : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <ProtectedImage
                      src={url}
                      alt={`Preview ${index + 1}`}
                      watermarkText={`#${index + 1}`}
                    />
                    {activeImageIndex === index && (
                      <span className="absolute top-1 right-1 z-20 h-2.5 w-2.5 rounded-full bg-indigo-600 ring-2 ring-white" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Metadata */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{listing.title}</h1>
              {listing.isFree && (
                <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3.5 py-1 text-xs font-black text-emerald-800 tracking-wider">
                  FREE DESIGN
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm">{listing.ratingAvg > 0 ? listing.ratingAvg.toFixed(1) : '5.0'}</span>
                <span className="text-slate-400 font-normal">({listing.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-slate-400" />
                <span>{listing.viewsCount} Views</span>
              </div>
              <span>ZIP File • {fileSizeMb} MB</span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map((t: string, i: number) => (
                <span key={i} className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-2xs">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Description Body */}
          <div className="space-y-3 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-bold text-slate-900">Product Description</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line font-normal">{listing.description}</p>
          </div>

          {/* Policy-Compliant In-Page Ad Placement */}
          <AdPlacement type="banner" slotId="detail_page_banner_001" />

          {/* Verified Reviews Section */}
          <div className="space-y-6 border-t border-slate-200 pt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900">Purchaser Reviews</h3>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Verified Buyer Restricted
              </span>
            </div>

            {listing.reviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No reviews submitted yet for this listing.</p>
            ) : (
              <div className="space-y-4">
                {listing.reviews.map((r: any) => (
                  <div key={r.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-100">
                          {r.buyer.name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-900">{r.buyer.name}</span>
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 border border-indigo-100">Verified Purchaser</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: r.rating }).map((_, idx) => (
                          <Star key={idx} className="h-3.5 w-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{r.comment}</p>
                    <span className="text-[10px] text-slate-400 block">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Purchase / Download Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-6 shadow-xl shadow-slate-200/40 sticky top-24">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {listing.isFree ? 'Free License' : 'Purchase License'}
              </span>
              <span className="text-3xl font-black text-indigo-600">
                {listing.isFree ? <span className="text-emerald-600">FREE</span> : `₹${listing.price.toLocaleString('en-IN')}`}
              </span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 border-t border-b border-slate-100 py-4 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Instant server-side proxy download</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Commercial & personal project use</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Unlimited re-downloads from library</span>
              </li>
            </ul>

            {/* Action Buttons: Download/Buy Now + Add to Cart */}
            <div className="space-y-3">
              {listing.isFree ? (
                <button
                  onClick={handleFreeDownload}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 transition-all min-h-[48px]"
                >
                  <Download className="h-5 w-5" />
                  {isDownloading ? 'Preparing Stream...' : 'Download Free Asset'}
                </button>
              ) : (
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-all min-h-[48px]"
                >
                  <CreditCard className="h-5 w-5" />
                  Buy Now with Razorpay
                </button>
              )}

              <button
                onClick={handleAddToCart}
                className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold transition-all border min-h-[44px] ${
                  inCart
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-900 text-white border-slate-900 hover:bg-indigo-600 hover:border-indigo-600'
                }`}
              >
                {inCart ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>

            {/* Creator Profile Link Card */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created By</span>
                {sellerId && (
                  <button
                    onClick={handleFollowToggle}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                      isFollowing
                        ? 'bg-slate-200 text-slate-800 hover:bg-rose-100 hover:text-rose-700'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <Link href={sellerId ? `/seller-profile/${sellerId}` : '#'} className="flex items-center gap-3 group">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                  {sellerDisplayName.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{sellerDisplayName}</h4>
                  {listing.seller?.status === 'SUSPENDED' ? (
                    <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> Account Suspended
                    </span>
                  ) : listing.seller?.warningNotice ? (
                    <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Warning Issued
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Verified Creator
                    </span>
                  )}
                </div>
              </Link>

              {/* Warning/Suspension Alert Box for Buyers */}
              {listing.seller?.status === 'SUSPENDED' && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-[11px] text-rose-800 leading-snug">
                  <strong>Notice:</strong> This seller&apos;s studio is currently suspended under platform review.
                </div>
              )}

              {listing.seller?.warningNotice && listing.seller?.status !== 'SUSPENDED' && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-800 leading-snug">
                  <strong>Seller Policy Notice:</strong> <em>&ldquo;{listing.seller.warningNotice}&rdquo;</em>
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed font-normal line-clamp-3">
                {listing.seller?.bio || 'Independent digital creator publishing high quality resources on DesignHub.'}
              </p>
              
              <button
                onClick={() => setShowMessageModal(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs min-h-[40px]"
              >
                <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                Message Creator
              </button>
            </div>
          </div>

          <AdPlacement type="sidebar" slotId="detail_sidebar_001" />
        </aside>
      </div>

      {/* Related Assets Grid */}
      {relatedListings.length > 0 && (
        <section className="space-y-6 border-t border-slate-200 pt-12">
          <h3 className="text-xl font-extrabold text-slate-900">More Assets in {listing.category?.name}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {relatedListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}

      {/* Checkout Modal */}
      <CheckoutModal listing={listing} isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={listing.title}
        url={canonicalUrl}
      />

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Send Message to Creator</h3>
            {msgSent ? (
              <p className="text-xs text-emerald-600 font-bold text-center py-4">Message sent successfully!</p>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Ask a question about file compatibility, custom licensing, or support..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowMessageModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
                  <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm">Send Message</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
