'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, CreditCard, Sparkles, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface CheckoutModalProps {
  listing: any;
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ listing, isOpen, onClose }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleRazorpayPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Call backend API to create real Razorpay Order
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate checkout');
      }

      // If free item, process free download directly
      if (data.isFree) {
        await verifyAndCompletePayment(
          data.razorpayOrderId,
          `free_pay_${Date.now()}`,
          'free_order_valid'
        );
        return;
      }

      // 2. Load official Razorpay checkout script (checkout.js)
      const loadScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
          if ((window as any).Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const loaded = await loadScript();

      if (!loaded || typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Razorpay checkout SDK failed to load. Please check your internet connection.');
      }

      // 3. Configure Real Razorpay Modal Options
      const options = {
        key: data.keyId,
        amount: Math.round(data.amount * 100),
        currency: data.currency || 'INR',
        name: 'DesignHub Marketplace',
        description: `Purchase: ${listing.title}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: data.buyer?.name || '',
          email: data.buyer?.email || '',
          contact: '9999999999',
        },
        theme: { color: '#4f46e5' },
        handler: async function (response: any) {
          await verifyAndCompletePayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      // 4. Open Real Razorpay Payment Window
      const paymentObject = new (window as any).Razorpay(options);

      paymentObject.on('payment.failed', function (response: any) {
        console.error('Razorpay payment failed:', response.error);
        setError(response.error?.description || 'Payment was declined or cancelled.');
        setLoading(false);
      });

      paymentObject.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Payment initiation failed');
      setLoading(false);
    }
  };

  // Called after real Razorpay payment succeeds to verify HMAC signature
  const verifyAndCompletePayment = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) => {
    try {
      const webhookRes = await fetch('/api/webhooks/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'order.paid',
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          payload: {
            payment: {
              entity: {
                id: razorpayPaymentId,
                order_id: razorpayOrderId,
                amount: Math.round(listing.price * 100),
                currency: 'INR',
                status: 'captured',
              },
            },
          },
        }),
      });

      if (webhookRes.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          router.push('/my-purchases');
          router.refresh();
        }, 1500);
      } else {
        const errData = await webhookRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Payment signature verification failed');
      }
    } catch (e: any) {
      setError(e.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 space-y-6">

        {/* Success State */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Payment Successful!</h3>
            <p className="text-sm text-slate-500">Your asset is ready in your library. Redirecting...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Razorpay Secure Checkout</h3>
              </div>
              <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Product Details */}
            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <img
                src={listing.previewUrl || `/api/preview/${listing.id}`}
                alt={listing.title}
                className="h-16 w-20 rounded-xl object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{listing.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">By {listing.seller?.businessName || listing.seller?.name}</p>
                <span className="inline-block text-[11px] font-bold text-emerald-600 mt-1">
                  Unlimited Re-downloads • Instant Access
                </span>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-2 text-sm border-t border-b border-slate-100 py-4 text-slate-600">
              <div className="flex justify-between">
                <span>Asset Price</span>
                <span className="font-bold text-slate-900">₹{listing.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Platform Service Fee & Taxes</span>
                <span className="text-emerald-600 font-bold">Included</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Payable</span>
                <span className="text-indigo-600 font-extrabold text-lg">₹{listing.price.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Security Info */}
            <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <Lock className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>Gated Server Proxy Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Razorpay Route Instant Split</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleRazorpayPayment}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening Razorpay Gateway...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Pay ₹{listing.price.toLocaleString('en-IN')} via Razorpay
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
