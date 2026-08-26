'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface AdPlacementProps {
  type: 'banner' | 'sidebar' | 'in-feed' | 'interstitial';
  slotId?: string;
  className?: string;
}

export const AdPlacement: React.FC<AdPlacementProps> = ({ type, slotId = '1234567890', className = '' }) => {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-1234567890123456';

  return (
    <div className={`my-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {/* AdSense Standard Label */}
      <div className="mb-2 flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 uppercase">
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-indigo-600" />
          Sponsored Advertisement
        </span>
        <span className="text-[10px] text-slate-400">AdSense • Verified Placement</span>
      </div>

      {type === 'banner' && (
        <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-700">Google AdSense Horizontal Leaderboard Banner</p>
            <p className="text-[10px] text-slate-400">Client ID: {publisherId} | Slot: {slotId}</p>
          </div>
        </div>
      )}

      {type === 'sidebar' && (
        <div className="flex h-64 w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">Google AdSense Sidebar Skyscraper</p>
            <p className="text-[10px] text-slate-400">Client ID: {publisherId}</p>
          </div>
        </div>
      )}

      {type === 'in-feed' && (
        <div className="flex h-56 w-full flex-col justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
          <div className="space-y-2">
            <div className="h-4 w-1/2 rounded bg-slate-200"></div>
            <p className="text-xs text-slate-600">Sponsored Design Tools & Asset Extensions</p>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>In-Feed Native Ad Unit</span>
            <span className="rounded bg-indigo-50 px-2 py-0.5 font-bold text-indigo-600">Promoted</span>
          </div>
        </div>
      )}

      {type === 'interstitial' && (
        <div className="flex h-36 w-full items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4 text-center">
          <div className="space-y-1">
            <p className="text-xs font-bold text-indigo-700">Natural Navigation Breakpoint Advertisement</p>
            <p className="text-[10px] text-slate-500">Policy-Compliant Page Interstitial</p>
          </div>
        </div>
      )}
    </div>
  );
};
