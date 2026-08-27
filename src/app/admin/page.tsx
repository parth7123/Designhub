'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, AlertTriangle, Layers, Settings, HardDrive, BarChart3, Plus, Tag, Trash2, X, Edit, ArrowUp, ArrowDown, IndianRupee, GripVertical, Search, Filter } from 'lucide-react';

export default function AdminPortalPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'disputes' | 'categories' | 'settings'>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [driveQuota, setDriveQuota] = useState<any>(null);
  const [sellersList, setSellersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states for Users / Sellers tab
  const [sellerSearch, setSellerSearch] = useState('');
  const [sellerStatusFilter, setSellerStatusFilter] = useState<string>('ALL');
  const [sellerSortBy, setSellerSortBy] = useState<'NEWEST' | 'VOLUME' | 'COMMISSION'>('NEWEST');

  // Drag and Drop state for Categories
  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);
  const [draggedParentId, setDraggedParentId] = useState<string | null>(null);

  // Penalty Modal states
  const [selectedSellerForPenalty, setSelectedSellerForPenalty] = useState<any | null>(null);
  const [penaltyActionType, setPenaltyActionType] = useState<'WARN' | 'BLOCK_AND_FINE'>('WARN');
  const [penaltyFineAmount, setPenaltyFineAmount] = useState('500');
  const [penaltyReason, setPenaltyReason] = useState('');
  const [warningText, setWarningText] = useState('');
  const [submittingPenalty, setSubmittingPenalty] = useState(false);

  // Category creation & editing form states
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState('15');

  // Edit category modal states
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editParentId, setEditParentId] = useState<string>('');
  const [editDisplayOrder, setEditDisplayOrder] = useState<number>(0);
  const [savingCat, setSavingCat] = useState(false);

  // Seller commission override modal state
  const [editingSellerCommission, setEditingSellerCommission] = useState<any | null>(null);
  const [customCommissionVal, setCustomCommissionVal] = useState<string>('');
  const [savingSellerCommission, setSavingSellerCommission] = useState(false);

  // Homepage Hero Banner customization state
  const [heroImageUrl, setHeroImageUrl] = useState<string>('');
  const [uploadingHero, setUploadingHero] = useState<boolean>(false);

  const fetchAdminData = async () => {
    try {
      const [analyticRes, disputesRes, catRes, setRes, sellersRes] = await Promise.allSettled([
        fetch('/api/admin/analytics'),
        fetch('/api/disputes'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/sellers/penalty'),
      ]);

      if (analyticRes.status === 'fulfilled' && analyticRes.value.ok) {
        const aData = await analyticRes.value.json();
        setAnalytics(aData);
      }

      if (disputesRes.status === 'fulfilled' && disputesRes.value.ok) {
        const dData = await disputesRes.value.json();
        setDisputes(Array.isArray(dData.disputes) ? dData.disputes : []);
      }

      if (catRes.status === 'fulfilled' && catRes.value.ok) {
        const cData = await catRes.value.json();
        setCategories(Array.isArray(cData.categories) ? cData.categories : []);
      }

      if (setRes.status === 'fulfilled' && setRes.value.ok) {
        const sData = await setRes.value.json();
        setSettings(sData.settings || {});
        setDriveQuota(sData.driveQuota || null);
        if (sData.settings?.global_commission_pct) {
          setCommissionRate(sData.settings.global_commission_pct);
        }
        if (sData.settings?.hero_image_url) {
          setHeroImageUrl(sData.settings.hero_image_url);
        }
      }

      if (sellersRes.status === 'fulfilled' && sellersRes.value.ok) {
        const selData = await sellersRes.value.json();
        setSellersList(Array.isArray(selData.sellers) ? selData.sellers : []);
      }
    } catch (e) {
      console.error('Admin data fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data?.user || data?.user?.role !== 'ADMIN') {
          setIsAuthorized(false);
          setLoading(false);
          router.push('/login?redirect=/admin');
        } else {
          setIsAuthorized(true);
          fetchAdminData();
        }
      })
      .catch(() => {
        setIsAuthorized(false);
        setLoading(false);
        router.push('/login?redirect=/admin');
      });
  }, []);

  const handleApplyPenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSellerForPenalty) return;

    setSubmittingPenalty(true);
    try {
      const res = await fetch('/api/admin/sellers/penalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: selectedSellerForPenalty.id,
          action: penaltyActionType,
          warningNotice: warningText,
          fineAmount: penaltyFineAmount,
          reason: penaltyReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to apply action');
        return;
      }

      setSelectedSellerForPenalty(null);
      setPenaltyReason('');
      setWarningText('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmittingPenalty(false);
    }
  };

  const handleDirectUnblock = async (sellerId: string) => {
    if (!confirm('Are you sure you want to re-activate and unblock this seller studio?')) return;
    try {
      const res = await fetch('/api/admin/sellers/penalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, action: 'UNBLOCK' }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {}
  };

  const handleRevokeWarning = async (sellerId: string) => {
    if (!confirm('Are you sure you want to revoke and clear this warning?')) return;
    try {
      const res = await fetch('/api/admin/sellers/penalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, action: 'REVOKE_WARNING' }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {}
  };

  const handleSellerApproval = async (sellerId: string, action: 'APPROVE' | 'REJECT', commissionOverride?: string) => {
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, commissionOverride }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {}
  };

  const handleResolveDispute = async (disputeId: string, action: 'APPROVE_REFUND' | 'REJECT') => {
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNotes: 'Actioned via Admin Portal' }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {}
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName,
          description: newCatDesc,
          parentId: selectedParentId || null,
        }),
      });
      if (res.ok) {
        setNewCatName('');
        setNewCatDesc('');
        setSelectedParentId('');
        fetchAdminData();
      }
    } catch (e) {}
  };

  const handleStartEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setEditCatName(cat.name || '');
    setEditCatDesc(cat.description || '');
    setEditParentId(cat.parentId || '');
    setEditDisplayOrder(cat.displayOrder || 0);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName) return;

    setSavingCat(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editCatName,
          description: editCatDesc,
          parentId: editParentId || null,
          displayOrder: Number(editDisplayOrder),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update category');
        return;
      }

      setEditingCategory(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setSavingCat(false);
    }
  };

  // Reorder via Click (Move Up / Move Down)
  const handleReorderCategory = async (categoryId: string, direction: 'UP' | 'DOWN', parentId?: string | null) => {
    const list = parentId
      ? (categories.find((c) => c.id === parentId)?.children || [])
      : categories.filter((c) => !c.parentId);

    const index = list.findIndex((c: any) => c.id === categoryId);
    if (index === -1) return;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const updatedList = [...list];
    const temp = updatedList[index];
    updatedList[index] = updatedList[targetIndex];
    updatedList[targetIndex] = temp;

    const items = updatedList.map((item: any, idx: number) => ({
      id: item.id,
      displayOrder: idx,
    }));

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
      console.error('Reorder error:', e);
    }
  };

  const handleHeroImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Hero banner image must be under 10MB');
      return;
    }

    setUploadingHero(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'hero_image_url', value: base64 }),
        });
        if (res.ok) {
          setHeroImageUrl(base64);
          alert('Homepage Hero Banner updated successfully!');
        } else {
          alert('Failed to update hero banner image.');
        }
      } catch (err: any) {
        alert(err.message || 'Upload failed');
      } finally {
        setUploadingHero(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearHeroImage = async () => {
    if (!confirm('Revert Homepage Hero back to default Vector Studio illustration?')) return;
    setUploadingHero(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'hero_image_url', value: '' }),
      });
      if (res.ok) {
        setHeroImageUrl('');
        alert('Homepage Hero reset to default illustration!');
      }
    } catch (e) {
      alert('Failed to reset image');
    } finally {
      setUploadingHero(false);
    }
  };

  // Reorder via Drag and Drop
  const handleDragStart = (e: React.DragEvent, catId: string, parentId?: string | null) => {
    e.stopPropagation();
    setDraggedCatId(catId);
    setDraggedParentId(parentId || null);
    e.dataTransfer.setData('text/plain', catId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetCatId: string, targetParentId?: string | null) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedCatId || draggedCatId === targetCatId) return;
    if ((draggedParentId || null) !== (targetParentId || null)) return;

    const list = targetParentId
      ? (categories.find((c) => c.id === targetParentId)?.children || [])
      : categories.filter((c) => !c.parentId);

    const fromIndex = list.findIndex((c: any) => c.id === draggedCatId);
    const toIndex = list.findIndex((c: any) => c.id === targetCatId);

    if (fromIndex === -1 || toIndex === -1) return;

    const updatedList = [...list];
    const [movedItem] = updatedList.splice(fromIndex, 1);
    updatedList.splice(toIndex, 0, movedItem);

    const items = updatedList.map((item: any, idx: number) => ({
      id: item.id,
      displayOrder: idx,
    }));

    setDraggedCatId(null);
    setDraggedParentId(null);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Drag reorder failed:', err);
    }
  };

  const handleSaveSellerCommissionOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSellerCommission) return;

    setSavingSellerCommission(true);
    try {
      const val = customCommissionVal === '' ? null : parseFloat(customCommissionVal);
      const res = await fetch(`/api/admin/sellers/${editingSellerCommission.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          commissionOverride: val !== null ? String(val) : '',
        }),
      });

      if (res.ok) {
        setEditingSellerCommission(null);
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update seller commission');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating seller commission');
    } finally {
      setSavingSellerCommission(false);
    }
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'global_commission_pct', value: commissionRate }),
      });
      fetchAdminData();
    } catch (e) {}
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete "${catName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${catId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete category');
        return;
      }
      fetchAdminData();
    } catch (e: any) {
      alert(e.message || 'Error deleting category');
    }
  };

  if (loading || isAuthorized === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="rounded-3xl bg-red-50 border border-red-200/80 p-8 text-red-600 shadow-md flex flex-col items-center space-y-4 max-w-md">
          <div className="rounded-full bg-red-100 p-4 animate-bounce">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Administrator authentication required to access the Governance Portal. Redirecting to secure login...
          </p>
        </div>
      </div>
    );
  }

  const formatRupees = (val: any): string => {
    const num = Number(val);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-IN');
  };

  const safeSellersList = Array.isArray(sellersList) ? sellersList : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeDisputes = Array.isArray(disputes) ? disputes : [];

  const parentCategories = safeCategories.filter((c) => !c.parentId);

  // Filtered & Sorted Sellers List
  const filteredSellers = safeSellersList
    .filter((s) => {
      const q = sellerSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.businessName && s.businessName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q));

      let matchesStatus = true;
      if (sellerStatusFilter === 'APPROVED') matchesStatus = s.status === 'APPROVED';
      else if (sellerStatusFilter === 'PENDING') matchesStatus = s.status === 'PENDING_APPROVAL';
      else if (sellerStatusFilter === 'SUSPENDED') matchesStatus = s.status === 'SUSPENDED';
      else if (sellerStatusFilter === 'WARNING') matchesStatus = Boolean(s.warningNotice);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sellerSortBy === 'VOLUME') {
        return (b.grossVolume || 0) - (a.grossVolume || 0);
      }
      if (sellerSortBy === 'COMMISSION') {
        return (b.commissionEarned || 0) - (a.commissionEarned || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalAdminCommissionEarned = safeSellersList.reduce((sum, s) => sum + (s.commissionEarned || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Admin Title & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-purple-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Admin Governance Portal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Platform moderation, users & sellers, subcategories, payout logs & settings</p>
        </div>

        {/* Drive Storage Alert Widget */}
        {driveQuota && (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-xs">
            <HardDrive className="h-5 w-5 text-indigo-600" />
            <div>
              <span className="font-bold text-slate-900">Hidden Google Drive Quota</span>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                <span>{(driveQuota.usedBytes / (1024 * 1024)).toFixed(0)} MB used</span>
                <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div className="h-full bg-indigo-600" style={{ width: `${driveQuota.usedPercent}%` }} />
                </div>
                <span className="font-bold text-indigo-600">{driveQuota.usedPercent}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Analytics & Revenue
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" /> Users ({safeSellersList.length})
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'disputes' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="h-4 w-4" /> Disputes ({analytics?.overview?.openDisputesCount || 0})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'categories' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="h-4 w-4" /> Categories & Subcategories
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="h-4 w-4" /> Commission & Settings (Hero Banner)
        </button>
      </div>

      {/* Tab 1: Analytics & Revenue */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">₹{formatRupees(analytics?.overview?.totalGrossRevenue)}</div>
              <span className="text-[10px] text-slate-400 font-medium">Total volume processed</span>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Admin Net Platform Earnings</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-900">₹{formatRupees(analytics?.overview?.totalPlatformEarnings)}</div>
              <span className="text-[10px] text-emerald-700 font-medium">{commissionRate}% Razorpay split commission</span>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Count</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">{analytics?.overview?.totalOrdersCount || 0}</div>
              <span className="text-[10px] text-slate-400 font-medium">Completed marketplace orders</span>
            </div>

            <div className="rounded-3xl border border-purple-200 bg-purple-50/50 p-5 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Seller Network</span>
              <div className="text-2xl sm:text-3xl font-black text-purple-900">{analytics?.overview?.totalSellersCount || 0}</div>
              <span className="text-[10px] text-purple-700 font-medium">{analytics?.overview?.pendingSellersCount || 0} pending KYC verification</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users & Seller Management Hub */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Users & Seller Management Hub</h3>
              <p className="text-xs text-slate-500 mt-1">Search, filter, approve KYC onboarding, set custom commission rates, issue warnings, block accounts, and track earnings per seller</p>
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 flex items-center gap-3">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
              <div>
                <span className="text-[10px] uppercase font-extrabold text-emerald-700 block">Total Admin Commission Earned</span>
                <span className="text-lg font-black text-emerald-900">₹{formatRupees(totalAdminCommissionEarned)}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-2xl bg-white border border-slate-200 p-3 shadow-2xs">
              <span className="text-slate-400 font-bold block">Total Registered Sellers</span>
              <span className="text-lg font-black text-slate-900">{safeSellersList.length}</span>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-3 shadow-2xs">
              <span className="text-amber-600 font-bold block">Pending KYC Approvals</span>
              <span className="text-lg font-black text-amber-700">{safeSellersList.filter(s => s.status === 'PENDING_APPROVAL').length}</span>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-3 shadow-2xs">
              <span className="text-amber-700 font-bold block">Active Policy Warnings</span>
              <span className="text-lg font-black text-amber-800">{safeSellersList.filter(s => s.warningNotice).length}</span>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-3 shadow-2xs">
              <span className="text-rose-600 font-bold block">Blocked / Suspended</span>
              <span className="text-lg font-black text-rose-700">{safeSellersList.filter(s => s.status === 'SUSPENDED').length}</span>
            </div>
          </div>

          {/* Search, Status Filter & Sorting Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-2xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={sellerSearch}
                onChange={(e) => setSellerSearch(e.target.value)}
                placeholder="Search sellers & users by name, studio, email, or phone number..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 min-h-[40px]"
              />
              {sellerSearch && (
                <button
                  onClick={() => setSellerSearch('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sellerStatusFilter}
                  onChange={(e) => setSellerStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 min-h-[40px] font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="APPROVED">Approved Sellers</option>
                  <option value="PENDING">Pending KYC Approval</option>
                  <option value="SUSPENDED">Blocked / Suspended</option>
                  <option value="WARNING">Issued Policy Warning</option>
                </select>
              </div>

              <div className="relative">
                <select
                  value={sellerSortBy}
                  onChange={(e: any) => setSellerSortBy(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 min-h-[40px] font-medium"
                >
                  <option value="NEWEST">Newest Registered</option>
                  <option value="VOLUME">Highest Sales Volume</option>
                  <option value="COMMISSION">Highest Admin Commission</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sellers & Users Management Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Seller / Studio Name</th>
                  <th className="p-3">Contact Email & Phone</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3">Sales & Gross Rev</th>
                  <th className="p-3">⚡ Admin Commission Earned</th>
                  <th className="p-3">Commission % Rate</th>
                  <th className="p-3">Active Warning / Fine</th>
                  <th className="p-3">Management Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No sellers found matching your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSellers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        {s.businessName || s.name}
                        <span className="text-[10px] text-slate-400 font-normal block">{s.name} • {s._count?.listings || 0} listings</span>
                      </td>
                      <td className="p-3 text-slate-500 font-medium">
                        {s.email}
                        {s.phone && <span className="text-[10px] text-slate-400 block">{s.phone}</span>}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          s.status === 'SUSPENDED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : s.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {s.status === 'SUSPENDED' ? '🚫 Blocked' : s.status}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-700">
                        <span className="font-bold text-slate-900 block">{s.completedSalesCount || s._count?.sellerOrders || 0} sales</span>
                        <span className="text-[10px] text-slate-400">₹{formatRupees(s?.grossVolume)} Vol</span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-black text-emerald-800 shadow-2xs">
                          <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                          ₹{formatRupees(s?.commissionEarned)}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSellerCommission(s);
                            setCustomCommissionVal(s.commissionOverride !== null && s.commissionOverride !== undefined ? String(s.commissionOverride) : '');
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg transition-colors"
                          title="Edit Commission Override %"
                        >
                          <span>{s.commissionOverride !== null && s.commissionOverride !== undefined ? `${s.commissionOverride}% (Override)` : `${commissionRate}% (Global)`}</span>
                          <Edit className="h-3 w-3" />
                        </button>
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-600">
                        {s.warningNotice ? (
                          <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 block truncate">
                            ⚠️ {s.warningNotice}
                          </span>
                        ) : s.penaltyFineAmount && Number(s.penaltyFineAmount) > 0 ? (
                          <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 block">
                            Penalty Fine: ₹{formatRupees(s?.penaltyFineAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {s.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => handleSellerApproval(s.id, 'APPROVE')}
                                className="rounded-xl bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-2xs"
                              >
                                Approve KYC
                              </button>
                              <button
                                onClick={() => handleSellerApproval(s.id, 'REJECT')}
                                className="rounded-xl bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-300"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {s.status === 'SUSPENDED' ? (
                            <button
                              onClick={() => handleDirectUnblock(s.id)}
                              className="rounded-xl bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-2xs"
                            >
                              Unblock Studio
                            </button>
                          ) : (
                            <>
                              {s.warningNotice && (
                                <button
                                  onClick={() => handleRevokeWarning(s.id)}
                                  className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                  title="Revoke Warning"
                                >
                                  Revoke
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedSellerForPenalty(s);
                                  setPenaltyActionType('WARN');
                                  setWarningText('Policy Notice: Please ensure all uploaded ZIP assets adhere to DesignHub digital licensing terms.');
                                }}
                                className="rounded-xl border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                              >
                                {s.warningNotice ? 'Edit Warn' : 'Warn'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSellerForPenalty(s);
                                  setPenaltyActionType('BLOCK_AND_FINE');
                                  setPenaltyFineAmount('1000');
                                  setPenaltyReason('Marketplace policy violation: Incompatible files reported by buyers.');
                                }}
                                className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors"
                              >
                                Block & Fine
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Disputes */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          <h3 className="text-xl font-extrabold text-slate-900">Dispute & Refund Queue</h3>
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Reported Asset</th>
                  <th className="p-3">Buyer</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeDisputes.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-400">No open dispute cases.</td></tr>
                ) : (
                  safeDisputes.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{d.listing?.title}</td>
                      <td className="p-3 text-slate-500">{d.buyer?.name}</td>
                      <td className="p-3 font-bold text-rose-600">{d.reason}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{d.description}</td>
                      <td className="p-3 font-bold text-amber-600">{d.status}</td>
                      <td className="p-3 flex gap-2">
                        {d.status === 'OPEN' && (
                          <>
                            <button
                              onClick={() => handleResolveDispute(d.id, 'APPROVE_REFUND')}
                              className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-xs"
                            >
                              Approve Refund
                            </button>
                            <button
                              onClick={() => handleResolveDispute(d.id, 'REJECT')}
                              className="rounded-lg bg-rose-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-rose-700 shadow-xs"
                            >
                              Dismiss Case
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Categories & Subcategories */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xl font-extrabold text-slate-900">Categories & Subcategories Management</h3>
            <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl font-semibold">
              💡 Tip: Re-order categories by dragging cards or clicking ▲/▼ buttons
            </span>
          </div>
          
          <form onSubmit={handleCreateCategory} className="space-y-3 rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-indigo-600" />
              Create Category / Subcategory
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category Name (e.g. 3D Icons)"
                required
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 min-h-[44px]"
              />

              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 min-h-[44px]"
              >
                <option value="">Top-Level Category (No Parent)</option>
                {parentCategories.map((p) => (
                  <option key={p.id} value={p.id}>Subcategory under: {p.name}</option>
                ))}
              </select>

              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Description..."
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 min-h-[44px]"
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 min-h-[44px]">
                Create Category
              </button>
            </div>
          </form>

          {/* Drag and Drop Categories Tree Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parentCategories.map((cat, idx) => (
              <div
                key={cat.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, cat.id, null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, cat.id, null)}
                className={`rounded-2xl border bg-white p-5 space-y-3 shadow-xs flex flex-col justify-between transition-all ${
                  draggedCatId === cat.id ? 'border-indigo-500 bg-indigo-50/20 scale-[0.99] opacity-60' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span title="Drag to reorder position">
                        <GripVertical className="h-4 w-4 text-slate-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing shrink-0" />
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleReorderCategory(cat.id, 'UP')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 rounded hover:bg-slate-100"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorderCategory(cat.id, 'DOWN')}
                          disabled={idx === parentCategories.length - 1}
                          className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 rounded hover:bg-slate-100"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm truncate">{cat.name}</h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        {cat._count?.listings || 0} assets
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEditCategory(cat)}
                        className="rounded-lg p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit Category"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">{cat.description || 'Top-level category'}</p>

                  {/* Subcategories */}
                  {cat.children?.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subcategories</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.children.map((sub: any, subIdx: number) => (
                          <span
                            key={sub.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, sub.id, cat.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, sub.id, cat.id)}
                            className={`inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition-all ${
                              draggedCatId === sub.id ? 'opacity-40 bg-indigo-100' : ''
                            }`}
                          >
                            <GripVertical className="h-3 w-3 text-slate-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing shrink-0" />
                            <Tag className="h-3 w-3 text-indigo-600 shrink-0" />
                            <span>{sub.name}</span>
                            <div className="flex items-center gap-0.5 ml-1 border-l border-slate-300 pl-1">
                              <button
                                type="button"
                                onClick={() => handleReorderCategory(sub.id, 'UP', cat.id)}
                                disabled={subIdx === 0}
                                className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                                title="Move Subcategory Left"
                              >
                                <ArrowUp className="h-3 w-3 rotate-[-90deg]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReorderCategory(sub.id, 'DOWN', cat.id)}
                                disabled={subIdx === cat.children.length - 1}
                                className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                                title="Move Subcategory Right"
                              >
                                <ArrowDown className="h-3 w-3 rotate-[-90deg]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(sub)}
                                className="p-0.5 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                title="Edit Subcategory"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(sub.id, sub.name)}
                                className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Delete Subcategory"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-xl">
          <h3 className="text-xl font-extrabold text-slate-900">Platform Settings & Monetization</h3>
          <form onSubmit={handleSaveCommission} className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Global Platform Commission (%)</label>
              <input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                step="0.5"
                min="0"
                max="100"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 min-h-[44px]"
              />
              <p className="text-[10px] text-slate-500 mt-1">Deducted automatically on every sale during Razorpay Route split.</p>
            </div>

            <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs min-h-[44px]">
              Save Platform Settings
            </button>
          </form>

          {/* Homepage Hero Banner Customization */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 space-y-4 shadow-xs">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">Homepage Hero Banner Artwork Customizer</h4>
              <p className="text-xs text-slate-500 mt-1">Upload a custom banner image to display on the homepage hero section anytime. (PNG, JPG, SVG up to 10MB)</p>
            </div>

            <div className="space-y-3">
              {heroImageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 p-2 space-y-2">
                  <img src={heroImageUrl} alt="Current Hero Banner" className="w-full h-44 object-cover rounded-xl" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      ✓ Custom Hero Banner Active
                    </span>
                    <button
                      type="button"
                      onClick={handleClearHeroImage}
                      disabled={uploadingHero}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200 transition-colors"
                    >
                      Reset to Default Vector SVG
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-6 text-center space-y-2">
                  <span className="text-xs font-bold text-stone-600 block">Default Vector Studio Illustration Active</span>
                  <span className="text-[11px] text-stone-400 block">Upload an image below to replace the homepage hero graphic anytime.</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {heroImageUrl ? 'Upload Replacement Hero Image' : 'Upload New Hero Banner Image'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeroImageChange}
                  disabled={uploadingHero}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {uploadingHero && <span className="text-xs font-bold text-indigo-600 mt-2 block animate-pulse">Uploading new hero image...</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Action Modal: Warning / Penalty Fine & Suspension */}
      {selectedSellerForPenalty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Seller Action: {selectedSellerForPenalty.businessName || selectedSellerForPenalty.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSellerForPenalty(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Action Type Toggle */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPenaltyActionType('WARN')}
                className={`py-2 rounded-xl transition-all ${
                  penaltyActionType === 'WARN' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                Issue Warning Notice
              </button>
              <button
                type="button"
                onClick={() => setPenaltyActionType('BLOCK_AND_FINE')}
                className={`py-2 rounded-xl transition-all ${
                  penaltyActionType === 'BLOCK_AND_FINE' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Block Account & Issue Fine
              </button>
            </div>

            <form onSubmit={handleApplyPenalty} className="space-y-4 text-xs">
              {penaltyActionType === 'WARN' ? (
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Warning Notice Message</label>
                  <textarea
                    value={warningText}
                    onChange={(e) => setWarningText(e.target.value)}
                    rows={3}
                    placeholder="Enter policy violation warning details..."
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">This warning will appear as a banner in the seller's studio and be emailed to them.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Penalty Fine Amount (₹)</label>
                    <input
                      type="number"
                      value={penaltyFineAmount}
                      onChange={(e) => setPenaltyFineAmount(e.target.value)}
                      placeholder="500"
                      required
                      min="1"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Reason for Account Suspension & Fine</label>
                    <textarea
                      value={penaltyReason}
                      onChange={(e) => setPenaltyReason(e.target.value)}
                      rows={3}
                      placeholder="e.g. Upload of corrupted files / copyright dispute / repeated buyer complaints..."
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-[11px] text-rose-700">
                    <strong>Enforcement Action:</strong> The seller studio will be immediately locked (status: SUSPENDED). The seller will not be able to publish new assets until they pay this penalty fine via Razorpay.
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSellerForPenalty(null)}
                  className="px-4 py-2 font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPenalty}
                  className={`rounded-xl px-5 py-2.5 font-bold text-white shadow-md disabled:opacity-60 transition-all ${
                    penaltyActionType === 'BLOCK_AND_FINE'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  }`}
                >
                  {submittingPenalty ? 'Applying...' : penaltyActionType === 'BLOCK_AND_FINE' ? 'Block & Issue Fine' : 'Send Warning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Action Modal: Edit Category / Subcategory */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Edit Category: {editingCategory.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Category Name</label>
                <input
                  type="text"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:outline-none focus:border-indigo-600 min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Parent Category (Optional)</label>
                <select
                  value={editParentId}
                  onChange={(e) => setEditParentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:outline-none focus:border-indigo-600 min-h-[44px]"
                >
                  <option value="">Top-Level Category (No Parent)</option>
                  {parentCategories.filter((p) => p.id !== editingCategory.id).map((p) => (
                    <option key={p.id} value={p.id}>Subcategory under: {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Description</label>
                <textarea
                  value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Display Order Position Number</label>
                <input
                  type="number"
                  value={editDisplayOrder}
                  onChange={(e) => setEditDisplayOrder(Number(e.target.value))}
                  min="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:outline-none focus:border-indigo-600 min-h-[44px]"
                />
                <p className="text-[10px] text-slate-400 mt-1">Lower position numbers appear first in marketplace navigation.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-60 transition-all min-h-[44px]"
                >
                  {savingCat ? 'Saving...' : 'Save Category Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Action Modal: Edit Seller Commission Override */}
      {editingSellerCommission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Seller Commission Override: {editingSellerCommission.businessName || editingSellerCommission.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSellerCommission(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSellerCommissionOverride} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Custom Platform Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={customCommissionVal}
                  onChange={(e) => setCustomCommissionVal(e.target.value)}
                  placeholder={`Leave blank to use Global default (${commissionRate}%)`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:outline-none focus:border-indigo-600 min-h-[44px]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Overrides the global platform commission rate for sales generated by this specific creator.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSellerCommission(null)}
                  className="px-4 py-2 font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSellerCommission}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-60 transition-all min-h-[44px]"
                >
                  {savingSellerCommission ? 'Saving...' : 'Update Commission Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
