import React, { useState } from 'react';
import { Search, Plus, Filter, Tag, Check, CheckCircle2, AlertTriangle, Users, Hammer, ListCollapse, X, Trash2, Edit3, ArrowUpRight, Sparkles, RefreshCw, Eye, Wind, Wifi, Tv } from 'lucide-react';
import { Room, Tenant, Bill, RoomStatus, RoomType, HousekeepingStatus } from '../types';

interface RoomsViewProps {
  rooms: Room[];
  tenants: Tenant[];
  bills: Bill[];
  selectedRoomId: string | null;
  onSelectRoomId: (id: string | null) => void;
  onAddRoom: (newRoom: Room) => void;
  onUpdateRoomStatus: (id: string, status: RoomStatus, tenantId?: string) => void;
  onDeleteRoom: (id: string) => void;
  onNavigateToTab: (tab: string, arg?: string) => void;
  onUpdateHousekeepingStatus?: (id: string, hkStatus: HousekeepingStatus) => void;
}

export function RoomsView({ 
  rooms, tenants, bills, selectedRoomId, onSelectRoomId, 
  onAddRoom, onUpdateRoomStatus, onDeleteRoom, onNavigateToTab, onUpdateHousekeepingStatus 
}: RoomsViewProps) {
  
  // Views states
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [housekeepingFilter, setHousekeepingFilter] = useState<string>('Semua');

  // Add Room form states
  const [roomNo, setRoomNo] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('Standard');
  const [roomFloor, setRoomFloor] = useState(1);
  const [pricePerDay, setPricePerDay] = useState(180000);
  const [pricePerMonth, setPricePerMonth] = useState(1500000);
  const [roomSize, setRoomSize] = useState('3x3 m');
  const [roomNotes, setRoomNotes] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(['AC', 'WiFi', 'Kamar Mandi Dalam', 'Kasur Queen']);
  const [formError, setFormError] = useState('');

  // Predefined facilities lists
  const AVAILABLE_FACILITIES = [
    'AC', 'WiFi', 'Kamar Mandi Dalam', 'Kamar Mandi Luar', 'Kasur Single', 'Kasur Queen', 
    'Lemari Baju', 'Water Heater', 'Smart TV 32"', 'Meja Kerja', 'Kulkas Mini', 'Balkon'
  ];

  const handleFacilityToggle = (facility: string) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities(selectedFacilities.filter(f => f !== facility));
    } else {
      setSelectedFacilities([...selectedFacilities, facility]);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNo) {
      setFormError('Nomor kamar wajib diisi!');
      return;
    }
    // Check if room number already exists
    if (rooms.some(r => r.number.toLowerCase() === roomNo.trim().toLowerCase())) {
      setFormError('Nomor kamar ini sudah terdaftar!');
      return;
    }

    const newRoom: Room = {
      id: `room-${Date.now()}`,
      number: roomNo.toUpperCase(),
      status: 'Kosong',
      type: roomType,
      price: pricePerMonth,
      pricePerDay: pricePerDay,
      pricePerMonth: pricePerMonth,
      housekeepingStatus: 'Bersih',
      rentalTypesAllowed: ['Harian', 'Bulanan'],
      floor: Number(roomFloor),
      size: roomSize,
      facilities: selectedFacilities,
      notes: roomNotes,
      images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80']
    };

    onAddRoom(newRoom);
    
    // Reset states
    setRoomNo('');
    setRoomType('Standard');
    setRoomFloor(1);
    setPricePerDay(180000);
    setPricePerMonth(1500000);
    setRoomSize('3x3 m');
    setRoomNotes('');
    setFormError('');
    setShowAddForm(false);
  };

  // Helper formatting currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Filter and search logic
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          room.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'Semua' || room.status === statusFilter;
    const matchesHK = housekeepingFilter === 'Semua' || room.housekeepingStatus === housekeepingFilter;

    return matchesSearch && matchesStatus && matchesHK;
  });

  // Selected Room Details
  const activeDetailRoom = rooms.find(r => r.id === selectedRoomId);
  const roomTenant = activeDetailRoom && activeDetailRoom.tenantId 
    ? tenants.find(t => t.id === activeDetailRoom.tenantId) 
    : null;

  const roomPaymentHistory = activeDetailRoom 
    ? bills.filter(b => b.roomId === activeDetailRoom.id && b.status === 'Lunas') 
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. SEARCH BAR & FILTERS */}
      <section className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari nomor kamar atau tipe (Standard, Deluxe, VIP...)"
            className="w-full bg-slate-50 text-xs pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter status */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['Semua', 'Kosong', 'Terisi', 'Booking', 'Perbaikan'].map((status) => {
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-teal-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status} ({status === 'Semua' ? rooms.length : rooms.filter(r => r.status === status).length})
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden md:block"></div>

          {/* Housekeeping filter */}
          <select
            value={housekeepingFilter}
            onChange={(e) => setHousekeepingFilter(e.target.value)}
            className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="Semua">Housekeeping: Semua</option>
            <option value="Bersih">✨ Bersih Steril</option>
            <option value="Kotor">⚠️ Kotor Perlu Dibersihkan</option>
            <option value="Dibersihkan">🧹 Pembersihan</option>
          </select>

          {/* Add Button */}
          <button
            onClick={() => {
              setShowAddForm(true);
              onSelectRoomId(null);
            }}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/15 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Tambah Kamar Baru
          </button>
        </div>
      </section>

      {/* 2. ROOM DETAIL & HOUSEKEEPING MODAL OVERLAY */}
      {activeDetailRoom && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-xl bg-teal-500 flex items-center justify-center font-black text-sm text-slate-950">
                  {activeDetailRoom.number}
                </span>
                <div>
                  <span className="font-extrabold text-base block">Kamar {activeDetailRoom.number} ({activeDetailRoom.type})</span>
                  <span className="text-[10px] text-teal-300">Lantai {activeDetailRoom.floor} • Dimensi {activeDetailRoom.size}</span>
                </div>
              </div>
              <button 
                onClick={() => onSelectRoomId(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scroll Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Housekeeping Control Bar */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">Status Kebersihan Kamar</span>
                  <p className="text-sm font-bold flex items-center gap-2 mt-0.5">
                    {activeDetailRoom.housekeepingStatus === 'Bersih' && <span className="text-emerald-400">✨ Bersih Steril (Siap Check-In)</span>}
                    {activeDetailRoom.housekeepingStatus === 'Kotor' && <span className="text-amber-400">⚠️ Kotor (Perlu Dibersihkan Housekeeping)</span>}
                    {activeDetailRoom.housekeepingStatus === 'Dibersihkan' && <span className="text-cyan-400">🧹 Sedang Dalam Proses Pembersihan</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activeDetailRoom.housekeepingStatus !== 'Bersih' && (
                    <button
                      onClick={() => {
                        if (onUpdateHousekeepingStatus) onUpdateHousekeepingStatus(activeDetailRoom.id, 'Bersih');
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer"
                    >
                      ✓ Tandai Bersih
                    </button>
                  )}
                  {activeDetailRoom.housekeepingStatus !== 'Kotor' && (
                    <button
                      onClick={() => {
                        if (onUpdateHousekeepingStatus) onUpdateHousekeepingStatus(activeDetailRoom.id, 'Kotor');
                      }}
                      className="px-3 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold text-xs rounded-xl border border-amber-500/40 cursor-pointer"
                    >
                      ⚠️ Tandai Kotor
                    </button>
                  )}
                </div>
              </div>

              {/* Dual Rate Breakdown */}
              <div className="grid grid-cols-2 gap-4 bg-teal-50/70 p-4 rounded-2xl border border-teal-100">
                <div>
                  <span className="text-[10px] text-teal-800 uppercase font-bold block">Tarif Sewa Harian</span>
                  <span className="text-xl font-black text-teal-900">
                    {formatIDR(activeDetailRoom.pricePerDay || 180000)}
                  </span>
                  <span className="text-[10px] text-teal-700"> /malam</span>
                </div>
                <div>
                  <span className="text-[10px] text-teal-800 uppercase font-bold block">Tarif Sewa Bulanan</span>
                  <span className="text-xl font-black text-emerald-900">
                    {formatIDR(activeDetailRoom.pricePerMonth || activeDetailRoom.price)}
                  </span>
                  <span className="text-[10px] text-teal-700"> /bulan</span>
                </div>
              </div>

              {/* Facilities list */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Fasilitas Kamar</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(activeDetailRoom.facilities || []).map((fac, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-xl">
                      ✓ {fac}
                    </span>
                  ))}
                </div>
              </div>

              {/* Occupant Info */}
              {roomTenant ? (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Penghuni / Guest Aktif</h4>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                      Tipe: {roomTenant.guestType || 'Bulanan'}
                    </span>
                  </div>
                  <p className="text-sm font-black text-slate-800">{roomTenant.name}</p>
                  <p className="text-xs text-slate-500">HP/WA: {roomTenant.phone} • Check-In: {roomTenant.checkInDate || roomTenant.moveInDate}</p>
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <p className="text-xs font-bold text-slate-700">Kamar Sedang Kosong (Ready Check-In)</p>
                </div>
              )}

            </div>

            {/* Modal Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus kamar ${activeDetailRoom.number}?`)) {
                    onDeleteRoom(activeDetailRoom.id);
                    onSelectRoomId(null);
                  }
                }}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" /> Hapus Kamar
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSelectRoomId(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. ADD KAMAR FORM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Tambah Kamar Dual-Tarif Baru</span>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl font-bold">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Kamar *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: A05"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold uppercase text-slate-900"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Kamar</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as RoomType)}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              </div>

              {/* Dual rates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarif Harian (Rp/malam) *</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarif Bulanan (Rp/bulan) *</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                    value={pricePerMonth}
                    onChange={(e) => setPricePerMonth(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Posisi Lantai</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                    value={roomFloor}
                    onChange={(e) => setRoomFloor(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dimensi Ukuran</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                    value={roomSize}
                    onChange={(e) => setRoomSize(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fasilitas Kamar</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {AVAILABLE_FACILITIES.map(fac => (
                    <label key={fac} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFacilities.includes(fac)}
                        onChange={() => handleFacilityToggle(fac)}
                        className="rounded text-teal-600"
                      />
                      <span>{fac}</span>
                    </label>
                  ))}
                </div>
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
                  className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Kamar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ROOM CARDS GRID WITH HOUSEKEEPING ACTIONS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map((room) => {
          const tenant = room.tenantId ? tenants.find(t => t.id === room.tenantId) : null;
          const isClean = room.housekeepingStatus === 'Bersih';
          const dailyRate = room.pricePerDay || 180000;
          const monthlyRate = room.pricePerMonth || room.price;

          return (
            <div 
              key={room.id}
              className="bg-white rounded-3xl border border-slate-200 hover:border-teal-400 p-5 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image & Status bar */}
                <div className="relative h-36 bg-slate-100 rounded-2xl overflow-hidden mb-3">
                  <img
                    src={room.images?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80'}
                    alt={`Kamar ${room.number}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black text-white ${
                      room.status === 'Kosong' ? 'bg-emerald-500' : 'bg-slate-900/80'
                    }`}>
                      {room.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      isClean ? 'bg-teal-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {isClean ? '✨ Bersih' : '⚠️ Kotor'}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2 bg-white/95 px-2 py-0.5 rounded-lg text-xs font-black text-slate-900">
                    Kmr {room.number}
                  </div>
                </div>

                {/* Rates */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-base font-black text-teal-700">Rp {dailyRate.toLocaleString('id-ID')}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">/mlm</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-700">Rp {(monthlyRate/1000).toFixed(0)}rb</span>
                    <span className="text-[10px] text-slate-400">/bln</span>
                  </div>
                </div>

                {/* Facilities */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {(room.facilities || []).slice(0, 4).map((f, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-md">
                      {f}
                    </span>
                  ))}
                </div>

                {/* Occupant preview */}
                {tenant && (
                  <div className="bg-slate-50 p-2 rounded-xl text-[10px] flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                      {tenant.name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-800 truncate">{tenant.name} ({tenant.guestType || 'Bulanan'})</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                {!isClean && onUpdateHousekeepingStatus && (
                  <button
                    onClick={() => onUpdateHousekeepingStatus(room.id, 'Bersih')}
                    className="py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    ✨ Set Bersih
                  </button>
                )}
                <button
                  onClick={() => onSelectRoomId(room.id)}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-xl text-center cursor-pointer"
                >
                  Detail & Kelola
                </button>
              </div>

            </div>
          );
        })}
      </section>

    </div>
  );
}
