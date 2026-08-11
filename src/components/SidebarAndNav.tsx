import React from 'react';
import { 
  LayoutDashboard, Home, Users, Receipt, Coins, 
  TrendingDown, Wrench, BarChart3, Settings, LogOut, ChevronRight, Plus, Building, Globe, Crown
} from 'lucide-react';
import { Property, UserRole } from '../types';

interface SidebarAndNavProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
  kostName: string;
  ownerName: string;
  onQuickPlus?: () => void;
  properties?: Property[];
  selectedPropertyId?: string;
  onViewGuestPortal?: () => void;
  userRole?: UserRole;
}

export function SidebarAndNav({ 
  currentTab, 
  onChangeTab, 
  onLogout, 
  kostName, 
  ownerName, 
  onQuickPlus,
  properties = [],
  selectedPropertyId = 'all',
  onViewGuestPortal,
  userRole = 'owner'
}: SidebarAndNavProps) {
  
  const activeProperty = properties.find(p => p.id === selectedPropertyId);
  const isSuperAdmin = userRole === 'super_admin';

  // Base Nav Items
  const navItems = [
    ...(isSuperAdmin ? [{ id: 'super_admin', label: 'Master Admin SaaS', icon: Crown, highlight: true }] : []),
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms', label: 'Unit Kamar', icon: Home },
    { id: 'tenants', label: 'Penghuni / Tamu', icon: Users },
    { id: 'bills', label: 'Tagihan', icon: Receipt },
    { id: 'payments', label: 'Pembayaran', icon: Coins },
    { id: 'expenses', label: 'Pengeluaran', icon: TrendingDown },
    { id: 'complaints', label: 'Maintenance', icon: Wrench },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* 1. DESKTOP LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0b1727] text-slate-300 h-screen sticky top-0 shrink-0 border-r border-slate-800/80 shadow-2xl">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg ${
              isSuperAdmin ? 'bg-amber-500 shadow-amber-500/30' : 'bg-blue-600 shadow-blue-500/30'
            }`}>
              {isSuperAdmin ? <Crown className="h-5.5 w-5.5 text-slate-950" /> : <Home className="h-5.5 w-5.5" />}
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight">StayFlow</span>
              <p className={`text-[10px] font-bold tracking-wider uppercase ${
                isSuperAdmin ? 'text-amber-400' : 'text-teal-400'
              }`}>
                {isSuperAdmin ? 'SUPER ADMIN HQ' : 'MULTI-PENGINAPAN HQ'}
              </p>
            </div>
          </div>
        </div>

        {/* User / Property Card */}
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl border font-bold flex items-center justify-center text-xs shrink-0 ${
              isSuperAdmin 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : 'bg-teal-500/20 border-teal-500/30 text-teal-300'
            }`}>
              {isSuperAdmin ? <Crown className="h-4.5 w-4.5" /> : <Building className="h-4.5 w-4.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {isSuperAdmin ? 'Master Admin SaaS' : (selectedPropertyId === 'all' ? `Semua Penginapan (${properties.length})` : (activeProperty?.name || kostName))}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {isSuperAdmin ? 'Pengelola Platform' : (selectedPropertyId === 'all' ? 'Akun Penginapan' : `${activeProperty?.type || 'Penginapan'} • ${activeProperty?.city || 'Yogyakarta'}`)}
              </p>
            </div>
          </div>

          {!isSuperAdmin && onViewGuestPortal && (
            <button
              onClick={onViewGuestPortal}
              className="mt-2.5 w-full py-1.5 px-2 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-300 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Globe className="h-3 w-3 text-teal-400" />
              <span>Beranda Calon Penginap</span>
            </button>
          )}
        </div>

        {/* Sidebar Nav List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isHighlight = item.highlight;

            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? isHighlight
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-extrabold'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-extrabold' 
                    : isHighlight
                      ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 ${
                    isActive 
                      ? (isHighlight ? 'text-slate-950' : 'text-white')
                      : (isHighlight ? 'text-amber-400' : 'text-slate-400')
                  }`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-80" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 text-slate-600 px-2 py-1.5 flex justify-around items-center shadow-2xl">
        {isSuperAdmin ? (
          <button
            onClick={() => onChangeTab('super_admin')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] ${
              currentTab === 'super_admin' ? 'text-amber-600 font-extrabold' : 'text-slate-400'
            }`}
          >
            <Crown className="h-5 w-5" />
            <span className="text-[10px]">Master Admin</span>
          </button>
        ) : (
          <button
            onClick={() => onChangeTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] ${
              currentTab === 'dashboard' ? 'text-blue-600 font-extrabold' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px]">Beranda</span>
          </button>
        )}

        <button
          onClick={() => onChangeTab('rooms')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            currentTab === 'rooms' ? 'text-blue-600 font-extrabold' : 'text-slate-400'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px]">Unit</span>
        </button>

        {/* Floating Center Plus Action Button */}
        <button
          onClick={onQuickPlus || (() => onChangeTab('tenants'))}
          className="h-11 w-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 -mt-5 border-4 border-white cursor-pointer active:scale-95 transition-transform"
        >
          <Plus className="h-6 w-6 stroke-[2.5px]" />
        </button>

        <button
          onClick={() => onChangeTab('bills')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            currentTab === 'bills' ? 'text-blue-600 font-extrabold' : 'text-slate-400'
          }`}
        >
          <Receipt className="h-5 w-5" />
          <span className="text-[10px]">Tagihan</span>
        </button>

        <button
          onClick={() => onChangeTab('settings')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            currentTab === 'settings' ? 'text-blue-600 font-extrabold' : 'text-slate-400'
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[10px]">Lainnya</span>
        </button>
      </nav>
    </>
  );
}
