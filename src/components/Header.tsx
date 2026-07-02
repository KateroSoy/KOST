import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Plus, UserPlus, Coins, Receipt, ArrowRightLeft, Home, MessageSquare, Menu, LogOut, Bell, ChevronDown } from 'lucide-react';
import { KostSettings } from '../types';

interface HeaderProps {
  settings: KostSettings;
  currentTab: string;
  onQuickAction: (action: string) => void;
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  onLogout: () => void;
  toggleMobileMenu?: () => void;
}

export function Header({ settings, currentTab, onQuickAction, selectedMonth, onChangeMonth, onLogout, toggleMobileMenu }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 11) return 'Selamat Pagi';
    if (hours < 15) return 'Selamat Siang';
    if (hours < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Dasbor Utama';
      case 'rooms': return 'Pengelolaan Kamar';
      case 'tenants': return 'Daftar Penghuni Kost';
      case 'bills': return 'Tagihan & Invoice sewa';
      case 'payments': return 'Catat Pembayaran Masuk';
      case 'expenses': return 'Arsip Pengeluaran Operasional';
      case 'complaints': return 'Komplain & Layanan Pelanggan';
      case 'reports': return 'Laporan Keuangan & Hunian';
      case 'settings': return 'Pengaturan & Konfigurasi';
      default: return 'Aplikasi Kostos';
    }
  };

  const menuActions = [
    { id: 'add-tenant', label: 'Tambah Penghuni Baru', desc: 'Registrasi penyewa & isi draf KTP', icon: UserPlus, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'record-payment', label: 'Catat Pembayaran Masuk', desc: 'Isi kas pembayaran sewa bulanan', icon: Coins, color: 'text-teal-600 bg-teal-50' },
    { id: 'create-bill', label: 'Buat Tagihan Bulanan', desc: 'Gabungkan sewa + penunjang listrik', icon: Receipt, color: 'text-amber-600 bg-amber-50' },
    { id: 'add-expense', label: 'Catat Pengeluaran Baru', desc: 'Isi biaya reparasi, token, air, dll', icon: ArrowRightLeft, color: 'text-rose-600 bg-rose-50' },
    { id: 'add-room', label: 'Tambah Kamar Kost', desc: 'Input nomor kamar & fasilitas', icon: Home, color: 'text-indigo-600 bg-slate-50' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100/80 px-3 sm:px-6 py-2.5 sm:py-3 shadow-xs transition-all duration-300">
      <div id="header-main-container" className="flex items-center justify-between gap-3 max-w-7xl mx-auto select-none">
        
        {/* Left Side: Welcomes & Tab Context */}
        <div className="space-y-0.5 min-w-0 flex-1 sm:flex-initial">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate max-w-[120px] sm:max-w-none">
              {getGreeting()}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-200"></span>
            <span className="text-[9px] sm:text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-mono truncate max-w-[100px] sm:max-w-none">
              {settings.kostName || 'KOSTOS'}
            </span>
          </div>
          <h1 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 tracking-tight leading-none truncate pr-1">
            {getTabTitle()}
          </h1>
        </div>

        {/* Right Side: Month Filter, Dropdowns & Quick Record Button */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Month Selector dropdown */}
          <div className="relative flex items-center">
            <div className="relative flex items-center bg-slate-50 hover:bg-slate-100/90 transition-all border border-slate-200/50 rounded-xl px-2.5 py-1.5 pr-7 text-[11px] sm:text-xs font-extrabold text-slate-600 cursor-pointer min-h-[36px] sm:min-h-[38px]">
              <Calendar className="h-3.5 w-3.5 text-slate-400 mr-1.5 shrink-0" />
              <select 
                value={selectedMonth}
                onChange={(e) => onChangeMonth(e.target.value)}
                className="bg-transparent border-none appearance-none outline-none font-extrabold cursor-pointer text-slate-800 text-[11px] sm:text-xs pr-1 focus:ring-0 active:scale-[0.98] transition-transform"
              >
                <option value="Mei 2026">Mei 25/26</option>
                <option value="Juni 2026">Juni 2026</option>
                <option value="Juli 2026">Juli 2026</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          </div>

          {/* Quick Plus Action Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="header-quick-action-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-teal-600 hover:bg-teal-700 active:scale-[0.97] text-white font-extrabold text-[11px] sm:text-xs rounded-xl shadow-sm shadow-teal-600/10 hover:shadow-md transition-all cursor-pointer min-h-[36px] sm:min-h-[38px]"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline">Catat Cepat</span>
              <ChevronDown className="h-3 w-3 opacity-85 shrink-0" />
            </button>

            {/* Quick action dropdown */}
            {dropdownOpen && (
              <div 
                id="header-quick-action-dropdown"
                className="absolute right-0 mt-2.5 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="p-3 bg-slate-50/80 border-b border-slate-100/80 flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Operasional Cepat</span>
                  <span className="text-[9px] bg-teal-100/70 text-teal-800 px-2 py-0.5 rounded-full font-extrabold">Instant</span>
                </div>
                
                <div className="p-1.5 space-y-0.5">
                  {menuActions.map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.id}
                        onClick={() => {
                          onQuickAction(act.id);
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-xl hover:bg-slate-50/80 active:bg-slate-100/50 transition-all flex items-start gap-3 cursor-pointer group"
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${act.color} transition-colors`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="translate-y-[-1px] min-w-0">
                          <p className="text-xs font-extrabold text-slate-800 group-hover:text-teal-600 transition-colors truncate">{act.label}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1 truncate">{act.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2 border-t border-slate-100/80 bg-slate-50/50 text-center">
                  <button 
                    onClick={onLogout}
                    className="text-[10px] text-rose-500 hover:text-rose-700 active:scale-[0.98] font-extrabold flex items-center justify-center gap-1.5 mx-auto cursor-pointer py-1 w-full rounded-lg hover:bg-rose-50/50 transition-all"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Keluar dari Aplikasi
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Small Device Menu Shortcut to logout */}
          <button
            onClick={onLogout}
            title="Keluar"
            className="xs:hidden p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

      </div>
    </header>
  );
}
