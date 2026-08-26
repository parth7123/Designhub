'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, X, Trash2, ArrowRight, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const { items, removeFromCart, clearCart, cartCount, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckoutCart = async () => {
    if (items.length === 0) return;
    setCheckingOut(true);

    try {
      // Check if all items are free
      const allFree = items.every((i) => i.isFree || i.price === 0);

      if (allFree) {
        // Download each free item via API
        for (const item of items) {
          try {
            await fetch(`/api/downloads/${item.id}`);
          } catch (e) {}
        }
        clearCart();
        setIsCartOpen(false);
        router.push('/my-purchases');
        return;
      }

      // Paid items: navigate to /cart or trigger first item checkout / batch checkout
      setIsCartOpen(false);
      router.push('/cart');
    } catch (err: any) {
      alert(err.message || 'Cart checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md border-l border-slate-200 bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#FBF8F3]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                <ShoppingBag className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Your Cart</h2>
                <p className="text-[11px] text-slate-500 font-medium">{cartCount} design {cartCount === 1 ? 'asset' : 'assets'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cartCount > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors px-2 py-1"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-stone-200/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Your cart is currently empty</h3>
                <p className="text-xs text-slate-500 max-w-xs">Explore the marketplace and add UI kits, vectors, or 3D models to your cart.</p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    router.push('/marketplace');
                  }}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <img
                    src={item.previewUrl || `/api/preview/${item.id}`}
                    alt={item.title}
                    className="h-14 w-18 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/marketplace/${item.slug || item.id}`}
                      onClick={() => setIsCartOpen(false)}
                      className="text-xs font-bold text-slate-900 hover:text-indigo-600 truncate block"
                    >
                      {item.title}
                    </Link>
                    <span className="text-[10px] text-slate-500 font-medium block truncate">
                      By {item.sellerName || 'Verified Creator'}
                    </span>
                    <div className="mt-1">
                      {item.isFree || item.price === 0 ? (
                        <span className="text-emerald-600 font-black text-xs">FREE</span>
                      ) : (
                        <span className="text-indigo-600 font-extrabold text-xs">₹{item.price.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer Summary & Checkout CTA */}
          {items.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 p-5 space-y-4">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal ({cartCount} items)</span>
                  <span className="font-bold text-slate-900">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Gated Proxy Stream License</span>
                  <span className="text-emerald-600 font-bold">Included</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-indigo-600 font-black text-base">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleCheckoutCart}
                  disabled={checkingOut}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-all min-h-[44px]"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>{checkingOut ? 'Processing...' : 'Proceed to Checkout'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  View Full Cart Page
                </Link>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Encrypted Razorpay Checkout & Proxy Stream</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
