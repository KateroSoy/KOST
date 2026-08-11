import React, { useState } from 'react';
import { 
  Home, ShieldCheck, Zap, Users, Receipt, MessageSquare, ArrowRight, 
  Search, Calendar, UserCheck, CheckCircle2, Sparkles, MapPin, Phone, 
  SlidersHorizontal, X, CreditCard, QrCode, Star, Eye, Wifi, Tv, Coffee, Wind, Bath, Layers,
  Building, Globe, Filter, ChevronRight, Check
} from 'lucide-react';
import { Room, KostSettings, RentalType, Property, PropertyType } from '../types';
import { INITIAL_ROOMS, INITIAL_SETTINGS, INITIAL_PROPERTIES } from '../data';

interface LandingPageProps {
  onStartDemo: () => void;
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  rooms?: Room[];
  settings?: KostSettings;
  properties?: Property[];
  selectedPropertyId?: string;
  onSelectPropertyId?: (id: string) => void;
  isOwnerCatalog?: boolean;
}

export function LandingPage({ 
  onStartDemo, 
  onGoToLogin, 
  onGoToRegister,
  rooms = INITIAL_ROOMS,
  settings = INITIAL_SETTINGS,
  properties = INITIAL_PROPERTIES,
  selectedPropertyId,
  onSelectPropertyId,
  isOwnerCatalog = false
}: LandingPageProps) {

  // View state: 'portal' (Beranda Calon Penginap catalog) | 'property' (Single stay landing page)
  const [viewMode, setViewMode] = useState<'portal' | 'property'>(() => {
    return (selectedPropertyId && selectedPropertyId !== 'all') ? 'property' : 'portal';
  });

  // Active property ID when viewing a specific property
  const [activePropId, setActivePropId] = useState<string>(() => {
    if (selectedPropertyId && selectedPropertyId !== 'all') return selectedPropertyId;
    return properties[0]?.id || 'prop-1';
  });

  // Catalog Filter State for Beranda Calon Penginap
  const [catalogTypeFilter, setCatalogTypeFilter] = useState<string>('All');
  const [catalogCityFilter, setCatalogCityFilter] = useState<string>('All');
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  // Single Property Search & Filter State
  const [stayType, setStayType] = useState<RentalType>('Harian');
  const [checkInDate, setCheckInDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [guestCount, setGuestCount] = useState<number>(1);
  const [selectedFacility, setSelectedFacility] = useState<string>('All');
  const [selectedFloor, setSelectedFloor] = useState<string>('All');

  // Modal State for Booking & Room Preview
  const [selectedRoomForPreview, setSelectedRoomForPreview] = useState<Room | null>(null);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);

  // Form State for Booking Modal
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestKtp, setGuestKtp] = useState<string>('');
  const [guestNotes, setGuestNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'Transfer' | 'Cash'>('QRIS');
  const [bookingSubmitted, setBookingSubmitted] = useState<boolean>(false);

  // Get active property data object
  const activeProperty = properties.find(p => p.id === activePropId) || properties[0] || {
    id: 'prop-1',
    name: settings.kostName,
    type: 'Kost' as PropertyType,
    slug: 'stayflow',
    address: settings.address,
    city: 'Yogyakarta',
    description: 'Penginapan harian & bulanan bersih, nyaman, dan strategis.',
    whatsapp: settings.whatsapp,
    ownerName: settings.ownerName,
    coverImage: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80',
    facilities: ['AC', 'WiFi', 'Water Heater', 'Smart Key']
  };

  // Rooms filtered for active property
  const activePropertyRooms = rooms.filter(r => !r.propertyId || r.propertyId === activeProperty.id);

  // Calculate stay duration
  const computeDurationNights = () => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const durationNights = computeDurationNights();

  // Rooms filtered by single property filters
  const filteredPropertyRooms = activePropertyRooms.filter(room => {
    if (selectedFloor !== 'All' && room.floor.toString() !== selectedFloor) return false;
    if (selectedFacility !== 'All' && !room.facilities.some(f => f.toLowerCase().includes(selectedFacility.toLowerCase()))) return false;
    return true;
  });

  const availableRoomsCount = activePropertyRooms.filter(r => r.status === 'Kosong').length;

  // Filter properties in guest portal catalog
  const filteredCatalogProperties = properties.filter(p => {
    if (catalogTypeFilter !== 'All' && p.type !== catalogTypeFilter) return false;
    if (catalogCityFilter !== 'All' && p.city !== catalogCityFilter) return false;
    if (catalogSearch && !p.name.toLowerCase().includes(catalogSearch.toLowerCase()) && !p.address.toLowerCase().includes(catalogSearch.toLowerCase())) return false;
    return true;
  });

  const handleOpenPropertyPage = (propId: string) => {
    setActivePropId(propId);
    if (onSelectPropertyId) onSelectPropertyId(propId);
    setViewMode('property');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBookingModal = (room: Room) => {
    setSelectedRoomForBooking(room);
    setSelectedRoomForPreview(null);
    setBookingSubmitted(false);
  };

  const handleSendWhatsAppBooking = () => {
    if (!selectedRoomForBooking || !guestName || !guestPhone) return;

    const targetWa = activeProperty.whatsapp || settings.whatsapp;
    const rate = stayType === 'Harian' ? (selectedRoomForBooking.pricePerDay || 180000) : (selectedRoomForBooking.pricePerMonth || selectedRoomForBooking.price);
    const totalRoomCharge = stayType === 'Harian' ? rate * durationNights : rate;
    const deposit = stayType === 'Harian' ? 100000 : 500000;
    const grandTotal = totalRoomCharge + deposit;

    const message = `Halo pengelola *${activeProperty.name}*,\nSaya ingin reservasi sewa *${stayType.toUpperCase()}* kamar *${selectedRoomForBooking.number}* (${selectedRoomForBooking.type}).\n\n` +
      `📌 *Detail Pemesan:*\n` +
      `• Nama: ${guestName}\n` +
      `• No. HP/WA: ${guestPhone}\n` +
      `• No. KTP: ${guestKtp || '-'}\n` +
      `• Tempat Penginapan: ${activeProperty.name} (${activeProperty.address})\n` +
      `• Tipe Sewa: ${stayType} (${stayType === 'Harian' ? `${durationNights} Malam (${checkInDate} s/d ${checkOutDate})` : 'Mulai tgl ' + checkInDate})\n` +
      `• Jumlah Tamu: ${guestCount} orang\n\n` +
      `💰 *Rincian Pembayaran (${paymentMethod}):*\n` +
      `• Tarif Kamar: Rp ${totalRoomCharge.toLocaleString('id-ID')}\n` +
      `• Deposit Keamanan: Rp ${deposit.toLocaleString('id-ID')}\n` +
      `• *Total Pembayaran: Rp ${grandTotal.toLocaleString('id-ID')}*\n\n` +
      `Catatan: ${guestNotes || '-'}\n\n` +
      `Mohon konfirmasi ketersediaan kamar. Terima kasih!`;

    const cleanPhone = targetWa.replace(/^0/, '62').replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    setBookingSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-teal-100 selection:text-teal-900">
      
      {/* 1. TOP HEADER BRAND BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode('portal')}
              className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-600/20 text-white cursor-pointer hover:scale-105 transition-transform"
            >
              <Home className="h-5 w-5" />
            </button>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                {isOwnerCatalog ? settings.kostName : (
                  <>StayFlow <span className="text-teal-600 font-bold">Network</span></>
                )}
              </span>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                {isOwnerCatalog ? `By ${settings.ownerName || 'Pengelola'} • Powered by StayFlow` : 'SaaS Manajemen Properti & Booking Portal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switcher Pill */}
            <button
              onClick={() => setViewMode(viewMode === 'portal' ? 'property' : 'portal')}
              className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Globe className="h-3.5 w-3.5 text-teal-600" />
              <span>{viewMode === 'portal' ? 'Pratinjau Landing Single' : 'Jelajah Beranda Penginap'}</span>
            </button>

            <button
              onClick={onStartDemo}
              className="text-xs font-bold text-slate-700 hover:text-teal-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="h-4 w-4 text-teal-600" />
              <span className="hidden sm:inline">Dashboard Host</span>
            </button>

            <button
              onClick={onGoToLogin}
              className="text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-teal-600/15 cursor-pointer flex items-center gap-1.5"
            >
              <span>Masuk</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MODE 1: BERANDA CALON PENGINAP (MULTI-PROPERTY CATALOG) */}
      {/* ========================================================= */}
      {viewMode === 'portal' ? (
        <main className="flex-1 flex flex-col">
          
          {/* HERO PORTAL BANNER */}
          <section className="relative overflow-hidden bg-gradient-to-b from-teal-950 via-slate-900 to-slate-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-teal-500/10 blur-3xl pointer-events-none rounded-full" />

            <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" /> 
                <span>{isOwnerCatalog ? `Katalog Penginapan Resmi ${settings.kostName}` : 'Beranda Calon Penginap • Cari & Sewa Tempat Penginapan Terbaik'}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                {isOwnerCatalog ? (
                  <>Jelajahi <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">Koleksi Penginapan</span> Kami</>
                ) : (
                  <>Temukan <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">Tempat Penginapan</span> Sesuai Kebutuhan</>
                )}
              </h1>
              
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                {isOwnerCatalog 
                  ? `Temukan berbagai pilihan tempat menginap harian, kost bulanan, homestay, dan villa terbaik yang dikelola langsung oleh ${settings.ownerName || 'Pengelola'}.` 
                  : `Pilih dari berbagai pilihan tempat menginap harian, kost bulanan eksklusif, homestay keluarga, dan villa dengan fasilitas terjamin.`}
              </p>

              {/* SEARCH & FILTER BAR FOR CALON PENGINAP */}
              <div className="mt-8 bg-white/95 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-white/20 shadow-2xl text-slate-800 text-left max-w-4xl mx-auto space-y-4">
                
                {/* Search input + Type filters */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  
                  {/* Search Bar */}
                  <div className="relative flex-1 w-full">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama penginapan atau lokasi alamat..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {catalogSearch && (
                      <button onClick={() => setCatalogSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Category Type Filter */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
                    {['All', 'Kost', 'Homestay', 'Guesthouse'].map(type => (
                      <button
                        key={type}
                        onClick={() => setCatalogTypeFilter(type)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          catalogTypeFilter === type 
                            ? 'bg-teal-600 text-white shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {type === 'All' ? 'Semua Tipe' : type}
                      </button>
                    ))}
                  </div>

                </div>

                {/* Quick counters summary */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-500 font-semibold">
                  <span>Menampilkan <strong>{filteredCatalogProperties.length}</strong> tempat penginapan aktif</span>
                  <span className="text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg font-bold border border-teal-200">
                    ✓ Garansi Bersih & Transparan
                  </span>
                </div>

              </div>

            </div>
          </section>

          {/* PLACES OF STAY CATALOG GRID */}
          <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Katalog Tempat Penginapan</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Daftar Tempat Menginap Ready</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Pilih tempat menginap favorit Anda dan langsung akses landing page atau pesan kamar.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCatalogProperties.map(prop => {
                const propRooms = rooms.filter(r => !r.propertyId || r.propertyId === prop.id);
                const vacantRoomsCount = propRooms.filter(r => r.status === 'Kosong').length;

                return (
                  <div 
                    key={prop.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-2xl transition-all duration-300 flex flex-col overflow-hidden group hover:border-teal-400"
                  >
                    {/* Property Cover Image Header */}
                    <div className="relative h-52 bg-slate-100 overflow-hidden">
                      <img
                        src={prop.coverImage || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80'}
                        alt={prop.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Property Type Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-950/80 text-white backdrop-blur-md shadow-md">
                          🏠 {prop.type}
                        </span>
                        <span className="bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md">
                          {vacantRoomsCount > 0 ? `✓ ${vacantRoomsCount} Kamar Ready` : 'Full Booked'}
                        </span>
                      </div>

                      {/* City Tag */}
                      <div className="absolute top-3 right-3">
                        <span className="bg-white/90 text-slate-900 backdrop-blur-md text-[10px] font-extrabold px-2.5 py-1 rounded-xl shadow-xs">
                          📍 {prop.city}
                        </span>
                      </div>

                      {/* Title Badge overlay */}
                      <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-md border border-white">
                        <h3 className="text-sm font-black text-slate-900 truncate">{prop.name}</h3>
                        <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-teal-600 shrink-0" />
                          <span>{prop.address}</span>
                        </p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {prop.description}
                        </p>

                        {/* Starting Price Box */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Mulai Tarif Harian</span>
                            <span className="text-base font-black text-teal-700">
                              Rp {(prop.startPriceDay || 180000).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-slate-400"> /malam</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Sewa Bulanan</span>
                            <span className="text-xs font-black text-slate-800">
                              Rp {(prop.startPriceMonth || 1750000).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-slate-400 block">/bulan</span>
                          </div>
                        </div>

                        {/* Facilities */}
                        <div className="flex flex-wrap gap-1.5">
                          {(prop.facilities || ['AC', 'WiFi', 'Kamar Mandi Dalam']).slice(0, 4).map((fac, idx) => (
                            <span key={idx} className="bg-teal-50 text-teal-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-teal-100/70">
                              ✓ {fac}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleOpenPropertyPage(prop.id)}
                        className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-teal-600/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <span>Lihat Landing Page & Pesan Kamar</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </section>

        </main>
      ) : (
        /* ========================================================= */
        /* MODE 2: SINGLE DEDICATED PROPERTY LANDING PAGE SHOWCASE */
        /* ========================================================= */
        <main className="flex-1 flex flex-col">
          
          {/* TOP BACK BAR TO PORTAL */}
          <div className="bg-slate-900 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
              <button
                onClick={() => setViewMode('portal')}
                className="flex items-center gap-1 text-teal-300 hover:text-white transition-colors cursor-pointer"
              >
                <span>← Kembali ke Beranda Calon Penginap</span>
              </button>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                Menampilkan Landing Page Resmi: <strong>{activeProperty.name}</strong>
              </span>
            </div>
          </div>

          {/* HERO BANNER FOR ACTIVE PROPERTY */}
          <section className="relative overflow-hidden bg-gradient-to-b from-teal-900 via-slate-900 to-slate-950 text-white pt-10 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-teal-500/10 blur-3xl pointer-events-none rounded-full" />

            <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 backdrop-blur-md">
                <Building className="h-3.5 w-3.5 text-emerald-400" /> 
                <span>{activeProperty.type} • {activeProperty.city}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                {activeProperty.name}
              </h1>
              
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed flex items-center justify-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{activeProperty.address}</span>
              </p>

              {/* INTERACTIVE GUEST BOOKING SEARCH BAR */}
              <div className="mt-8 bg-white/95 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-white/20 shadow-2xl text-slate-800 text-left max-w-4xl mx-auto">
                
                {/* Stay Type Toggle (Harian vs Bulanan) */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setStayType('Harian')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        stayType === 'Harian' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🌙 Menginap Harian
                    </button>
                    <button
                      type="button"
                      onClick={() => setStayType('Bulanan')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        stayType === 'Bulanan' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📅 Sewa Bulanan
                    </button>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      ✓ {availableRoomsCount} Kamar Kosong Ready
                    </span>
                  </div>
                </div>

                {/* Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Check-In
                    </label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {stayType === 'Harian' ? 'Check-Out' : 'Lama Sewa'}
                    </label>
                    {stayType === 'Harian' ? (
                      <input
                        type="date"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    ) : (
                      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Minimal 1 Bulan</span>
                        <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">Fleksibel</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Jumlah Tamu
                    </label>
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    >
                      <option value={1}>1 Orang Guest</option>
                      <option value={2}>2 Orang Guest</option>
                      <option value={3}>3 Orang (Family/Group)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <a
                      href="#kamar-property"
                      className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Search className="h-4 w-4" />
                      <span>Cari Kamar Tersedia</span>
                    </a>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* ROOM CATALOG FOR ACTIVE PROPERTY */}
          <section id="kamar-property" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Katalog Kamar Ready</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Pilih Kamar {activeProperty.name}</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Transparan, bersih higienis, dan tanpa biaya tersembunyi.</p>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 px-2">Lantai:</span>
                  {['All', '1', '2'].map(flr => (
                    <button
                      key={flr}
                      onClick={() => setSelectedFloor(flr)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                        selectedFloor === flr ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {flr === 'All' ? 'Semua' : `Lt. ${flr}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Room Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPropertyRooms.map(room => {
                const isAvailable = room.status === 'Kosong';
                const dailyPrice = room.pricePerDay || 180000;
                const monthlyPrice = room.pricePerMonth || room.price;
                const activePrice = stayType === 'Harian' ? dailyPrice : monthlyPrice;

                return (
                  <div 
                    key={room.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:border-teal-300"
                  >
                    <div className="relative h-48 sm:h-52 bg-slate-100 overflow-hidden">
                      <img
                        src={room.images?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80'}
                        alt={`Kamar ${room.number}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className={`px-3 py-1 rounded-full text-xs font-black shadow-md ${
                          isAvailable ? 'bg-emerald-500 text-white' : 'bg-slate-900/80 text-white backdrop-blur-md'
                        }`}>
                          {isAvailable ? '✓ Tersedia Ready' : `Terisi (${room.status})`}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl shadow-md border border-white">
                        <span className="text-xs font-black text-slate-900">Kamar {room.number}</span>
                        <span className="text-[10px] text-slate-500 font-medium ml-1.5">({room.size})</span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-baseline justify-between mb-3 border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-2xl font-black text-teal-700">
                              Rp {activePrice.toLocaleString('id-ID')}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold ml-1">
                              /{stayType === 'Harian' ? 'malam' : 'bulan'}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                          {room.description || 'Kamar penginapan modern dengan fasilitas lengkap dan akses strategis.'}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {(room.facilities || []).slice(0, 4).map((fac, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                              {fac}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setSelectedRoomForPreview(room)}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detail</span>
                        </button>

                        <button
                          onClick={() => handleOpenBookingModal(room)}
                          disabled={!isAvailable}
                          className={`flex-1 py-2.5 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isAvailable 
                              ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/15' 
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          }`}
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>{isAvailable ? 'Pesan Sekarang' : 'Sudah Terisi'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* FACILITY HIGHLIGHTS */}
          <section className="py-14 bg-white border-t border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Kenyamanan Utama</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Fasilitas Standar {activeProperty.name}</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {(activeProperty.facilities || ['AC', 'WiFi 150 Mbps', 'Water Heater', 'Smart Key 24/7']).map((fac, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-center font-bold text-xs text-slate-800">
                    ✨ {fac}
                  </div>
                ))}
              </div>
            </div>
          </section>

        </main>
      )}

      {/* ========================================================= */}
      {/* GLOBAL BOOKING & ROOM PREVIEW MODALS */}
      {/* ========================================================= */}

      {/* ROOM PREVIEW MODAL */}
      {selectedRoomForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative h-64 bg-slate-100">
              <img
                src={selectedRoomForPreview.images?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80'}
                alt={`Kamar ${selectedRoomForPreview.number}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedRoomForPreview(null)}
                className="absolute top-4 right-4 bg-slate-950/60 text-white hover:bg-slate-950 p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-xl font-black text-slate-900">Detail Kamar {selectedRoomForPreview.number}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {selectedRoomForPreview.description || 'Kamar penginapan berdesain modern dengan fasilitas lengkap.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tarif Harian</span>
                  <span className="text-lg font-black text-teal-700">
                    Rp {(selectedRoomForPreview.pricePerDay || 180000).toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tarif Sewa Bulanan</span>
                  <span className="text-lg font-black text-emerald-700">
                    Rp {(selectedRoomForPreview.pricePerMonth || selectedRoomForPreview.price).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => setSelectedRoomForPreview(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => handleOpenBookingModal(selectedRoomForPreview)}
                  disabled={selectedRoomForPreview.status !== 'Kosong'}
                  className={`flex-1 py-3 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer ${
                    selectedRoomForPreview.status === 'Kosong' 
                      ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {selectedRoomForPreview.status === 'Kosong' ? 'Lanjut Booking Online' : 'Kamar Terisi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSTANT ONLINE BOOKING MODAL */}
      {selectedRoomForBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className="bg-gradient-to-r from-teal-800 to-emerald-800 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300">Reservasi {activeProperty.name}</span>
                <h3 className="text-lg font-black">Booking Kamar {selectedRoomForBooking.number} ({stayType})</h3>
              </div>
              <button
                onClick={() => setSelectedRoomForBooking(null)}
                className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {!bookingSubmitted ? (
                <>
                  <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-teal-900 font-bold border-b border-teal-200 pb-2">
                      <span>{activeProperty.name}</span>
                      <span>Kamar {selectedRoomForBooking.number}</span>
                    </div>

                    <div className="space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Check-In:</span>
                        <strong className="text-slate-900">{checkInDate} (14:00 WIB)</strong>
                      </div>
                      {stayType === 'Harian' && (
                        <div className="flex justify-between">
                          <span>Check-Out:</span>
                          <strong className="text-slate-900">{checkOutDate} (12:00 WIB)</strong>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Durasi Stay:</span>
                        <strong className="text-teal-800">
                          {stayType === 'Harian' ? `${durationNights} Malam` : '1 Bulan'}
                        </strong>
                      </div>
                    </div>

                    <div className="border-t border-teal-200 pt-2 flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-800">Total Biaya Sewa:</span>
                      <strong className="text-teal-700 text-base font-black">
                        Rp {(
                          stayType === 'Harian'
                            ? (selectedRoomForBooking.pricePerDay || 180000) * durationNights
                            : (selectedRoomForBooking.pricePerMonth || selectedRoomForBooking.price)
                        ).toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Formulir Tamu Pemesan</h4>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Lengkap Tamu *</label>
                      <input
                        type="text"
                        placeholder="Contoh: Dr. Rizky Ramadhan"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor WhatsApp *</label>
                        <input
                          type="text"
                          placeholder="0812xxxxxxxx"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">No. KTP / SIM (Opsional)</label>
                        <input
                          type="text"
                          placeholder="3273xxxxxxxxxxxx"
                          value={guestKtp}
                          onChange={(e) => setGuestKtp(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Metode Pembayaran</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['QRIS', 'Transfer', 'Cash'] as const).map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              paymentMethod === method 
                                ? 'bg-teal-600 text-white border-teal-600 shadow-xs' 
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {method === 'QRIS' && <QrCode className="h-3.5 w-3.5" />}
                            {method === 'Transfer' && <CreditCard className="h-3.5 w-3.5" />}
                            {method === 'Cash' && <Receipt className="h-3.5 w-3.5" />}
                            <span>{method}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex gap-3">
                    <button
                      onClick={() => setSelectedRoomForBooking(null)}
                      className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSendWhatsAppBooking}
                      disabled={!guestName || !guestPhone}
                      className={`w-2/3 py-3 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        guestName && guestPhone 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Kirim Booking via WhatsApp</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                    ✓
                  </div>
                  <h4 className="text-xl font-black text-slate-900">Pesanan WhatsApp Terkirim!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Terima kasih <strong>{guestName}</strong>. Detail reservasi kamar <strong>{selectedRoomForBooking.number}</strong> ({activeProperty.name}) telah dialihkan ke WhatsApp pengelola.
                  </p>
                  <button
                    onClick={() => setSelectedRoomForBooking(null)}
                    className="py-2.5 px-6 bg-teal-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
