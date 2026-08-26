'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function PageProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prev = useRef(pathname);

  useEffect(() => {
    if (prev.current === pathname) return;
    prev.current = pathname;

    // Start bar
    setWidth(0);
    setVisible(true);

    // Animate to 85% quickly
    const t1 = setTimeout(() => setWidth(30), 50);
    const t2 = setTimeout(() => setWidth(60), 200);
    const t3 = setTimeout(() => setWidth(85), 400);

    // Complete bar then hide
    timerRef.current = setTimeout(() => {
      setWidth(100);
      setTimeout(() => setVisible(false), 300);
    }, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '3px',
        width: `${width}%`,
        background: 'linear-gradient(to right, #6366f1, #8b5cf6, #a855f7)',
        transition: width === 100 ? 'width 0.2s ease' : 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 9999,
        boxShadow: '0 0 12px rgba(99,102,241,0.7)',
        borderRadius: '0 4px 4px 0',
      }}
    />
  );
}
