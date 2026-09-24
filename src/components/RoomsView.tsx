import React, { useState } from 'react';
import { MagnifyingGlass, Plus, Faders, Tag, Check, CheckCircle, Warning, Users, Hammer, List, X, Trash, PencilSimple, Buildings, Eye } from '@phosphor-icons/react';
import { Room, Tenant, Bill, RoomStatus, RoomType, HousekeepingStatus } from '../types';
import { ElegantSelect } from './ElegantSelect';
import { generateId } from '../utils';

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
  
  // View states
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [floorFilter, setFloorFilter] = useState<string>('Semua');
  
  // Custom dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Add Room form states
  const [roomNo, setRoomNo] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('Studio');
  const [roomFloor, setRoomFloor] = useState(1);
  const [pricePerMonth, setPricePerMonth] = useState(3500000);
  const [roomSize, setRoomSize] = useState('4x4 m');
  const [roomNotes, setRoomNotes] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(['AC', 'WiFi', 'Private Bathroom', 'Queen Bed']);
  const [formError, setFormError] = useState('');

  const AVAILABLE_FACILITIES = [
    'Private Bathroom', 'AC', 'Workspace', 'Queen Bed', 'King Bed', 
    'WiFi Fiber', 'Lemari Built-in', 'Smart TV', 'Balkon', 'Water Heater'
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
      setFormError('Nomor atau nama kamar wajib diisi!');
      return;
    }

    const newRoom: Room = {
      id: generateId('room'),
      number: roomNo,
      status: 'Kosong',
      type: roomType,
      price: pricePerMonth,
      pricePerMonth: pricePerMonth,
      housekeepingStatus: 'Bersih',
      floor: Number(roomFloor),
      size: roomSize,
      facilities: selectedFacilities,
      notes: roomNotes,
      images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80']
    };

    onAddRoom(newRoom);
    
    // Reset
    setRoomNo('');
    setFormError('');
    setShowAddForm(false);
  };

  const formatIDR = (num: number) => {
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          room.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || room.status === statusFilter;
    const matchesFloor = floorFilter === 'Semua' || room.floor.toString() === floorFilter;

    return matchesSearch && matchesStatus && matchesFloor;
  });

  const activeDetailRoom = rooms.find(r => r.id === selectedRoomId);
  const roomTenant = activeDetailRoom && activeDetailRoom.tenantId 
    ? tenants.find(t => t.id === activeDetailRoom.tenantId) 
    : null;

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & FILTER BAR */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#171A18] font-editorial tracking-tight leading-none">
            Kamar
          </h2>
          <p className="text-xs text-[#6E746F] mt-1.5 leading-none">
            Kelola unit dan ketersediaan
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-5 py-3 rounded-full bg-[#173B30] text-[#F5F1E8] hover:bg-[#0f2720] text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#173b30]/20"
        >
           Kamar Baru
        </button>
      </div>

      {/* Filter Row (App-less look) */}
      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <MagnifyingGlass weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E746F]" />
          <input
            type="text"
            placeholder="Cari nomor kamar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl text-sm text-[#171A18] placeholder-[#6E746F] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#173B30] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          {['Semua', 'Kosong', 'Terisi', 'Booking', 'Perbaikan'].map((status) => {
            const count = status === 'Semua' ? rooms.length : rooms.filter(r => r.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shadow-sm ${
                  statusFilter === status
                    ? 'bg-[#173B30] text-white shadow-md shadow-[#173b30]/20'
                    : 'bg-white text-[#6E746F] hover:text-[#171A18]'
                }`}
              >
                {status} <span className="opacity-60 ml-1">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ROOMS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
        {filteredRooms.map((room) => {
          const isAvailable = room.status === 'Kosong';
          const isBooking = room.status === 'Booking';
          const isOccupied = room.status === 'Terisi';
          const isMaintenance = room.status === 'Perbaikan' || room.status === 'Dibersihkan';

          return (
            <div
              key={room.id}
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Room Image & Badges */}
              <div className="relative aspect-[16/10] bg-zinc-100 overflow-hidden m-2 rounded-[24px]">
                <img
                  src={room.images?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80'}
                  alt={room.number}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  {isAvailable && (
                    <span className="bg-white/90 backdrop-blur-sm text-emerald-800 text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Tersedia
                    </span>
                  )}
                  {isBooking && (
                    <span className="bg-white/90 backdrop-blur-sm text-amber-800 text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Booking
                    </span>
                  )}
                  {isOccupied && (
                    <span className="bg-white/90 backdrop-blur-sm text-zinc-800 text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-600"></div> Terisi
                    </span>
                  )}
                  {isMaintenance && (
                    <span className="bg-white/90 backdrop-blur-sm text-rose-800 text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Perbaikan
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
                  Lantai {room.floor}
                </div>
              </div>

              {/* Room Body */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                       <h4 className="text-lg font-bold text-[#171A18] leading-tight">
                         Kamar {room.number}
                       </h4>
                       <span className="text-xs font-semibold text-[#6E746F] mt-1 block">
                         {room.type} • {room.size}
                       </span>
                    </div>
                    <button
                      onClick={() => onSelectRoomId(room.id)}
                      className="h-10 w-10 rounded-full bg-[#F5F1E8] flex items-center justify-center text-[#173B30] shadow-sm hover:bg-[#E5DCC5] transition-colors"
                    >
                      <Eye weight="duotone" className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6E746F] font-medium uppercase tracking-wider block">Sewa / Bulan</span>
                    <span className="text-base font-extrabold text-[#173B30] mt-0.5 block">
                      {formatIDR(room.pricePerMonth || room.price)}
                    </span>
                  </div>

                  <div className="relative">
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         setOpenDropdownId(openDropdownId === room.id ? null : room.id);
                       }}
                       className="text-xs font-bold rounded-xl bg-[#FBF9F5] px-3 py-2 text-[#171A18] cursor-pointer outline-none shadow-sm flex items-center gap-2 hover:bg-[#F5F1E8] transition-colors"
                     >
                       {room.status === 'Kosong' ? 'Tersedia' : room.status}
                       <svg width="8" height="8" viewBox="0 0 292.4 292.4" fill="#171A18"><path d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-5 0-9.3 1.8-12.9 5.4A17.6 17.6 0 0 0 0 82.2c0 5 1.8 9.3 5.4 12.9l128 127.9c3.6 3.6 7.8 5.4 12.8 5.4s9.2-1.8 12.8-5.4L287 95c3.5-3.5 5.4-7.8 5.4-12.8 0-5-1.9-9.2-5.5-12.8z"/></svg>
                     </button>
                     
                     {openDropdownId === room.id && (
                       <>
                         <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }}></div>
                         <div className="absolute right-0 bottom-full mb-2 w-36 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                           {(['Kosong', 'Terisi', 'Booking', 'Perbaikan', 'Dibersihkan'] as RoomStatus[]).map((status) => (
                             <button
                               key={status}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 onUpdateRoomStatus(room.id, status);
                                 setOpenDropdownId(null);
                               }}
                               className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                                 room.status === status 
                                   ? 'bg-[#173B30] text-white' 
                                   : 'text-[#171A18] hover:bg-[#F5F1E8]'
                               }`}
                             >
                               {status === 'Kosong' ? 'Tersedia' : status}
                             </button>
                           ))}
                         </div>
                       </>
                     )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. ROOM DETAIL MODAL */}
      {activeDetailRoom && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-[#FBF9F5] sm:rounded-3xl rounded-t-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 slide-up-animation">
            <div className="flex items-center justify-between border-b border-[#E5DCC5] pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#A8B7A1] uppercase tracking-wider">Detail Kamar</span>
                <h3 className="text-xl font-bold text-[#171A18] mt-1">{activeDetailRoom.number}</h3>
              </div>
              <button
                onClick={() => onSelectRoomId(null)}
                className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#6E746F] shadow-sm"
              >
                <X weight="duotone" className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#6E746F]">Tipe</span>
                <span className="font-bold bg-white px-3 py-1 rounded-lg shadow-sm">{activeDetailRoom.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E746F]">Lantai / Ukuran</span>
                <span className="font-bold">Lantai {activeDetailRoom.floor} • {activeDetailRoom.size}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm my-2">
                <span className="text-[#6E746F] font-medium">Tarif Bulanan</span>
                <span className="font-extrabold text-[#173B30] text-lg">{formatIDR(activeDetailRoom.pricePerMonth || activeDetailRoom.price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E746F]">Status Saat Ini</span>
                <span className="font-bold">{activeDetailRoom.status}</span>
              </div>
              
              {roomTenant && (
                <div className="p-4 bg-white rounded-2xl shadow-sm mt-4">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-2">Penghuni Aktif</span>
                  <p className="font-bold text-base text-[#171A18]">{roomTenant.name}</p>
                  <div className="mt-2 space-y-1">
                     <p className="text-[#6E746F] text-xs flex items-center justify-between">
                        <span>Masuk:</span> <span className="font-semibold text-[#171A18]">{roomTenant.moveInDate}</span>
                     </p>
                     <p className="text-[#6E746F] text-xs flex items-center justify-between">
                        <span>Kontak:</span> <span className="font-semibold text-[#171A18]">{roomTenant.phone}</span>
                     </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => onSelectRoomId(null)}
                className="w-full px-4 py-3.5 rounded-2xl bg-[#173B30] text-[#F5F1E8] text-sm font-bold shadow-md shadow-[#173b30]/20"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  onDeleteRoom(activeDetailRoom.id);
                  onSelectRoomId(null);
                }}
                className="w-full py-3.5 rounded-2xl bg-white text-xs text-rose-700 font-bold shadow-sm"
              >
                Hapus Kamar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ADD ROOM FORM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FBF9F5] border border-[rgba(23,59,48,0.15)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(23,59,48,0.10)] pb-3">
              <h3 className="text-lg font-bold text-[#171A18] font-editorial">Tambah Kamar Baru</h3>
              <button onClick={() => setShowAddForm(false)} className="p-1 text-[#6E746F]">
                <X weight="duotone" className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{formError}</p>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#171A18] mb-1">Nomor / Nama Kamar *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Studio Plus A104"
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Tipe Kamar</label>
                  <ElegantSelect
                    value={roomType}
                    onChange={(val) => setRoomType(val as RoomType)}
                    options={[
                      { value: 'Studio', label: 'Studio' },
                      { value: 'Studio Plus', label: 'Studio Plus' },
                      { value: 'Suite', label: 'Suite' },
                      { value: 'Standard', label: 'Standard' },
                      { value: 'Deluxe', label: 'Deluxe' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Lantai</label>
                  <input
                    type="number"
                    min={1}
                    value={roomFloor}
                    onChange={(e) => setRoomFloor(Number(e.target.value))}
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Tarif Bulanan (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={pricePerMonth}
                    onChange={(e) => setPricePerMonth(Number(e.target.value))}
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Ukuran Kamar</label>
                  <input
                    type="text"
                    value={roomSize}
                    onChange={(e) => setRoomSize(e.target.value)}
                    placeholder="4x4 m"
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#171A18] mb-1.5">Fasilitas Kamar</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_FACILITIES.map(fac => (
                    <button
                      key={fac}
                      type="button"
                      onClick={() => handleFacilityToggle(fac)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        selectedFacilities.includes(fac)
                          ? 'bg-[#173B30] text-[#F5F1E8]'
                          : 'bg-white border text-[#6E746F]'
                      }`}
                    >
                      {fac}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[rgba(23,59,48,0.10)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl border border-[rgba(23,59,48,0.20)] text-xs font-bold text-[#173B30]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#173B30] text-[#F5F1E8] font-bold text-xs hover:bg-[#0f2720]"
                >
                  Simpan Kamar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
