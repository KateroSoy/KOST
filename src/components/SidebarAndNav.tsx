import React, { useState } from 'react';
import { SquaresFour, House, Users, Receipt, CalendarCheck, Wrench, ChartBar, Gear, SignOut, CaretRight, Buildings, Globe, Crown, Shield, Laptop, DotsThree, X, ArrowUpRight, Sparkle, Lock, FileText, TrendDown, ShieldWarning } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
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
  lockedTabIds?: string[];
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
  userRole = 'owner',
  lockedTabIds = []
}: SidebarAndNavProps) {
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeProperty = properties.find(p => p.id === selectedPropertyId);
  const isSuperAdmin = userRole === 'super_admin';

  // Master Navigation Items
  const navItems = [
    ...(isSuperAdmin ? [{ id: 'super_admin', label: 'Master SaaS', icon: Crown, highlight: true }] : []),
    { id: 'dashboard', label: 'Beranda', icon: SquaresFour },
    { id: 'rooms', label: 'Unit Kamar', icon: House },
    { id: 'bookings', label: 'Booking', icon: CalendarCheck },
    { id: 'tenants', label: 'Penghuni', icon: Users },
    { id: 'bills', label: 'Tagihan', icon: FileText },
    { id: 'payments', label: 'Pembayaran', icon: Receipt },
    { id: 'expenses', label: 'Pengeluaran', icon: TrendDown },
    { id: 'operations', label: 'Operasional', icon: Wrench },
    { id: 'complaints', label: 'Keluhan', icon: ShieldWarning },
    { id: 'website', label: 'Website', icon: Laptop },
    { id: 'reports', label: 'Laporan', icon: ChartBar },
    { id: 'team', label: 'Tim', icon: Shield },
    { id: 'settings', label: 'Pengaturan', icon: Gear },
  ];

  // Mobile Bottom Bar Primary Tabs (App-Style)
  const mobilePrimaryTabs = [
    { id: 'dashboard', label: 'Beranda', icon: SquaresFour },
    { id: 'rooms', label: 'Unit', icon: House },
    { id: 'bookings', label: 'Booking', icon: CalendarCheck },
    { id: 'tenants', label: 'Penghuni', icon: Users },
  ];

  const handleMobileTabSelect = (tabId: string) => {
    onChangeTab(tabId);
    setMobileMenuOpen(false);
  };

  const isCurrentTabInSecondary = !mobilePrimaryTabs.some(t => t.id === currentTab);

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. DESKTOP LEFT SIDEBAR (>= lg)
      ───────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#173B30] text-[#F5F1E8] h-screen sticky top-0 shrink-0 border-r border-emerald-950/80 shadow-2xl relative overflow-hidden font-sans z-50">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-emerald-900/60 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#F5F1E8] text-[#173B30] flex items-center justify-center font-black shadow-md">
              <Buildings weight="duotone" className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#F5F1E8] font-display">
                BISNIESGO <span className="font-light text-emerald-300">Living</span>
              </span>
              <p className="text-[9px] font-bold tracking-widest uppercase mt-0.5 text-emerald-300/80">
                {isSuperAdmin ? 'SUPER ADMIN' : 'PENGELOLA HUNIAN'}
              </p>
            </div>
          </div>
        </div>

        {/* User / Active Property Card */}
        <div className="px-4 py-4 border-b border-emerald-900/60 bg-[#0e241e]/50 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-emerald-800/60 font-bold flex items-center justify-center text-xs shrink-0 bg-emerald-900/40 text-emerald-200">
              <Buildings weight="duotone" className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {isSuperAdmin ? 'Master Admin' : (selectedPropertyId === 'all' ? `Semua Properti (${properties.length})` : (activeProperty?.name || kostName))}
              </p>
              <p className="text-[10px] text-emerald-200/70 truncate mt-0.5">
                {isSuperAdmin ? 'Pengelola Platform' : (selectedPropertyId === 'all' ? 'Akun Pemilik' : `${activeProperty?.type || 'Coliving'} • ${activeProperty?.city || 'Jakarta'}`)}
              </p>
            </div>
          </div>

          {/* Quick Button to Public Website */}
          {onViewGuestPortal && (
            <button
              onClick={onViewGuestPortal}
              className="mt-3.5 w-full py-2 px-2.5 bg-[#F5F1E8]/10 hover:bg-[#F5F1E8]/20 border border-emerald-700/50 text-emerald-100 hover:text-white text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-emerald-300" />
              <span>Lihat Website Publik</span>
            </button>
          )}
        </div>

        {/* Sidebar Nav List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto relative z-10 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isLocked = lockedTabIds.includes(item.id);

            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-[#F5F1E8] text-[#173B30] shadow-sm font-extrabold relative'
                    : 'text-emerald-100/80 hover:text-white hover:bg-emerald-900/30'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-[#173B30] rounded-r-full" />
                )}
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[#173B30]' : 'text-emerald-300'
                  }`} />
                  <span>{item.label}</span>
                </div>
                {isLocked && (
                  <Lock weight="fill" className={`h-3 w-3 shrink-0 ${isActive ? 'text-[#173B30]/60' : 'text-emerald-300/70'}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Logout & User Profile */}
        <div className="p-4 border-t border-emerald-900/60 bg-[#0e241e]/70 relative z-10">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-white truncate">{ownerName || 'Pemilik Properti'}</p>
              <p className="text-[10px] text-emerald-300/70 truncate">Pengelola Aktif</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-emerald-300 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
              title="Keluar Aku"
            >
              <SignOut weight="duotone" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. MOBILE FLOATING ISLAND DOCK (< lg)
          App-Style Floating Bottom Navigation with Soft Rounded Pill
      ───────────────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-4 left-3 right-3 sm:left-auto sm:right-auto sm:w-[440px] sm:left-1/2 sm:-translate-x-1/2 z-50">
        <div className="bg-white/95 backdrop-blur-xl border border-[rgba(23,59,48,0.12)] shadow-[0_12px_40px_rgba(23,59,48,0.18)] rounded-full px-2 py-1.5 flex items-center justify-between">
          
          {mobilePrimaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            const isLocked = lockedTabIds.includes(tab.id);

            return (
              <button
                key={tab.id}
                onClick={() => handleMobileTabSelect(tab.id)}
                className={`relative flex items-center justify-center h-10 px-4 rounded-full transition-colors cursor-pointer z-10 ${
                  isActive
                    ? 'text-[#F5F1E8] font-bold'
                    : 'text-[#6E746F] hover:text-[#173B30] font-medium'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-active-pill"
                    className="absolute inset-0 bg-[#173B30] rounded-full shadow-md shadow-emerald-950/20 -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                {isLocked && (
                  <Lock weight="fill" className="absolute top-1 right-2 h-2.5 w-2.5 text-amber-500 z-10" />
                )}
                <div className="flex items-center gap-1.5 relative z-10">
                  <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  <AnimatePresence>
                    {isActive && (
                      <motion.span 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="text-xs tracking-tight overflow-hidden whitespace-nowrap block"
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            );
          })}

          {/* More Menu Pill Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`relative flex items-center justify-center h-10 px-4 rounded-full transition-colors cursor-pointer z-10 ${
              isCurrentTabInSecondary
                ? 'text-[#F5F1E8] font-bold'
                : 'text-[#6E746F] hover:text-[#173B30] font-medium'
            }`}
          >
            {isCurrentTabInSecondary && (
              <motion.div
                layoutId="mobile-active-pill"
                className="absolute inset-0 bg-[#173B30] rounded-full shadow-md shadow-emerald-950/20 -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <div className="flex items-center gap-1.5 relative z-10">
              <DotsThree weight="duotone" className={`h-4 w-4 shrink-0 ${isCurrentTabInSecondary ? 'scale-110' : ''}`} />
              <AnimatePresence>
                {isCurrentTabInSecondary && (
                  <motion.span 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="text-xs tracking-tight overflow-hidden whitespace-nowrap block capitalize"
                  >
                    {navItems.find(n => n.id === currentTab)?.label || 'Menu'}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </button>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MOBILE "MORE" BOTTOM SHEET MODAL
      ───────────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          
          {/* Backdrop Clicker */}
          <div 
            className="flex-1" 
            onClick={() => setMobileMenuOpen(false)} 
          />

          {/* Bottom Drawer Card */}
          <div className="bg-[#FBF9F5] rounded-t-3xl border-t border-[rgba(23,59,48,0.12)] p-5 pb-8 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
            
            {/* Sheet Drag Indicator */}
            <div className="w-12 h-1 bg-[rgba(23,59,48,0.15)] rounded-full mx-auto mb-4" />

            {/* Header: User & Active Property Context */}
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(23,59,48,0.08)] mb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-[#173B30] text-[#F5F1E8] flex items-center justify-center font-bold text-sm shadow-md">
                  {ownerName ? ownerName.slice(0, 2).toUpperCase() : 'JM'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#171A18] font-editorial">
                    {ownerName || 'Pengelola Properti'}
                  </h4>
                  <p className="text-[11px] text-[#6E746F] flex items-center gap-1">
                    <Buildings weight="duotone" className="h-3 w-3 text-[#173B30]" />
                    <span>{selectedPropertyId === 'all' ? `Semua Properti (${properties.length})` : (activeProperty?.name || kostName)}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 rounded-full bg-zinc-200/60 hover:bg-zinc-200 flex items-center justify-center text-[#171A18] cursor-pointer"
              >
                <X weight="duotone" className="h-4 w-4" />
              </button>
            </div>

            {/* Grid of All Management Modules */}
            <div className="mb-4">
              <span className="text-[10px] font-bold text-[#A8B7A1] uppercase tracking-wider block mb-2 px-1">
                Modul Manajemen
              </span>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'bills', label: 'Tagihan', desc: 'Faktur & Piutang', icon: FileText },
                  { id: 'payments', label: 'Pembayaran', desc: 'Tagihan & Kas', icon: Receipt },
                  { id: 'expenses', label: 'Pengeluaran', desc: 'Biaya Operasional', icon: TrendDown },
                  { id: 'operations', label: 'Operasional', desc: 'Tiket & Service', icon: Wrench },
                  { id: 'complaints', label: 'Keluhan', desc: 'Keluhan Penghuni', icon: ShieldWarning },
                  { id: 'website', label: 'Website Publik', desc: 'Editor Landing', icon: Laptop },
                  { id: 'reports', label: 'Laporan', desc: 'Keuangan & Okupansi', icon: ChartBar },
                  { id: 'team', label: 'Tim & Staf', desc: 'Akses Petugas', icon: Shield },
                  { id: 'settings', label: 'Pengaturan', desc: 'Kamar & Rekening', icon: Gear },
                  ...(isSuperAdmin ? [{ id: 'super_admin', label: 'Master SaaS', desc: 'Kelola Tenant', icon: Crown }] : [])
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  const isLocked = lockedTabIds.includes(item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMobileTabSelect(item.id)}
                      className={`relative p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#173B30] text-[#F5F1E8] border-[#173B30] shadow-md'
                          : 'bg-white border-[rgba(23,59,48,0.08)] hover:border-[rgba(23,59,48,0.2)] text-[#171A18]'
                      }`}
                    >
                      {isLocked && (
                        <Lock weight="fill" className={`absolute top-2.5 right-2.5 h-3 w-3 ${isActive ? 'text-emerald-200' : 'text-[#A8B7A1]'}`} />
                      )}
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-[#F5F1E8] text-[#173B30]' : 'bg-[rgba(23,59,48,0.06)] text-[#173B30]'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{item.label}</p>
                        <p className={`text-[10px] truncate ${isActive ? 'text-emerald-200' : 'text-[#6E746F]'}`}>
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions & Links */}
            <div className="space-y-2 pt-2 border-t border-[rgba(23,59,48,0.08)]">
              {onViewGuestPortal && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onViewGuestPortal();
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl border border-[rgba(23,59,48,0.15)] bg-white hover:bg-[#F5F1E8] text-[#173B30] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Globe className="h-4 w-4 text-emerald-700" />
                  <span>Buka Website Publik Properti</span>
                  <ArrowUpRight weight="duotone" className="h-3 w-3 opacity-60" />
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <SignOut weight="duotone" className="h-4 w-4" />
                <span>Keluar dari Akun</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
