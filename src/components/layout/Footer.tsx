'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, CreditCard, Lock } from 'lucide-react';
import { AdPlacement } from '../ads/AdPlacement';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white pt-12 pb-8 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Policy Compliant AdSense Footer Banner */}
        <AdPlacement type="banner" slotId="footer_leaderboard_001" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 py-8 border-t border-slate-100">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-slate-900">DesignHub</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              The premium multi-vendor digital design marketplace. Discover Figma UI kits, 3D renders, vector icons, and Next.js web templates.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Marketplace</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/marketplace?category=ui-kits-dashboards" className="hover:text-indigo-600">UI Kits & Dashboards</Link></li>
              <li><Link href="/marketplace?category=3d-assets-models" className="hover:text-indigo-600">3D Assets & Models</Link></li>
              <li><Link href="/marketplace?category=icons-vector-packs" className="hover:text-indigo-600">Icons & Vector Graphics</Link></li>
              <li><Link href="/marketplace?category=web-templates" className="hover:text-indigo-600">Web Templates</Link></li>
            </ul>
          </div>

          {/* Sellers & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Sell on DesignHub</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/register?role=seller" className="hover:text-indigo-600 font-bold text-indigo-600">Become a Creator</Link></li>
              <li><span className="text-slate-500">Razorpay Route Instant Payouts</span></li>
              <li><span className="text-slate-500">Hidden Cloud Vault Protection</span></li>
              <li><span className="text-slate-500">Configurable Platform Commission</span></li>
            </ul>
          </div>

          {/* Security Badges */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Platform Guarantee</h4>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <Lock className="h-4 w-4 text-emerald-600" />
              <span>Gated Server Proxy Downloads</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              <span>Razorpay Verified Checkout</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              <span>Case-by-Case Buyer Protection</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-6 text-[11px] text-slate-400">
          <p>© 2026 DesignHub Multi-Vendor Marketplace. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Seller Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
