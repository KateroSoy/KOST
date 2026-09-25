import React, { useEffect, useState } from 'react';
import { Buildings, MagnifyingGlass, MapPin, CalendarBlank, Users, CaretDown, Star, Heart, ArrowRight, ArrowUpRight, ShieldCheck, WifiHigh, Armchair, CheckCircle, Globe, House, Compass, Stack } from '@phosphor-icons/react';
import { motion, useScroll, useSpring } from 'motion/react';
import { PropertyType } from '../types';
import { INITIAL_PROPERTIES, INITIAL_ROOMS } from '../data';
import { fetchPublicListings, ListingFilters, PublicListing } from '../api';
import { TiltCard3D } from './TiltCard3D';

interface LandingPageProps {
  onStartDemo: () => void;
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onViewPropertyWebsite?: (propId: string) => void;
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'Kost', label: 'Kost' },
  { value: 'Coliving', label: 'Coliving' },
  { value: 'Apartemen', label: 'Apartemen' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Guest House', label: 'Guest House' },
  { value: 'Homestay', label: 'Homestay' },
  { value: 'Small Hotel', label: 'Small Hotel' },
];

const DESTINATIONS = [
  { label: 'Yogyakarta', query: 'Yogyakarta' },
  { label: 'Jakarta', query: 'Jakarta' },
  { label: 'Bali (Canggu & Ubud)', query: 'Bali' },
  { label: 'Bandung', query: 'Bandung' },
];

// Demo catalog shown only when no owner has published a website yet (or the API is down).
// Mirrors the backend's listing rules so filtering behaves the same.
const DEMO_LISTINGS: PublicListing[] = INITIAL_PROPERTIES.map(p => {
  const free = INITIAL_ROOMS.filter(r => r.propertyId === p.id && r.status === 'Kosong');
  const supports = (r: typeof free[number], kind: 'Bulanan' | 'Harian') =>
    r.rentalTypesAllowed?.length ? r.rentalTypesAllowed.includes(kind)
      : kind === 'Harian' ? (r.pricePerDay || 0) > 0 : (r.pricePerMonth || r.price) > 0;
  const monthly = free.filter(r => supports(r, 'Bulanan'));
  const daily = free.filter(r => supports(r, 'Harian'));
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    city: p.city,
    address: p.address,
    coverImage: p.coverImage,
    facilities: (p.facilities || []).slice(0, 6),
    availableRooms: free.length,
    startPriceMonth: monthly.length ? Math.min(...monthly.map(r => r.pricePerMonth || r.price)) : p.startPriceMonth,
    startPriceDay: daily.length ? Math.min(...daily.map(r => r.pricePerDay || 0)) : p.startPriceDay,
    rentalTypes: [...(monthly.length ? ['Bulanan' as const] : []), ...(daily.length ? ['Harian' as const] : [])],
  };
});

const filterListings = (list: PublicListing[], f: ListingFilters) => {
  const q = (f.q || '').trim().toLowerCase();
  return list.filter(l =>
    (!q || [l.name, l.city, l.address].some(v => (v || '').toLowerCase().includes(q))) &&
    (!f.type || l.type === f.type) &&
    (!f.duration || l.rentalTypes.includes(f.duration)));
};

const formatIDR = (n?: number | null) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

