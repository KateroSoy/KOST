import React, { useState } from 'react';
import { Buildings, MapPin, Phone, ChatTeardropText, Check, CalendarBlank, Users, ArrowRight, ArrowLeft, Star, WifiHigh, Wind, Bathtub, Eye, X, CheckCircle, ShieldCheck, CaretDown, CaretUp, ArrowUpRight, Armchair, House, Layout, Info, NavigationArrow, MagnifyingGlass, List } from '@phosphor-icons/react';
import { motion, useScroll, useSpring, AnimatePresence } from 'motion/react';
import { Property, Room, WebsiteConfig, Booking } from '../types';
import { TiltCard3D } from './TiltCard3D';
import { ElegantSelect } from './ElegantSelect';

/* =========================================================================
 * SHARED TYPES & PROPS
 * ========================================================================= */
interface PropertyPublicWebsiteProps {
  property: Property;
  rooms: Room[];
  websiteConfig?: WebsiteConfig;
  onBookRoom?: (bookingData: Partial<Booking>) => Promise<void>;
  onBackToDashboard?: () => void;
  backButtonLabel?: string;
  onSelectTemplate?: (templateId: 'align' | 'urban' | 'serene') => void;
  isOwnerPreview?: boolean;
}

/* =========================================================================
 * MAIN ROUTER COMPONENT & SHARED LOGIC
 * ========================================================================= */
