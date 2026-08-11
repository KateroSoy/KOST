import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  Crown, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  DoorClosed,
  UserCheck,
  Zap,
  Lock,
  Unlock
} from 'lucide-react';
import { SuperAdminMetrics, TenantAccount } from '../types';
import { fetchAdminMetrics, fetchAdminUsers, updateAdminUserStatus, updateAdminUserPlan, deleteAdminUser } from '../api';

interface SuperAdminViewProps {
  onOpenOwnerLandingPage: (slug: string) => void;
}

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
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data Master Admin SaaS');
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
      await updateAdminUserStatus(account.id, newStatus);
      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, status: newStatus } : a));
      if (metrics) {
        setMetrics({
          ...metrics,
          activeOwners: newStatus === 'active' ? metrics.activeOwners + 1 : metrics.activeOwners - 1,
          suspendedOwners: newStatus === 'suspended' ? metrics.suspendedOwners + 1 : metrics.suspendedOwners - 1,
        });
      }
    } catch (err: any) {
      alert(err?.message || 'Gagal memperbarui status akun');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTogglePlan = async (account: TenantAccount) => {
    const newPlan = account.plan === 'pro' ? 'basic' : 'pro';
    setActionLoadingId(account.id);
    try {
      await updateAdminUserPlan(account.id, newPlan);
      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, plan: newPlan } : a));
    } catch (err: any) {
      alert(err?.message || 'Gagal memperbarui paket langganan');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    const targetId = deleteConfirmUser.id;
    setActionLoadingId(targetId);
    try {
      await deleteAdminUser(targetId);
      setAccounts(prev => prev.filter(a => a.id !== targetId));
      setDeleteConfirmUser(null);
      if (metrics) {
        setMetrics({
          ...metrics,
          totalOwners: Math.max(0, metrics.totalOwners - 1),
        });
      }
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus akun');
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
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-700/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
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
          className="flex items-center gap-2 bg-indigo-600/50 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition border border-indigo-400/30 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Memuat...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Customer SaaS</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics ? metrics.totalOwners : '-'}
            </h3>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="text-emerald-600 font-semibold">{metrics ? metrics.activeOwners : 0} Aktif</span>
              <span className="text-slate-400">•</span>
              <span className="text-rose-600 font-semibold">{metrics ? metrics.suspendedOwners : 0} Suspended</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Kamar Platform</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics ? metrics.totalRooms : '-'}
            </h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
              {metrics ? metrics.occupiedRooms : 0} Kamar Terisi ({metrics && metrics.totalRooms ? Math.round((metrics.occupiedRooms / metrics.totalRooms) * 100) : 0}%)
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
            <DoorClosed className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Penghuni</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics ? metrics.totalTenants : '-'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Di seluruh penginapan</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Omset Terbayar (Lunas)</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics ? formatRupiah(metrics.totalRevenuePaid) : '-'}
            </h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
              Pending: {metrics ? formatRupiah(metrics.totalRevenuePending) : '-'}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Akun Pemilik Penginapan</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Setiap pemilik memiliki landing page independen dan isolasi data privat.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, penginapan, WA..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
            <p className="text-sm font-medium">Memuat data akun SaaS...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Tidak ada akun ditemukan</p>
            <p className="text-xs text-slate-400">Coba kata kunci pencarian lain.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Pemilik & Penginapan</th>
                  <th className="px-5 py-3.5">Kontak WhatsApp</th>
                  <th className="px-5 py-3.5">Properti & Kamar</th>
                  <th className="px-5 py-3.5">Paket SaaS</th>
                  <th className="px-5 py-3.5">Status Akun</th>
                  <th className="px-5 py-3.5 text-right">Aksi Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAccounts.map((account) => {
                  const isSuspended = account.status === 'suspended';
                  const isPro = account.plan === 'pro';
                  const isLoadingThis = actionLoadingId === account.id;

                  return (
                    <tr key={account.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base flex-shrink-0">
                            {account.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {account.kostName}
                              <button
                                onClick={() => onOpenOwnerLandingPage(account.slug)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-normal"
                                title="Buka Landing Page Publik Pemilik Ini"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Landing Page</span>
                              </button>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Pemilik: <span className="font-medium text-slate-700 dark:text-slate-300">{account.name}</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              slug: ?owner={account.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                          {account.phone}
                        </span>
                        {account.createdAt && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Daftar: {account.createdAt}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-medium">
                            🏠 {account.propertyCount || 1} Properti
                          </span>
                          <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-medium">
                            🚪 {account.roomCount} Kamar
                          </span>
                          <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-medium">
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
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <Crown className={`w-3.5 h-3.5 ${isPro ? 'text-amber-500' : 'text-slate-400'}`} />
                          {isPro ? 'PAKET PRO' : 'PAKET BASIC'}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                            <Lock className="w-3.5 h-3.5" /> DITANGGUHKAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> AKUN AKTIF
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
                                : 'bg-amber-500 hover:bg-amber-600 text-white'
                            }`}
                            title={isSuspended ? 'Aktifkan Kembali Akun Pemilik Ini' : 'Tangguhkan Akses Akun Pemilik Ini'}
                          >
                            {isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            {isSuspended ? 'Aktifkan' : 'Tangguhkan'}
                          </button>

                          <button
                            onClick={() => setDeleteConfirmUser(account)}
                            disabled={isLoadingThis}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition"
                            title="Hapus Akun Pemilik & Seluruh Data Berkenaan"
                          >
                            <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Hapus Akun "{deleteConfirmUser.kostName}"?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tindakan ini akan menghapus akun **{deleteConfirmUser.name}** beserta seluruh kamar ({deleteConfirmUser.roomCount}), penghuni ({deleteConfirmUser.tenantCount}), tagihan, dan catatan keuangan secara permanen.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoadingId === deleteConfirmUser.id}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                {actionLoadingId === deleteConfirmUser.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
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