export function LandingPage({
  onStartDemo,
  onGoToLogin,
  onGoToRegister,
  onViewPropertyWebsite,
}: LandingPageProps) {

  // Search form fields, and the filters of the search currently shown.
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [duration, setDuration] = useState<ListingFilters['duration']>('');
  const [applied, setApplied] = useState<ListingFilters | null>(null);
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [isDemoCatalog, setIsDemoCatalog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [catalogSize, setCatalogSize] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchPublicListings()
      .then(rows => {
        if (cancelled) return;
        setIsDemoCatalog(rows.length === 0);
        setListings(rows.length ? rows : DEMO_LISTINGS);
        setCatalogSize(rows.length || DEMO_LISTINGS.length);
      })
      .catch(() => { if (!cancelled) { setIsDemoCatalog(true); setListings(DEMO_LISTINGS); setCatalogSize(DEMO_LISTINGS.length); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const scrollToResults = () => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });

  const runSearch = async (filters: ListingFilters) => {
    setQ(filters.q || '');
    setType(filters.type || '');
    setDuration(filters.duration || '');
    const active = filters.q?.trim() || filters.type || filters.duration ? filters : null;
    setApplied(active);
    setLoading(true);
    scrollToResults();
    try {
      if (isDemoCatalog) {
        setListings(filterListings(DEMO_LISTINGS, filters));
      } else {
        setListings(await fetchPublicListings(filters));
      }
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch({ q, type, duration });
  };

  const resetSearch = () => runSearch({});
  const featured = listings[0];

  // Minimalist top scroll progress indicator
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="relative min-h-screen bg-[#F7F6F2] text-[#1A2521] font-sans antialiased selection:bg-[#153428] selection:text-[#F7F6F2] overflow-x-hidden">
      
      {/* 0. ELEGANT TOP SCROLL PROGRESS BAR */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-[#153428] z-[100] origin-left shadow-[0_0_8px_rgba(21,52,40,0.5)]"
        style={{ scaleX }}
      />

      {/* AMBIENT BACKGROUND GLOW ORBS (3D DEPTH) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[130px]" />
        <div className="absolute bottom-20 left-10 w-[550px] h-[550px] bg-[#E3E8E1]/40 rounded-full blur-[150px]" />
      </div>

      {/* 1. HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#F7F6F2]/85 backdrop-blur-md border-b border-[rgba(23,59,48,0.06)] transition-all">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button type="button" aria-label="BISNIESGO Living — ke atas" className="flex flex-col items-start cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className="text-xl font-bold tracking-tight text-[#153428] font-editorial leading-tight">
                BISNIESGO
              </span>
              <span className="text-xs font-medium text-[#153428] tracking-widest pl-0.5">
                Living
              </span>
            </button>
          </div>

          {/* Center Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#4A544E]">
            <a href="#featured" onClick={(e) => { e.preventDefault(); document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-[#1A2521] hover:text-[#153428] transition-colors cursor-pointer">Tempat Hunian</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#1A2521] transition-colors cursor-pointer">Keunggulan</a>
            <a href="#locations" onClick={(e) => { e.preventDefault(); document.getElementById('locations')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#1A2521] transition-colors cursor-pointer">Destinasi</a>
            <a href="#community" onClick={(e) => { e.preventDefault(); document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#1A2521] transition-colors cursor-pointer">Komunitas</a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onStartDemo}
              className="hidden sm:inline-flex whitespace-nowrap text-xs font-bold text-[#153428] hover:bg-black/5 px-4 py-2 rounded-full border border-[#153428]/30 transition-colors cursor-pointer shadow-xs"
            >
              Coba Demo
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onGoToLogin}
              className="whitespace-nowrap text-xs font-bold text-[#1A2521] hover:text-[#153428] transition-colors cursor-pointer"
            >
              Masuk
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(21, 52, 40, 0.3)" }}
              whileTap={{ scale: 0.96 }}
              onClick={onGoToRegister}
              className="whitespace-nowrap px-4 sm:px-5 py-2 text-xs font-bold rounded-full bg-[#153428] text-white hover:bg-[#0c2018] shadow-sm transition-all cursor-pointer"
            >
              Daftar Akun
            </motion.button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20">
        
        {/* 2. HERO SECTION WITH 3D INTERACTIVE TILT & STAGGER */}
        <section className="max-w-[1400px] mx-auto px-6 relative mb-32 pt-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="pt-4 z-10"
            >
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/40 border border-white/60 backdrop-blur-xl mb-6 shadow-[0_8px_20px_rgba(21,52,40,0.04),inset_0_2px_4px_rgba(255,255,255,0.9)] relative overflow-hidden group cursor-default"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out" />
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-b from-[#153428]/10 to-transparent border border-[#153428]/10 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                  <Compass className="h-3.5 w-3.5 text-[#153428]" />
                </div>
                <span className="relative text-[10px] tracking-[0.2em] font-bold text-[#1A2521] uppercase">
                  Modern Living & Property OS
                </span>
              </motion.div>
              
              <h1 className="text-6xl sm:text-7xl lg:text-[5.5rem] font-medium text-[#1A2521] font-editorial leading-[1.04] tracking-tight mb-6">
                Find a place<br />that feels right.
              </h1>
              
              <p className="text-lg text-[#6D7772] max-w-md leading-relaxed mb-8">
                Platform all-in-one pengelolaan coliving, kost modern, apartemen, dan villa dengan website publik instan.
              </p>

              {/* Call to Actions */}
              <div className="flex flex-wrap items-center gap-3 mb-10">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2, boxShadow: "0 12px 30px -5px rgba(21, 52, 40, 0.35)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onStartDemo}
                  className="group px-6 py-3.5 rounded-full bg-[#153428] text-white text-xs font-extrabold hover:bg-[#0c2018] transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  Coba Demo Interaktif
                  <ArrowUpRight weight="duotone" className="h-4 w-4 text-emerald-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onGoToRegister}
                  className="px-6 py-3.5 rounded-full bg-white border border-[#153428]/25 text-[#153428] text-xs font-extrabold hover:bg-[#F7F6F2] transition-all cursor-pointer shadow-xs"
                >
                  Daftar Akun Pengelola
                </motion.button>
              </div>

              {/* Search Widget */}
              <motion.form
                role="search"
                onSubmit={handleSearchSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-3xl p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-black/5 flex flex-col md:flex-row items-center gap-2 max-w-3xl mb-8 relative z-20"
              >
                <label className="flex-1 flex items-center gap-3 px-4 py-2 hover:bg-[#F7F6F2] focus-within:bg-[#F7F6F2] rounded-2xl cursor-text transition-colors w-full md:w-auto">
                  <MapPin weight="duotone" className="h-5 w-5 shrink-0 text-[#6D7772]" />
                  <span className="flex flex-col text-left w-full min-w-0">
                    <span className="text-[11px] font-bold text-[#1A2521] uppercase tracking-wide">Lokasi / Properti</span>
                    <input
                      type="search"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Yogyakarta, Jakarta, Bali..."
                      className="text-sm text-[#1A2521] placeholder:text-[#6D7772] bg-transparent outline-none truncate w-full"
                    />
                  </span>
                </label>

                <div className="hidden md:block w-px h-8 bg-black/5" />

                <label className="relative flex-1 flex items-center justify-between gap-3 px-4 py-2 hover:bg-[#F7F6F2] focus-within:bg-[#F7F6F2] rounded-2xl cursor-pointer transition-colors w-full md:w-auto">
                  <span className="flex items-center gap-3 w-full">
                    <House weight="duotone" className="h-5 w-5 shrink-0 text-[#6D7772]" />
                    <span className="flex flex-col text-left w-full">
                      <span className="text-[11px] font-bold text-[#1A2521] uppercase tracking-wide">Tipe Hunian</span>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="appearance-none bg-transparent outline-none text-sm text-[#6D7772] w-full pr-6 cursor-pointer"
                      >
                        <option value="">Semua Tipe</option>
                        {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </span>
                  </span>
                  <CaretDown weight="duotone" className="pointer-events-none absolute right-4 h-4 w-4 text-[#6D7772]" />
                </label>

                <div className="hidden md:block w-px h-8 bg-black/5" />

                <label className="relative flex-1 flex items-center justify-between gap-3 px-4 py-2 hover:bg-[#F7F6F2] focus-within:bg-[#F7F6F2] rounded-2xl cursor-pointer transition-colors w-full md:w-auto">
                  <span className="flex items-center gap-3 w-full">
                    <CalendarBlank weight="duotone" className="h-5 w-5 shrink-0 text-[#6D7772]" />
                    <span className="flex flex-col text-left w-full">
                      <span className="text-[11px] font-bold text-[#1A2521] uppercase tracking-wide">Durasi Sewa</span>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value as ListingFilters['duration'])}
                        className="appearance-none bg-transparent outline-none text-sm text-[#6D7772] w-full pr-6 cursor-pointer"
                      >
                        <option value="">Bulanan / Harian</option>
                        <option value="Bulanan">Bulanan</option>
                        <option value="Harian">Harian</option>
                      </select>
                    </span>
                  </span>
                  <CaretDown weight="duotone" className="pointer-events-none absolute right-4 h-4 w-4 text-[#6D7772]" />
                </label>

                <motion.button
                  type="submit"
                  aria-label="Cari hunian"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#153428] text-white p-4 rounded-2xl hover:bg-[#0c2018] transition-colors w-full md:w-auto flex justify-center items-center gap-2 cursor-pointer shadow-md"
                >
                  <MagnifyingGlass weight="duotone" className="h-5 w-5" />
                  <span className="md:hidden text-sm font-bold">Cari Hunian</span>
                </motion.button>
              </motion.form>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/8 bg-white/80 text-[11px] font-bold text-[#4A544E] shadow-2xs">
                  <CalendarBlank weight="duotone" className="h-3.5 w-3.5 text-[#153428]" /> Sewa Fleksibel
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/8 bg-white/80 text-[11px] font-bold text-[#4A544E] shadow-2xs">
                  <Armchair weight="duotone" className="h-3.5 w-3.5 text-[#153428]" /> Full Furnished
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/8 bg-white/80 text-[11px] font-bold text-[#4A544E] shadow-2xs">
                  <Stack className="h-3.5 w-3.5 text-[#153428]" /> All-inclusive
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/8 bg-white/80 text-[11px] font-bold text-[#4A544E] shadow-2xs">
                  <ShieldCheck weight="duotone" className="h-3.5 w-3.5 text-[#153428]" /> Terverifikasi
                </span>
              </div>
            </motion.div>

            {/* Right Hero Image with 3D Tilt Card & Floating Widgets */}
            <div className="relative h-[620px] w-full mt-10 lg:mt-0 perspective-1200">
              <TiltCard3D maxTilt={7} scale={1.02} className="w-full h-full">
                <div className="relative h-full w-full rounded-[40px] overflow-hidden shadow-2xl border border-[rgba(23,59,48,0.12)]">
                  <img 
                    src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000" 
                    alt="Modern Coliving & Villa" 
                    className="w-full h-full object-cover object-center scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

                  {/* Typography overlay right */}
                  <div className="absolute top-8 right-8 text-white font-editorial text-2xl rotate-6 opacity-90 drop-shadow-md hidden sm:block">
                    More than a stay<br />
                    <span className="italic font-light text-emerald-200">A lifestyle</span>
                  </div>
                </div>
              </TiltCard3D>

              {/* Floating Element 1 - Coliving Showcase Card (Smooth Levitation) */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="absolute top-12 -left-8 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl flex items-center gap-4 pr-6 z-20 border border-[rgba(23,59,48,0.08)] cursor-pointer"
                onClick={() => featured ? onViewPropertyWebsite?.(featured.id) : scrollToResults()}
              >
                <img 
                  src={featured?.coverImage || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=200"} 
                  alt={featured?.name || 'Kamar'} 
                  className="w-16 h-14 rounded-xl object-cover" 
                />
                <div>
                  <h4 className="text-sm font-bold text-[#1A2521]">{featured?.name || 'Green House Kemang'}</h4>
                  <p className="text-[10px] text-[#6D7772] flex items-center gap-1 mb-1">
                    <MapPin weight="duotone" className="h-3 w-3 text-emerald-700" /> {featured ? (featured.city || featured.address || featured.type) : 'Jakarta Selatan'}
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-[#153428]">
                      {formatIDR(featured?.startPriceMonth || featured?.startPriceDay || 4550000)}{' '}
                      <span className="text-[10px] font-normal text-[#6D7772]">{featured && !featured.startPriceMonth && featured.startPriceDay ? '/mlm' : '/bln'}</span>
                    </span>
                    <span className="text-[11px] font-bold flex items-center gap-0.5">
                      <Star weight="duotone" className="h-3 w-3 fill-amber-400 text-amber-400" /> 5.0
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Floating Element 2 - Resident Review Card */}
              <motion.div 
                animate={{ y: [0, 9, 0] }}
                transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-12 right-12 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl max-w-[250px] z-20 border border-[rgba(23,59,48,0.08)]"
              >
                <div className="flex -space-x-2 mb-2">
                  <img src="https://i.pravatar.cc/100?img=1" className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="User" />
                  <img src="https://i.pravatar.cc/100?img=5" className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="User" />
                  <img src="https://i.pravatar.cc/100?img=9" className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="User" />
                </div>
                <p className="text-xs font-semibold text-[#1A2521] italic mb-1">
                  "Website mandiri yang elegan, penghuni langsung pesan tanpa repot."
                </p>
                <p className="text-[10px] text-emerald-800 font-bold">+500 penghuni puas</p>
              </motion.div>

              {/* Floating Element 3 - Amenities List */}
              <motion.div 
                animate={{ y: [0, -7, 0] }}
                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/2 right-0 translate-x-1/4 -translate-y-1/2 bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-xl z-20 hidden xl:block border border-[rgba(23,59,48,0.08)]"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Armchair weight="duotone" className="h-4 w-4 text-[#153428]" />
                    <span className="text-xs font-semibold text-[#1A2521]">Full Furnished</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <WifiHigh weight="duotone" className="h-4 w-4 text-[#153428]" />
                    <span className="text-xs font-semibold text-[#1A2521]">High-speed WiFi</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle weight="duotone" className="h-4 w-4 text-[#153428]" />
                    <span className="text-xs font-semibold text-[#1A2521]">Housekeeping</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck weight="duotone" className="h-4 w-4 text-[#153428]" />
                    <span className="text-xs font-semibold text-[#1A2521]">Smart Lock</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users weight="duotone" className="h-4 w-4 text-[#153428]" />
                    <span className="text-xs font-semibold text-[#1A2521]">Komunitas Hangat</span>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* 3. FEATURED HOMES SECTION WITH 3D CARDS & SCROLL REVEAL */}
        <section id="featured" className="scroll-mt-24 bg-white rounded-[32px] sm:rounded-[40px] max-w-[1400px] mx-4 sm:mx-auto p-5 sm:p-10 lg:p-16 mb-24 shadow-sm border border-[rgba(23,59,48,0.06)]">
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
          >
            <div aria-live="polite">
              <p className="text-[10px] tracking-[0.2em] font-bold text-[#6D7772] uppercase mb-3">
                {applied ? 'Hasil Pencarian' : 'Tempat & Penginapan Pilihan'}
              </p>
              {applied ? (
                <div className="flex flex-col gap-3">
                  <h2 className="text-3xl lg:text-4xl font-medium text-[#1A2521] font-editorial">
                    {loading ? 'Mencari hunian...' : `${listings.length} hunian ditemukan`}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                    {applied.q?.trim() && <span className="px-3 py-1 rounded-full bg-[#F7F6F2] border border-black/5 text-[#1A2521]">Lokasi: {applied.q.trim()}</span>}
                    {applied.type && <span className="px-3 py-1 rounded-full bg-[#F7F6F2] border border-black/5 text-[#1A2521]">Tipe: {PROPERTY_TYPES.find(t => t.value === applied.type)?.label || applied.type}</span>}
                    {applied.duration && <span className="px-3 py-1 rounded-full bg-[#F7F6F2] border border-black/5 text-[#1A2521]">Sewa {applied.duration}</span>}
                    <button type="button" onClick={resetSearch} className="px-3 py-1 rounded-full text-[#153428] underline underline-offset-2 cursor-pointer">
                      Reset pencarian
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row lg:items-baseline gap-4 lg:gap-8">
                  <h2 className="text-4xl lg:text-5xl font-medium text-[#1A2521] font-editorial">Handpicked spaces for modern living.</h2>
                  <p className="text-sm text-[#6D7772]">Tempat penginapan terbaik. Website pemesanan langsung tanpa komisi agen.</p>
                </div>
              )}
              {isDemoCatalog && !loading && (
                <p className="mt-3 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-full inline-block px-3 py-1">
                  Contoh properti demo — belum ada website pengelola yang dipublikasikan.
                </p>
              )}
            </div>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={onStartDemo}
              className="text-sm font-semibold text-[#1A2521] hover:text-[#153428] flex items-center gap-2 whitespace-nowrap group cursor-pointer"
            >
              Lihat di Dashboard <ArrowRight weight="duotone" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          {!loading && listings.length === 0 && (
            <div className="mb-8 rounded-3xl border border-dashed border-[#153428]/25 bg-[#FBF9F5] p-8 text-center">
              <h3 className="font-editorial text-2xl text-[#1A2521] mb-2">Belum ada hunian yang cocok.</h3>
              <p className="text-sm text-[#6D7772] mb-4">Coba kota lain, pilih semua tipe, atau ubah durasi sewa.</p>
              <button type="button" onClick={resetSearch} className="px-5 py-2.5 rounded-full bg-[#153428] text-white text-xs font-bold cursor-pointer hover:bg-[#0c2018]">
                Tampilkan semua hunian
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading && listings.length === 0 && [0, 1, 2].map(i => (
              <div key={i} className="h-[420px] rounded-3xl bg-[#FBF9F5] border border-zinc-200/80 animate-pulse" />
            ))}
            {listings.map((prop, idx) => (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <TiltCard3D maxTilt={6} scale={1.02} className="h-full">
                  <div 
                    onClick={() => onViewPropertyWebsite?.(prop.id)}
                    className="group cursor-pointer bg-[#FBF9F5] rounded-3xl p-4 border border-zinc-200/80 hover:border-[#153428]/40 hover:shadow-xl transition-all flex flex-col justify-between h-full"
                  >
                    <div>
                      <div className="relative h-56 mb-4 rounded-2xl overflow-hidden shadow-xs">
                        <img 
                          src={prop.coverImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'} 
                          alt={prop.name} 
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700" 
                        />
                        <div className="absolute top-3 left-3 bg-[#153428]/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                          <Star weight="duotone" className="h-3 w-3 fill-amber-300 text-amber-300" /> {prop.type}
                        </div>
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full text-[#153428] shadow-sm hover:scale-110 transition-transform">
                          <Globe className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      
                      <div className="flex items-start justify-between mb-1 px-1">
                        <h3 className="font-bold text-[#1A2521] text-base group-hover:text-[#153428] transition-colors">{prop.name}</h3>
                        <span className="text-xs font-bold flex items-center gap-1 text-[#153428]">
                          {prop.availableRooms} kamar kosong
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6D7772] flex items-center gap-1 mb-3 px-1">
                        <MapPin weight="duotone" className="h-3 w-3 shrink-0 text-emerald-700" /> {[prop.city, prop.address].filter(Boolean).join(' — ') || 'Lokasi belum diisi'}
                      </p>
                    </div>

                    <div className="px-1 pt-3 border-t border-zinc-200/60">
                      <div className="mb-3">
                        {(() => {
                          // Show the price for the rental period being searched for, if any.
                          const daily = applied?.duration === 'Harian' || (!prop.startPriceMonth && !!prop.startPriceDay);
                          const price = daily ? prop.startPriceDay : prop.startPriceMonth;
                          return price ? (
                            <>
                              <span className="text-[10px] text-[#6D7772]">Mulai </span>
                              <span className="text-base font-extrabold text-[#153428]">{formatIDR(price)}</span>
                              <span className="text-xs text-[#6D7772]"> / {daily ? 'malam' : 'bulan'}</span>
                            </>
                          ) : (
                            <span className="text-xs font-semibold text-[#6D7772]">Hubungi pengelola untuk harga</span>
                          );
                        })()}
                        {prop.rentalTypes.length > 0 && (
                          <span className="block mt-0.5 text-[10px] font-bold text-emerald-800">Sewa {prop.rentalTypes.join(' · ')}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(prop.facilities && prop.facilities.length > 0 ? prop.facilities.slice(0, 3) : ['WiFi', 'AC', 'Furnished']).map((fac, i) => (
                          <span key={i} className="px-2.5 py-1 bg-white border border-zinc-200 rounded-lg text-[10px] font-semibold text-[#4A544E]">
                            {fac}
                          </span>
                        ))}
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewPropertyWebsite?.(prop.id);
                        }}
                        className="w-full py-2.5 bg-[#153428] text-white rounded-xl text-xs font-bold hover:bg-[#0c2018] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Globe className="h-3.5 w-3.5" /> Lihat Website Publik
                      </motion.button>
                    </div>
                  </div>
                </TiltCard3D>
              </motion.div>
            ))}

            {/* Special Community Card in 3D */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: listings.length * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <TiltCard3D maxTilt={6} scale={1.02} className="h-full">
                <div className="relative rounded-3xl overflow-hidden bg-[#153428] text-white p-6 h-full flex flex-col justify-between group shadow-xl shadow-[#153428]/25 border border-white/10">
                  <div className="absolute inset-0 opacity-20">
                    <img src="https://images.unsplash.com/photo-1534008897995-27a23e859048?auto=format&fit=crop&q=80&w=800" alt="Background" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#153428]/95 via-[#153428]/85 to-transparent" />
                  
                  <div className="relative z-10">
                    <h3 className="font-editorial text-2xl mb-3 leading-tight">Kelola Properti Anda Sekarang</h3>
                    <p className="text-xs text-white/80 leading-relaxed mb-4">
                      Website landing page publik instan, pemesanan mandiri, dan pencatatan kas otomatis.
                    </p>
                    <div className="grid grid-cols-2 gap-2 border-t border-white/20 pt-4 mb-4">
                      <div>
                        <div className="text-lg font-bold">{catalogSize}</div>
                        <div className="text-[9px] text-white/70 uppercase tracking-wider">Tempat Aktif</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">100%</div>
                        <div className="text-[9px] text-white/70 uppercase tracking-wider">Otomatis</div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={onStartDemo}
                      className="group w-full py-2.5 bg-white text-[#153428] rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      Coba Demo Gratis
                      <ArrowRight weight="duotone" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </motion.button>
                  </div>
                </div>
              </TiltCard3D>
            </motion.div>

          </div>
        </section>

        {/* 4. WHY BISNIESGO LIVING SECTION WITH MINIMALIST ELEGANCE */}
        <section id="features" className="max-w-[1400px] mx-auto px-6 mb-32">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-70px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-4"
            >
              <p className="text-[10px] tracking-[0.2em] font-bold text-[#6D7772] uppercase mb-4">Why Bisniesgo Living</p>
              <h2 className="text-4xl lg:text-5xl font-medium text-[#1A2521] font-editorial leading-tight mb-6">
                A smarter, simpler<br />way to live.
              </h2>
              <p className="text-sm text-[#6D7772] leading-relaxed mb-8 max-w-sm">
                Desain arsitektur modern, manajemen sewa fleksibel, dan teknologi otomatisasi hunian yang menyejukkan.
              </p>
              <motion.button 
                whileHover={{ scale: 1.03, x: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onStartDemo}
                className="px-6 py-3 rounded-full bg-[#153428] text-white text-sm font-semibold hover:bg-[#0c2018] transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                Coba Demo Sekarang <ArrowRight weight="duotone" className="h-4 w-4" />
              </motion.button>
            </motion.div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-x-4 gap-y-10 px-4">
              {[
                { icon: CalendarBlank, title: "Flexible stays", desc: "Bulanan & harian" },
                { icon: Stack, title: "All-inclusive", desc: "Listrik, WiFi, cleaning" },
                { icon: ShieldCheck, title: "Verified homes", desc: "Kualitas terjamin" },
                { icon: Users, title: "Community", desc: "Komunitas positif" },
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-13 h-13 rounded-2xl bg-white border border-black/5 shadow-sm group-hover:shadow-md group-hover:border-[#153428]/20 flex items-center justify-center mb-4 text-[#153428] transition-all">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-[#1A2521] mb-1">{item.title}</h4>
                  <p className="text-xs text-[#6D7772]">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Map Graphic with 3D Depth floating card */}
            <motion.div 
              id="locations"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-70px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-4 bg-[#EEEDEA] p-8 rounded-[32px] relative overflow-hidden min-h-[320px] border border-[rgba(23,59,48,0.06)]"
            >
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-[#1A2521] mb-1">Live in inspiring places.</h3>
                <p className="text-xs text-[#6D7772] mb-6">From vibrant cities to coastal escapes.</p>
                
                <ul className="space-y-1 text-sm font-semibold text-[#4A544E]">
                  {DESTINATIONS.map((d, i) => (
                    <li key={d.query}>
                      <button
                        type="button"
                        onClick={() => runSearch({ q: d.query })}
                        className="flex items-center gap-2 py-1 hover:text-[#153428] hover:underline underline-offset-2 cursor-pointer"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-[#153428]' : 'border border-[#153428]'}`} /> {d.label}
                      </button>
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-[#6D7772] font-normal text-xs mt-4">— Dan kota-kota lainnya</li>
                </ul>
              </div>

              {/* Map Illustration background */}
              <div className="absolute top-10 right-0 bottom-0 left-32 opacity-40 mix-blend-multiply pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle, #153428 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                maskImage: 'linear-gradient(to right, transparent, black)'
              }} />
              
              {/* Floating city 3D card */}
              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="absolute bottom-6 right-6 bg-white p-2.5 rounded-2xl shadow-xl w-48 z-10 border border-black/5 cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label="Cari hunian di Yogyakarta"
                onClick={() => runSearch({ q: 'Yogyakarta' })}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); runSearch({ q: 'Yogyakarta' }); } }}
              >
                <img src="https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&q=80&w=400" alt="Yogyakarta" className="w-full h-20 object-cover rounded-xl mb-2" />
                <h4 className="font-bold text-xs text-[#1A2521]">Yogyakarta</h4>
                <p className="text-[10px] text-[#6D7772]">Pusat coliving & hunian asri.</p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* 5. FOOTER BANNER WITH SCROLL EFFECT */}
        <section id="community" className="max-w-[1400px] mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-[40px] overflow-hidden min-h-[380px] flex items-center bg-zinc-900 shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=2000" 
              alt="Beautiful landscape" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            
            <div className="relative z-10 p-10 lg:p-20 flex flex-col md:flex-row md:items-end justify-between gap-10 w-full">
              <div className="max-w-xl">
                <h2 className="text-4xl lg:text-[3.5rem] font-medium text-white font-editorial leading-[1.1] mb-6">
                  More than a stay.<br />A brighter you.
                </h2>
              </div>
              <div className="max-w-md bg-black/30 backdrop-blur-md p-6 rounded-3xl border border-white/15 shadow-2xl">
                <p className="text-white/90 text-sm leading-relaxed mb-6">
                  Bergabunglah dengan ratusan pengelola hunian modern di Indonesia bersama BISNIESGO Living.
                </p>
                <div className="flex items-center gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onStartDemo}
                    className="px-5 py-3 rounded-full bg-[#153428] border border-white/20 text-white text-xs font-bold hover:bg-white hover:text-[#153428] transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    Mulai Coba Demo <ArrowRight weight="duotone" className="h-4 w-4" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onGoToRegister}
                    className="px-5 py-3 rounded-full bg-white text-[#153428] text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    Daftar Akun Baru
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

      </main>
    </div>
  );
}
