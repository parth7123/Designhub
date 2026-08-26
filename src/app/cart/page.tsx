'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, ArrowLeft, ShieldCheck, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { CheckoutModal } from '../../components/marketplace/CheckoutModal';

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, clearCart, cartCount, cartTotal } = useCart();
  const [selectedCheckoutListing, setSelectedCheckoutListing] = useState<any | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleCheckoutItem = (item: any) => {
    if (item.isFree) {
      // Instant download free item
      window.location.href = `/api/downloads/${item.id}`;
      return;
    }
    setSelectedCheckoutListing(item);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutAll = () => {
    if (items.length === 0) return;
    const paidItem = items.find((i) => !i.isFree && i.price > 0);
    if (paidItem) {
      setSelectedCheckoutListing(paidItem);
      setIsCheckoutOpen(true);
    } else {
      // Download all free items
      items.forEach((i) => {
        window.open(`/api/downloads/${i.id}`, '_blank');
      });
      clearCart();
      router.push('/my-purchases');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Back Button */}
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Continue Browsing Marketplace
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <ShoppingBag className="h-7 w-7 text-indigo-600" />
            Shopping Cart
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review your selected design assets before downloading</p>
        </div>

        {cartCount > 0 && (
          <button
            onClick={clearCart}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors self-start sm:self-auto"
          >
            Clear Entire Cart
          </button>
        )}
      </div>

      {cartCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-4 shadow-xs">
          <ShoppingBag className="h-10 w-10 text-slate-400" />
          <h3 className="text-base font-bold text-slate-900">Your shopping cart is currently empty</h3>
          <p className="text-xs text-slate-500 max-w-sm">Explore our catalog to find UI kits, icons, vectors, and web templates.</p>
          <Link href="/marketplace" className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors">
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-4">
                  <img
                    src={item.previewUrl || `/api/preview/${item.id}`}
                    alt={item.title}
                    className="h-20 w-28 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      {item.categoryName || 'Design Asset'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-slate-500">By {item.sellerName || 'Verified Creator'}</p>
                    <div className="pt-1">
                      {item.isFree || item.price === 0 ? (
                        <span className="text-emerald-600 font-black text-sm">FREE</span>
                      ) : (
                        <span className="text-indigo-600 font-extrabold text-sm">₹{item.price.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                  <button
                    onClick={() => handleCheckoutItem(item)}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors min-h-[40px]"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    {item.isFree ? 'Download Free' : 'Checkout Item'}
                  </button>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[40px] flex items-center"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Sidebar Summary */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-6 shadow-xl shadow-slate-200/40 sticky top-24">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Order Summary</h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Selected Assets ({cartCount})</span>
                  <span className="font-bold text-slate-900">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Razorpay Service Fees</span>
                  <span className="text-emerald-600 font-bold">Included</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-100">
                  <span>Total Amount</span>
                  <span className="text-indigo-600 font-black text-xl">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-4 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Instant server-side proxy download</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Unlimited re-downloads from library</span>
                </li>
              </ul>

              <button
                onClick={handleCheckoutAll}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-all min-h-[48px]"
              >
                <CreditCard className="h-5 w-5" />
                Proceed to Pay ₹{cartTotal.toLocaleString('en-IN')}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Checkout Modal Integration */}
      {selectedCheckoutListing && (
        <CheckoutModal
          listing={selectedCheckoutListing}
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            setSelectedCheckoutListing(null);
          }}
        />
      )}
    </div>
  );
}
