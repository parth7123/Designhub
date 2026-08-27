'use client';

import React, { useState } from 'react';

interface VectorHeroIllustrationProps {
  customImageUrl?: string | null;
}

export const VectorHeroIllustration: React.FC<VectorHeroIllustrationProps> = ({ customImageUrl }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const shouldRenderCustom = Boolean(customImageUrl) && !imageError;

  return (
    <div className="relative w-full aspect-square max-w-[520px] mx-auto flex items-center justify-center p-4">
      {/* Soft Glow Background Circle */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#8b263e]/10 via-amber-500/10 to-indigo-500/10 blur-2xl pointer-events-none" />

      {shouldRenderCustom ? (
        <div className="relative w-full h-full rounded-3xl border border-stone-300/90 bg-white p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] backdrop-blur-sm flex flex-col justify-between overflow-hidden group transition-all">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5 px-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400"></span>
              <span className="h-3 w-3 rounded-full bg-amber-400"></span>
              <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
              <span className="ml-2 font-mono text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                HERO_ARTWORK.PNG
              </span>
            </div>
            <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[10px] font-bold text-stone-600 border border-stone-200">
              Admin Choice
            </span>
          </div>

          {/* Custom Uploaded Image with Fast Loading & Skeleton */}
          <div className="relative w-full h-[380px] sm:h-[400px] rounded-2xl overflow-hidden bg-stone-100 flex items-center justify-center border border-stone-200">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-stone-200 animate-pulse flex items-center justify-center text-xs font-bold text-stone-400">
                Loading Hero Artwork...
              </div>
            )}
            <img
              src={customImageUrl!}
              alt="Homepage Hero Banner"
              loading="eager"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover rounded-2xl transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        </div>
      ) : (
        /* Main SVG Vector Artwork */
        <div className="relative w-full h-full rounded-2xl border border-stone-300/80 bg-white/90 p-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] backdrop-blur-sm flex flex-col justify-between overflow-hidden group">
          
          {/* Top App Header / Vector Tool Bar */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400/80"></span>
              <span className="h-3 w-3 rounded-full bg-amber-400/80"></span>
              <span className="h-3 w-3 rounded-full bg-emerald-400/80"></span>
              <span className="ml-2 font-mono text-[10px] font-bold text-stone-500 uppercase tracking-widest">Vector_Studio_v2.4.svg</span>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-100 rounded-md px-2 py-0.5 border border-stone-200 text-[10px] font-mono text-stone-600 font-bold">
              <svg className="h-3 w-3 text-[#8b263e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Pen Tool (P)</span>
            </div>
          </div>

          {/* Center Main Vector Canvas */}
          <div className="relative flex-1 my-4 bg-[#FBF8F3] rounded-xl border border-dashed border-stone-300/90 p-5 flex items-center justify-center overflow-hidden">
            
            {/* Vector Grid Pattern Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="vector-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1c1917" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#vector-grid)" />
            </svg>

            {/* SVG Vector Elements Scene */}
            <svg viewBox="0 0 400 300" className="w-full h-full relative z-10 drop-shadow-sm">
              <defs>
                <linearGradient id="gradient-burgundy" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b263e" />
                  <stop offset="100%" stopColor="#621a2c" />
                </linearGradient>
                <linearGradient id="gradient-[#FBF8F3]" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="gradient-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>

              {/* Vector UI Card Base */}
              <rect x="40" y="30" width="220" height="150" rx="12" fill="#ffffff" stroke="#e7e5e4" strokeWidth="2" />
              
              {/* Header bar of UI Card */}
              <rect x="40" y="30" width="220" height="28" rx="12" fill="#f5f5f4" />
              <circle cx="56" cy="44" r="4" fill="#ef4444" />
              <circle cx="68" cy="44" r="4" fill="#f59e0b" />
              <circle cx="80" cy="44" r="4" fill="#10b981" />
              <rect x="100" y="41" width="70" height="6" rx="3" fill="#d6d3d1" />

              {/* UI Card Content Placeholder elements */}
              <rect x="56" y="70" width="80" height="40" rx="8" fill="url(#gradient-burgundy)" opacity="0.9" />
              <rect x="146" y="70" width="100" height="12" rx="4" fill="#1c1917" />
              <rect x="146" y="88" width="75" height="8" rx="3" fill="#a8a29e" />

              <rect x="56" y="122" width="190" height="10" rx="4" fill="#e7e5e4" />
              <rect x="56" y="138" width="140" height="10" rx="4" fill="#f5f5f4" />
              <rect x="56" y="154" width="90" height="10" rx="4" fill="url(#gradient-amber)" opacity="0.8" />

              {/* Bezier Vector Curve with Editable Nodes & Handles */}
              <path
                d="M 30 220 C 90 140, 180 280, 290 180 S 360 260, 380 230"
                fill="none"
                stroke="#8b263e"
                strokeWidth="3"
                strokeDasharray="6 4"
                className="animate-pulse"
              />

              {/* Vector Pen Cursor & Guide Control Handles */}
              {/* Control Point Line 1 */}
              <line x1="90" y1="140" x2="130" y2="100" stroke="#0284c7" strokeWidth="1.5" />
              <circle cx="130" cy="100" r="4" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
              
              {/* Anchor Point 1 */}
              <rect x="85" y="135" width="10" height="10" fill="#ffffff" stroke="#8b263e" strokeWidth="2.5" />

              {/* Control Point Line 2 */}
              <line x1="290" y1="180" x2="330" y2="130" stroke="#0284c7" strokeWidth="1.5" />
              <circle cx="330" cy="130" r="4" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />

              {/* Anchor Point 2 */}
              <rect x="285" y="175" width="10" height="10" fill="#ffffff" stroke="#8b263e" strokeWidth="2.5" />

              {/* Vector Pen Tool Cursor Icon */}
              <g transform="translate(292, 172) rotate(-25)">
                <path d="M 0 0 L 14 30 L 7 24 L 0 32 Z" fill="#8b263e" stroke="#ffffff" strokeWidth="1.5" />
              </g>

              {/* Floating 2D Vector Shape Badge 1 */}
              <g transform="translate(260, 40)">
                <rect width="90" height="70" rx="14" fill="#ffffff" stroke="#8b263e" strokeWidth="2" className="drop-shadow-md" />
                <polygon points="30,20 60,15 70,45 40,55 15,35" fill="url(#gradient-burgundy)" opacity="0.85" />
                <circle cx="60" cy="15" r="4" fill="#ffffff" stroke="#8b263e" strokeWidth="1.5" />
                <circle cx="70" cy="45" r="4" fill="#ffffff" stroke="#8b263e" strokeWidth="1.5" />
                <circle cx="40" cy="55" r="4" fill="#ffffff" stroke="#8b263e" strokeWidth="1.5" />
              </g>

              {/* Floating 2D Vector Character / Designer Avatar Silhouette Badge */}
              <g transform="translate(220, 190)">
                <rect width="140" height="75" rx="14" fill="#1c1917" className="drop-shadow-lg" />
                {/* Avatar Icon */}
                <circle cx="35" cy="38" r="14" fill="#8b263e" />
                <path d="M 27 34 C 27 28 43 28 43 34 C 43 42 27 42 27 34" fill="#ffffff" opacity="0.9" />
                <path d="M 25 50 C 25 43 45 43 45 50 Z" fill="#ffffff" opacity="0.7" />
                {/* Text Label */}
                <text x="60" y="36" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Vector Studio</text>
                <text x="60" y="52" fill="#a8a29e" fontSize="9" fontFamily="sans-serif">2D Node System</text>
              </g>
            </svg>
          </div>

          {/* Bottom Inspector Bar */}
          <div className="flex items-center justify-between border-t border-stone-200 pt-3 text-[11px] font-mono font-bold text-stone-600">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#8b263e]"></span>
                Bezier Nodes: 24
              </span>
              <span>Zoom: 100%</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#8b263e]"></span>
              <span className="h-3 w-3 rounded-full bg-[#38bdf8]"></span>
              <span className="h-3 w-3 rounded-full bg-[#fbbf24]"></span>
              <span className="h-3 w-3 rounded-full bg-[#10b981]"></span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
