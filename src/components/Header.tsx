import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Plus, UserPlus, Coins, Receipt, ArrowRightLeft, Home, LogOut, ChevronDown, Sparkles, Building, Layers, Check, Globe } from 'lucide-react';
import { KostSettings, Property } from '../types';

interface HeaderProps {
  settings: KostSettings;
  currentTab: string;
  onQuickAction: (action: string) => void;
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  onLogout: () => void;
  properties?: Property[];
  selectedPropertyId?: string;
  onSelectPropertyId?: (id: string) => void;
  onAddPropertyClick?: () => void;
  onViewGuestPortal?: () => void;
  toggleMobileMenu?: () => void;
}

export function Header({ 
  settings, 
  currentTab, 
  onQuickAction, 
  selectedMonth, 
  onChangeMonth, 
  onLogout,
  properties = [],
  selectedPropertyId = 'all',
  onSelectPropertyId,
  onAddPropertyClick,
  onViewGuestPortal
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const propertyDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (propertyDropdownRef.current && !propertyDropdownRef.current.contains(event.target as Node)) {
        setPropertyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeProperty = properties.find(p => p.id === selectedPropertyId);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 11) return 'Selamat Pagi';
    if (hours < 15) return 'Selamat Siang';
    if (hours < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Dasbor Penginapan & Availability Grid';
      case 'rooms': return 'Pengelolaan Kamar & Tarif Stay';
      case 'tenants': return 'Daftar Tamu Harian & Penghuni Bulanan';
      case 'bills': return 'Tagihan, Invoice & QRIS Payment';
      case 'payments': return 'Catat Pembayaran Masuk';
      case 'expenses': return 'Arsip Pengeluaran Operasional';
      case 'complaints': return 'Komplain & Layanan Housekeeping';
      case 'reports': return 'Laporan Keuangan & Pendapatan';
      case 'settings': return 'Pengaturan Properti Penginapan';
      default: return 'StayFlow Platform';
    }
  };

  const menuActions = [
    { id: 'add-tenant', label: 'Check-In Tamu / Penghuni', desc: 'Registrasi sewa harian & bulanan', icon: UserPlus, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'record-payment', label: 'Catat Pembayaran QRIS', desc: 'Terima bayar kas / transfer / QRIS', icon: Coins, color: 'text-teal-600 bg-teal-50' },
    { id: 'create-bill', label: 'Buat Invoice Tagihan', desc: 'Sewa harian atau tagihan bulanan', icon: Receipt, color: 'text-amber-600 bg-amber-50' },
    { id: 'add-expense', label: 'Catat Pengeluaran Operasional', desc: 'Beli token, laundry sprei, reparasi', icon: ArrowRightLeft, color: 'text-rose-600 bg-rose-50' },
    { id: 'add-room', label: 'Tambah & Kelola Kamar', desc: 'Atur tarif harian, bulanan & fasilitas', icon: Home, color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3 shadow-xs">
      <div id="header-main-container" className="flex items-center justify-between gap-3 max-w-7xl mx-auto select-none">
        
        {/* Left Side: Welcomes & Tab Context */}
        <div className="space-y-0.5 min-w-0 flex-1 sm:flex-initial">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate">
              {getGreeting()}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            
            {/* MULTI-PROPERTY SWITCHER PILL */}
            <div className="relative" ref={propertyDropdownRef}>
              <button
                type="button"
                onClick={() => setPropertyDropdownOpen(!propertyDropdownOpen)}
                className="text-[9px] sm:text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Building className="h-3 w-3 text-teal-600 shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-[220px]">
                  {selectedPropertyId === 'all' ? `Semua Penginapan (${properties.length})` : (activeProperty?.name || settings.kostName)}
                </span>
                <ChevronDown className="h-3 w-3 text-teal-500 shrink-0" />
              </button>

              {/* Property Selector Dropdown */}
              {propertyDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider">Penginapan Account</p>
                      <p className="text-xs font-bold truncate">Pilih Unit Penginapan / Cabang</p>
                    </div>
                    <span className="text-[9px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-bold border border-teal-500/30">
                      {properties.length} Unit
                    </span>
                  </div>

                  <div className="p-1.5 max-h-64 overflow-y-auto space-y-1">
                    {/* Option All */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPropertyId?.('all');
                        setPropertyDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        selectedPropertyId === 'all' 
                          ? 'bg-teal-50 text-teal-900 border border-teal-200' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                          <Layers className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-black">Semua Penginapan</p>
                          <p className="text-[9px] text-slate-400 font-medium">Dasbor gabungan seluruh unit</p>
                        </div>
                      </div>
                      {selectedPropertyId === 'all' && <Check className="h-4 w-4 text-teal-600 shrink-0" />}
                    </button>

                    {/* Property list */}
                    {properties.map(p => {
                      const isSel = selectedPropertyId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            onSelectPropertyId?.(p.id);
                            setPropertyDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                            isSel 
                              ? 'bg-teal-50 text-teal-900 border border-teal-200 font-bold' 
                              : 'text-slate-700 hover:bg-slate-50 font-semibold'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                              <Building className="h-3.5 w-3.5 text-teal-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate font-extrabold text-slate-900">{p.name}</p>
                                <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">{p.type}</span>
                              </div>
                              <p className="text-[9px] text-slate-400 truncate">{p.address}</p>
                            </div>
                          </div>
                          {isSel && <Check className="h-4 w-4 text-teal-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onAddPropertyClick?.();
                        setPropertyDropdownOpen(false);
                      }}
                      className="text-[10px] text-teal-700 hover:text-teal-800 font-black flex items-center gap-1 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-teal-100/50 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" /> + Tambah Penginapan
                    </button>

                    {onViewGuestPortal && (
                      <button
                        type="button"
                        onClick={() => {
                          onViewGuestPortal();
                          setPropertyDropdownOpen(false);
                        }}
                        className="text-[10px] text-emerald-700 hover:text-emerald-800 font-black flex items-center gap-1 cursor-pointer py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-all"
                      >
                        <Globe className="h-3.5 w-3.5 text-emerald-600" /> Landing Guest
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
          <h1 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 tracking-tight leading-none truncate">
            {getTabTitle()}
          </h1>
        </div>

        {/* Right Side: Month Filter, Dropdowns & Quick Action Button */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* View Guest Portal Quick Button */}
          {onViewGuestPortal && (
            <button
              onClick={onViewGuestPortal}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Globe className="h-3.5 w-3.5 text-emerald-600" />
              <span>Beranda Calon Penginap</span>
            </button>
          )}

          {/* Month Selector dropdown */}
          <div className="relative flex items-center">
            <div className="relative flex items-center bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200/80 rounded-xl px-2.5 py-1.5 pr-7 text-[11px] sm:text-xs font-extrabold text-slate-700 cursor-pointer min-h-[36px] sm:min-h-[38px]">
              <Calendar className="h-3.5 w-3.5 text-slate-400 mr-1.5 shrink-0" />
              <select 
                value={selectedMonth}
                onChange={(e) => onChangeMonth(e.target.value)}
                className="bg-transparent border-none appearance-none outline-none font-extrabold cursor-pointer text-slate-800 text-[11px] sm:text-xs pr-1 focus:ring-0"
              >
                {(() => {
                  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                  const now = new Date();
                  const options = [];
                  for (let i = -2; i <= 3; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
                    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
                    options.push(<option key={label} value={label}>{label}</option>);
                  }
                  return options;
                })()}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          </div>

          {/* Quick Plus Action Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="header-quick-action-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.97] text-white font-extrabold text-[11px] sm:text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer min-h-[36px] sm:min-h-[38px]"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline">Aksi Cepat</span>
              <ChevronDown className="h-3 w-3 opacity-85 shrink-0" />
            </button>

            {/* Quick action dropdown */}
            {dropdownOpen && (
              <div 
                id="header-quick-action-dropdown"
                className="absolute right-0 mt-2.5 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Aksi Operasional</span>
                  <span className="text-[9px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">Penginapan</span>
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
                        className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition-all flex items-start gap-3 cursor-pointer group"
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${act.color} transition-colors`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="translate-y-[-1px] min-w-0">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-teal-600 transition-colors truncate">{act.label}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 truncate">{act.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                  <button 
                    onClick={onLogout}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-extrabold flex items-center justify-center gap-1.5 mx-auto cursor-pointer py-1.5 w-full rounded-lg hover:bg-rose-50 transition-all"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Keluar Aplikasi
                  </button>
                </div>
              </div>
            )}
          </div>
          
        </div>

      </div>
    </header>
  );
}

