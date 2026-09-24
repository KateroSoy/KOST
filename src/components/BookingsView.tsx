import React, { useState } from 'react';
import { CalendarBlank, Users, CheckCircle, XCircle, Clock, MagnifyingGlass, Faders, Plus, Phone, EnvelopeSimple, ArrowRight, ChatTeardropText, Buildings, ArrowUpRight, ShieldCheck, UserCheck, X, Globe } from '@phosphor-icons/react';
import { Booking, BookingStatus, BookingSource, Room, Property, Tenant } from '../types';
import { ElegantSelect } from './ElegantSelect';
import { generateId } from '../utils';

interface BookingsViewProps {
  bookings: Booking[];
  rooms: Room[];
  properties: Property[];
  onAddBooking: (booking: Booking) => void;
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  onConvertToTenant?: (booking: Booking) => void;
  selectedPropertyId?: string;
}

export function BookingsView({
  bookings,
  rooms,
  properties,
  onAddBooking,
  onUpdateBookingStatus,
  onConvertToTenant,
  selectedPropertyId = 'all'
}: BookingsViewProps) {

  // MagnifyingGlass and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Modal State for New Booking
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<Booking | null>(null);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [roomId, setRoomId] = useState('');
  const [moveInDate, setMoveInDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [durationMonths, setDurationMonths] = useState(3);
  const [source, setSource] = useState<BookingSource>('WhatsApp');
  const [notes, setNotes] = useState('');

  // Filter Bookings
  const filteredBookings = bookings.filter(b => {
    if (selectedPropertyId !== 'all' && b.propertyId !== selectedPropertyId) return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && b.source !== sourceFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return b.guestName.toLowerCase().includes(q) || 
             b.guestPhone.includes(q) || 
             b.roomType.toLowerCase().includes(q) ||
             (b.roomNumber && b.roomNumber.toLowerCase().includes(q));
    }
    return true;
  });

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const selRoom = rooms.find(r => r.id === roomId);
    const roomType = selRoom ? selRoom.type : 'Studio';
    const roomNumber = selRoom ? selRoom.number : undefined;
    const monthlyRate = selRoom ? (selRoom.pricePerMonth || selRoom.price) : 3500000;

    const newBooking: Booking = {
      id: generateId('book'),
      propertyId: selRoom?.propertyId || properties[0]?.id || 'prop-1',
      roomId: roomId || undefined,
      roomType,
      roomNumber,
      guestName,
      guestPhone,
      guestEmail: guestEmail || undefined,
      moveInDate,
      durationMonths,
      guestsCount: 1,
      totalAmount: monthlyRate * durationMonths,
      depositAmount: monthlyRate,
      source,
      status: 'Pending',
      notes,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddBooking(newBooking);
    setShowAddModal(false);
    // Reset Form
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setRoomId('');
    setNotes('');
  };

  const statusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Confirmed':
        return <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full text-xs font-bold">Confirmed</span>;
      case 'Pending':
        return <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-xs font-bold">Pending</span>;
      case 'Inquiry':
        return <span className="bg-[#E5DCC5] text-blue-900 px-2.5 py-1 rounded-full text-xs font-bold">Inquiry</span>;
      case 'Checked In':
        return <span className="bg-purple-100 text-purple-900 px-2.5 py-1 rounded-full text-xs font-bold">Checked In</span>;
      case 'Checked Out':
        return <span className="bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-full text-xs font-bold">Checked Out</span>;
      case 'Cancelled':
        return <span className="bg-rose-100 text-rose-900 px-2.5 py-1 rounded-full text-xs font-bold">Cancelled</span>;
      default:
        return <span className="bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#171A18] font-editorial tracking-tight leading-none">
            Booking
          </h2>
          <p className="text-xs text-[#6E746F] mt-1.5 leading-none">
            Kelola permintaan sewa dan reservasi
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-full bg-[#173B30] text-[#F5F1E8] hover:bg-[#0f2720] text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-md shadow-[#173b30]/20 whitespace-nowrap shrink-0"
        >
           Booking Baru
        </button>
      </div>

      {/* Filter and MagnifyingGlass Bar (App-less look: pills and soft inputs) */}
      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <MagnifyingGlass weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E746F]" />
          <input
            type="text"
            placeholder="Cari tamu atau kamar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl text-sm text-[#171A18] placeholder-[#6E746F] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#173B30] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          <ElegantSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            className="w-48"
            options={[
              { value: 'all', label: 'Status: Semua' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Confirmed', label: 'Confirmed' },
              { value: 'Inquiry', label: 'Inquiry' },
              { value: 'Checked In', label: 'Checked In' },
              { value: 'Checked Out', label: 'Checked Out' },
              { value: 'Cancelled', label: 'Cancelled' }
            ]}
          />

          <ElegantSelect
            value={sourceFilter}
            onChange={(val) => setSourceFilter(val)}
            className="w-48"
            options={[
              { value: 'all', label: 'Sumber: Semua' },
              { value: 'Website', label: 'Website' },
              { value: 'WhatsApp', label: 'WhatsApp' },
              { value: 'Walk-in', label: 'Walk-in' },
              { value: 'Partner', label: 'Partner' }
            ]}
          />
        </div>
      </div>

      {/* Bookings Display */}
      {/* Bookings Table & Cards */}
      <div className="w-full">
        {filteredBookings.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto text-[#6E746F]">
              <CalendarBlank weight="duotone" className="h-8 w-8" />
            </div>
            <h4 className="font-bold text-lg text-[#171A18]">Belum Ada Booking</h4>
            <p className="text-sm text-[#6E746F] max-w-sm mx-auto">
              Saat ada yang memesan kamar, data reservasi akan muncul di sini.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards (App-less) */}
            <div className="grid grid-cols-1 gap-4 md:hidden pb-10">
              {filteredBookings.map((b) => (
                <div key={b.id} className="bg-white p-5 rounded-3xl shadow-sm space-y-4" onClick={() => setSelectedBookingDetail(b)}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#F5F1E8] flex items-center justify-center text-[#173B30] font-bold text-lg shrink-0">
                        {b.guestName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#171A18] leading-tight">{b.guestName}</h3>
                        <p className="text-xs text-[#6E746F] mt-1 flex items-center gap-1">
                          Kamar {b.roomNumber || b.roomType}
                        </p>
                      </div>
                    </div>
                    <div>
                      {statusBadge(b.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#FBF9F5] p-3 rounded-2xl">
                    <div>
                      <p className="text-[10px] text-[#6E746F] font-medium uppercase tracking-wider">Tanggal Masuk</p>
                      <p className="font-bold text-sm text-[#171A18] mt-0.5">{b.moveInDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6E746F] font-medium uppercase tracking-wider">Durasi</p>
                      <p className="font-bold text-sm text-[#171A18] mt-0.5">{b.durationMonths} Bulan</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-[10px] text-[#6E746F] font-medium uppercase tracking-wider">Total Sewa</p>
                      <p className="font-bold text-[#173B30] text-base mt-0.5">Rp {b.totalAmount.toLocaleString('id-ID')}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      {b.status === 'Pending' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onUpdateBookingStatus(b.id, 'Confirmed'); }}
                          className="h-10 w-10 rounded-full bg-[#173B30] text-white flex items-center justify-center shadow-md shadow-[#173b30]/20"
                        >
                          <CheckCircle weight="duotone" className="h-5 w-5" />
                        </button>
                      )}
                      {b.status === 'Confirmed' && onConvertToTenant && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onConvertToTenant(b); }}
                          className="h-10 px-4 rounded-full bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-800/20"
                        >
                          <UserCheck className="h-4 w-4" /> Masuk
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FBF9F5] text-[#171A18] text-xs font-bold">
                  <tr>
                    <th className="p-5 font-semibold">Tamu</th>
                    <th className="p-5 font-semibold">Kamar</th>
                    <th className="p-5 font-semibold">Mulai Sewa</th>
                    <th className="p-5 font-semibold">Total</th>
                    <th className="p-5 font-semibold">Status</th>
                    <th className="p-5 text-right font-semibold">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F1E8] text-[#171A18]">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[#FBF9F5]/50 transition-colors cursor-pointer" onClick={() => setSelectedBookingDetail(b)}>
                      <td className="p-5">
                        <p className="font-bold text-[#171A18]">{b.guestName}</p>
                        <p className="text-xs text-[#6E746F] flex items-center gap-1 mt-1">
                          <Phone weight="duotone" className="h-3 w-3" /> {b.guestPhone}
                        </p>
                      </td>

                      <td className="p-5">
                        <span className="font-bold text-[#171A18]">{b.roomNumber || b.roomType}</span>
                        <span className="text-xs text-[#6E746F] block mt-1">{b.roomType}</span>
                      </td>

                      <td className="p-5">
                        <p className="font-bold text-[#171A18]">{b.moveInDate}</p>
                        <p className="text-xs text-[#6E746F] mt-1">{b.durationMonths} Bulan</p>
                      </td>

                      <td className="p-5">
                        <span className="font-bold text-[#173B30]">
                          Rp {b.totalAmount.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-[#6E746F] block mt-1">
                          Dep: Rp {b.depositAmount.toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="p-5">
                        {statusBadge(b.status)}
                      </td>

                      <td className="p-5 text-right space-x-2 whitespace-nowrap">
                        {b.status === 'Pending' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); onUpdateBookingStatus(b.id, 'Confirmed'); }}
                              className="px-4 py-2 rounded-xl bg-[#173B30] text-[#F5F1E8] font-bold text-xs hover:bg-[#0f2720] transition-colors"
                            >
                              Konfirmasi
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onUpdateBookingStatus(b.id, 'Cancelled'); }}
                              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-50 transition-colors"
                            >
                              Tolak
                            </button>
                          </>
                        )}

                        {b.status === 'Confirmed' && onConvertToTenant && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onConvertToTenant(b); }}
                            className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 transition-colors inline-flex items-center gap-1.5"
                          >
                            <UserCheck className="h-4 w-4" /> Masuk
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBookingDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-[#FBF9F5] sm:rounded-3xl rounded-t-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 slide-up-animation">
            <div className="flex items-center justify-between border-b border-[#E5DCC5] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A8B7A1] tracking-wider">Rincian Booking</span>
                <h3 className="text-xl font-bold text-[#171A18] mt-1">{selectedBookingDetail.guestName}</h3>
              </div>
              <button
                onClick={() => setSelectedBookingDetail(null)}
                className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#6E746F] shadow-sm"
              >
                <X weight="duotone" className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#6E746F]">No. Telepon</span>
                <span className="font-bold flex items-center gap-2">
                  <Phone weight="duotone" className="h-4 w-4 text-[#173B30]" /> {selectedBookingDetail.guestPhone}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E746F]">Kamar</span>
                <span className="font-bold bg-white px-3 py-1 rounded-lg shadow-sm">{selectedBookingDetail.roomNumber || selectedBookingDetail.roomType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E746F]">Mulai Sewa</span>
                <span className="font-bold">{selectedBookingDetail.moveInDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E746F]">Durasi</span>
                <span className="font-bold">{selectedBookingDetail.durationMonths} Bulan</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm my-2">
                <span className="text-[#6E746F] font-medium">Total Sewa</span>
                <span className="font-extrabold text-[#173B30] text-lg">Rp {selectedBookingDetail.totalAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E746F]">Deposit</span>
                <span className="font-bold">Rp {selectedBookingDetail.depositAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6E746F]">Sumber Booking</span>
                <span className="font-bold">{selectedBookingDetail.source}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[#6E746F]">Status</span>
                <span>{statusBadge(selectedBookingDetail.status)}</span>
              </div>
              {selectedBookingDetail.notes && (
                <div className="pt-2">
                  <span className="text-[#6E746F] block text-xs font-medium mb-2">Catatan Tamu</span>
                  <p className="bg-white p-4 rounded-2xl text-sm italic shadow-sm">{selectedBookingDetail.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-col gap-3">
               {selectedBookingDetail.status === 'Pending' && (
                  <div className="grid grid-cols-2 gap-3 mb-2">
                     <button
                        onClick={() => { onUpdateBookingStatus(selectedBookingDetail.id, 'Confirmed'); setSelectedBookingDetail(null); }}
                        className="px-4 py-3.5 rounded-2xl bg-[#173B30] text-[#F5F1E8] font-bold text-sm hover:bg-[#0f2720] shadow-md shadow-[#173b30]/20 w-full"
                     >
                        Terima
                     </button>
                     <button
                        onClick={() => { onUpdateBookingStatus(selectedBookingDetail.id, 'Cancelled'); setSelectedBookingDetail(null); }}
                        className="px-4 py-3.5 rounded-2xl bg-white border border-rose-200 text-rose-700 font-bold text-sm shadow-sm w-full"
                     >
                        Tolak
                     </button>
                  </div>
               )}
              <button
                onClick={() => setSelectedBookingDetail(null)}
                className="w-full px-4 py-3.5 rounded-2xl bg-white text-sm font-bold text-[#171A18] shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FBF9F5] border border-[rgba(23,59,48,0.15)] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(23,59,48,0.10)] pb-3">
              <h3 className="text-xl font-bold text-[#171A18] font-editorial">Tambah Booking Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-[#6E746F]">
                <X weight="duotone" className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#171A18] mb-1">Nama Tamu *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sarah Amelia"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">No. WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@anda.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#171A18] mb-1">Pilih Unit Kamar</label>
                <ElegantSelect
                  value={roomId}
                  onChange={(val) => setRoomId(val)}
                  placeholder="Pilih Kamar Tersedia..."
                  options={rooms.filter(r => r.status === 'Kosong').map(r => ({
                    value: r.id,
                    label: `${r.number} (${r.type} - Rp ${(r.pricePerMonth || r.price).toLocaleString('id-ID')} / bln) - Status: ${r.status}`
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Mulai Masuk</label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Durasi Sewa</label>
                  <ElegantSelect
                    value={durationMonths.toString()}
                    onChange={(val) => setDurationMonths(Number(val))}
                    options={[
                      { value: '1', label: '1 Bulan' },
                      { value: '3', label: '3 Bulan' },
                      { value: '6', label: '6 Bulan' },
                      { value: '12', label: '12 Bulan' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#171A18] mb-1">Sumber Booking</label>
                <ElegantSelect
                  value={source}
                  onChange={(val) => setSource(val as BookingSource)}
                  options={[
                    { value: 'WhatsApp', label: 'WhatsApp' },
                    { value: 'Website', label: 'Website Publik' },
                    { value: 'Walk-in', label: 'Walk-in Langsung' },
                    { value: 'Admin', label: 'Admin' },
                    { value: 'Partner', label: 'Partner' }
                  ]}
                />
              </div>

              <div>
                <label className="block font-bold text-[#171A18] mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan..."
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                />
              </div>

              <div className="pt-3 border-t border-[rgba(23,59,48,0.10)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[rgba(23,59,48,0.20)] text-xs font-bold text-[#173B30]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#173B30] text-[#F5F1E8] font-bold text-xs hover:bg-[#0f2720]"
                >
                  Simpan Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
