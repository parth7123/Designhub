'use client';

import React, { useState } from 'react';

interface ProtectedImageProps {
  src: string;
  alt: string;
  className?: string;
  watermarkText?: string;
}

export const ProtectedImage: React.FC<ProtectedImageProps> = ({
  src,
  alt,
  className = '',
  watermarkText = 'METUSK.COM',
}) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none watermark-protected ${className}`}>
      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : (
        /* Fallback Placeholder Graphic for Invalid/Broken Images */
        <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center p-4 text-center space-y-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/10 via-amber-500/10 to-indigo-500/10 blur-xl pointer-events-none" />
          <span className="text-2xl font-serif text-amber-400 font-bold tracking-widest relative z-10 uppercase">
            METUSK.COM
          </span>
          <span className="text-[10px] font-mono text-stone-300 font-bold relative z-10 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
            PROTECTED DESIGN ASSET PREVIEW
          </span>
        </div>
      )}

      {/* Repeating Diagonal Protective Watermark Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-wrap items-center justify-around opacity-35 select-none overflow-hidden rotate-[-18deg] scale-125">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="text-[13px] font-black uppercase tracking-[0.25em] text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] m-3 whitespace-nowrap"
          >
            {watermarkText}
          </span>
        ))}
      </div>
    </div>
  );
};
