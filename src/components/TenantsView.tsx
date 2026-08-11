import React, { useState } from 'react';
import { Search, Plus, UserCheck, Phone, Mail, Image, Calendar, Trash, Users, MessageSquare, ShieldAlert, X, CreditCard, ChevronRight, Moon, Sparkles, CheckCircle2, LogOut } from 'lucide-react';
import { Tenant, Room, TenantStatus, RoomStatus } from '../types';

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
      id: `guest-${Date.now()}`,
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
      status: 'Lunas',
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
      
      {/* 1. UPPER CONTROLS & GUEST TYPE FILTER */}
      <section className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari nama tamu, nomor WA, atau nomor kamar sewa..."
            className="w-full bg-slate-50 text-xs pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setGuestTypeFilter('Semua')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                guestTypeFilter === 'Semua' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({tenants.length})
            </button>
            <button
              onClick={() => setGuestTypeFilter('Harian')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                guestTypeFilter === 'Harian' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌙 Tamu Harian ({tenants.filter(t => t.guestType === 'Harian').length})
            </button>
            <button
              onClick={() => setGuestTypeFilter('Bulanan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                guestTypeFilter === 'Bulanan' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 Bulanan ({tenants.filter(t => t.guestType === 'Bulanan' || !t.guestType).length})
            </button>
          </div>

          <button
            onClick={() => {
              setShowAddForm(true);
              onSelectTenantId(null);
            }}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" /> Check-In Tamu
          </button>
        </div>
      </section>

      {/* 2. TENANT / GUEST DETAIL MODAL */}
      {activeTenantDetail && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center font-black text-sm">
                  {activeTenantDetail.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-base">{activeTenantDetail.name}</h3>
                  <span className="text-[10px] text-teal-300 font-bold">Kamar {activeTenantDetail.roomAssigned} • Stay {activeTenantDetail.guestType || 'Bulanan'}</span>
                </div>
              </div>
              <button 
                onClick={() => onSelectTenantId(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Card info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Durasi Staying</span>
                  <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {activeTenantDetail.guestType || 'Bulanan'}
                  </span>
                </div>
                <p className="font-bold text-slate-800">
                  Check-In: {activeTenantDetail.checkInDate || activeTenantDetail.moveInDate}
                  {activeTenantDetail.checkOutDate && ` s/d ${activeTenantDetail.checkOutDate}`}
                </p>
                <p className="font-black text-teal-700 text-sm">Total Biaya: {formatIDR(activeTenantDetail.rentAmount)}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Informasi Kontak & Identitas</h4>
                <p className="text-slate-700">📞 No. WhatsApp: <strong>{activeTenantDetail.phone}</strong></p>
                <p className="text-slate-700">💳 No. KTP / Identitas: <strong>{activeTenantDetail.idNumber || '-'}</strong></p>
                {activeTenantDetail.vehicleNumber && <p className="text-slate-700">🚗 Kendaraan: <strong>{activeTenantDetail.vehicleNumber}</strong></p>}
                <p className="text-slate-700">👥 Jumlah Tamu: <strong>{activeTenantDetail.totalGuests || 1} Orang</strong></p>
              </div>

              {/* Action WhatsApp */}
              <a
                href={`https://wa.me/${activeTenantDetail.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Kirim Pesan WhatsApp</span>
              </a>
            </div>

            {/* Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Proses Check-Out untuk ${activeTenantDetail.name}? Kamar ${activeTenantDetail.roomAssigned} akan otomatis ditandai Kosong dan Kotor untuk dibersihkan.`)) {
                    onMoveOutTenant(activeTenantDetail.id, activeTenantDetail.roomAssigned);
                    onSelectTenantId(null);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Proses Check-Out Instan</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTenantId(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. ADD GUEST FORM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Check-In Tamu / Registrasi Penghuni</span>
              </div>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded-full text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl font-bold">
                  ⚠️ {formError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipe Sewa *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGuestType('Harian')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                      guestType === 'Harian' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🌙 Menginap Harian
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuestType('Bulanan')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                      guestType === 'Bulanan' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    📅 Sewa Bulanan
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Kamar Ready *</label>
                <select
                  required
                  value={tenantRoomNo}
                  onChange={(e) => setTenantRoomNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                >
                  <option value="">-- Pilih Kamar --</option>
                  {emptyRooms.map(r => (
                    <option key={r.id} value={r.number}>
                      Kamar {r.number} ({r.type}) - Rp {(r.pricePerDay || 180000).toLocaleString('id-ID')}/mlm
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Tamu *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bpk. Rizky"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="0812xxxxxxxx"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Check-In</label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                {guestType === 'Harian' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Check-Out</label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Simpan Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CARDS GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.map((ten) => {
          const isHarian = ten.guestType === 'Harian';

          return (
            <div 
              key={ten.id}
              className="bg-white rounded-3xl border border-slate-200 hover:border-teal-400 p-5 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-2xl font-black text-white text-xs flex items-center justify-center shadow-md ${
                      isHarian ? 'bg-indigo-600' : 'bg-emerald-600'
                    }`}>
                      {ten.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 truncate max-w-[140px]">{ten.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400">
                        {isHarian ? `🌙 Stay Harian` : `📅 Sewa Bulanan`}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                    isHarian ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                  }`}>
                    Kmr {ten.roomAssigned}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] space-y-1.5 text-slate-600 font-medium">
                  <p className="flex justify-between">
                    <span className="text-slate-400">Check-In:</span> 
                    <strong className="text-slate-800">{ten.checkInDate || ten.moveInDate}</strong>
                  </p>
                  {ten.checkOutDate && (
                    <p className="flex justify-between">
                      <span className="text-slate-400">Check-Out:</span> 
                      <strong className="text-indigo-700">{ten.checkOutDate}</strong>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span className="text-slate-400">Total Tarif:</span> 
                    <strong className="text-teal-700 font-black">{formatIDR(ten.rentAmount)}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">No. WA:</span> 
                    <strong className="text-slate-800">{ten.phone}</strong>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm(`Check-Out ${ten.name} dari Kamar ${ten.roomAssigned}? Kamar akan berstatus Kotor.`)) {
                      onMoveOutTenant(ten.id, ten.roomAssigned);
                    }
                  }}
                  className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="h-3.5 w-3.5" /> Check-Out
                </button>

                <button
                  onClick={() => onSelectTenantId(ten.id)}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-xl text-center cursor-pointer"
                >
                  Profil & WA
                </button>
              </div>

            </div>
          );
        })}
      </section>

    </div>
  );
}
