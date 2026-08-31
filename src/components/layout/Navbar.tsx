'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, Store, Bell, LogOut, Download, Heart, Users, Menu, X, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { cartCount, toggleCart } = useCart();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setCurrentUser(data.user);
      if (data.user) {
        fetchNotifications();
      }
    } catch (e) {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadNotifications(data.unreadCount || 0);
    } catch (e) {}
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setShowUserMenu(false);
    setMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const markNotifsRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setUnreadNotifications(0);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#FBF8F3]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0 min-h-[44px]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs group-hover:bg-[#8b263e] transition-colors">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-serif font-extrabold tracking-tight text-slate-900">
              Design<span className="text-[#8b263e] font-serif italic">Hub</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Link href="/marketplace" className="hover:text-[#8b263e] transition-colors py-2">
            Browse Market
          </Link>
          <Link href="/favorites" className="hover:text-[#8b263e] transition-colors py-2 flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-600" />
            Wishlist
          </Link>
          <Link href="/following" className="hover:text-[#8b263e] transition-colors py-2 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-indigo-600" />
            Following
          </Link>
          {currentUser && currentUser.role === 'BUYER' && (
            <Link href="/my-purchases" className="hover:text-[#8b263e] transition-colors py-2 flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5 text-[#8b263e]" />
              My Purchases
            </Link>
          )}
          {(currentUser?.role === 'SELLER' || currentUser?.role === 'ADMIN') && (
            <Link href="/seller" className="hover:text-[#8b263e] transition-colors py-2 flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-emerald-800" />
              Seller Studio
            </Link>
          )}
          {currentUser && currentUser.role === 'ADMIN' && (
            <Link href="/admin" className="hover:text-[#8b263e] transition-colors py-2 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-purple-800" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Right CTA / Cart / Notifications / User Profile & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Shopping Cart Trigger Button */}
          <button
            onClick={toggleCart}
            aria-label="Shopping Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-white text-slate-800 hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <ShoppingBag className="h-5 w-5 text-slate-700" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-extrabold text-white shadow-sm leading-none border-2 border-white animate-in zoom-in">
                {cartCount}
              </span>
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notifications Center */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifMenu(!showNotifMenu);
                    if (!showNotifMenu && unreadNotifications > 0) {
                      markNotifsRead();
                    }
                  }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-white text-slate-700 hover:text-slate-900 transition-colors shadow-2xs"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#8b263e] px-1 text-[10px] font-extrabold text-white shadow-sm leading-none border-2 border-white">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-stone-200 bg-white p-4 shadow-xl backdrop-blur-xl z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <span className="font-serif font-bold text-sm text-slate-900">Notifications</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Alerts</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 py-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            href={n.link || '#'}
                            onClick={() => setShowNotifMenu(false)}
                            className="block rounded-xl p-2.5 hover:bg-[#FBF8F3] transition-colors border border-transparent hover:border-stone-200"
                          >
                            <p className="text-xs font-bold text-[#8b263e]">{n.title}</p>
                            <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu Dropdown */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-[#FBF8F3] transition-colors min-h-[44px]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{currentUser.name}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl backdrop-blur-xl z-50 space-y-1 text-xs">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <span className="mt-1 inline-block rounded-md bg-stone-100 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase text-slate-700 border border-stone-200">
                        {currentUser.role}
                      </span>
                    </div>

                    <Link
                      href="/cart"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-[#FBF8F3] font-medium"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-indigo-600" />
                      Shopping Cart ({cartCount})
                    </Link>

                    <Link
                      href="/favorites"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-[#FBF8F3] font-medium"
                    >
                      <Heart className="h-3.5 w-3.5 text-rose-600" />
                      Saved Wishlist
                    </Link>

                    <Link
                      href="/following"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-[#FBF8F3] font-medium"
                    >
                      <Users className="h-3.5 w-3.5 text-indigo-600" />
                      Followed Sellers
                    </Link>

                    {currentUser.role === 'BUYER' && (
                      <Link
                        href="/my-purchases"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-[#FBF8F3] font-medium"
                      >
                        <Download className="h-3.5 w-3.5 text-[#8b263e]" />
                        My Purchases
                      </Link>
                    )}

                    {currentUser.role === 'SELLER' && (
                      <Link
                        href="/seller"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-[#FBF8F3] font-medium"
                      >
                        <Store className="h-3.5 w-3.5 text-emerald-800" />
                        Seller Dashboard
                      </Link>
                    )}

                    {currentUser.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-[#FBF8F3] font-medium"
                      >
                        <Shield className="h-3.5 w-3.5 text-purple-800" />
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-rose-700 hover:bg-rose-50 font-medium transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 transition-colors py-2 px-1"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-[#8b263e] transition-colors min-h-[44px] flex items-center"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Drawer Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-white text-slate-800 shadow-2xs hover:bg-stone-50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-[#FBF8F3] px-4 py-6 space-y-4 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-2 text-sm font-bold text-slate-800">
            <Link
              href="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl bg-white p-3 border border-stone-200/80 shadow-2xs"
            >
              <span>Browse Marketplace</span>
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </Link>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                toggleCart();
              }}
              className="flex items-center justify-between rounded-xl bg-white p-3 border border-stone-200/80 shadow-2xs text-left"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-indigo-600" />
                Shopping Cart ({cartCount})
              </span>
            </button>

            <Link
              href="/favorites"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl bg-white p-3 border border-stone-200/80 shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-600" />
                Saved Wishlist
              </span>
            </Link>

            <Link
              href="/following"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl bg-white p-3 border border-stone-200/80 shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Followed Creators
              </span>
            </Link>

            {currentUser && currentUser.role === 'BUYER' && (
              <Link
                href="/my-purchases"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl bg-white p-3 border border-stone-200/80 shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-[#8b263e]" />
                  My Purchases & Downloads
                </span>
              </Link>
            )}

            {currentUser && currentUser.role === 'SELLER' && (
              <Link
                href="/seller"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl bg-white p-3 border border-stone-200/80 shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-emerald-800" />
                  Seller Studio Dashboard
                </span>
              </Link>
            )}

            {currentUser && currentUser.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl bg-white p-3 border border-stone-200/80 shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-800" />
                  Admin Control Portal
                </span>
              </Link>
            )}
          </nav>

          {currentUser ? (
            <div className="pt-2 border-t border-stone-200 space-y-3">
              <div className="px-1">
                <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-50 border border-rose-200 py-3 text-xs font-bold text-rose-700 shadow-2xs"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-xl border border-stone-300 bg-white py-3 text-xs font-bold text-slate-800 shadow-2xs"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-2xs"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
