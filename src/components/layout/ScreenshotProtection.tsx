'use client';

import React, { useEffect, useState } from 'react';

export const ScreenshotProtection: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // 1. Prevent Right-Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Prevent Dragging Images & Text Selection
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 3. Intercept Screenshot / Print / Save Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }

      // Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5 (Mac screenshot shortcuts)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
        e.preventDefault();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }

      // Ctrl+P / Cmd+P (Print page)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }

      // Ctrl+S / Cmd+S (Save webpage)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }

      // Ctrl+U / Cmd+U (View source)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in select-none pointer-events-none">
      <div className="rounded-3xl border border-rose-500/30 bg-slate-900 p-8 text-center shadow-2xl space-y-3 max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 text-2xl font-bold">
          🛡️
        </div>
        <h3 className="text-xl font-extrabold text-white">Screenshot Protected</h3>
        <p className="text-xs text-stone-300 leading-relaxed">
          Artwork and design previews on Metusk.com are protected by active digital watermark encryption and intellectual property rights.
        </p>
      </div>
    </div>
  );
};
