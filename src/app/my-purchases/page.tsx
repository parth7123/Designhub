'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Download, Star, ShieldAlert, Gift, ShoppingBag, Loader2, CheckCircle2 } from 'lucide-react';
import { AdPlacement } from '../../components/ads/AdPlacement';

export default function MyPurchasesPage() {
  const [activeTab, setActiveTab] = useState<'purchases' | 'free'>('purchases');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [freeDownloads, setFreeDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any | null>(null);
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState<any | null>(null);
  // Map of listingId -> download progress (0-100) | 'done' | null
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number | 'done'>>({});

  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  const [disputeReason, setDisputeReason] = useState('Broken/Corrupt File');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeMsg, setDisputeMsg] = useState<string | null>(null);

  const fetchDownloads = async () => {
    try {
      const res = await fetch('/api/my-downloads');
      const data = await res.json();
      setPurchases(data.purchases || []);
      setFreeDownloads(data.freeDownloads || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  const handleDownload = (listingId: string, filename?: string) => {
    if (downloadProgress[listingId] !== undefined && downloadProgress[listingId] !== 'done') return;

    setDownloadProgress((prev) => ({ ...prev, [listingId]: 0 }));

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/api/downloads/${listingId}`, true);
    xhr.responseType = 'blob';

    xhr.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        setDownloadProgress((prev) => ({ ...prev, [listingId]: pct }));
      } else {
        // Unknown size — animate progress to indicate activity
        setDownloadProgress((prev) => {
          const cur = typeof prev[listingId] === 'number' ? (prev[listingId] as number) : 0;
          return { ...prev, [listingId]: Math.min(cur + 5, 90) };
        });
      }
    });

    xhr.addEventListener('load', () => {
      setDownloadProgress((prev) => ({ ...prev, [listingId]: 'done' }));
      // Trigger browser download
      const url = URL.createObjectURL(xhr.response);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `designhub-asset-${listingId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // Reset after 3s
      setTimeout(() => {
        setDownloadProgress((prev) => {
          const next = { ...prev };
          delete next[listingId];
          return next;
        });
      }, 3000);
    });

    xhr.addEventListener('error', () => {
      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[listingId];
        return next;
      });
    });

    xhr.send();
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReview) return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedOrderForReview.listingId,
          orderId: selectedOrderForReview.id,
          rating,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReviewMsg('Verified review submitted!');
      setTimeout(() => {
        setSelectedOrderForReview(null);
        setReviewMsg(null);
        setReviewComment('');
        fetchDownloads();
      }, 1500);
    } catch (e: any) {
      setReviewMsg(e.message);
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDispute) return;

    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderForDispute.id,
          reason: disputeReason,
          description: disputeDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDisputeMsg('Dispute case opened with admin!');
      setTimeout(() => {
        setSelectedOrderForDispute(null);
        setDisputeMsg(null);
        setDisputeDesc('');
        fetchDownloads();
      }, 1500);
    } catch (e: any) {
      setDisputeMsg(e.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Library & Downloads</h1>
        <p className="text-xs text-slate-500 mt-1">Unlimited re-downloads of owned assets via gated proxy streams</p>
      </div>

      <AdPlacement type="banner" slotId="purchases_banner_001" />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all min-h-[44px] ${
            activeTab === 'purchases' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="h-4 w-4" /> Paid Purchases ({purchases.length})
        </button>

        <button
          onClick={() => setActiveTab('free')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all min-h-[44px] ${
            activeTab === 'free' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Gift className="h-4 w-4 text-emerald-400" /> Free Downloads ({freeDownloads.length})
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 py-8">Loading your downloads library...</p>
      ) : activeTab === 'purchases' ? (
        purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-4 shadow-xs">
            <Download className="h-10 w-10 text-slate-400" />
            <h3 className="text-base font-bold text-slate-900">You have not purchased any paid design assets yet</h3>
            <p className="text-xs text-slate-500 max-w-sm">Explore our marketplace to find Figma UI kits, 3D models, and web templates.</p>
            <Link href="/marketplace" className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((order) => {
              const isDeleted = order.listing?.status === 'DELETED';
              const listingId = order.listing?.id;
              const title = order.listing?.title || 'Design Asset';

              return (
                <div key={order.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-3xl border ${isDeleted ? 'border-slate-200 bg-slate-50/70 opacity-90' : 'border-slate-200 bg-white'} p-6 shadow-xs`}>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative shrink-0">
                      <img
                        src={order.listing?.previewUrl || `/api/preview/${listingId}`}
                        alt={title}
                        className={`h-20 w-28 rounded-2xl object-cover border border-slate-200 ${isDeleted ? 'grayscale contrast-75' : ''}`}
                      />
                      {isDeleted && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white bg-rose-600/90 px-2 py-0.5 rounded-md">Deleted</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          {order.listing?.category?.name || 'Asset'}
                        </span>
                        {isDeleted && (
                          <span className="rounded-full bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 text-[9px] font-bold">
                            Deleted by Seller
                          </span>
                        )}
                      </div>
                      <h3 className={`text-base font-bold ${isDeleted ? 'text-slate-600 line-through' : 'text-slate-900'}`}>{title}</h3>
                      <p className="text-xs text-slate-500">By {order.listing?.seller?.businessName || order.listing?.seller?.name || 'Creator'}</p>
                      <span className="text-[11px] text-emerald-600 font-bold block">
                        Purchased on {new Date(order.createdAt).toLocaleDateString()} • ₹{order.amount}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                    {isDeleted ? (
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-200/80 px-4 py-2.5 text-xs font-bold text-slate-500 min-h-[44px]">
                        <ShieldAlert className="h-4 w-4 text-slate-400" />
                        Asset Unavailable (Deleted by Seller)
                      </div>
                    ) : (
                      /* Download Button with Progress */
                      <div className="flex flex-col gap-1.5 min-w-[160px]">
                        <button
                          onClick={() => handleDownload(listingId, `${title}.zip`)}
                          disabled={downloadProgress[listingId] !== undefined && downloadProgress[listingId] !== 'done'}
                          className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold shadow-md transition-all min-h-[44px] w-full ${
                            downloadProgress[listingId] === 'done'
                              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                              : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-70'
                          }`}
                        >
                          {downloadProgress[listingId] === 'done' ? (
                            <><CheckCircle2 className="h-4 w-4" /> Downloaded!</>
                          ) : typeof downloadProgress[listingId] === 'number' ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> {downloadProgress[listingId]}%</>
                          ) : (
                            <><Download className="h-4 w-4" /> Download Asset ZIP</>
                          )}
                        </button>
                        {/* Progress bar */}
                        {typeof downloadProgress[listingId] === 'number' && (
                          <div className="h-1.5 w-full rounded-full bg-indigo-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                              style={{ width: `${downloadProgress[listingId]}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {order.review ? (
                      <span className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-amber-600 flex items-center gap-1 min-h-[44px]">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        Reviewed ({order.review.rating}★)
                      </span>
                    ) : (
                      !isDeleted && (
                        <button
                          onClick={() => setSelectedOrderForReview(order)}
                          className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 min-h-[44px]"
                        >
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                          Leave Verified Review
                        </button>
                      )
                    )}

                    {order.dispute ? (
                      <span className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 min-h-[44px] flex items-center">
                        Dispute: {order.dispute.status}
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedOrderForDispute(order)}
                        className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 min-h-[44px]"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Report Issue
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        freeDownloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-4 shadow-xs">
            <Gift className="h-10 w-10 text-slate-400" />
            <h3 className="text-base font-bold text-slate-900">You haven't downloaded any free designs yet</h3>
            <p className="text-xs text-slate-500 max-w-sm">Browse our marketplace for free community vectors, UI kits, and templates.</p>
            <Link href="/marketplace?pricing=free" className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs">
              Browse Free Designs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {freeDownloads.map((log) => {
              const isDeleted = log.listing?.status === 'DELETED';
              const listingId = log.listing?.id;
              const title = log.listing?.title || 'Free Design Asset';

              return (
                <div key={log.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-3xl border ${isDeleted ? 'border-slate-200 bg-slate-50/70 opacity-90' : 'border-slate-200 bg-white'} p-6 shadow-xs`}>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative shrink-0">
                      <img
                        src={log.listing?.previewUrl || `/api/preview/${listingId}`}
                        alt={title}
                        className={`h-20 w-28 rounded-2xl object-cover border border-slate-200 ${isDeleted ? 'grayscale contrast-75' : ''}`}
                      />
                      {isDeleted && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white bg-rose-600/90 px-2 py-0.5 rounded-md">Deleted</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          {log.listing?.category?.name || 'Asset'}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-800">
                          FREE
                        </span>
                        {isDeleted && (
                          <span className="rounded-full bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 text-[9px] font-bold">
                            Deleted by Seller
                          </span>
                        )}
                      </div>
                      <h3 className={`text-base font-bold ${isDeleted ? 'text-slate-600 line-through' : 'text-slate-900'}`}>{title}</h3>
                      <p className="text-xs text-slate-500">By {log.listing?.seller?.businessName || log.listing?.seller?.name || 'Creator'}</p>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        Downloaded on {new Date(log.downloadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                    {isDeleted ? (
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-200/80 px-4 py-2.5 text-xs font-bold text-slate-500 min-h-[44px]">
                        <ShieldAlert className="h-4 w-4 text-slate-400" />
                        Asset Unavailable (Deleted by Seller)
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDownload(listingId, `${title}.zip`)}
                        disabled={downloadProgress[listingId] !== undefined && downloadProgress[listingId] !== 'done'}
                        className={`flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all min-h-[44px] ${
                          downloadProgress[listingId] ? 'opacity-80' : ''
                        }`}
                      >
                        <Download className="h-4 w-4" />
                        Download Free Asset ZIP
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Review Modal */}
      {selectedOrderForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Leave Verified Review for {selectedOrderForReview.listing.title}</h3>
            {reviewMsg && <p className="text-xs text-indigo-600 font-bold">{reviewMsg}</p>}
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Star Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-xl border ${rating >= star ? 'border-amber-400 bg-amber-50 text-amber-500 font-bold' : 'border-slate-200 text-slate-400'}`}
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Your Review Comment</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Describe your experience with this design asset..."
                  rows={4}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedOrderForReview(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {selectedOrderForDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Report File Issue / Request Refund Case</h3>
            <p className="text-xs text-slate-500">Refunds are handled case-by-case after admin inspection of broken or incorrect files.</p>
            {disputeMsg && <p className="text-xs text-indigo-600 font-bold">{disputeMsg}</p>}
            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Reason</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="Broken/Corrupt File">ZIP file is corrupt or unextractable</option>
                  <option value="Incorrect File Content">File does not match listing preview/description</option>
                  <option value="Missing Assets">Missing font files or components mentioned</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Detailed Explanation</label>
                <textarea
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Explain the technical issue to our admin moderation team..."
                  rows={4}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedOrderForDispute(null)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
                <button type="submit" className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs">File Case</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
