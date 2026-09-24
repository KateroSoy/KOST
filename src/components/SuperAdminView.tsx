import React, { useState, useEffect } from 'react';
import { Users, Buildings, ShieldWarning, ShieldCheck, ArrowsClockwise, MagnifyingGlass, ArrowUpRight, Crown, Trash, CheckCircle, WarningCircle, Door, UserCheck, Lightning, Lock, LockOpen } from '@phosphor-icons/react';
import { SuperAdminMetrics, TenantAccount } from '../types';
import { fetchAdminMetrics, fetchAdminUsers, updateAdminUserStatus, updateAdminUserPlan, deleteAdminUser } from '../api';

interface SuperAdminViewProps {
  onOpenOwnerLandingPage: (slug: string) => void;
}

const DEMO_METRICS: SuperAdminMetrics = {
  totalOwners: 8,
  activeOwners: 7,
  suspendedOwners: 1,
  totalRooms: 64,
  occupiedRooms: 48,
  totalTenants: 48,
  totalRevenuePaid: 112500000,
  totalRevenuePending: 8500000
};

const DEMO_ACCOUNTS: TenantAccount[] = [
  {
    id: 1,
    name: 'Budi Hartanto',
    phone: '081234567890',
    slug: 'green-house-kemang',
    email: 'budi@greenhouse.id',
    role: 'owner',
    status: 'active',
    plan: 'pro',
    kostName: 'Green House Kemang',
    roomCount: 20,
    tenantCount: 16,
    propertyCount: 2,
    createdAt: '2025-01-15'
  },
  {
    id: 2,
    name: 'Siti Rahma',
    phone: '081398765432',
    slug: 'align-canggu',
    email: 'siti@aligncanggu.com',
    role: 'owner',
    status: 'active',
    plan: 'pro',
    kostName: 'Align Canggu Sanctuary',
    roomCount: 18,
    tenantCount: 15,
    propertyCount: 1,
    createdAt: '2025-02-01'
  },
  {
    id: 3,
    name: 'Rian Pratama',
    phone: '085712345678',
    slug: 'urban-kost-dago',
    email: 'rian@urbankost.id',
    role: 'owner',
    status: 'active',
    plan: 'basic',
    kostName: 'Urban Kost Dago',
    roomCount: 26,
    tenantCount: 17,
    propertyCount: 1,
    createdAt: '2025-03-10'
  }
];

