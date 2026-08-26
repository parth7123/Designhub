'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Download, Plus, Clock, CheckCircle, Package, Lock, Heart, ExternalLink, Gift, Tag, Loader2, CloudUpload, CheckCircle2, Trash2, AlertTriangle, CreditCard, ShieldAlert, X } from 'lucide-react';
import { AdPlacement } from '../../components/ads/AdPlacement';

export default function SellerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Create Listing Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('Figma, UI Kit, SaaS');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const progressIntervalRef = useRef<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/seller/dashboard');
      if (!res.ok) {
        setLoading(false);
        router.replace('/login?redirect=/seller&error=seller_access_required');
        return;
      }
      const d = await res.json();
      setData(d);

      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      const allCats = catData.categories || [];
      setCategories(allCats);

      const parents = allCats.filter((c: any) => !c.parentId);
      if (parents.length > 0) {
        setParentCategoryId(parents[0].id);
        const children = allCats.filter((c: any) => c.parentId === parents[0].id);
        setCategoryId(children.length > 0 ? children[0].id : parents[0].id);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleParentCategoryChange = (pId: string) => {
    setParentCategoryId(pId);
    const children = categories.filter((c) => c.parentId === pId);
    if (children.length > 0) {
      setCategoryId(children[0].id);
    } else {
      setCategoryId(pId);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    setDeletingId(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete listing');
      // Optimistically remove from local state
      setData((prev: any) => ({
        ...prev,
        listings: prev.listings.filter((l: any) => l.id !== listingId),
      }));
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile || (previewFiles.length === 0 && !previewFile) || !title || (!isFree && !price) || !categoryId) {
      setUploadMsg('Please fill out all required fields, ZIP product file, and select 1 to 4 preview images.');
      return;
    }

    const filesToUpload = previewFiles.length > 0 ? previewFiles : (previewFile ? [previewFile] : []);
    if (filesToUpload.length < 1 || filesToUpload.length > 4) {
      setUploadMsg('Please select minimum 1 and maximum 4 preview images.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStage('uploading');
    setUploadMsg(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('isFree', isFree ? 'true' : 'false');
    formData.append('price', isFree ? '0' : price);
    formData.append('categoryId', categoryId);
    formData.append('tags', tags);
    formData.append('zipFile', zipFile);
    
    filesToUpload.forEach((file) => {
      formData.append('previewFiles', file);
    });
    formData.append('previewFile', filesToUpload[0]);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.timeout = 25000; // 25s timeout

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        // Map raw byte transmission to 0% -> 85%
        const pct = Math.round((event.loaded / event.total) * 85);
        setUploadProgress(pct);
        if (event.loaded === event.total) {
          setUploadStage('processing');
          // Smoothly tick from 85% to 96% while server processes
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 96) return 96;
              return prev + 1;
            });
          }, 300);
        }
      }
    });

    xhr.addEventListener('load', () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          setUploadStage('done');
          setUploadMsg('Listing created and published successfully!');
          setTimeout(() => {
            setShowCreateModal(false);
            setUploading(false);
            setUploadMsg(null);
            setUploadProgress(0);
            setUploadStage('idle');
            setTitle('');
            setDescription('');
            setIsFree(false);
            setPrice('');
            setZipFile(null);
            setPreviewFile(null);
            setPreviewFiles([]);
            fetchDashboardData();
          }, 800);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (err: any) {
        setUploadMsg(err.message || 'Upload failed');
        setUploadStage('error');
        setUploading(false);
      }
    });

    xhr.addEventListener('error', () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setUploadMsg('Network connection error while uploading file.');
      setUploadStage('error');
      setUploading(false);
    });

    xhr.addEventListener('timeout', () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setUploadMsg('Upload request timed out. Please retry with a smaller file or check your connection.');
      setUploadStage('error');
      setUploading(false);
    });

    xhr.open('POST', '/api/listings');
    xhr.send(formData);
  };

  const [payingFine, setPayingFine] = useState(false);
  const [finePayError, setFinePayError] = useState<string | null>(null);

  const handlePayPenaltyFine = async () => {
    setPayingFine(true);
    setFinePayError(null);

    try {
      // 1. Create penalty payment order on backend
      const res = await fetch('/api/seller/pay-fine', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate fine payment');

      // 2. Load Razorpay script
      const loadScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
          if ((window as any).Razorpay) { resolve(true); return; }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const loaded = await loadScript();
      if (!loaded) throw new Error('Razorpay SDK failed to load');

      const options = {
        key: data.keyId,
        amount: Math.round(data.amount * 100),
        currency: 'INR',
        name: 'DesignHub Governance',
        description: 'Seller Account Re-activation Penalty Fine',
        order_id: data.orderId,
        prefill: {
          name: data.sellerName,
          email: data.email,
        },
        theme: { color: '#dc2626' },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/seller/pay-fine', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              alert('Penalty fine paid successfully! Your studio account is now unblocked and live.');
              fetchDashboardData();
            } else {
              const err = await verifyRes.json();
              setFinePayError(err.error || 'Fine payment verification failed');
            }
          } catch (e: any) {
            setFinePayError(e.message || 'Verification error');
          } finally {
            setPayingFine(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPayingFine(false);
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      setFinePayError(err.message || 'Failed to pay penalty fine');
      setPayingFine(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-xs text-slate-500">Loading Seller Studio...</div>;
  }

  if (!data?.sellerInfo) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <Store className="h-12 w-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Seller Studio Account Required</h2>
        <p className="text-xs text-slate-500">Please register or log in as a seller account to access your studio dashboard.</p>
        <Link href="/register?role=seller" className="inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm">
          Register as Seller
        </Link>
      </div>
    );
  }

  const seller = data.sellerInfo;
  const parentCategories = categories.filter((c) => !c.parentId);
  const availableSubcategories = categories.filter((c) => c.parentId === parentCategoryId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Warning Notice Banner if issued by Admin */}
      {seller.warningNotice && seller.status !== 'SUSPENDED' && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
              Official Platform Notice / Warning
            </h4>
            <p className="text-amber-800 mt-1 font-medium leading-relaxed">{seller.warningNotice}</p>
            <p className="text-[11px] text-amber-700 mt-1">Please ensure full adherence to Marketplace Quality & Licensing Guidelines.</p>
          </div>
        </div>
      )}

      {/* Account Blocked / Suspended & Fine Payment Enforcement Card */}
      {seller.status === 'SUSPENDED' && (
        <div className="rounded-3xl border-2 border-rose-300 bg-rose-50/90 p-6 sm:p-8 text-rose-900 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/20">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-950">Studio Account Suspended & Blocked</h3>
                <p className="text-xs text-rose-700 mt-0.5">Your publishing privileges have been locked due to an administrator policy enforcement action.</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Mandatory Penalty Fine</span>
              <span className="text-3xl font-black text-rose-700">₹{(seller.penaltyFineAmount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-rose-800">
            <p><strong>Reason for Action:</strong> {seller.penaltyReason || 'Violation of DesignHub marketplace seller terms.'}</p>
            <p className="text-[11px] text-rose-700">To unlock your creator studio and resume publishing assets, pay the required governance fine below via Razorpay.</p>
          </div>

          {finePayError && (
            <div className="rounded-xl bg-white border border-rose-300 p-3 text-xs text-rose-700 font-bold">
              {finePayError}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handlePayPenaltyFine}
              disabled={payingFine}
              className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700 disabled:opacity-60 transition-all min-h-[48px]"
            >
              {payingFine ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting to Razorpay...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Pay ₹{(seller.penaltyFineAmount || 0).toLocaleString('en-IN')} Fine & Unblock Account
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Header & Approval Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{seller.businessName || seller.name} Studio</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1 ${
              seller.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              seller.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
              'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {seller.status === 'APPROVED' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> :
               seller.status === 'SUSPENDED' ? <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> :
               <Clock className="h-3.5 w-3.5 text-amber-600" />}
              {seller.status === 'APPROVED' ? 'Approved & Live' :
               seller.status === 'SUSPENDED' ? 'Studio Suspended' :
               'KYC Pending Admin Approval'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Razorpay Route Account ID: {seller.razorpayAccountId || 'Pending Config'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/seller-profile/${seller.id}`}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors min-h-[44px]"
          >
            <ExternalLink className="h-4 w-4 text-indigo-600" />
            <span>View Public Profile</span>
          </Link>

          <button
            onClick={() => setShowCreateModal(true)}
            disabled={seller.status !== 'APPROVED'}
            className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Listing</span>
          </button>
        </div>
      </div>

      {seller.status !== 'APPROVED' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-center gap-3">
          <Clock className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold">Your Seller Registration is Currently Awaiting Admin Approval</p>
            <p className="text-amber-700 mt-0.5">Our admin team is reviewing your business details. You will be able to publish assets once approved.</p>
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Net Paid Earnings</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">₹{(data.stats.totalEarnings || 0).toLocaleString('en-IN')}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">Via Razorpay Route payout</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Paid Sales Count</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600">{data.stats.totalSalesCount || 0}</span>
            <Download className="h-5 w-5 text-indigo-500/40" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">Paid completed orders</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Wishlist Favorites</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-rose-500">
              {data.listings?.reduce((sum: number, l: any) => sum + (l._count?.favorites || 0), 0) || 0}
            </span>
            <Heart className="h-5 w-5 text-rose-500/40 fill-rose-500/20" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">Buyer popularity signal</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Listings</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-purple-600">{data.stats.listingsCount || 0}</span>
            <Package className="h-5 w-5 text-purple-500/40" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">Published products</span>
        </div>
      </div>

      <AdPlacement type="banner" slotId="seller_dashboard_banner_001" />

      {/* Listings Management Table & Responsive Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-extrabold text-slate-900">Your Design Listings</h3>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Listing Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Downloads</th>
                <th className="px-6 py-4">Views</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.listings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No listings published yet.</td>
                </tr>
              ) : (
                data.listings.map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                      <img src={l.previewUrl || `/api/preview/${l.id}`} alt={l.title} className="h-9 w-12 rounded-lg object-cover border border-slate-200" />
                      <Link href={`/marketplace/${l.slug || l.id}`} className="hover:text-indigo-600 line-clamp-1">{l.title}</Link>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{l.category?.name}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {l.isFree ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${l.price}`}
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-600">{l.downloadCount}</td>
                    <td className="px-6 py-4 text-slate-500">{l.viewsCount}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {confirmDeleteId === l.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-rose-600 font-bold">Sure?</span>
                          <button
                            onClick={() => handleDeleteListing(l.id)}
                            disabled={deletingId === l.id}
                            className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-700 disabled:opacity-60 transition-colors"
                          >
                            {deletingId === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Delete'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(l.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="md:hidden space-y-3">
          {data.listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
              No listings published yet.
            </div>
          ) : (
            data.listings.map((l: any) => (
              <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <img src={l.previewUrl || `/api/preview/${l.id}`} alt={l.title} className="h-12 w-16 rounded-xl object-cover border border-slate-200 shrink-0" />
                  <div className="space-y-0.5 truncate">
                    <Link href={`/marketplace/${l.slug || l.id}`} className="text-sm font-bold text-slate-900 hover:text-indigo-600 truncate block">
                      {l.title}
                    </Link>
                    <span className="text-xs text-slate-500 block">{l.category?.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2 font-medium">
                  <div>
                    Price: {l.isFree ? <span className="text-emerald-600 font-bold">FREE</span> : <strong className="text-slate-900">₹{l.price}</strong>}
                  </div>
                  <div>Downloads: <strong className="text-indigo-600">{l.downloadCount}</strong></div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    {l.status}
                  </span>
                </div>
                {/* Delete for mobile */}
                <div className="pt-2 border-t border-slate-100">
                  {confirmDeleteId === l.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-rose-600">Delete this listing?</span>
                      <button
                        onClick={() => handleDeleteListing(l.id)}
                        disabled={deletingId === l.id}
                        className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        {deletingId === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Yes, Delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(l.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Listing
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[99999] flex justify-center items-start pt-16 sm:pt-20 pb-12 bg-slate-950/65 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl relative my-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Create & Upload New Design Listing</h3>
                <p className="text-xs text-slate-500 mt-0.5">Upload asset package and preview screenshots for your listing.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {uploadMsg && <p className="text-xs font-bold text-indigo-700 bg-indigo-50 p-3 rounded-xl border border-indigo-100">{uploadMsg}</p>}

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Listing Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. NeoGlass Figma UI System"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 min-h-[44px]"
                />
              </div>

              {/* Free Toggle & Price Input */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Gift className="h-4 w-4 text-emerald-600" />
                  <span>Offer this design asset for FREE to all buyers</span>
                </label>

                {!isFree && (
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Price (₹ INR)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="1499"
                      required={!isFree}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 min-h-[44px]"
                    />
                  </div>
                )}
              </div>

              {/* Two-step Nested Category Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Top-level Category</label>
                  <select
                    value={parentCategoryId}
                    onChange={(e) => handleParentCategoryChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:outline-none min-h-[44px]"
                  >
                    {parentCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Subcategory (Optional)</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:outline-none min-h-[44px]"
                  >
                    {availableSubcategories.length === 0 ? (
                      <option value={parentCategoryId}>General (No subcategories)</option>
                    ) : (
                      availableSubcategories.map((sc) => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Figma, UI Kit, SaaS"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Product Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your design asset features, component count, font usage..."
                  rows={3}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              {/* Upload Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4 space-y-2">
                  <label className="font-bold text-indigo-700 flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    Product ZIP File (.zip)
                  </label>
                  <input
                    type="file"
                    accept=".zip,.rar,.7z"
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                    required
                    className="text-slate-600 text-[11px]"
                  />
                  <p className="text-[10px] text-slate-500">Only accessible to verified buyers after successful purchase.</p>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 text-xs">Public Preview Images (1 to 4 JPG/PNG)</label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      previewFiles.length >= 1 && previewFiles.length <= 4 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {previewFiles.length} / 4 Selected (Min 1, Max 4)
                    </span>
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 4) {
                        alert('Maximum 4 preview images allowed. Selecting the first 4 images.');
                      }
                      const selected = files.slice(0, 4);
                      setPreviewFiles(selected);
                      if (selected.length > 0) setPreviewFile(selected[0]);
                    }}
                    required={previewFiles.length === 0}
                    className="text-slate-600 text-[11px] w-full"
                  />
                  
                  {previewFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {previewFiles.map((file, idx) => (
                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute top-0.5 left-0.5 bg-slate-900/80 text-white text-[8px] font-bold px-1 rounded">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500">Add 1 to 4 showcase images for buyers to view in gallery.</p>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                  {/* Stage label */}
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={`flex items-center gap-1.5 ${
                      uploadStage === 'done' ? 'text-emerald-600' :
                      uploadStage === 'error' ? 'text-rose-600' :
                      'text-indigo-600'
                    }`}>
                      {uploadStage === 'uploading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {uploadStage === 'processing' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {uploadStage === 'done' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {uploadStage === 'error' && '✗'}
                      {uploadStage === 'uploading' && `Uploading product asset package... ${uploadProgress}%`}
                      {uploadStage === 'processing' && 'Processing & saving listing...'}
                      {uploadStage === 'done' && 'Upload complete! Publishing listing...'}
                      {uploadStage === 'error' && 'Upload failed'}
                    </span>
                    <span className="text-slate-400">{uploadProgress}%</span>
                  </div>

                  {/* Progress bar track */}
                  <div className="h-2.5 w-full rounded-full bg-indigo-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ease-out ${
                        uploadStage === 'done' ? 'bg-emerald-500' :
                        uploadStage === 'error' ? 'bg-rose-500' :
                        'bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500'
                      } ${
                        uploadStage === 'processing' ? 'animate-pulse' : ''
                      }`}
                      style={{ width: uploadStage === 'processing' ? '95%' : `${uploadProgress}%` }}
                    />
                  </div>

                  {/* Step dots */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span className={uploadProgress >= 10 ? 'text-indigo-600 font-bold' : ''}>⬤ Reading file</span>
                    <span className={uploadProgress >= 50 ? 'text-indigo-600 font-bold' : ''}>⬤ Uploading</span>
                    <span className={uploadStage === 'processing' || uploadStage === 'done' ? 'text-indigo-600 font-bold' : ''}>⬤ Processing</span>
                    <span className={uploadStage === 'done' ? 'text-emerald-600 font-bold' : ''}>⬤ Published</span>
                  </div>
                </div>
              )}

              {uploadMsg && !uploading && (
                <div className={`rounded-xl p-3 text-xs font-bold ${
                  uploadStage === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}>
                  {uploadMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setUploadStage('idle'); setUploadProgress(0); }}
                  disabled={uploading}
                  className="px-4 py-2 font-bold text-slate-500 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-60 min-h-[44px] transition-all"
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Publishing Listing...</>
                  ) : (
                    <><CloudUpload className="h-4 w-4" /> Publish Listing</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
