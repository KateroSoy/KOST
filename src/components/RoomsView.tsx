import React, { useState } from 'react';
import { Search, Plus, Filter, Tag, Check, CheckCircle2, AlertTriangle, Users, Hammer, ListCollapse, X, Trash2, Edit3, ArrowUpRight } from 'lucide-react';
import { Room, Tenant, Bill, RoomStatus, RoomType } from '../types';

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
}

export function RoomsView({ 
  rooms, tenants, bills, selectedRoomId, onSelectRoomId, 
  onAddRoom, onUpdateRoomStatus, onDeleteRoom, onNavigateToTab 
}: RoomsViewProps) {
  
  // Views states
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  // Add Room form states
  const [roomNo, setRoomNo] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('Standard');
  const [roomFloor, setRoomFloor] = useState(1);
  const [roomPrice, setRoomPrice] = useState(1200000);
  const [roomSize, setRoomSize] = useState('3x3 m');
  const [roomNotes, setRoomNotes] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(['WiFi', 'Kasur Single', 'Lemari Baju']);
  const [formError, setFormError] = useState('');

  // Predefined facilities lists
  const AVAILABLE_FACILITIES = [
    'AC', 'WiFi', 'Kamar Mandi Dalam', 'Kamar Mandi Luar', 'Kasur Single', 'Kasur Queen', 
    'Lemari Baju', 'Water Heater', 'TV', 'Meja Kerja', 'Kulkas Mini', 'Balkon'
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
      setFormError('Nomor kamar ini sudah terdaftar dalam draf Anda!');
      return;
    }

    const newRoom: Room = {
      id: `room-${Date.now()}`,
      number: roomNo.toUpperCase(),
      status: 'Kosong',
      type: roomType,
      price: roomPrice,
      floor: Number(roomFloor),
      size: roomSize,
      facilities: selectedFacilities,
      notes: roomNotes
    };

    onAddRoom(newRoom);
    
    // Reset states
    setRoomNo('');
    setRoomType('Standard');
    setRoomFloor(1);
    setRoomPrice(1200000);
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
    
    if (statusFilter === 'Semua') return matchesSearch;
    return matchesSearch && room.status === statusFilter;
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
      
      {/* Search, Filter menu & Add Button row */}
      <section className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search Input BAR */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari nomor kamar atau tipe (Standard, Deluxe...)"
            className="w-full bg-slate-50 text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter chips scrollable horizontal */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['Semua', 'Kosong', 'Terisi', 'Booking', 'Perbaikan', 'Menunggak'].map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {status} ({status === 'Semua' ? rooms.length : rooms.filter(r => r.status === status).length})
              </button>
            );
          })}
        </div>

        {/* Adds Button */}
        <button
          onClick={() => {
            setShowAddForm(true);
            onSelectRoomId(null);
          }}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4" /> Tambah Kamar
        </button>
      </section>

      {/* 3-COLUMN DETAIL MODAL OVERLAY */}
      {activeDetailRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Heading */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded bg-teal-500 flex items-center justify-center font-bold text-xs text-slate-900">
                  {activeDetailRoom.number}
                </span>
                <span className="font-extrabold text-base">Detail Kamar {activeDetailRoom.number}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  activeDetailRoom.status === 'Kosong' ? 'bg-slate-700 text-slate-100' : 'bg-emerald-500 text-white'
                }`}>
                  {activeDetailRoom.status}
                </span>
              </div>
              <button 
                onClick={() => onSelectRoomId(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Grid 2 Column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual Specifications */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Spesifikasi Fisik</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Tipe Kamar</p>
                      <p className="font-extrabold text-slate-800">{activeDetailRoom.type}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Ukurannya</p>
                      <p className="font-extrabold text-slate-800">{activeDetailRoom.size}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Posisi Lantai</p>
                      <p className="font-extrabold text-slate-800">Lantai {activeDetailRoom.floor}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Harga Bulanan</p>
                      <p className="font-extrabold text-teal-700">{formatIDR(activeDetailRoom.price)}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Fasilitas Kamar</h5>
                    <div className="flex flex-wrap gap-1">
                      {activeDetailRoom.facilities.map((f, i) => (
                        <span key={i} className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-100 px-2 py-0.5 rounded-lg">
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {activeDetailRoom.notes && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Catatan Khusus:</p>
                      <p className="text-xs text-slate-600 mt-0.5 italic">“{activeDetailRoom.notes}”</p>
                    </div>
                  )}
                </div>

                {/* Occupant Detail or Action suggestions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Data Penghuni Aktif</h4>

                  {roomTenant ? (
                    <div className="p-3.5 border border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-teal-600 text-white border-2 border-white rounded-full flex items-center justify-center font-bold text-sm shadow">
                          {roomTenant.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-slate-800">{roomTenant.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Mulai masuk: {roomTenant.moveInDate}</p>
                        </div>
                      </div>

                      <div className="text-[11px] space-y-1 text-slate-500 font-semibold">
                        <p>📞 WA: {roomTenant.phone}</p>
                        <p>✉ Email: {roomTenant.email || '-'}</p>
                        <p>💼 KTP: {roomTenant.idNumber || 'Lunas/Valid'}</p>
                        <p>💰 Deposit: {formatIDR(roomTenant.deposit)}</p>
                      </div>

                      <button 
                        onClick={() => {
                          onSelectRoomId(null);
                          onNavigateToTab('tenants', roomTenant.id);
                        }}
                        className="w-full py-1.5 bg-slate-900 text-white font-extrabold text-[10px] rounded-lg text-center flex items-center justify-center gap-1 hover:bg-slate-800 cursor-pointer"
                      >
                        Kelola Profil Penghuni <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                      <span className="text-3xl">🛏️</span>
                      <p className="text-xs font-bold text-slate-700 mt-2">Kamar Ini Sedang Kosong</p>
                      <p className="text-[10px] text-slate-400 mt-1 mb-4">Belum ada penghuni terdaftar di kamar {activeDetailRoom.number}.</p>
                      
                      <button 
                        onClick={() => {
                          onSelectRoomId(null);
                          onNavigateToTab('tenants');
                        }}
                        className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" /> Tempatkan Penghuni Baru
                      </button>
                    </div>
                  )}

                  {/* Payment history in this room */}
                  <div>
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Kwitansi Terakhir di Kamar Ini</h5>
                    {roomPaymentHistory.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">Belum ada riwayat sewa lunas pada database.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {roomPaymentHistory.slice(0, 3).map((ph) => (
                          <div key={ph.id} className="p-2 border border-slate-100 rounded-xl bg-slate-50/30 flex justify-between items-center text-[10px]">
                            <span>
                              <strong>{ph.period}</strong> • {ph.paymentMethod}
                            </span>
                            <span className="font-bold text-teal-600">{formatIDR(ph.paidAmount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Apakah Anda yakin ingin menghapus Kamar ${activeDetailRoom.number} permanently?`)) {
                    onDeleteRoom(activeDetailRoom.id);
                    onSelectRoomId(null);
                  }
                }}
                className="px-3 py-2 text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Hapus Kamar"
              >
                <Trash2 className="h-4 w-4" /> Hapus Kamar
              </button>

              <div className="flex gap-2 text-xs">
                {activeDetailRoom.status !== 'Perbaikan' && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateRoomStatus(activeDetailRoom.id, 'Perbaikan');
                      onSelectRoomId(null);
                    }}
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    🛠️ Tandai Perbaikan
                  </button>
                )}
                {activeDetailRoom.status === 'Perbaikan' && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateRoomStatus(activeDetailRoom.id, 'Kosong');
                      onSelectRoomId(null);
                    }}
                    className="px-3 py-2 bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    ✓ Perbaikan Selesai
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectRoomId(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. ADD KAMAR FORM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-300 shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Tambah Kamar Kost Baru</span>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-medium">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">NOMOR KAMAR *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: B05"
                    className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 uppercase"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">TIPE KAMAR</label>
                  <select
                    className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
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

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">LANTAI (FLOOR)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 font-bold text-center"
                    value={roomFloor}
                    onChange={(e) => setRoomFloor(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-extrabold text-slate-500 block">DIMENSI UKURAN</label>
                  <select
                    className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-semibold"
                    value={roomSize}
                    onChange={(e) => setRoomSize(e.target.value)}
                  >
                    <option value="3x3 m">3x3 meter</option>
                    <option value="3x4 m">3x4 meter</option>
                    <option value="3.5x4 m">3.5x4 meter</option>
                    <option value="4x4 m">4x4 meter</option>
                    <option value="4x5 m">4x5 meter</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 block">HARGA SEWA PER BULAN (IDR)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-extrabold text-xs">Rp</span>
                  <input
                    type="number"
                    required
                    title="Harga Sewa"
                    className="w-full bg-slate-50 pl-10 pr-3 py-2.5 text-xs text-slate-800 border border-slate-200 rounded-xl font-extrabold focus:outline-none"
                    value={roomPrice}
                    onChange={(e) => setRoomPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Facility Tags selectors */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 block">FASILITAS KAMAR YANG TERSEDIA</label>
                <div className="grid grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                  {AVAILABLE_FACILITIES.map((fac) => {
                    const isChecked = selectedFacilities.includes(fac);
                    return (
                      <button
                        type="button"
                        key={fac}
                        onClick={() => handleFacilityToggle(fac)}
                        className={`p-1.5 text-[9px] font-bold rounded-lg border text-left flex justify-between items-center transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-teal-50 border-teal-300 text-teal-800' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{fac}</span>
                        {isChecked && <Check className="h-3 w-3 text-teal-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 block">CATATAN KHUSUS (OPSIONAL)</label>
                <textarea
                  className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                  rows={2}
                  placeholder="Kelebihan kamar, minus, washtafel rusak, ranjang baru, dekat tangga..."
                  value={roomNotes}
                  onChange={(e) => setRoomNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-room"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow shadow-teal-500/10 cursor-pointer animate-pulse-once"
                >
                  Simpan Kamar Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DYNAMIC ROOMS CARDS LOOP */}
      {filteredRooms.length === 0 ? (
        <div id="rooms-empty-state" className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-sm mx-auto">
          <span className="text-4xl text-slate-300 block">🛏️</span>
          <h3 className="text-sm font-black text-slate-700 mt-3">Kamar Kost Tidak Ditemukan</h3>
          <p className="text-[10px] text-slate-400 mt-1 mb-5">
            Tidak ada kamar yang sesuai kriteria pencarian "{searchQuery}" atau filter "{statusFilter}".
          </p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('Semua');
            }} 
            className="py-2 px-4 bg-teal-600 inline-block hover:bg-teal-700 text-white font-bold text-[10px] rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            Bersihkan Filter
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const tenant = room.tenantId ? tenants.find(t => t.id === room.tenantId) : null;
            
            // Status badges design
            let statusColor = 'bg-slate-100 text-slate-600 border-slate-200';
            if (room.status === 'Terisi') statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            if (room.status === 'Booking') statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
            if (room.status === 'Perbaikan') statusColor = 'bg-orange-50 text-orange-800 border-orange-200';
            if (room.status === 'Menunggak') statusColor = 'bg-rose-50 text-rose-800 border-rose-300';
            
            return (
              <div 
                key={room.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-teal-400 p-5 shadow-xs transition-all hover:shadow hover:translate-y-[-1px] flex flex-col justify-between"
              >
                <div>
                  {/* Card head */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                        {room.number}
                      </span>
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{room.type}</span>
                        <span className="text-[9px] font-bold text-slate-400">Lantai {room.floor} • {room.size}</span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                      {room.status}
                    </span>
                  </div>

                  {/* Pricing */}
                  <p className="text-sm font-extrabold text-teal-700 font-mono tracking-tight">{formatIDR(room.price)}<span className="text-[10px] text-slate-400 font-sans font-normal font-semibold"> / bulan</span></p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    {/* Facility preview dots/pills */}
                    <div className="flex flex-wrap gap-1">
                      {room.facilities.slice(0, 3).map((f, i) => (
                        <span key={i} className="text-[8px] font-extrabold bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                      {room.facilities.length > 3 && (
                        <span className="text-[8px] font-black text-teal-600 bg-teal-50 px-1 py-0.5 rounded">
                          +{room.facilities.length - 3} lagi
                        </span>
                      )}
                    </div>

                    {/* Occupant card previews */}
                    <div className="pt-1.5">
                      {tenant ? (
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold">
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-800 truncate">{tenant.name}</p>
                            <p className="text-[8px] text-slate-400 font-mono">WA: {tenant.phone}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">Sewa kosong, siap disewa.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSelectRoomId(room.id)}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200/80 text-[10px] font-extrabold text-slate-700 rounded-lg text-center transition-all cursor-pointer"
                  >
                    Kelola Kamar & Detail
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

    </div>
  );
}
