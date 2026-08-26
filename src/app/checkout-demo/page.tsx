'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

export default function CheckoutDemoPage() {
  const [amountInr, setAmountInr] = useState<number>(500);
  const [currency, setCurrency] = useState<string>('INR');
  const [receipt, setReceipt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info' | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    setReceipt(`rcpt_demo_${Date.now()}`);
  }, []);

  const loadRazorpayScript = (): Promise<boolean> => {
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

  const handleCheckout = async () => {
    setLoading(true);
    setStatusMsg(null);
    setStatusType(null);
    setPaymentDetails(null);

    const amountPaise = Math.round(amountInr * 100);

    if (amountPaise < 100) {
      setStatusMsg('Amount must be at least ₹1 (100 paise)');
      setStatusType('error');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Call Backend to Create Order
      setStatusMsg('Step 1: Calling POST /api/create-order...');
      setStatusType('info');

      const createRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountPaise,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
        }),
      });

      const orderData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(orderData.error || orderData.details || 'Failed to create order');
      }

      const { order_id, key_id } = orderData;

      // Step 2: Load Razorpay Script & Open Modal
      setStatusMsg('Step 2: Loading Razorpay Checkout Modal...');
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Razorpay SDK failed to load');
      }

      const options = {
        key: key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TUHtq7FjCBYSOe',
        amount: amountPaise,
        currency,
        name: 'DesignHub Test Checkout',
        description: 'Razorpay Standard Web Checkout Integration Test',
        order_id,
        prefill: {
          name: 'Test Buyer',
          email: 'buyer@example.com',
          contact: '9999999999',
        },
        theme: { color: '#4f46e5' },
        handler: async function (response: any) {
          // Step 3: Call Backend to Verify Payment Signature
          setStatusMsg('Step 3: Verifying HMAC-SHA256 signature with POST /api/verify-payment...');
          setStatusType('info');

          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              setStatusMsg('🎉 Payment & Signature Verified Successfully!');
              setStatusType('success');
              setPaymentDetails({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
            } else {
              throw new Error(verifyData.error || 'Payment signature verification failed');
            }
          } catch (verifyErr: any) {
            setStatusMsg(`Verification Error: ${verifyErr.message}`);
            setStatusType('error');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setStatusMsg('Checkout cancelled by user.');
            setStatusType('error');
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', function (resp: any) {
        console.error('Payment failed:', resp.error);
        setStatusMsg(`Payment Failed: ${resp.error?.description || resp.error?.code}`);
        setStatusType('error');
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setStatusMsg(err.message || 'An unexpected error occurred during checkout');
      setStatusType('error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Razorpay Checkout Test</h1>
            <p className="text-xs text-slate-500">Standard Web Checkout Integration</p>
          </div>
        </div>

        {/* Credentials Info */}
        <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-indigo-700">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>Configured Razorpay Credentials</span>
          </div>
          <p className="text-slate-600 font-mono text-[11px]">
            Key ID: <span className="text-slate-900 font-bold">rzp_live_TUHtq7FjCBYSOe</span>
          </p>
          <p className="text-slate-600 font-mono text-[11px]">
            Secret: <span className="text-slate-900 font-bold">k2QA7Om873kWVj...</span>
          </p>
        </div>

        {/* Amount Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount (₹ INR)</label>
            <input
              type="number"
              min="1"
              value={amountInr}
              onChange={(e) => setAmountInr(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              = {Math.round(amountInr * 100)} paise (Minimum 100 paise)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Receipt ID</label>
              <input
                type="text"
                value={receipt}
                onChange={(e) => setReceipt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`rounded-2xl p-4 text-xs font-medium space-y-1 ${
              statusType === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : statusType === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {statusType === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
              {statusType === 'error' && <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
              {statusType === 'info' && <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />}
              <span>{statusMsg}</span>
            </div>

            {paymentDetails && (
              <div className="pt-2 text-[11px] font-mono space-y-0.5 border-t border-emerald-200 mt-2 text-emerald-950">
                <p>Order ID: {paymentDetails.order_id}</p>
                <p>Payment ID: {paymentDetails.payment_id}</p>
                <p className="truncate">Signature: {paymentDetails.signature}</p>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 transition-all disabled:opacity-60 min-h-[48px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Pay ₹{amountInr} via Razorpay
            </>
          )}
        </button>
      </div>
    </div>
  );
}