export function PropertyPublicWebsite(props: PropertyPublicWebsiteProps) {
  const currentTemplate = props.websiteConfig?.templateId || props.property.activeTemplate || 'align';

  // Shared State
  const [moveInDate, setMoveInDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState<number>(3); 
  const [guestCount, setGuestCount] = useState<number>(1);
  
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingModalRoom, setBookingModalRoom] = useState<Room | null>(null);
  
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestNotes, setGuestNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Top scroll progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Filter rooms
  const propRooms = props.rooms.filter(r => !r.propertyId || r.propertyId === props.property.id);

  // Submit Handler
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalRoom || !guestName || !guestPhone || bookingSaving) return;

    setBookingSaving(true);
    setBookingError('');
    try {
      if (!props.onBookRoom) throw new Error('Pemesanan belum tersedia untuk properti ini.');
      await props.onBookRoom({
        propertyId: props.property.id,
        roomId: bookingModalRoom.id,
        roomType: bookingModalRoom.type,
        roomNumber: bookingModalRoom.number,
        guestName,
        guestPhone,
        guestEmail,
        moveInDate,
        durationMonths: duration,
        guestsCount: guestCount,
        totalAmount: (bookingModalRoom.pricePerMonth || bookingModalRoom.price) * duration,
        depositAmount: bookingModalRoom.pricePerMonth || bookingModalRoom.price,
        source: 'Website',
        status: 'Pending',
        notes: guestNotes || `Booking dari website publik template ${currentTemplate.toUpperCase()}`,
        createdAt: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Permintaan booking gagal dikirim.');
      setBookingSaving(false);
      return;
    }
    setBookingSaving(false);

    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setBookingModalRoom(null);
      setSelectedRoom(null);
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setGuestNotes('');
    }, 2500);
  };

  // WhatsApp Link Helper
  const waNumber = props.property.whatsapp ? props.property.whatsapp.replace(/[^0-9]/g, '') : '6281298765432';
  const cleanWaNumber = waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber;
  const waUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(`Halo ${props.property.name}, saya tertarik menanyakan ketersediaan kamar untuk sewa mulai ${moveInDate}.`)}`;

  // Bundle state for templates
  const templateProps = {
    ...props,
    scaleX,
    state: {
      moveInDate, setMoveInDate,
      duration, setDuration,
      guestCount, setGuestCount,
      bookingModalRoom, setBookingModalRoom,
      guestName, setGuestName,
      guestPhone, setGuestPhone,
      guestEmail, setGuestEmail,
      guestNotes, setGuestNotes,
      bookingSuccess,
      bookingSaving,
      bookingError,
      propRooms,
      waUrl,
      handleBookingSubmit
    }
  };

  // Route to the specific template design
  if (currentTemplate === 'urban') return <UrbanTemplate {...templateProps} />;
  if (currentTemplate === 'serene') return <SereneTemplate {...templateProps} />;
  if (currentTemplate === 'sander') return <SanderTemplate {...templateProps} />;
  if (currentTemplate === 'hearthly') return <HearthlyTemplate {...templateProps} />;
  return <AlignTemplate {...templateProps} />;
}


/* =========================================================================
 * 1. ALIGN TEMPLATE (Minimalist, Centered, Soft Beige)
 * ========================================================================= */
function AlignTemplate({ property, websiteConfig, isOwnerPreview, onBackToDashboard, backButtonLabel, state, scaleX }: any) {
  const heroImage = property.coverImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000';
  
  return (
    <div className="relative min-h-screen bg-[#F7F6F2] text-[#1A2521] font-sans antialiased overflow-x-hidden selection:bg-[#153428] selection:text-[#F7F6F2]">
      
      {/* Top Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-[#153428] z-[100] origin-left shadow-xs"
        style={{ scaleX }}
      />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#F7F6F2]/85 backdrop-blur-md border-b border-black/5">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-editorial text-xl font-bold uppercase tracking-tight text-[#153428]">{property.name}</div>
          <nav className="hidden lg:flex gap-8 text-sm font-semibold text-[#6D7772]">
            <a href="#rooms" onClick={(e) => { e.preventDefault(); document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#1A2521] transition-colors cursor-pointer">Pilihan Kamar</a>
            <a href="#amenities" onClick={(e) => { e.preventDefault(); document.getElementById('amenities')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#1A2521] transition-colors cursor-pointer">Fasilitas</a>
            <a href="#location" onClick={(e) => { e.preventDefault(); document.getElementById('location')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#1A2521] transition-colors cursor-pointer">Lokasi</a>
          </nav>
          <div className="flex gap-3 items-center">
            <motion.a 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              href={state.waUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="hidden md:flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-white border border-[#153428]/20 rounded-full hover:bg-black/5 transition-all text-[#153428] shadow-xs"
            >
              <ChatTeardropText weight="duotone" className="h-3.5 w-3.5 text-emerald-700" /> Tanya Pengelola
            </motion.a>
            {onBackToDashboard && (
              <motion.button 
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onBackToDashboard} 
                className="px-4 py-2 text-xs bg-[#153428] text-white font-bold rounded-full flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {backButtonLabel || 'Kembali'}
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20">
        {/* Hero Section with 3D Tilt View */}
        <section className="max-w-[1400px] mx-auto px-6 mb-28">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-4xl mx-auto mb-10 pt-6"
          >
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#153428] mb-3 block">
              {property.type} di {property.city}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[5rem] font-medium font-editorial leading-[1.05] tracking-tight mb-6 break-words">
              {websiteConfig?.headline || "Find a place that feels right."}
            </h1>
            <p className="text-lg text-[#6D7772] max-w-2xl mx-auto leading-relaxed">
              {websiteConfig?.subheadline || "Hunian eksklusif dengan fasilitas lengkap, desain elegan, dan kenyamanan terbaik."}
            </p>
          </motion.div>

          <TiltCard3D maxTilt={5} scale={1.01} className="w-full">
            <div className="relative h-[560px] sm:h-[620px] w-full rounded-[40px] overflow-hidden shadow-2xl border border-[rgba(23,59,48,0.1)]">
              <img src={heroImage} alt={property.name} className="w-full h-full object-cover scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />
              
              {/* Floating Property Badge */}
              <div className="absolute top-8 left-8 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-black/5 flex items-center gap-2">
                <Star weight="duotone" className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-[#1A2521]">{property.name}</span>
                <span className="text-[10px] text-[#6D7772]">★ 4.9 (Terverifikasi)</span>
              </div>

              {/* Centered Interactive Booking Bar */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-20">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-3 shadow-2xl border border-black/5 flex flex-col md:flex-row items-center gap-2"
                >
                  <div className="flex-1 flex items-center gap-3 px-4 py-2 hover:bg-[#F7F6F2] rounded-2xl cursor-pointer w-full md:w-auto transition-colors">
                    <CalendarBlank weight="duotone" className="h-5 w-5 text-[#6D7772]" />
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D7772]">Mulai Sewa</span>
                      <input type="date" value={state.moveInDate} onChange={(e) => state.setMoveInDate(e.target.value)} className="text-xs font-bold text-[#1A2521] bg-transparent outline-none cursor-pointer" />
                    </div>
                  </div>

                  <div className="hidden md:block w-px h-8 bg-black/10" />

                  <div className="flex-1 flex items-center gap-3 px-4 py-2 hover:bg-[#F7F6F2] rounded-2xl cursor-pointer w-full md:w-auto transition-colors">
                    <div className="flex flex-col text-left w-full">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D7772]">Durasi</span>
                      <ElegantSelect
                        value={state.duration}
                        onChange={(val) => state.setDuration(Number(val))}
                        options={[
                          { value: '1', label: '1 Bulan' },
                          { value: '3', label: '3 Bulan' },
                          { value: '6', label: '6 Bulan' },
                          { value: '12', label: '12 Bulan' }
                        ]}
                      />
                    </div>
                    <CaretDown weight="duotone" className="h-4 w-4 text-[#6D7772]" />
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })} 
                    className="bg-[#153428] text-white p-4 rounded-full w-full md:w-auto flex justify-center hover:bg-[#0c2018] transition-all shadow-md cursor-pointer"
                  >
                    <MagnifyingGlass weight="duotone" className="h-5 w-5" />
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </TiltCard3D>
        </section>

        {/* Rooms Section with 3D Card Hover Effects */}
        <section id="rooms" className="max-w-[1400px] mx-auto px-6 mb-32 bg-white rounded-[40px] p-10 lg:p-16 shadow-sm border border-[rgba(23,59,48,0.06)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
          >
            <div>
              <p className="text-[10px] tracking-[0.2em] font-bold text-[#6D7772] uppercase mb-2">Pilihan Unit</p>
              <h2 className="text-4xl lg:text-5xl font-medium font-editorial">Available spaces.</h2>
            </div>
            <p className="text-sm text-[#6D7772]">Pemesanan instan langsung terhubung ke pengelola.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {state.propRooms.map((room: Room, idx: number) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="h-full"
              >
                <TiltCard3D maxTilt={6} scale={1.02} className="h-full">
                  <div className="bg-[#FBF9F5] rounded-3xl p-4 border border-zinc-200/80 hover:border-[#153428]/40 hover:shadow-xl transition-all flex flex-col justify-between h-full group">
                    <div>
                      <div className="relative h-64 mb-4 overflow-hidden rounded-2xl shadow-xs">
                        <img 
                          src={room.images?.[0] || heroImage} 
                          alt={room.type} 
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700" 
                        />
                        {room.status === 'Kosong' ? (
                          <div className="absolute top-3 left-3 bg-[#153428]/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Tersedia
                          </div>
                        ) : (
                          <div className="absolute top-3 left-3 bg-zinc-800/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold">
                            Terisi
                          </div>
                        )}
                        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#153428] shadow-xs">
                          {room.size || '3.5 x 4 m'}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 px-1 gap-1">
                        <div>
                          <h3 className="font-bold text-lg text-[#1A2521] group-hover:text-[#153428] transition-colors">{room.number} — {room.type}</h3>
                          <p className="text-xs text-[#6D7772] mt-0.5">Lantai {room.floor || 1}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-[#153428]">
                            Rp {(room.pricePerMonth || room.price).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-[#6D7772] block">/bulan</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-5 px-1">
                        {(room.facilities || ['AC', 'WiFi', 'Kamar Mandi Dalam']).slice(0, 3).map((f: string) => (
                          <span key={f} className="text-[10px] bg-white border border-zinc-200 px-2 py-0.5 rounded-md font-medium text-[#4A544E]">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => state.setBookingModalRoom(room)} 
                      disabled={room.status !== 'Kosong'} 
                      className={`w-full py-3 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
                        room.status === 'Kosong' 
                          ? 'bg-[#153428] text-white hover:bg-[#0c2018]' 
                          : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                      }`}
                    >
                      {room.status === 'Kosong' ? 'Pesan Kamar Ini' : 'Kamar Penuh'}
                    </motion.button>
                  </div>
                </TiltCard3D>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Amenities Section */}
        <section id="amenities" className="max-w-[1400px] mx-auto px-6 mb-28">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h3 className="font-editorial text-3xl font-medium text-[#1A2521] mb-2">Fasilitas Lengkap untuk Kenyamanan Anda</h3>
            <p className="text-xs text-[#6D7772]">Semua kebutuhan harian sudah tersedia lengkap tanpa biaya tambahan.</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(property.facilities || ['High-speed WiFi', 'Private Bathroom', 'AC Inverter', 'Housekeeping', 'Communal Lounge', 'Smart Doorlock', 'Parkir Luas', 'Dapur Bersama']).map((fac: string, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                whileHover={{ y: -3 }}
                className="bg-white p-4 rounded-2xl border border-[rgba(23,59,48,0.08)] shadow-xs flex items-center gap-3 cursor-pointer group"
              >
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-[#153428] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle weight="duotone" className="h-4 w-4 text-emerald-700" />
                </div>
                <span className="text-xs font-semibold text-[#1A2521]">{fac}</span>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      
      {state.bookingModalRoom && <BookingModal theme="align" property={property} websiteConfig={websiteConfig} state={state} />}
    </div>
  );
}


/* =========================================================================
 * 2. URBAN TEMPLATE (Bold, Monochrome, Split-screen Hero)
 * ========================================================================= */
function UrbanTemplate({ property, websiteConfig, isOwnerPreview, onBackToDashboard, backButtonLabel, state, scaleX }: any) {
  const heroImage = property.coverImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=2000';
  
  return (
    <div className="relative min-h-screen bg-white text-zinc-900 font-sans antialiased overflow-x-hidden">
      
      {/* Top Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-black z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-black text-xl tracking-tighter uppercase">{property.name}</div>
          <nav className="hidden md:flex gap-6 text-xs font-mono uppercase tracking-widest text-zinc-500">
            <a href="#rooms" onClick={(e) => { e.preventDefault(); document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-black transition-colors cursor-pointer">Spaces</a>
            <a href="#amenities" onClick={(e) => { e.preventDefault(); document.getElementById('amenities')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-black transition-colors cursor-pointer">Features</a>
          </nav>
          <div className="flex gap-3 items-center">
            <motion.a 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              href={state.waUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="px-4 py-2 text-xs font-bold bg-zinc-100 rounded-lg hover:bg-zinc-200 uppercase transition-all"
            >
              Contact
            </motion.a>
            {onBackToDashboard && (
              <motion.button 
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onBackToDashboard} 
                className="px-4 py-2 text-xs bg-zinc-900 text-white font-bold rounded-lg uppercase flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {backButtonLabel || 'Kembali'}
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16 pb-20">
        {/* Split Hero with 3D Depth */}
        <section className="max-w-7xl mx-auto px-6 mb-24 mt-12 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-16 h-1.5 bg-black mb-8" />
            <h1 className="text-6xl sm:text-7xl font-black tracking-tighter leading-none mb-6">
              {websiteConfig?.headline || "LIVING REINVENTED."}
            </h1>
            <p className="text-zinc-500 text-lg mb-10 max-w-md leading-relaxed">
              {websiteConfig?.subheadline || "Modern aesthetics. Uncompromised comfort. Right in the heart of the city."}
            </p>
            
            <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 flex flex-col gap-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Check Availability</h3>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={state.moveInDate} onChange={(e) => state.setMoveInDate(e.target.value)} className="bg-white border border-zinc-200 rounded-lg px-4 py-3 text-xs font-bold outline-none" />
                <ElegantSelect
                  value={state.duration}
                  onChange={(val) => state.setDuration(Number(val))}
                  options={[
                    { value: '1', label: '1 Month' },
                    { value: '3', label: '3 Months' },
                    { value: '6', label: '6 Months' }
                  ]}
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })} 
                className="bg-black text-white px-6 py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all cursor-pointer shadow-md"
              >
                Explore Rooms
              </motion.button>
            </div>
          </motion.div>
          
          <TiltCard3D maxTilt={6} scale={1.02} className="h-[620px] w-full">
            <div className="h-full w-full rounded-2xl overflow-hidden relative shadow-2xl border border-zinc-200">
              <img src={heroImage} alt={property.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
              <div className="absolute top-6 right-6 bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest shadow-md">
                {property.city}
              </div>
            </div>
          </TiltCard3D>
        </section>

        {/* Rooms Grid with 3D Tilt */}
        <section id="rooms" className="bg-zinc-50 border-y border-zinc-200 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-black tracking-tighter uppercase mb-12">Select your space.</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.propRooms.map((room: Room, idx: number) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  <TiltCard3D maxTilt={5} scale={1.015}>
                    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col sm:flex-row group cursor-pointer shadow-xs hover:shadow-xl transition-all">
                      <div className="sm:w-1/2 h-64 sm:h-auto relative overflow-hidden">
                        <img src={room.images?.[0] || heroImage} alt={room.type} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        {room.status === 'Kosong' && (
                          <div className="absolute top-4 left-4 bg-white text-black px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                            Available
                          </div>
                        )}
                      </div>
                      <div className="sm:w-1/2 p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="font-black text-2xl mb-1">{room.type}</h3>
                          <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{room.description || "Spacious, modern, minimalist."}</p>
                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {(room.facilities || []).slice(0, 3).map(f => (
                              <span key={f} className="text-[10px] bg-zinc-100 px-2 py-1 rounded font-bold uppercase">{f}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="font-black text-2xl mb-4">Rp {(room.pricePerMonth || room.price).toLocaleString('id-ID')}</div>
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => state.setBookingModalRoom(room)} 
                            disabled={room.status !== 'Kosong'} 
                            className={`w-full py-3 text-xs font-black uppercase tracking-widest rounded-lg cursor-pointer ${
                              room.status === 'Kosong' ? 'bg-black text-white hover:bg-zinc-800' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                            }`}
                          >
                            {room.status === 'Kosong' ? 'Book Now' : 'Waitlist'}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </TiltCard3D>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      {state.bookingModalRoom && <BookingModal theme="urban" property={property} websiteConfig={websiteConfig} state={state} />}
    </div>
  );
}


/* =========================================================================
 * 3. SERENE TEMPLATE (Nature-inspired, Overlapping, Sage Green)
 * ========================================================================= */
function SereneTemplate({ property, websiteConfig, isOwnerPreview, onBackToDashboard, backButtonLabel, state, scaleX }: any) {
  const heroImage = property.coverImage || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000';
  
  return (
    <div className="relative min-h-screen bg-[#FAF8F5] text-[#315A49] font-sans antialiased overflow-x-hidden">
      
      {/* Top Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-[#315A49] z-[100] origin-left shadow-xs"
        style={{ scaleX }}
      />

      {/* Header */}
      <header className="absolute top-0 inset-x-0 z-50 px-6 pt-6">
        <div className="max-w-[1200px] mx-auto bg-white/80 backdrop-blur-xl h-16 rounded-full px-6 flex items-center justify-between shadow-sm border border-[#315A49]/10">
          <div className="font-editorial text-xl font-bold tracking-tight text-[#234335]">{property.name}</div>
          <div className="flex gap-3 items-center">
            <motion.a 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              href={state.waUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="px-5 py-2 text-xs font-semibold bg-[#EAE4D9] text-[#315A49] rounded-full hover:bg-[#D8CEB8] transition-all"
            >
              Connect
            </motion.a>
            {onBackToDashboard && (
              <motion.button 
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onBackToDashboard} 
                className="px-4 py-2 text-xs bg-[#173B30] text-[#F5F1E8] font-bold rounded-full flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {backButtonLabel || 'Kembali'}
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className="pb-20">
        {/* Overlapping Hero with 3D Depth */}
        <section className="relative pt-6 px-6 max-w-[1400px] mx-auto mb-28">
          <TiltCard3D maxTilt={4} scale={1.01} className="w-full">
            <div className="h-[75vh] w-full rounded-[3rem] overflow-hidden relative shadow-2xl border border-[#315A49]/10">
              <img src={heroImage} alt={property.name} className="w-full h-full object-cover scale-105" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/65" />
              
              <div className="absolute bottom-16 left-12 lg:left-24 text-white z-10 max-w-2xl">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-5xl md:text-7xl font-editorial mb-4 leading-tight"
                >
                  {websiteConfig?.headline || "Find your peace in the city."}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-white/85 text-lg max-w-md leading-relaxed"
                >
                  {websiteConfig?.subheadline || "Naturally designed spaces for mindful living."}
                </motion.p>
              </div>
            </div>
          </TiltCard3D>
          
          {/* Overlapping Booking Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-4xl mx-auto -mt-12 relative z-20 px-4"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-4 shadow-2xl border border-[#315A49]/10 flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 flex flex-col px-4 w-full md:w-auto">
                <span className="text-xs font-semibold text-[#8B9A89] mb-1">Mulai Tanggal</span>
                <input type="date" value={state.moveInDate} onChange={(e) => state.setMoveInDate(e.target.value)} className="text-xs font-bold text-[#315A49] outline-none bg-transparent cursor-pointer" />
              </div>
              <div className="w-px h-10 bg-[#EAE4D9] hidden md:block" />
              <div className="flex-1 flex flex-col px-4 w-full md:w-auto">
                <span className="text-xs font-semibold text-[#8B9A89] mb-1">Durasi Sewa</span>
                <ElegantSelect
                  value={state.duration}
                  onChange={(val) => state.setDuration(Number(val))}
                  options={[
                    { value: '1', label: '1 Bulan' },
                    { value: '3', label: '3 Bulan' },
                    { value: '6', label: '6 Bulan' }
                  ]}
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })} 
                className="bg-[#4A7055] text-white px-8 py-4 rounded-full font-bold hover:bg-[#315A49] shadow-lg w-full md:w-auto transition-all cursor-pointer text-xs uppercase tracking-wider"
              >
                Cek Kamar
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* Serene Rooms with 3D Image Focus */}
        <section id="rooms" className="max-w-[1200px] mx-auto px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-editorial text-[#234335] text-center mb-16"
          >
            Spaces that breathe.
          </motion.h2>
          
          <div className="space-y-20">
            {state.propRooms.map((room: Room, i: number) => (
              <motion.div 
                key={room.id} 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8 }}
                className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
              >
                <div className="w-full lg:w-1/2">
                  <TiltCard3D maxTilt={6} scale={1.02}>
                    <div className="h-[400px] rounded-[2.5rem] overflow-hidden shadow-xl border border-[#315A49]/10">
                      <img src={room.images?.[0] || heroImage} alt={room.type} className="w-full h-full object-cover hover:scale-108 transition-transform duration-1000" />
                    </div>
                  </TiltCard3D>
                </div>

                <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 lg:px-12">
                  {room.status === 'Kosong' && (
                    <span className="text-xs font-bold tracking-widest text-[#4A7055] uppercase mb-4 block">Ready to move in</span>
                  )}
                  <h3 className="font-editorial text-4xl text-[#234335] mb-4">{room.type} Haven</h3>
                  <p className="text-[#8B9A89] mb-8 leading-relaxed text-sm">
                    {room.description || "Bathed in natural light, this space is designed to help you recharge and find balance after a long day in the city."}
                  </p>
                  <div className="flex items-center gap-4 mb-8 border-b border-[#EAE4D9] pb-8">
                    <span className="text-3xl font-editorial text-[#234335]">Rp {(room.pricePerMonth || room.price).toLocaleString('id-ID')}</span>
                    <span className="text-[#8B9A89] text-xs">/ bulan</span>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => state.setBookingModalRoom(room)} 
                    disabled={room.status !== 'Kosong'} 
                    className={`py-4 rounded-full font-bold text-center w-full max-w-[200px] cursor-pointer text-xs transition-all ${
                      room.status === 'Kosong' ? 'bg-[#4A7055] text-white hover:bg-[#315A49] shadow-md' : 'bg-[#EAE4D9] text-[#8B9A89] cursor-not-allowed'
                    }`}
                  >
                    {room.status === 'Kosong' ? 'Reserve Space' : 'Waitlist'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      
      {state.bookingModalRoom && <BookingModal theme="serene" property={property} websiteConfig={websiteConfig} state={state} />}
    </div>
  );
}


/* =========================================================================
 * SHARED BOOKING MODAL WITH 3D DEPTH
 * ========================================================================= */
function BookingModal({ theme, property, state }: any) {
  const isUrban = theme === 'urban';
  const isSerene = theme === 'serene';

  const styles = {
    overlay: "fixed inset-0 z-[100] flex items-center justify-center p-4",
    bg: "absolute inset-0 bg-black/60 backdrop-blur-sm",
    modal: `w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl flex flex-col md:flex-row ${
      isUrban ? 'bg-white rounded-xl' : isSerene ? 'bg-[#FAF8F5] rounded-[2rem]' : 'bg-white rounded-3xl'
    }`,
    leftPanel: `w-full md:w-5/12 p-6 flex flex-col ${
      isUrban ? 'bg-zinc-50 border-r border-zinc-200' : isSerene ? 'bg-[#F4F0E8] rounded-l-[2rem]' : 'bg-zinc-50 border-r border-black/10'
    }`,
    title: `font-bold ${isUrban ? 'text-xl uppercase tracking-tighter' : 'text-xl font-editorial text-[#234335]'}`,
    btnPrimary: isUrban ? 'bg-black text-white rounded-lg hover:bg-zinc-800' : isSerene ? 'bg-[#4A7055] text-white rounded-full hover:bg-[#315A49]' : 'bg-[#153428] text-white rounded-full hover:bg-[#0c2018]',
    input: `w-full px-4 py-3 bg-transparent text-xs focus:outline-none transition-colors ${
      isUrban ? 'border border-zinc-300 rounded-lg focus:border-black' : isSerene ? 'border border-[#C2CDBF] rounded-xl focus:border-[#4A7055]' : 'border border-black/10 rounded-xl focus:border-[#153428]'
    }`
  };

  return (
    <div className={styles.overlay}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={styles.bg} 
        onClick={() => state.setBookingModalRoom(null)} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={styles.modal}
      >
        {/* Left Info Panel */}
        <div className={styles.leftPanel}>
          <div className="h-32 rounded-xl overflow-hidden mb-4 shadow-xs">
            <img src={state.bookingModalRoom.images?.[0] || property.coverImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000'} alt="Room" className="w-full h-full object-cover" />
          </div>
          
          <h4 className={styles.title}>{state.bookingModalRoom.type} Room</h4>
          <p className="text-[11px] text-zinc-500 mb-4">{property.city}</p>

          <div className="space-y-2 mt-auto text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Harga / bln</span>
              <span className="font-bold">Rp {(state.bookingModalRoom.pricePerMonth || state.bookingModalRoom.price).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Durasi</span>
              <span className="font-bold">{state.duration} Bulan</span>
            </div>
            <div className="pt-2 border-t border-black/10 flex justify-between mt-2 text-sm">
              <span className="font-bold">Estimasi Total</span>
              <span className="font-bold text-[#153428]">Rp {((state.bookingModalRoom.pricePerMonth || state.bookingModalRoom.price) * state.duration).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col relative">
          <button onClick={() => state.setBookingModalRoom(null)} className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:bg-black/5 rounded-full cursor-pointer">
            <X weight="duotone" className="h-4 w-4" />
          </button>

          <h3 className={`${styles.title} mb-6`}>Form Reservasi Hunian</h3>
          
          {state.bookingSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in py-10">
              <CheckCircle weight="duotone" className={`h-12 w-12 mb-4 ${isUrban ? 'text-black' : isSerene ? 'text-[#4A7055]' : 'text-[#153428]'}`} />
              <h4 className="text-xl font-bold mb-2">Permintaan Terkirim!</h4>
              <p className="text-xs text-zinc-500 max-w-xs">Pengelola hunian akan segera menghubungi nomor WhatsApp Anda untuk konfirmasi pemesanan.</p>
            </div>
          ) : (
            <form onSubmit={state.handleBookingSubmit} className="space-y-3.5 flex-1">
              {state.bookingError && <p role="alert" className="text-xs text-rose-700">{state.bookingError}</p>}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Nama Lengkap *</label>
                <input required value={state.guestName} onChange={e => state.setGuestName(e.target.value)} className={styles.input} placeholder="Contoh: Budi Pratama" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Nomor WhatsApp *</label>
                  <input required value={state.guestPhone} onChange={e => state.setGuestPhone(e.target.value)} className={styles.input} placeholder="081234567890" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Email</label>
                  <input type="email" value={state.guestEmail} onChange={e => state.setGuestEmail(e.target.value)} className={styles.input} placeholder="email@anda.com" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Catatan Tambahan</label>
                <textarea rows={2} value={state.guestNotes} onChange={e => state.setGuestNotes(e.target.value)} className={`${styles.input} resize-none`} placeholder="Perkiraan jam check-in, parkir kendaraan..."></textarea>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={state.bookingSaving}
                className={`w-full py-3.5 mt-2 font-bold text-xs shadow-md cursor-pointer ${styles.btnPrimary}`}
              >
                {state.bookingSaving ? 'Mengirim...' : 'Kirim Permintaan Sewa'}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* =========================================================================
 * 4. SANDER TEMPLATE (Ultra Modern & Luxury Dubai Style)
 * ========================================================================= */
function SanderTemplate({ property, websiteConfig, isOwnerPreview, onBackToDashboard, backButtonLabel, state, scaleX }: any) {
  const heroImage = property.coverImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000';
  
  // Split property name into two parts for the massive background text
  const nameParts = property.name ? property.name.split(' ') : ['SANDER', 'HOUSE'];
  const firstWord = nameParts[0] || 'SANDER';
  const secondWord = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'HOUSE';

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-white font-sans antialiased selection:bg-white selection:text-black flex flex-col items-center p-4 sm:p-6 lg:p-8 space-y-24">
      
      {/* Top Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-white z-[100] origin-left shadow-xs"
        style={{ scaleX }}
      />

      {/* Main Container Frame */}
      <div className="relative w-full max-w-[1600px] min-h-[90vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt="Property" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/10" /> {/* Subtle overlay for text readability */}
        </div>

        {/* Massive Background Typography */}
        <div className="absolute top-[30%] left-0 w-full z-10 flex items-center justify-center gap-4 md:gap-12 pointer-events-none opacity-30 overflow-hidden transform -translate-y-1/2">
          <span className="text-[10vw] md:text-[12vw] lg:text-[14vw] font-thin tracking-tighter leading-none text-white mix-blend-overlay whitespace-nowrap">
            {firstWord.toUpperCase()}
          </span>
          <div className="flex flex-col items-center mt-[-4vw]">
             <span className="text-xl md:text-2xl font-light border border-white/50 rounded-full h-10 w-10 md:h-16 md:w-16 flex items-center justify-center mix-blend-overlay">C</span>
          </div>
          <span className="text-[10vw] md:text-[12vw] lg:text-[14vw] font-thin tracking-tighter leading-none text-white mix-blend-overlay whitespace-nowrap">
            {secondWord.toUpperCase()}
          </span>
        </div>

        {/* Header */}
        <header className="relative z-50 px-8 lg:px-12 py-8 flex items-center justify-between w-full">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-3xl font-light tracking-widest uppercase relative border-b-2 border-white/50 pb-1 pr-6">
              {firstWord.slice(0,3)}
              <div className="absolute top-1/2 left-2 w-full h-[1px] bg-white transform -translate-y-1/2"></div>
            </span>
          </div>

          {/* Center Navigation */}
          <nav className="hidden lg:flex items-center gap-10 text-sm font-medium tracking-wide">
            <a href="#gallery" className="hover:opacity-70 transition-opacity">Gallery</a>
            <a href="#about" className="hover:opacity-70 transition-opacity">About Us</a>
            <a href="#rooms" onClick={(e) => { e.preventDefault(); document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:opacity-70 transition-opacity">Apartments</a>
            <a href="#contact" className="hover:opacity-70 transition-opacity">Contact Us</a>
            <a href="#location" onClick={(e) => { e.preventDefault(); document.getElementById('location')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:opacity-70 transition-opacity">Location</a>
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <span className="tracking-widest">EN | UA</span>
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={state.waUrl}
              target="_blank"
              className="flex items-center gap-3 bg-white text-black px-6 py-2.5 rounded-full shadow-lg"
            >
              <span className="font-bold">{property.whatsapp || '+92 319 949 2066'}</span>
              <div className="bg-black text-white p-1.5 rounded-full flex items-center justify-center">
                <Phone weight="duotone" className="h-4 w-4" />
              </div>
            </motion.a>
            {onBackToDashboard && (
              <button onClick={onBackToDashboard} className="ml-2 text-xs font-bold bg-black/50 backdrop-blur-md px-4 py-2.5 rounded-full hover:bg-black/70 transition-colors">
                Back
              </button>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button className="lg:hidden text-white">
            <List weight="duotone" className="h-8 w-8" />
          </button>
        </header>

        {/* Main Hero Content */}
        <div className="relative z-40 flex-1 flex flex-col justify-end pb-12 px-6 sm:px-8 lg:px-12 w-full mt-20">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between w-full gap-10">
            
            {/* Left Content */}
            <div className="max-w-xl space-y-6 w-full">
              <div className="text-sm font-medium tracking-widest opacity-90 mb-2">Y219</div>
              <h1 className="text-[2.5rem] leading-[1] sm:text-5xl lg:text-7xl font-light tracking-tight break-words">
                WHERE <br />
                TRANQUILITY MEETS <br />
                MODERN LIVING
              </h1>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-4 bg-white text-black px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase mt-6"
              >
                VIEW LAYOUTS
                <div className="h-2 w-2 rounded-full bg-black ml-2" />
              </motion.button>
              
              <div className="pt-10 text-[10px] font-medium tracking-widest uppercase leading-relaxed max-w-[200px] opacity-80">
                PREMIUM RESIDENCE<br/>IN {property.city?.toUpperCase() || 'THE CITY'}.<br/>{property.address?.split(',')[0]?.toUpperCase() || 'STRATEGIC LOCATION'}
              </div>
            </div>

            {/* Right Content */}
            <div className="flex flex-col items-end gap-16">
              
              {/* Top Right Text */}
              <div className="flex items-center gap-4 hidden lg:flex">
                <Star weight="duotone" className="h-8 w-8 text-white animate-spin-slow opacity-80" />
                <div className="text-sm font-medium tracking-widest uppercase text-right leading-tight opacity-90">
                  WE PROVIDE<br />MODERN SPACES<br />IN {property.city?.toUpperCase() || 'YOUR CITY'}
                </div>
              </div>

              {/* Bottom Right Card */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white text-black p-6 rounded-[24px] max-w-sm w-full shadow-2xl relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-4xl font-bold tracking-tight">400+</h3>
                  <div className="bg-black text-white p-2 rounded-full transform -rotate-45 cursor-pointer hover:scale-110 transition-transform">
                    <ArrowRight weight="duotone" className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed mb-6 break-words">
                  clients have already received our work from worldwide.
                </p>
                <div className="flex items-center -space-x-3">
                  <img src="https://i.pravatar.cc/100?img=1" className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="Client 1" />
                  <img src="https://i.pravatar.cc/100?img=2" className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="Client 2" />
                  <img src="https://i.pravatar.cc/100?img=3" className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="Client 3" />
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Rooms Section (Hidden below fold, accessed via 'View Layouts') */}
      <section id="rooms" className="w-full max-w-[1600px] mx-auto py-32 px-8 lg:px-12 text-black bg-[#F0F2F5]">
        <div className="text-center mb-16 px-4">
          <h2 className="text-[2rem] sm:text-4xl lg:text-5xl font-light tracking-tight mb-4 break-words">Discover Our Layouts</h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-xl mx-auto break-words">Explore premium living spaces designed for ultimate comfort and modern luxury.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {state.propRooms.map((room: Room) => (
            <TiltCard3D key={room.id} className="h-full">
              <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-black/5 h-full flex flex-col group cursor-pointer" onClick={() => state.setBookingModalRoom(room)}>
                <div className="h-64 relative overflow-hidden">
                  <img src={room.images?.[0] || heroImage} alt={room.type} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm">
                    {room.type}
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-light mb-2">{room.type} Suite</h3>
                  <div className="flex gap-4 text-zinc-500 text-sm mb-6">
                    <span className="flex items-center gap-1.5"><Layout weight="duotone" className="h-4 w-4"/> {room.facilities.length} Fac.</span>
                    <span className="flex items-center gap-1.5"><Users weight="duotone" className="h-4 w-4"/> 2 Guests</span>
                  </div>
                  <div className="mt-auto flex items-end justify-between">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Starting from</p>
                      <p className="text-2xl font-bold">Rp {(room.pricePerMonth || room.price).toLocaleString('id-ID')}<span className="text-sm font-normal text-zinc-500">/mo</span></p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center transform -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                      <ArrowRight weight="duotone" className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard3D>
          ))}
          {state.propRooms.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-black/5">
              <Armchair weight="duotone" className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 font-medium">No layouts available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      <AnimatePresence>
        {state.bookingModalRoom && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => state.setBookingModalRoom(null)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative bg-white text-black w-full max-w-md rounded-[32px] p-8 shadow-2xl">
              <button onClick={() => state.setBookingModalRoom(null)} className="absolute top-6 right-6 text-zinc-400 hover:text-black transition-colors">
                <X weight="duotone" className="h-6 w-6" />
              </button>
              <h3 className="text-3xl font-light mb-2">Book Suite</h3>
              <p className="text-zinc-500 mb-8">{state.bookingModalRoom.type} • Rp {(state.bookingModalRoom.pricePerMonth || state.bookingModalRoom.price).toLocaleString('id-ID')}/mo</p>
              
              {state.bookingSuccess ? (
                <div className="text-center py-10">
                  <CheckCircle weight="duotone" className="h-16 w-16 text-black mx-auto mb-4" />
                  <h4 className="text-2xl font-bold mb-2">Request Sent!</h4>
                  <p className="text-zinc-500">We will contact you via WhatsApp shortly to confirm your booking.</p>
                </div>
              ) : (
                <form onSubmit={state.handleBookingSubmit} className="space-y-6">
                  {state.bookingError && <p role="alert" className="text-sm text-rose-700">{state.bookingError}</p>}
                  <div>
                    <input required value={state.guestName} onChange={e => state.setGuestName(e.target.value)} className="w-full bg-[#F0F2F5] rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-black transition-all" placeholder="Full Name *" />
                  </div>
                  <div>
                    <input required value={state.guestPhone} onChange={e => state.setGuestPhone(e.target.value)} className="w-full bg-[#F0F2F5] rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-black transition-all" placeholder="WhatsApp Number *" />
                  </div>
                  <div>
                    <input type="email" value={state.guestEmail} onChange={e => state.setGuestEmail(e.target.value)} className="w-full bg-[#F0F2F5] rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-black transition-all" placeholder="Email Address" />
                  </div>
                  <button type="submit" disabled={state.bookingSaving} className="w-full bg-black text-white rounded-xl py-4 font-bold text-sm tracking-widest uppercase hover:bg-zinc-800 transition-colors">
                    {state.bookingSaving ? 'Sending...' : 'Submit Request'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}


/* =========================================================================
 * 5. HEARTHLY TEMPLATE (Minimalist Brutalist & High Contrast)
 * ========================================================================= */
function HearthlyTemplate({ property, websiteConfig, isOwnerPreview, onBackToDashboard, backButtonLabel, state, scaleX }: any) {
  const heroImage = property.coverImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000';
  const nameText = property.name?.toUpperCase() || 'HEARTHLY';

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased selection:bg-black selection:text-white">
      
      {/* Top Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-black z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <header className="absolute top-0 inset-x-0 z-50 p-6 sm:p-10 flex justify-between items-center text-white mix-blend-difference">
        <div className="font-black text-xl tracking-tighter uppercase flex items-center gap-2">
          <div className="w-4 h-4 bg-white transform -skew-x-12"></div>
          {nameText}
        </div>
        <div className="flex items-center gap-6">
          {onBackToDashboard && (
            <button onClick={onBackToDashboard} className="text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
              Back
            </button>
          )}
          <List weight="duotone" className="h-6 w-6 cursor-pointer hover:opacity-70 transition-opacity" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] w-full flex flex-col justify-center overflow-hidden bg-zinc-900 pb-20">
        <img src={heroImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover scale-105 opacity-80" />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10 px-6 sm:px-12 md:px-20 mt-32 mb-10 max-w-[1400px]">
          <motion.h1 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl sm:text-[6rem] lg:text-[9vw] font-black tracking-tighter leading-[0.9] text-white uppercase break-words drop-shadow-2xl"
          >
            {websiteConfig?.headline?.split(' ')[0] || "INTERIOR"}<br/>
            {websiteConfig?.headline?.split(' ').slice(1).join(' ') || "DESIGN"}
          </motion.h1>
        </div>

        {/* Floating bottom nav/data */}
        <div className="absolute bottom-10 inset-x-6 sm:inset-x-12 flex justify-between text-white/80 text-[10px] font-bold tracking-widest uppercase mix-blend-overlay">
          <span>{property.city || 'LOCATION'}</span>
          <span>{property.type || 'RESIDENCE'}</span>
          <span className="hidden sm:block">SCROLL DOWN</span>
        </div>
      </section>

      {/* Manifesto / About Section */}
      <section className="py-24 sm:py-40 px-6 sm:px-12 md:px-20 max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-32">
        <div className="md:w-1/3">
          <h2 className="text-[10px] font-bold tracking-widest uppercase mb-4 text-black/50">Transforming spaces</h2>
        </div>
        <div className="md:w-2/3 space-y-8">
          <h3 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            {websiteConfig?.subheadline || "Transforming spaces into living masterpieces."}
          </h3>
          <p className="text-sm font-medium leading-relaxed max-w-xl text-black/80">
            {property.description || "We blend architectural precision with unparalleled comfort. Discover spaces designed not just to be inhabited, but to be truly experienced."}
          </p>
        </div>
      </section>

      {/* Wide Image Break */}
      <section className="w-full px-4 sm:px-10">
        <div className="w-full h-[40vh] sm:h-[60vh] overflow-hidden bg-zinc-100">
          <img src={state.propRooms[0]?.images?.[0] || heroImage} alt="Break" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
        </div>
      </section>

      {/* Massive Quote */}
      <section className="py-32 sm:py-48 px-6 sm:px-12 text-center flex flex-col items-center justify-center max-w-5xl mx-auto">
        <span className="text-8xl font-serif leading-none h-12 text-black/20">“</span>
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] my-8">
          Design shapes spaces, comfort, and daily life.
        </h2>
        <span className="text-8xl font-serif leading-none h-12 self-end mt-4 text-black/20">”</span>
      </section>

      {/* Asymmetrical Rooms / Offerings */}
      <section id="rooms" className="py-20 px-6 sm:px-12 max-w-[1600px] mx-auto border-t-2 border-black pt-24 sm:pt-32">
        <div className="flex justify-between items-end mb-20">
          <h2 className="text-6xl sm:text-8xl font-black tracking-tighter uppercase leading-none">Our<br/>Spaces</h2>
          <motion.button 
            whileHover={{ x: 10 }}
            onClick={() => window.open(state.waUrl, '_blank')}
            className="text-xs font-bold uppercase tracking-widest flex items-center gap-4 hover:opacity-50 transition-opacity"
          >
            INQUIRE NOW <ArrowRight weight="duotone" className="h-4 w-4" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24 mt-20">
          {state.propRooms.map((room: Room, idx: number) => (
            <div key={room.id} className={`flex flex-col ${idx % 2 !== 0 ? 'md:mt-32' : ''}`}>
              <div className="w-full aspect-[4/5] bg-zinc-100 overflow-hidden mb-6 relative group cursor-pointer" onClick={() => state.setBookingModalRoom(room)}>
                <img src={room.images?.[0] || heroImage} alt={room.type} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-500">
                  <div className="bg-white text-black px-6 py-3 font-bold text-xs uppercase tracking-widest border-2 border-transparent group-hover:border-black">
                    Book Now
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">{room.type}</h3>
                  <div className="flex flex-wrap gap-3 text-xs font-bold text-black/60 uppercase tracking-widest">
                    <span>{room.size || 'STUDIO'}</span>
                    <span>•</span>
                    <span>{room.facilities?.[0] || 'FURNISHED'}</span>
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-xl font-black">Rp {(room.pricePerMonth || room.price).toLocaleString('id-ID')}</div>
                  <div className="text-[10px] font-bold text-black/50 uppercase tracking-widest">/ MONTH</div>
                </div>
              </div>
            </div>
          ))}
          {state.propRooms.length === 0 && (
            <div className="col-span-full py-20 text-center border-y-2 border-black">
              <p className="text-2xl font-bold uppercase tracking-tighter">No spaces currently listed.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-20 px-6 sm:px-12 mt-32">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
          <div>
            <div className="font-black text-3xl tracking-tighter uppercase mb-6 flex items-center gap-2">
              <div className="w-3 h-3 bg-white transform -skew-x-12"></div>
              {nameText}
            </div>
            <p className="text-xs font-medium text-white/50 max-w-xs leading-relaxed">
              {property.address}<br/>{property.city}, {property.province}
            </p>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest flex flex-col gap-4 md:text-right">
            <a href={state.waUrl} target="_blank" className="hover:text-white/60 transition-colors">WhatsApp</a>
            <span className="text-white/30 mt-4">© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

      {/* Brutalist Booking Modal */}
      <AnimatePresence>
        {state.bookingModalRoom && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => state.setBookingModalRoom(null)} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="relative bg-white text-black w-full max-w-2xl p-8 sm:p-16 rounded-none shadow-2xl border-4 border-black max-h-[90vh] overflow-y-auto">
              
              <button onClick={() => state.setBookingModalRoom(null)} className="absolute top-6 right-6 hover:rotate-90 transition-transform duration-300">
                <X weight="duotone" className="h-10 w-10 stroke-[1.5]" />
              </button>
              
              <div className="mb-12">
                <h3 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase leading-none mb-4 break-words">Reserve<br/>Space</h3>
                <div className="h-1 w-20 bg-black"></div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4 pb-8 border-b-2 border-black">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-black/50 mb-1">SELECTED SPACE</div>
                  <div className="text-2xl font-bold uppercase tracking-tight">{state.bookingModalRoom.type}</div>
                </div>
                <div className="sm:text-right">
                  <div className="text-3xl font-black">Rp {(state.bookingModalRoom.pricePerMonth || state.bookingModalRoom.price).toLocaleString('id-ID')}</div>
                </div>
              </div>
              
              {state.bookingSuccess ? (
                <div className="text-center py-20 bg-zinc-100 border-2 border-black">
                  <CheckCircle weight="duotone" className="h-20 w-20 mx-auto mb-6 stroke-1" />
                  <h4 className="text-4xl font-black tracking-tighter uppercase mb-2">Confirmed</h4>
                  <p className="text-sm font-bold text-black/60 uppercase tracking-widest">Expect our dispatch shortly.</p>
                </div>
              ) : (
                <form onSubmit={state.handleBookingSubmit} className="space-y-6">
                  {state.bookingError && <p role="alert" className="text-sm text-rose-700">{state.bookingError}</p>}
                  <div className="space-y-6">
                    <input required value={state.guestName} onChange={e => state.setGuestName(e.target.value)} className="w-full bg-transparent border-b-2 border-black px-0 py-4 outline-none focus:border-black/50 text-xl font-bold placeholder-black/30 transition-colors rounded-none" placeholder="FULL NAME" />
                    <input required value={state.guestPhone} onChange={e => state.setGuestPhone(e.target.value)} className="w-full bg-transparent border-b-2 border-black px-0 py-4 outline-none focus:border-black/50 text-xl font-bold placeholder-black/30 transition-colors rounded-none" placeholder="WHATSAPP NUMBER" />
                    <input type="email" value={state.guestEmail} onChange={e => state.setGuestEmail(e.target.value)} className="w-full bg-transparent border-b-2 border-black px-0 py-4 outline-none focus:border-black/50 text-xl font-bold placeholder-black/30 transition-colors rounded-none" placeholder="EMAIL (OPTIONAL)" />
                  </div>
                  <button type="submit" disabled={state.bookingSaving} className="w-full bg-black text-white py-6 font-black text-xl tracking-tighter uppercase hover:bg-white hover:text-black hover:shadow-[0_0_0_4px_black_inset] transition-all mt-8">
                    {state.bookingSaving ? 'Sending...' : 'Submit Request'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
