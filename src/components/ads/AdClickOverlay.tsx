'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, ArrowRight, ExternalLink } from 'lucide-react';
import { AdPlacement } from './AdPlacement';

export const AdClickOverlay: React.FC = () => {
  const [showAd, setShowAd] = useState(false);
  const [countdown, setCountdown] = useState(2);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if click target is a button, link, or interactive element
      const interactiveEl = target.closest('button, a, [role="button"], input[type="submit"]');
      if (interactiveEl) {
        // Skip if clicking inside the ad modal itself
        if (target.closest('#ad-click-overlay-modal')) return;

        // Trigger Ad on button click (every 2-3 clicks or every click)
        setClickCount((prev) => {
          const next = prev + 1;
          // Show ad on button clicks
          if (next % 2 === 0) {
            setShowAd(true);
            setCountdown(2);
          }
          return next;
        });
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showAd && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [showAd, countdown]);

  if (!showAd) return null;

  return (
    <div
      id="ad-click-overlay-modal"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl space-y-5 animate-scale-up">
        {/* Ad Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <span className="text-xs font-black tracking-wider uppercase text-stone-900 block">
                Sponsored Advertisement
              </span>
              <span className="text-[10px] text-stone-400 font-semibold">
                Google AdSense • Interactive Placement
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAd(false)}
            className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            title="Close Advertisement"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Ad Body Slot */}
        <div className="my-2">
          <AdPlacement type="interstitial" slotId="button_click_interstitial_001" />
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <span className="text-[11px] font-semibold text-stone-500">
            {countdown > 0 ? `Continuing in ${countdown}s...` : 'Ready to proceed'}
          </span>

          <button
            type="button"
            onClick={() => setShowAd(false)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#8b263e] transition-all"
          >
            <span>Continue to Site</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
