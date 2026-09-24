import React, { useState } from 'react';
import { MagnifyingGlass, Plus, UserCheck, Phone, EnvelopeSimple, Image, CalendarBlank, Trash, Users, ChatTeardropText, ShieldWarning, X, CreditCard, CaretRight, Moon, CheckCircle, SignOut } from '@phosphor-icons/react';
import { Tenant, Room, TenantStatus, RoomStatus } from '../types';
import { ElegantSelect } from './ElegantSelect';
import { generateId } from '../utils';

interface TenantsViewProps {
  tenants: Tenant[];
  rooms: Room[];
  selectedTenantId: string | null;
  onSelectTenantId: (id: string | null) => void;
  onAddTenant: (newTenant: Tenant, assignedRoomId: string) => void;
  onMoveOutTenant: (tenantId: string, roomNumber: string) => void;
  onDeleteTenant: (id: string) => void;
  onNavigateToTab: (tab: string, arg?: string) => void;
}

export function TenantsView({
  tenants, rooms, selectedTenantId, onSelectTenantId,
  onAddTenant, onMoveOutTenant, onDeleteTenant, onNavigateToTab
}: TenantsViewProps) {
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [guestTypeFilter, setGuestTypeFilter] = useState<string>('Semua');

  // Add Tenant Form State
  const [guestType, setGuestType] = useState<'Harian' | 'Bulanan'>('Harian');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantIdNumber, setTenantIdNumber] = useState('');
  const [tenantRoomNo, setTenantRoomNo] = useState('');
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [tenantDeposit, setTenantDeposit] = useState(100000);
  const [totalGuests, setTotalGuests] = useState(1);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [tenantNotes, setTenantNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Empty rooms
  const emptyRooms = rooms.filter(r => r.status === 'Kosong' || r.status === 'Booking');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantPhone || !tenantRoomNo) {
      setFormError('Nama lengkap, nomor WhatsApp, dan kamar wajib diisi!');
      return;
    }

    const selectedRoomDetails = rooms.find(r => r.number === tenantRoomNo || r.id === tenantRoomNo);
    if (!selectedRoomDetails) {
      setFormError('Data kamar tidak ditemukan.');
      return;
    }

    const nights = Math.max(1, Math.ceil(Math.abs(new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
    const calculatedRent = guestType === 'Harian' 
      ? (selectedRoomDetails.pricePerDay || 180000) * nights 
      : (selectedRoomDetails.pricePerMonth || selectedRoomDetails.price);

    const newTenant: Tenant = {
      id: generateId('guest'),
      name: tenantName,
      phone: tenantPhone,
      email: tenantEmail || `${tenantName.toLowerCase().replace(/\s+/g, '')}@guest.com`,
      idNumber: tenantIdNumber || `KTP-${Date.now()}`,
      guestType: guestType,
      roomAssigned: selectedRoomDetails.number,
      moveInDate: checkInDate,
      checkInDate: checkInDate,
      checkOutDate: guestType === 'Harian' ? checkOutDate : undefined,
      rentAmount: calculatedRent,
      deposit: tenantDeposit,
      totalGuests: totalGuests,
      vehicleNumber: vehicleNumber || undefined,
      status: 'Belum Bayar',
      notes: tenantNotes,
      emergencyContact: {
        name: 'Kerabat',
        relation: 'Keluarga',
        phone: tenantPhone
      }
    };

    onAddTenant(newTenant, selectedRoomDetails.id);

    // Reset
    setTenantName('');
    setTenantPhone('');
    setTenantEmail('');
    setTenantIdNumber('');
    setTenantRoomNo('');
    setTenantDeposit(100000);
    setVehicleNumber('');
    setTenantNotes('');
    setFormError('');
    setShowAddForm(false);
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.phone.includes(searchQuery) ||
                          t.roomAssigned.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (guestTypeFilter === 'Semua') return matchesSearch;
    if (guestTypeFilter === 'Harian') return matchesSearch && t.guestType === 'Harian';
    if (guestTypeFilter === 'Bulanan') return matchesSearch && (t.guestType === 'Bulanan' || !t.guestType);
    return matchesSearch;
  });

  const activeTenantDetail = tenants.find(t => t.id === selectedTenantId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#171A18] font-editorial tracking-tight">
            Penghuni
          </h2>
        </div>

        <button
          onClick={() => {
            setShowAddForm(true);
            onSelectTenantId(null);
          }}
          className="px-4 py-2.5 rounded-full bg-[#173B30] text-[#F5F1E8] hover:bg-[#0f2720] transition-all flex items-center justify-center cursor-pointer shadow-md shadow-[#173b30]/20 text-xs whitespace-nowrap shrink-0 font-bold">
          Tambah Penghuni
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col gap-3">
        
        {/* MagnifyingGlass */}
        <div className="relative w-full">
          <MagnifyingGlass weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E746F]" />
          <input
            type="text"
            placeholder="Cari penghuni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl text-sm text-[#171A18] placeholder-[#6E746F] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#173B30] transition-all"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          {['Semua', 'Harian', 'Bulanan'].map((type) => {
            let count = tenants.length;
            if (type === 'Harian') count = tenants.filter(t => t.guestType === 'Harian').length;
            if (type === 'Bulanan') count = tenants.filter(t => t.guestType === 'Bulanan' || !t.guestType).length;

            return (
              <button
                key={type}
                onClick={() => setGuestTypeFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shadow-sm ${
                  guestTypeFilter === type
                    ? 'bg-[#173B30] text-white shadow-md shadow-[#173b30]/20'
                    : 'bg-white text-[#6E746F] hover:text-[#171A18]'
                }`}
              >
                {type} <span className="opacity-60 ml-1">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TENANT / GUEST DETAIL MODAL */}
      {activeTenantDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-[#FBF9F5] sm:rounded-3xl rounded-t-3xl max-w-md w-full p-6 shadow-2xl space-y-6 slide-up-animation max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[#173B30] text-white flex items-center justify-center font-black text-lg">
                  {activeTenantDetail.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#171A18] leading-tight">{activeTenantDetail.name}</h3>
                  <span className="text-xs text-[#6E746F] font-medium">Kamar {activeTenantDetail.roomAssigned} • {activeTenantDetail.guestType || 'Bulanan'}</span>
                </div>
              </div>
              <button 
                onClick={() => onSelectTenantId(null)}
                className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#6E746F] shadow-sm"
              >
                <X weight="duotone" className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-white p-4 rounded-3xl shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#6E746F] uppercase">Stay</span>
                  <span className="bg-[#F5F1E8] text-[#173B30] text-xs font-bold px-3 py-1 rounded-full">
                    {activeTenantDetail.guestType || 'Bulanan'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-[#6E746F] font-medium">Periode</p>
                  <p className="font-bold text-[#171A18] mt-0.5">
                    {activeTenantDetail.checkInDate || activeTenantDetail.moveInDate}
                    {activeTenantDetail.checkOutDate && ` — ${activeTenantDetail.checkOutDate}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6E746F] font-medium">Total Tarif</p>
                  <p className="font-extrabold text-[#173B30] text-lg mt-0.5">{formatIDR(activeTenantDetail.rentAmount)}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl shadow-sm space-y-3">
                <h4 className="font-bold text-[#171A18] uppercase text-[10px] tracking-wider mb-2">Informasi Kontak</h4>
                
                <div className="flex justify-between items-center">
                  <span className="text-[#6E746F]">WhatsApp</span>
                  <strong className="text-[#171A18]">{activeTenantDetail.phone}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6E746F]">KTP</span>
                  <strong className="text-[#171A18]">{activeTenantDetail.idNumber || '-'}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6E746F]">Tamu</span>
                  <strong className="text-[#171A18]">{activeTenantDetail.totalGuests || 1} Orang</strong>
                </div>
              </div>

              {/* Action WhatsApp */}
              <a
                href={`https://wa.me/${activeTenantDetail.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <ChatTeardropText weight="duotone" className="h-5 w-5" />
                <span>Chat WhatsApp</span>
              </a>
            </div>

            {/* Controls */}
            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Proses Check-Out untuk ${activeTenantDetail.name}? Kamar ${activeTenantDetail.roomAssigned} akan otomatis ditandai Kosong dan Kotor untuk dibersihkan.`)) {
                    onMoveOutTenant(activeTenantDetail.id, activeTenantDetail.roomAssigned);
                    onSelectTenantId(null);
                  }
                }}
                className="w-full px-4 py-4 bg-white text-rose-700 font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2"
              >
                <SignOut weight="duotone" className="h-4 w-4" />
                <span>Check-Out Penghuni</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. ADD GUEST FORM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-[#171A18]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-[rgba(23,59,48,0.15)] shadow-2xl overflow-hidden">
            <div className="p-5 bg-[#173B30] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Check-In Tamu / Registrasi Penghuni</span>
              </div>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded-full text-[#6E746F] hover:text-white">
                <X weight="duotone" className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl font-bold">
                  ⚠️ {formError}
                </div>
              )}

              <div>
                <label className="block font-bold text-[#171A18] mb-1">Tipe Sewa *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGuestType('Harian')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                      guestType === 'Harian' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-[#171A18] border-[rgba(23,59,48,0.15)]'
                    }`}
                  >
                    🌙 Menginap Harian
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuestType('Bulanan')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                      guestType === 'Bulanan' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-[#171A18] border-[rgba(23,59,48,0.15)]'
                    }`}
                  >
                    📅 Sewa Bulanan
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#171A18] mb-1">Pilih Kamar Ready *</label>
                <ElegantSelect
                  value={tenantRoomNo}
                  onChange={(val) => setTenantRoomNo(val)}
                  placeholder="-- Pilih Kamar --"
                  options={emptyRooms.map(r => ({
                    value: r.number,
                    label: `Kamar ${r.number} (${r.type}) - Rp ${(
                      guestType === 'Harian'
                        ? (r.pricePerDay || Math.round((r.pricePerMonth || r.price || 0) / 25))
                        : (r.pricePerMonth || r.price || 0)
                    ).toLocaleString('id-ID')}/${guestType === 'Harian' ? 'mlm' : 'bln'}`
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Nama Lengkap Tamu *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bpk. Rizky"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">No. WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="0812xxxxxxxx"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Tanggal Check-In</label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                {guestType === 'Harian' && (
                  <div>
                    <label className="block font-bold text-[#171A18] mb-1">Tanggal Check-Out</label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3 py-2 font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[rgba(23,59,48,0.15)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-[#FBF9F5] text-[#171A18] font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#173B30] text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Simpan Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CARDS GRID */}
      <section className="grid grid-cols-1 gap-4 pb-10">
        {filteredTenants.map((ten) => {
          const isHarian = ten.guestType === 'Harian';

          return (
            <div 
              key={ten.id}
              onClick={() => onSelectTenantId(ten.id)}
              className="bg-white p-4 rounded-[28px] shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl font-black text-[#173B30] text-xl flex items-center justify-center ${
                  isHarian ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {ten.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#171A18] truncate max-w-[160px]">{ten.name}</h4>
                  <p className="text-xs font-medium text-[#6E746F] flex items-center gap-1 mt-0.5">
                    Kamar {ten.roomAssigned} • {isHarian ? 'Harian' : 'Bulanan'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

    </div>
  );
}
