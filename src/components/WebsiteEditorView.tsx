import React, { useState, useEffect } from 'react';
import { Globe, Layout, Eye, FloppyDisk, Check, CheckCircle, ArrowUpRight, Palette, Stack, FileText, MagnifyingGlass, ArrowRight, CaretDown, CaretUp, Sliders, DeviceMobile, Monitor } from '@phosphor-icons/react';
import { Property, WebsiteConfig, Room } from '../types';

interface WebsiteEditorViewProps {
  property: Property;
  rooms: Room[];
  websiteConfig: WebsiteConfig;
  onUpdateConfig: (config: WebsiteConfig) => void;
  onPreviewLive: (propId: string) => void;
}

export function WebsiteEditorView({
  property,
  rooms,
  websiteConfig,
  onUpdateConfig,
  onPreviewLive
}: WebsiteEditorViewProps) {

  // Active tab: 'design' | 'sections' | 'content' | 'domain' | 'seo'
  const [activeTab, setActiveTab] = useState<'design' | 'sections' | 'content' | 'domain' | 'seo'>('design');

  // Preview device mode: 'desktop' | 'mobile'
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  // Local draft state
  const [config, setConfig] = useState<WebsiteConfig>(websiteConfig);
  const [savedNotice, setSavedNotice] = useState(false);

  // Sync draft state if active property or websiteConfig changes
  useEffect(() => {
    setConfig(websiteConfig);
  }, [websiteConfig]);

  // Update handlers
  const handleSave = () => {
    onUpdateConfig(config);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const toggleSection = (id: string) => {
    const updatedSections = config.sections.map(s => {
      if (s.id === id) return { ...s, enabled: !s.enabled };
      return s;
    });
    setConfig({ ...config, sections: updatedSections });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...config.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    setConfig({ ...config, sections: newSections });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FBF9F5] p-5 rounded-2xl border border-[rgba(23,59,48,0.10)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#6E746F] mb-1">
            <span>Website Pengelola</span>
            <span>/</span>
            <span className="text-[#173B30] font-bold">{property.name}</span>
          </div>
          <h2 className="text-2xl font-bold text-[#171A18] font-editorial">
            Editor Website Properti
          </h2>
          <p className="text-xs text-[#6E746F]">
            Sesuaikan tampilan, seksi, dan domain website publik Anda tanpa menyentuh koding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onPreviewLive(property.id)}
            className="px-4 py-2.5 rounded-xl border border-[rgba(23,59,48,0.25)] text-[#173B30] hover:bg-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <ArrowUpRight weight="duotone" className="h-3.5 w-3.5" /> Buka Website Publik
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#173B30] text-[#F5F1E8] hover:bg-[#0f2720] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <FloppyDisk weight="duotone" className="h-3.5 w-3.5" /> Simpan Perubahan
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle weight="duotone" className="h-4 w-4 text-emerald-700" />
          Pengaturan website berhasil disimpan dan langsung diterapkan ke website publik!
        </div>
      )}

      {/* Main 2-Column Workspace: Controls (Left) and Live Interactive Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Editor Controls & Tabs */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Navigation Tabs */}
          <div className="bg-[#FBF9F5] p-1.5 rounded-2xl border border-[rgba(23,59,48,0.10)] grid grid-cols-5 gap-1 text-center shadow-sm">
            {[
              { id: 'design', label: 'Desain', icon: Palette },
              { id: 'sections', label: 'Seksi', icon: Stack },
              { id: 'content', label: 'Konten', icon: FileText },
              { id: 'domain', label: 'Domain', icon: Globe },
              { id: 'seo', label: 'SEO', icon: MagnifyingGlass },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#173B30] text-[#F5F1E8] shadow-sm'
                    : 'text-[#6E746F] hover:text-[#171A18] hover:bg-white/60'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="text-[10px]">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab 1: Desain & Template */}
          {activeTab === 'design' && (
            <div className="bg-[#FBF9F5] p-5 rounded-2xl border border-[rgba(23,59,48,0.10)] space-y-5 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-[#171A18]">Pilih Template Tampilan</h3>
                <p className="text-xs text-[#6E746F] mt-0.5">
                  Ketiga template menggunakan data inventaris kamar yang sama secara otomatis.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'align',
                    name: 'ALIGN',
                    desc: 'Boutique & Coliving. Warm ivory, deep forest green, tipografi editorial tenang, foto megah.',
                    badge: 'Rekomendasi Coliving & Villa'
                  },
                  {
                    id: 'urban',
                    name: 'URBAN',
                    desc: 'Modern City. Bersih, praktis, kontras tegas, prioritas ketersediaan kamar cepat.',
                    badge: 'Ideal untuk Kost & Apartemen'
                  },
                  {
                    id: 'serene',
                    name: 'SERENE',
                    desc: 'Retreat & Nature. Batu hangat, sage green, galeri foto suasana yang menenangkan.',
                    badge: 'Cocok untuk Bali & Villa Alam'
                  },
                  {
                    id: 'sander',
                    name: 'SANDER HOUSE',
                    desc: 'Ultra Modern & Luxury. Tipografi masif, layout clean & architectural, overlay kaca.',
                    badge: 'Eksklusif & Premium'
                  },
                  {
                    id: 'hearthly',
                    name: 'HEARTHLY',
                    desc: 'Minimalist Brutalist. Bold typography, high contrast, staggered imagery, editorial flow.',
                    badge: 'Modern & Artistic'
                  },
                ].map(t => (
                  <div
                    key={t.id}
                    onClick={() => setConfig({ ...config, templateId: t.id as any })}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      config.templateId === t.id
                        ? 'bg-white border-[#173B30] shadow-md ring-2 ring-[#173B30]/20'
                        : 'bg-white/60 border-zinc-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-[#171A18]">{t.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(23,59,48,0.08)] text-[#173B30]">
                        {t.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#6E746F] mt-1.5 leading-relaxed">{t.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[rgba(23,59,48,0.08)] space-y-3">
                <label className="block text-xs font-bold text-[#171A18]">
                  Warna Aksen Primer
                </label>
                <div className="flex items-center gap-3">
                  {['#173B30', '#315A49', '#18181B', '#B89A68', '#0F2F38'].map(color => (
                    <button
                      key={color}
                      onClick={() => setConfig({ ...config, accentColor: color })}
                      style={{ backgroundColor: color }}
                      className={`h-8 w-8 rounded-full border-2 transition-all cursor-pointer ${
                        config.accentColor === color ? 'border-black scale-110 shadow-md' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Seksi & Urutan */}
          {activeTab === 'sections' && (
            <div className="bg-[#FBF9F5] p-5 rounded-2xl border border-[rgba(23,59,48,0.10)] space-y-4 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-[#171A18]">Atur Seksi Website</h3>
                <p className="text-xs text-[#6E746F] mt-0.5">
                  Aktifkan, sembunyikan, atau ubah urutan seksi pada halaman utama properti.
                </p>
              </div>

              <div className="space-y-2">
                {config.sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-[rgba(23,59,48,0.08)] text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={sec.enabled}
                        onChange={() => toggleSection(sec.id)}
                        className="rounded text-[#173B30] focus:ring-[#173B30] h-4 w-4 cursor-pointer"
                      />
                      <span className={`font-semibold ${sec.enabled ? 'text-[#171A18]' : 'text-zinc-400 line-through'}`}>
                        {sec.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-zinc-400 hover:text-[#171A18] disabled:opacity-30 cursor-pointer"
                      >
                        <CaretUp weight="duotone" className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveSection(idx, 'down')}
                        disabled={idx === config.sections.length - 1}
                        className="p-1 text-zinc-400 hover:text-[#171A18] disabled:opacity-30 cursor-pointer"
                      >
                        <CaretDown weight="duotone" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Konten & Teks */}
          {activeTab === 'content' && (
            <div className="bg-[#FBF9F5] p-5 rounded-2xl border border-[rgba(23,59,48,0.10)] space-y-4 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-[#171A18]">Edit Judul & Salinan Teks</h3>
                <p className="text-xs text-[#6E746F] mt-0.5">
                  Sesuaikan pesan sambutan utama pada banner properti.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171A18] mb-1">
                  Headline Utama
                </label>
                <input
                  type="text"
                  value={config.headline}
                  onChange={(e) => setConfig({ ...config, headline: e.target.value })}
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2.5 text-xs text-[#171A18] focus:outline-none focus:ring-2 focus:ring-[#173B30]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171A18] mb-1">
                  Deskripsi Pendukung (Subheadline)
                </label>
                <textarea
                  rows={3}
                  value={config.subheadline}
                  onChange={(e) => setConfig({ ...config, subheadline: e.target.value })}
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18] focus:outline-none focus:ring-2 focus:ring-[#173B30]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171A18] mb-1">
                  Nomor WhatsApp Concierge / Pengelola
                </label>
                <input
                  type="tel"
                  value={config.whatsappDirect}
                  onChange={(e) => setConfig({ ...config, whatsappDirect: e.target.value })}
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2.5 text-xs text-[#171A18] focus:outline-none focus:ring-2 focus:ring-[#173B30]"
                />
              </div>
            </div>
          )}

          {/* Tab 4: Domain */}
          {activeTab === 'domain' && (
            <div className="bg-[#FBF9F5] p-5 rounded-2xl border border-[rgba(23,59,48,0.10)] space-y-5 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-[#171A18]">Alamat Domain Website</h3>
                <p className="text-xs text-[#6E746F] mt-0.5">
                  Setiap properti langsung memiliki alamat subdomain gratis dari BISNIESGO.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[rgba(23,59,48,0.10)] space-y-2">
                <span className="text-[10px] font-bold text-[#A8B7A1] uppercase tracking-wider block">
                  Subdomain Gratis BISNIESGO Living
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={config.subdomain}
                    onChange={(e) => setConfig({ ...config, subdomain: e.target.value })}
                    className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold text-[#173B30]"
                  />
                  <span className="text-xs font-bold text-[#6E746F]">.bisniesgo.id</span>
                </div>
                <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                  <CheckCircle weight="duotone" className="h-3 w-3" /> Subdomain aktif & SSL otomatis terpasang
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[rgba(23,59,48,0.10)] space-y-2">
                <span className="text-[10px] font-bold text-[#A8B7A1] uppercase tracking-wider block">
                  Custom Domain Sendiri (Opsional)
                </span>
                <input
                  type="text"
                  placeholder="Contoh: greenhousekemang.com"
                  value={config.customDomain || ''}
                  onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-[#171A18]"
                />
                <p className="text-[10px] text-[#6E746F] leading-relaxed">
                  Arahkan CNAME DNS domain Anda ke <code>host.bisniesgo.id</code> untuk menghubungkan domain pribadi.
                </p>
              </div>
            </div>
          )}

          {/* Tab 5: SEO */}
          {activeTab === 'seo' && (
            <div className="bg-[#FBF9F5] p-5 rounded-2xl border border-[rgba(23,59,48,0.10)] space-y-4 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-[#171A18]">Optimasi Mesin Pencari (SEO)</h3>
                <p className="text-xs text-[#6E746F] mt-0.5">
                  Bantu calon penghuni menemukan kost atau villa Anda melalui pencarian Google.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171A18] mb-1">
                  Meta Title Google
                </label>
                <input
                  type="text"
                  defaultValue={`${property.name} — ${property.type} Nyaman & Modern di ${property.city}`}
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171A18] mb-1">
                  Meta Description Google
                </label>
                <textarea
                  rows={2}
                  defaultValue={property.description}
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                />
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Live Interactive Preview Frame */}
        <div className="lg:col-span-7 space-y-3">
          
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs text-[#6E746F]">
              <Eye weight="duotone" className="h-4 w-4 text-[#173B30]" />
              <span className="font-bold text-[#171A18]">Live Preview</span>
              <span>•</span>
              <span className="font-mono text-[11px]">{config.subdomain}.bisniesgo.id</span>
            </div>

            <div className="flex items-center bg-white p-1 rounded-xl border border-[rgba(23,59,48,0.10)]">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  deviceMode === 'desktop' ? 'bg-[#173B30] text-white shadow-sm' : 'text-[#6E746F]'
                }`}
                title="Tampilan Desktop"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  deviceMode === 'mobile' ? 'bg-[#173B30] text-white shadow-sm' : 'text-[#6E746F]'
                }`}
                title="Tampilan HP (Mobile)"
              >
                <DeviceMobile weight="duotone" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Scaled Preview Frame */}
          <div className={`transition-all duration-300 mx-auto rounded-3xl overflow-hidden border border-[rgba(23,59,48,0.18)] shadow-2xl bg-white ${
            deviceMode === 'mobile' ? 'max-w-sm' : 'w-full'
          }`}>
            
            {/* Top Mock Header */}
            <div className="bg-[#173B30] text-[#F5F1E8] px-4 py-2 text-[10px] font-mono flex items-center justify-between">
              <span>https://{config.subdomain}.bisniesgo.id</span>
              <span className="text-emerald-300 uppercase font-bold">{config.templateId}</span>
            </div>

            {/* Simulated Live Landing Page Body */}
            <div className="p-4 sm:p-6 space-y-5 bg-[#F5F1E8] max-h-[600px] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(23,59,48,0.10)]">
                <span className="font-bold text-sm text-[#173B30]">{property.name}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Kamar Tersedia
                </span>
              </div>

              {/* Hero Banner */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#A8B7A1] uppercase tracking-wider block">
                  {property.type} di {property.city}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#171A18] font-editorial leading-tight">
                  {config.headline}
                </h3>
                <p className="text-xs text-[#6E746F] leading-relaxed">
                  {config.subheadline}
                </p>
              </div>

              {/* Cover Image */}
              <div className="rounded-2xl overflow-hidden aspect-[16/9] shadow-sm">
                <img
                  src={property.coverImage || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80'}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Availability Widget */}
              <div className="bg-white p-3.5 rounded-xl border border-[rgba(23,59,48,0.10)] shadow-sm space-y-2 text-xs">
                <span className="font-bold text-[#173B30] text-[11px] block">Cek Ketersediaan Kamar</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                    <span className="text-[9px] text-[#6E746F] block">Mulai</span>
                    <strong className="text-[11px]">Bulan Ini</strong>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                    <span className="text-[9px] text-[#6E746F] block">Durasi</span>
                    <strong className="text-[11px]">3 Bulan</strong>
                  </div>
                </div>
              </div>

              {/* Mini Rooms Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#171A18] block">Pilihan Kamar</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {rooms.slice(0, 2).map((r, i) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-[rgba(23,59,48,0.10)]">
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Tersedia
                      </span>
                      <h5 className="font-bold mt-1 text-[#171A18]">{r.number}</h5>
                      <p className="text-[11px] font-extrabold text-[#173B30] mt-0.5">
                        Rp {(r.pricePerMonth || r.price).toLocaleString('id-ID')} / bln
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