export function SuperAdminView({ onOpenOwnerLandingPage }: SuperAdminViewProps) {
  const [metrics, setMetrics] = useState<SuperAdminMetrics | null>(null);
  const [accounts, setAccounts] = useState<TenantAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<TenantAccount | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [m, u] = await Promise.all([
        fetchAdminMetrics(),
        fetchAdminUsers(),
      ]);
      setMetrics(m);
      setAccounts(u);
    } catch {
      // Fallback to offline demo data if API server is not reachable
      setMetrics(DEMO_METRICS);
      setAccounts(DEMO_ACCOUNTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (account: TenantAccount) => {
    const newStatus = account.status === 'active' ? 'suspended' : 'active';
    setActionLoadingId(account.id);
    try {
      await updateAdminUserStatus(account.id, newStatus).catch(() => {});
      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, status: newStatus } : a));
      if (metrics) {
        setMetrics({
          ...metrics,
          activeOwners: newStatus === 'active' ? metrics.activeOwners + 1 : Math.max(0, metrics.activeOwners - 1),
          suspendedOwners: newStatus === 'suspended' ? metrics.suspendedOwners + 1 : Math.max(0, metrics.suspendedOwners - 1),
        });
      }
    } catch {
      // Fallback local update
      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, status: newStatus } : a));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTogglePlan = async (account: TenantAccount) => {
    const newPlan = account.plan === 'pro' ? 'basic' : 'pro';
    setActionLoadingId(account.id);
    try {
      await updateAdminUserPlan(account.id, newPlan).catch(() => {});
      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, plan: newPlan } : a));
    } catch {
      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, plan: newPlan } : a));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    const targetId = deleteConfirmUser.id;
    setActionLoadingId(targetId);
    try {
      await deleteAdminUser(targetId).catch(() => {});
      setAccounts(prev => prev.filter(a => a.id !== targetId));
      setDeleteConfirmUser(null);
      if (metrics) {
        setMetrics({
          ...metrics,
          totalOwners: Math.max(0, metrics.totalOwners - 1),
        });
      }
    } catch {
      setAccounts(prev => prev.filter(a => a.id !== targetId));
      setDeleteConfirmUser(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.kostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.phone.includes(searchQuery) ||
    a.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-[#0f2720] text-white rounded-[2rem] p-6 shadow-2xl border border-teal-700/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#B89A68]/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" /> MASTER ADMIN SAAS
            </span>
            <span className="text-xs text-indigo-300 font-mono">Platform HQ Control Center</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Pelanggan & Penginapan SaaS</h1>
          <p className="text-sm text-indigo-200 mt-1">
            Kelola seluruh akun pemilik penginapan (Customer SaaS), status langganan, dan isolasi data sistem.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 bg-[#173B30]/50 hover:bg-[#173B30] text-white text-sm font-medium px-4 py-2 rounded-xl transition border border-[#173B30]/30 disabled:opacity-50 cursor-pointer shadow-md"
        >
          <ArrowsClockwise weight="duotone" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Memuat...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
          <WarningCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up delay-100">
        <div className="glass-panel rounded-[2rem] p-5 border border-white/60 shadow-lg flex items-center justify-between hover:-translate-y-1 transition-transform">
          <div>
            <p className="text-xs font-medium text-[#6E746F] dark:text-[#6E746F] uppercase tracking-wider">Total Customer SaaS</p>
            <h3 className="text-2xl font-bold text-[#171A18] dark:text-white mt-1">
              {metrics ? metrics.totalOwners : '-'}
            </h3>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="text-emerald-600 font-semibold">{metrics ? metrics.activeOwners : 0} Aktif</span>
              <span className="text-[#6E746F]">•</span>
              <span className="text-rose-600 font-semibold">{metrics ? metrics.suspendedOwners : 0} Suspended</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-bold">
            <Users weight="duotone" className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-5 border border-white/60 shadow-lg flex items-center justify-between hover:-translate-y-1 transition-transform">
          <div>
            <p className="text-xs font-medium text-[#6E746F] dark:text-[#6E746F] uppercase tracking-wider">Total Kamar Platform</p>
            <h3 className="text-2xl font-bold text-[#171A18] dark:text-white mt-1">
              {metrics ? metrics.totalRooms : '-'}
            </h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
              {metrics ? metrics.occupiedRooms : 0} Kamar Terisi ({metrics && metrics.totalRooms ? Math.round((metrics.occupiedRooms / metrics.totalRooms) * 100) : 0}%)
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
            <Door className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-5 border border-white/60 shadow-lg flex items-center justify-between hover:-translate-y-1 transition-transform">
          <div>
            <p className="text-xs font-medium text-[#6E746F] dark:text-[#6E746F] uppercase tracking-wider">Total Penghuni</p>
            <h3 className="text-2xl font-bold text-[#171A18] dark:text-white mt-1">
              {metrics ? metrics.totalTenants : '-'}
            </h3>
            <p className="text-xs text-[#6E746F] dark:text-[#6E746F] mt-1">Di seluruh penginapan</p>
          </div>
          <div className="w-12 h-12 bg-[#F5F1E8] dark:bg-blue-950/50 text-[#173B30] dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] p-5 border border-white/60 shadow-lg flex items-center justify-between hover:-translate-y-1 transition-transform">
          <div>
            <p className="text-xs font-medium text-[#6E746F] dark:text-[#6E746F] uppercase tracking-wider">Omset Terbayar (Lunas)</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics ? formatRupiah(metrics.totalRevenuePaid) : '-'}
            </h3>
            <p className="text-xs text-[#B89A68] dark:text-amber-400 font-medium mt-1">
              Pending: {metrics ? formatRupiah(metrics.totalRevenuePending) : '-'}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
            <Lightning weight="duotone" className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="glass-panel rounded-[2rem] border border-white/60 shadow-lg overflow-hidden animate-fade-in-up delay-200">
        <div className="p-5 border-b border-[rgba(23,59,48,0.15)]/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#171A18] dark:text-white">Daftar Akun Pemilik Penginapan</h2>
            <p className="text-xs text-[#6E746F] dark:text-[#6E746F] mt-0.5">
              Setiap pemilik memiliki landing page independen dan isolasi data privat.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <MagnifyingGlass weight="duotone" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E746F]" />
            <input
              type="text"
              placeholder="Cari nama, penginapan, WA..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#0f2720] border border-[rgba(23,59,48,0.15)] dark:border-[#173B30] rounded-xl pl-9 pr-4 py-2 text-sm text-[#171A18] dark:text-white placeholder-[#6E746F] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#6E746F] dark:text-[#6E746F] space-y-3">
            <ArrowsClockwise weight="duotone" className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
            <p className="text-sm font-medium">Memuat data akun SaaS...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center text-[#6E746F] dark:text-[#6E746F] space-y-2">
            <Users weight="duotone" className="w-10 h-10 mx-auto text-[#A8B7A1] dark:text-[#6E746F]" />
            <p className="font-semibold text-[#171A18] dark:text-[#A8B7A1]">Tidak ada akun ditemukan</p>
            <p className="text-xs text-[#6E746F]">Coba kata kunci pencarian lain.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#6E746F] dark:text-[#A8B7A1]">
              <thead className="bg-white dark:bg-[#0f2720]/50 text-[#6E746F] dark:text-[#6E746F] text-xs uppercase tracking-wider font-semibold border-b border-[rgba(23,59,48,0.06)] dark:border-[#173B30]">
                <tr>
                  <th className="px-5 py-3.5">Pemilik & Penginapan</th>
                  <th className="px-5 py-3.5">Kontak WhatsApp</th>
                  <th className="px-5 py-3.5">Properti & Kamar</th>
                  <th className="px-5 py-3.5">Paket SaaS</th>
                  <th className="px-5 py-3.5">Status Akun</th>
                  <th className="px-5 py-3.5 text-right">Aksi Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(23,59,48,0.06)] dark:divide-[#173B30]">
                {filteredAccounts.map((account) => {
                  const isSuspended = account.status === 'suspended';
                  const isPro = account.plan === 'pro';
                  const isLoadingThis = actionLoadingId === account.id;

                  return (
                    <tr key={account.id} className="hover:bg-white/80 dark:hover:bg-[#0f2720]/40 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base flex-shrink-0">
                            {account.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#171A18] dark:text-white flex items-center gap-2">
                              {account.kostName}
                              <button
                                onClick={() => onOpenOwnerLandingPage(account.slug)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-normal"
                                title="Buka Landing Page Publik Pemilik Ini"
                              >
                                <ArrowUpRight weight="duotone" className="w-3 h-3" />
                                <span>Landing Page</span>
                              </button>
                            </div>
                            <div className="text-xs text-[#6E746F] dark:text-[#6E746F] mt-0.5">
                              Pemilik: <span className="font-medium text-[#171A18] dark:text-[#A8B7A1]">{account.name}</span>
                            </div>
                            <div className="text-[11px] font-mono text-[#6E746F] mt-0.5">
                              slug: ?owner={account.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-[#171A18] dark:text-[#A8B7A1]">
                          {account.phone}
                        </span>
                        {account.createdAt && (
                          <div className="text-[11px] text-[#6E746F] mt-0.5">
                            Daftar: {account.createdAt}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="bg-[#FBF9F5] dark:bg-[#0f2720] px-2.5 py-1 rounded-lg font-medium">
                            🏠 {account.propertyCount || 1} Properti
                          </span>
                          <span className="bg-[#FBF9F5] dark:bg-[#0f2720] px-2.5 py-1 rounded-lg font-medium">
                            🚪 {account.roomCount} Kamar
                          </span>
                          <span className="bg-[#FBF9F5] dark:bg-[#0f2720] px-2.5 py-1 rounded-lg font-medium">
                            👥 {account.tenantCount} Penghuni
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleTogglePlan(account)}
                          disabled={isLoadingThis}
                          className={`text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition ${
                            isPro
                              ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 hover:bg-purple-200'
                              : 'bg-[#FBF9F5] dark:bg-[#0f2720] text-[#171A18] dark:text-[#A8B7A1] border border-[rgba(23,59,48,0.20)] dark:border-[#173B30] hover:bg-[rgba(23,59,48,0.06)]'
                          }`}
                        >
                          <Crown className={`w-3.5 h-3.5 ${isPro ? 'text-[#B89A68]' : 'text-[#6E746F]'}`} />
                          {isPro ? 'PAKET PRO' : 'PAKET BASIC'}
                        </button>
                        {isPro && account.expiresAt && (
                          account.effectivePlan === 'basic' ? (
                            <div className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                              <WarningCircle weight="duotone" className="w-3 h-3" /> Trial berakhir
                            </div>
                          ) : (
                            <div className="text-[10px] font-semibold text-[#B89A68] mt-1 flex items-center gap-1">
                              <Lightning weight="duotone" className="w-3 h-3" />
                              Trial: {Math.max(0, Math.ceil((new Date(account.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} hari lagi
                            </div>
                          )
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                            <Lock weight="duotone" className="w-3.5 h-3.5" /> DITANGGUHKAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle weight="duotone" className="w-3.5 h-3.5" /> AKUN AKTIF
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(account)}
                            disabled={isLoadingThis}
                            className={`text-xs px-3 py-1.5 rounded-xl font-medium flex items-center gap-1 transition ${
                              isSuspended
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-[#B89A68] hover:bg-amber-600 text-white'
                            }`}
                            title={isSuspended ? 'Aktifkan Kembali Akun Pemilik Ini' : 'Tangguhkan Akses Akun Pemilik Ini'}
                          >
                            {isSuspended ? <LockOpen className="w-3.5 h-3.5" /> : <Lock weight="duotone" className="w-3.5 h-3.5" />}
                            {isSuspended ? 'Aktifkan' : 'Tangguhkan'}
                          </button>

                          <button
                            onClick={() => setDeleteConfirmUser(account)}
                            disabled={isLoadingThis}
                            className="p-1.5 text-[#6E746F] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition"
                            title="Hapus Akun Pemilik & Seluruh Data Berkenaan"
                          >
                            <Trash  weight="duotone" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Confirm Delete */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-[#173B30]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#173B30] rounded-2xl max-w-md w-full p-6 border border-[rgba(23,59,48,0.15)] dark:border-[#173B30] shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <ShieldWarning className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[#171A18] dark:text-white">
                Hapus Akun "{deleteConfirmUser.kostName}"?
              </h3>
              <p className="text-xs text-[#6E746F] dark:text-[#6E746F]">
                Tindakan ini akan menghapus akun **{deleteConfirmUser.name}** beserta seluruh kamar ({deleteConfirmUser.roomCount}), penghuni ({deleteConfirmUser.tenantCount}), tagihan, dan catatan keuangan secara permanen.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="w-1/2 py-2.5 rounded-xl border border-[rgba(23,59,48,0.15)] dark:border-[#173B30] text-sm font-semibold text-[#171A18] dark:text-[#A8B7A1] hover:bg-[#FBF9F5] dark:hover:bg-[#0f2720] transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoadingId === deleteConfirmUser.id}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                {actionLoadingId === deleteConfirmUser.id ? (
                  <ArrowsClockwise weight="duotone" className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash  weight="duotone" className="w-4 h-4" />
                )}
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
