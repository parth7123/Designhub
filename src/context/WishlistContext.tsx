'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WishlistContextType {
  favoriteIds: Set<string>;
  isFavorited: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType>({
  favoriteIds: new Set(),
  isFavorited: () => false,
  toggleFavorite: async () => false,
  refreshFavorites: async () => {},
});

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const refreshFavorites = async () => {
    try {
      const res = await fetch('/api/favorites');
      if (res.ok) {
        const data = await res.json();
        const ids = new Set<string>((data.favorites || []).map((f: any) => f.listingId || f.listing?.id));
        setFavoriteIds(ids);
      }
    } catch (err) {
      console.error('Failed to load user favorites:', err);
    }
  };

  useEffect(() => {
    refreshFavorites();
  }, []);

  const isFavorited = (listingId: string): boolean => {
    return favoriteIds.has(listingId);
  };

  const toggleFavorite = async (listingId: string): Promise<boolean> => {
    // Optimistic toggle
    const nextSet = new Set(favoriteIds);
    let nextState = false;

    if (nextSet.has(listingId)) {
      nextSet.delete(listingId);
      nextState = false;
    } else {
      nextSet.add(listingId);
      nextState = true;
    }
    setFavoriteIds(nextSet);

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      });

      if (res.status === 401) {
        // Revert optimistic update and redirect to login
        setFavoriteIds(favoriteIds);
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
        return false;
      }

      if (res.ok) {
        const data = await res.json();
        const serverState = data.favorited;
        const syncSet = new Set(favoriteIds);
        if (serverState) {
          syncSet.add(listingId);
        } else {
          syncSet.delete(listingId);
        }
        setFavoriteIds(syncSet);
        return serverState;
      } else {
        // Revert
        setFavoriteIds(favoriteIds);
        return !nextState;
      }
    } catch (err) {
      setFavoriteIds(favoriteIds);
      return !nextState;
    }
  };

  return (
    <WishlistContext.Provider value={{ favoriteIds, isFavorited, toggleFavorite, refreshFavorites }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
