import React, { useState, useRef, useEffect } from 'react';
import { CalendarBlank, Plus, UserPlus, Coins, House, CaretDown, Buildings, Globe, Bell, CheckCircle, WarningCircle, X, ArrowUpRight } from '@phosphor-icons/react';
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
  unreadCount?: number;
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
  onViewGuestPortal,
  unreadCount = 3
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const propertyDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (propertyDropdownRef.current && !propertyDropdownRef.current.contains(event.target as Node)) {
        setPropertyDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
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
      case 'dashboard': return 'Ringkasan Hunian';
      case 'rooms': return 'Unit Kamar';
      case 'bookings': return 'Booking Masuk';
      case 'tenants': return 'Daftar Penghuni';
      case 'payments': return 'Pembayaran Sewa';
      case 'bills': return 'Faktur Tagihan';
      case 'operations': return 'Operasional & Servis';
      case 'website': return 'Website Publik';
      case 'expenses': return 'Pengeluaran';
      case 'reports': return 'Laporan Finansial';
      case 'team': return 'Manajemen Tim';
      case 'settings': return 'Pengaturan';
      default: return 'BISNIESGO Living';
    }
  };

  const menuActions = [
    { id: 'add-booking', label: 'Tambah Booking Baru', desc: 'Reservasi WhatsApp atau walk-in', icon: CalendarBlank },
    { id: 'add-tenant', label: 'Tambah Penghuni', desc: 'Registrasi penghuni baru', icon: UserPlus },
    { id: 'record-payment', label: 'Catat Pembayaran', desc: 'Konfirmasi transfer atau kas masuk', icon: Coins },
    { id: 'add-room', label: 'Tambah Unit Kamar', desc: 'Nomor, tipe, dan harga baru', icon: House },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#F5F1E8]/90 backdrop-blur-md border-b border-[rgba(23,59,48,0.08)] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between transition-all">
      
      {/* ─────────────────────────────────────────────────────────────
          1. LEFT: Mobile App User Profile & Tab Heading
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0 relative" ref={propertyDropdownRef}>
        
        {/* Mobile Profile Avatar & Greeting (Matches Screen 1 of Reference!) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-10 w-10 rounded-full bg-white border border-[rgba(23,59,48,0.15)] shadow-xs flex items-center justify-center text-sm font-bold text-[#173B30] overflow-hidden shrink-0">
            <span className="font-editorial text-base">
              {settings.ownerName ? settings.ownerName.slice(0, 1) : 'J'}
            </span>
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <h1 className="text-sm sm:text-base font-bold text-[#171A18] font-editorial truncate leading-tight">
              {settings.ownerName || 'John Malik'}
            </h1>
            
            {/* Mobile Property Switcher (Subtitle Style) */}
            <button
              onClick={() => setPropertyDropdownOpen(!propertyDropdownOpen)}
              className="sm:hidden flex items-center gap-1 text-[11px] font-medium text-[#6E746F] hover:text-[#173B30] transition-colors text-left mt-0.5 cursor-pointer max-w-[130px]"
            >
              <span className="truncate">
                {selectedPropertyId === 'all' 
                  ? `Semua Properti (${properties.length})` 
                  : (activeProperty?.name || 'Pilih Properti')}
              </span>
              <CaretDown weight="duotone" className="h-3 w-3 shrink-0" />
            </button>

            {/* Desktop Subtitle */}
            <p className="hidden sm:block text-[10px] text-[#6E746F] truncate mt-0.5">
              Property Manager
            </p>
          </div>
        </div>

        {/* Separator on larger screens */}
        <div className="hidden sm:block h-6 w-px bg-[rgba(23,59,48,0.12)] ml-2 shrink-0" />

        {/* Multi-Property Switcher Pill (Desktop Only) */}
        <div className="hidden sm:block">
          <button
            onClick={() => setPropertyDropdownOpen(!propertyDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[rgba(23,59,48,0.12)] bg-white/80 hover:bg-white text-[11px] font-bold text-[#173B30] transition-all cursor-pointer shadow-xs shrink-0"
          >
            <Buildings weight="duotone" className="h-3 w-3 text-emerald-800 shrink-0" />
            <span className="truncate max-w-[180px]">
              {selectedPropertyId === 'all' 
                ? `Semua Properti (${properties.length})` 
                : (activeProperty?.name || 'Pilih Properti')}
            </span>
            <CaretDown weight="duotone" className="h-3 w-3 text-[#6E746F] shrink-0" />
          </button>
        </div>

        {/* Shared Property Dropdown List */}
        {propertyDropdownOpen && (
          <div className="absolute top-full left-0 sm:left-auto sm:right-auto mt-4 sm:mt-2 w-64 bg-[#FBF9F5] rounded-2xl shadow-xl border border-[rgba(23,59,48,0.15)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <span className="text-[10px] font-bold text-[#A8B7A1] uppercase tracking-wider px-3 py-1.5 block">
              Pilih Properti
            </span>

            <button
              onClick={() => {
                onSelectPropertyId && onSelectPropertyId('all');
                setPropertyDropdownOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                selectedPropertyId === 'all' 
                  ? 'bg-[#173B30] text-[#F5F1E8]' 
                  : 'text-[#171A18] hover:bg-white'
              }`}
            >
              <span>Semua Properti Gabungan</span>
              <span className="text-[10px] opacity-80">{properties.length} Lokasi</span>
            </button>

            <div className="my-1 border-t border-[rgba(23,59,48,0.08)]" />

            {properties.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  onSelectPropertyId && onSelectPropertyId(p.id);
                  setPropertyDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  selectedPropertyId === p.id 
                    ? 'bg-[#173B30] text-[#F5F1E8]' 
                    : 'text-[#171A18] hover:bg-white'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{p.name}</p>
                  <p className="text-[10px] opacity-70">{p.type} • {p.city}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. RIGHT: Circular App Action Buttons (+) and (Bell)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        
        {/* Desktop Quick Link to Public Website */}
        {onViewGuestPortal && (
          <button
            onClick={onViewGuestPortal}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[rgba(23,59,48,0.15)] bg-white hover:bg-[#F5F1E8] text-[#173B30] text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-800" />
            <span>Lihat Website</span>
          </button>
        )}



        {/* Circular (Bell) Notifications Button (Matches Reference Image!) */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="h-9 w-9 rounded-full bg-white border border-[rgba(23,59,48,0.12)] text-[#173B30] hover:bg-zinc-50 flex items-center justify-center transition-all shadow-xs cursor-pointer relative active:scale-95"
            title="Notifikasi"
          >
            <Bell weight="duotone" className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#FBF9F5] rounded-2xl shadow-xl border border-[rgba(23,59,48,0.15)] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(23,59,48,0.08)]">
                <span className="text-xs font-bold text-[#171A18]">Notifikasi & Pengingat</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                  {unreadCount} Baru
                </span>
              </div>

              <div className="space-y-2 py-2 text-xs">
                <div className="p-2 rounded-xl bg-white border border-[rgba(23,59,48,0.06)] flex items-start gap-2">
                  <WarningCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold text-[#171A18] text-[11px]">Tagihan Jatuh Tempo</p>
                    <p className="text-[10px] text-[#6E746F]">3 penghuni belum membayar sewa bulan ini.</p>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white border border-[rgba(23,59,48,0.06)] flex items-start gap-2">
                  <CalendarBlank weight="duotone" className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold text-[#171A18] text-[11px]">Permintaan Booking</p>
                    <p className="text-[10px] text-[#6E746F]">Jessica A. memesan Studio A103.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setNotificationsOpen(false)}
                className="w-full py-1.5 text-center text-[10px] font-bold text-[#173B30] hover:underline cursor-pointer"
              >
                Tandai Sudah Dibaca
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
