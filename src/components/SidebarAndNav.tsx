import React from 'react';
import { 
  LayoutDashboard, Home, Users, Receipt, Coins, 
  TrendingDown, Wrench, BarChart3, Settings, Menu, LogOut, ChevronRight
} from 'lucide-react';

interface SidebarAndNavProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
  kostName: string;
  ownerName: string;
}

export function SidebarAndNav({ currentTab, onChangeTab, onLogout, kostName, ownerName }: SidebarAndNavProps) {
  
  // Tab details definition
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms', label: 'Data Kamar', icon: Home },
    { id: 'tenants', label: 'Penghuni', icon: Users },
    { id: 'bills', label: 'Tagihan & Invoice', icon: Receipt },
    { id: 'payments', label: 'Catat Bayar', icon: Coins },
    { id: 'expenses', label: 'Pengeluaran', icon: TrendingDown },
    { id: 'complaints', label: 'Komplain & Servis', icon: Wrench },
    { id: 'reports', label: 'Laporan Harian', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan Kost', icon: Settings },
  ];

  return (
    <>
      {/* 1. DESKTOP LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-50 text-slate-600 h-screen sticky top-0 shrink-0 border-r border-slate-100">
        {/* Brand Container */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-teal-500 flex items-center justify-center text-white font-black shadow-lg shadow-teal-500/10">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-800 tracking-tight">Kostos</span>
              <p className="text-[10px] text-teal-600 font-semibold tracking-wider">PREMIUM PARTNER</p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="px-6 py-4 border-b border-slate-100/80 bg-slate-100/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-teal-50 font-bold text-teal-600 flex items-center justify-center text-xs">
              {ownerName ? ownerName.charAt(0).toUpperCase() : 'I'}
            </div>
            <div className="translate-y-[-1px] min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate max-w-[140px]">{kostName}</p>
              <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{ownerName}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/10' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </nav>

        {/* Logout Controller */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION (5 TABS) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] px-2 py-1.5 flex justify-around items-center">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'rooms', label: 'Kamar', icon: Home },
          { id: 'bills', label: 'Tagihan', icon: Receipt },
          { id: 'reports', label: 'Laporan', icon: BarChart3 },
          { id: 'settings', label: 'Menu', icon: Menu },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'settings' && ['tenants', 'payments', 'expenses', 'complaints', 'settings'].includes(currentTab));
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-xl transition-all cursor-pointer min-w-[64px] min-h-[44px] justify-center ${
                isActive ? 'text-teal-600 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
