import React, { useState } from 'react';
import { Buildings, ArrowLeft, ArrowRight, User, Key, Phone, MapPin, Check, CheckCircle, Globe, Eye, ShieldCheck } from '@phosphor-icons/react';
import { KostSettings, Room, Tenant, BankAccount } from '../types';
import { authLogin, authRegister, setToken } from '../api';
import { ElegantSelect } from './ElegantSelect';

interface AuthScreensProps {
  viewMode: 'login' | 'register' | 'onboarding';
  onGoBackLanding: () => void;
  onSetViewMode: (mode: 'login' | 'register' | 'onboarding' | 'dashboard') => void;
  onInitializeKost: (kostConfig: Partial<KostSettings>, roomCount: number, basePrice: number, templateId?: string, subdomain?: string) => Promise<void>;
}

export function AuthScreens({ viewMode, onGoBackLanding, onSetViewMode, onInitializeKost }: AuthScreensProps) {
  // Login states
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register states
  const [regName, setRegName] = useState('');
  const [regKostName, setRegKostName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // 5-Step Onboarding states (Section 33 of prompt)
  const [obStep, setObStep] = useState(1);
  const [obPropName, setObPropName] = useState('Green House Kemang');
  const [obPropType, setObPropType] = useState('Coliving');
  const [obOwnerName, setObOwnerName] = useState('Hendra Wijaya');
  const [obAddress, setObAddress] = useState('Jl. Kemang Timur No. 42, Jakarta Selatan');
  const [obCity, setObCity] = useState('Jakarta Selatan');
  const [obWhatsapp, setObWhatsapp] = useState('081298765432');
  const [obRoomCount, setObRoomCount] = useState(8);
  const [obBasePrice, setObBasePrice] = useState(4500000);
  const [obTemplate, setObTemplate] = useState<'align' | 'urban' | 'serene'>('align');
  const [obSubdomain, setObSubdomain] = useState('greenhousekemang');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone || !loginPassword) {
      setLoginError('Nomor WhatsApp dan kata sandi wajib diisi!');
      return;
    }
    setLoginError('');
    setLoginLoading(true);
    try {
      const result = await authLogin({ phone: loginPhone, password: loginPassword });
      setToken(result.token);
      if (result.user?.slug) {
        localStorage.setItem('kostos_owner_slug', result.user.slug);
      }
      if (result.user?.role) {
        localStorage.setItem('kostos_user_role', result.user.role);
      }
      onSetViewMode('dashboard');
    } catch (err: any) {
      setLoginError(err?.message || 'Nomor WhatsApp atau kata sandi salah!');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regKostName || !regPhone || !regPassword) {
      setRegError('Semua kolom formulir wajib diisi!');
      return;
    }
    setRegError('');
    setRegLoading(true);
    try {
      const result = await authRegister({
        name: regName,
        phone: regPhone,
        password: regPassword,
        kostName: regKostName
      });
      setToken(result.token);
      setObOwnerName(regName);
      setObPropName(regKostName);
      setObWhatsapp(regPhone);
      setObSubdomain(regKostName.toLowerCase().replace(/[^a-z0-9]/g, ''));
      onSetViewMode('onboarding');
    } catch (err: any) {
      setRegError(err?.message || 'Registrasi gagal, silakan coba lagi.');
    } finally {
      setRegLoading(false);
    }
  };

  const [onboardingError, setOnboardingError] = useState('');
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const handleFinishOnboarding = async () => {
    if (onboardingSaving) return;
    setOnboardingSaving(true);
    setOnboardingError('');
    try {
      await onInitializeKost(
      {
        kostName: obPropName,
        ownerName: obOwnerName,
        address: `${obAddress}, ${obCity}`,
        whatsapp: obWhatsapp,
      },
      obRoomCount,
      obBasePrice,
      obTemplate,
      obSubdomain
      );
      localStorage.setItem('kostos_logged_in', 'true');
      onSetViewMode('dashboard');
    } catch (error) {
      setOnboardingError(error instanceof Error ? error.message : 'Properti gagal disimpan.');
    } finally {
      setOnboardingSaving(false);
    }
  };

  /* =========================================================================
   * ONBOARDING FLOW (5 Steps)
   * ========================================================================= */
  if (viewMode === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#F5F1E8] text-[#171A18] flex flex-col justify-between p-4 sm:p-8 font-sans">
        
        {/* Top Header */}
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#173B30] text-[#F5F1E8] flex items-center justify-center font-black shadow-sm">
              <Buildings weight="duotone" className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold font-display text-[#173B30]">
              BISNIESGO <span className="font-light text-[#315A49]">Living</span>
            </span>
          </div>

          <span className="text-xs font-bold text-[#6E746F]">
            Langkah {obStep} dari 5
          </span>
        </div>

        {/* Card Container */}
        <div className="max-w-2xl mx-auto w-full bg-[#FBF9F5] border border-[rgba(23,59,48,0.12)] rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
          
          {/* Welcome Text */}
          <div className="text-center pb-2">
            <h1 className="text-3xl font-bold font-editorial text-[#171A18]">
              Selamat datang di BISNIESGO Living.
            </h1>
            <p className="text-sm text-[#6E746F] mt-2">
              Mari siapkan properti pertama Anda.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#173B30] h-full transition-all duration-300"
              style={{ width: `${(obStep / 5) * 100}%` }}
            />
          </div>

          {/* STEP 1: Tentang Properti */}
          {obStep === 1 && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-[#A8B7A1] uppercase tracking-wider block">
                  Langkah 1
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#171A18] font-editorial mt-1">
                  Tentang Properti Anda
                </h2>
                <p className="text-xs text-[#6E746F] mt-1">
                  Masukkan informasi dasar bisnis hunian yang Anda kelola.
                </p>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Nama Properti *</label>
                  <input
                    type="text"
                    value={obPropName}
                    onChange={(e) => {
                      setObPropName(e.target.value);
                      setObSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                    }}
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2.5 text-xs text-[#171A18]"
                    placeholder="Contoh: Green House Kemang"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Tipe Bisnis Hunian</label>
                  <ElegantSelect
                    value={obPropType}
                    onChange={(val) => setObPropType(val)}
                    options={[
                      { value: 'Kost', label: 'Kost Eksklusif' },
                      { value: 'Coliving', label: 'Coliving Space' },
                      { value: 'Apartemen', label: 'Apartemen Sewa' },
                      { value: 'Villa', label: 'Villa & Retreat' },
                      { value: 'Guest House', label: 'Guest House & Homestay' }
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#171A18] mb-1">Kota</label>
                    <input
                      type="text"
                      value={obCity}
                      onChange={(e) => setObCity(e.target.value)}
                      placeholder="Jakarta Selatan"
                      className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2.5 text-xs text-[#171A18]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#171A18] mb-1">WhatsApp Pengelola</label>
                    <input
                      type="tel"
                      value={obWhatsapp}
                      onChange={(e) => setObWhatsapp(e.target.value)}
                      placeholder="081234567890"
                      className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2.5 text-xs text-[#171A18]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={obAddress}
                    onChange={(e) => setObAddress(e.target.value)}
                    placeholder="Jl. Kemang Timur No. 42"
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2.5 text-xs text-[#171A18]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setObStep(2)}
                  className="px-6 py-3 rounded-xl bg-[#173B30] text-[#F5F1E8] font-bold text-xs hover:bg-[#0f2720] shadow-md flex items-center gap-2 cursor-pointer"
                >
                  Lanjut ke Kamar <ArrowRight weight="duotone" className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Tambahkan Kamar */}
          {obStep === 2 && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-[#A8B7A1] uppercase tracking-wider block">
                  Langkah 2
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#171A18] font-editorial mt-1">
                  Tambahkan Kamar Pertama
                </h2>
                <p className="text-xs text-[#6E746F] mt-1">
                  Tentukan berapa jumlah kamar dan tarif sewa bulanan dasar Anda.
                </p>
              </div>

              <div className="space-y-4 pt-2 text-xs">
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">
                    Jumlah Total Kamar / Unit: <strong className="text-[#173B30]">{obRoomCount} Kamar</strong>
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={40}
                    value={obRoomCount}
                    onChange={(e) => setObRoomCount(Number(e.target.value))}
                    className="w-full accent-[#173B30]"
                  />
                  <div className="flex justify-between text-[10px] text-[#6E746F] mt-1">
                    <span>2 Kamar</span>
                    <span>20 Kamar</span>
                    <span>40+ Kamar</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#171A18] mb-1">
                    Estimasi Tarif Sewa Bulanan Dasar (Rp)
                  </label>
                  <input
                    type="number"
                    value={obBasePrice}
                    onChange={(e) => setObBasePrice(Number(e.target.value))}
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2.5 text-xs text-[#171A18]"
                  />
                  <p className="text-[10px] text-[#6E746F] mt-1">
                    Anda dapat mengatur tarif dan nama tiap kamar secara spesifik nanti di dashboard.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setObStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-[rgba(23,59,48,0.20)] text-xs font-bold text-[#173B30]"
                >
                  ← Kembali
                </button>
                <button
                  onClick={() => setObStep(3)}
                  className="px-6 py-3 rounded-xl bg-[#173B30] text-[#F5F1E8] font-bold text-xs hover:bg-[#0f2720] shadow-md flex items-center gap-2 cursor-pointer"
                >
                  Pilih Tampilan <ArrowRight weight="duotone" className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Pilih Tampilan Template */}
          {obStep === 3 && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-[#A8B7A1] uppercase tracking-wider block">
                  Langkah 3
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#171A18] font-editorial mt-1">
                  Pilih Tampilan Website
                </h2>
                <p className="text-xs text-[#6E746F] mt-1">
                  Pilih salah satu template yang paling mencerminkan karakter hunian Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {[
                  { id: 'align', name: 'ALIGN', desc: 'Warm ivory & deep green, editorial, foto megah. Cocok untuk coliving & villa.' },
                  { id: 'urban', name: 'URBAN', desc: 'Modern city, rapi, kontras tegas. Cocok untuk kost & apartemen.' },
                  { id: 'serene', name: 'SERENE', desc: 'Batu hangat, sage green, nuansa alam. Cocok untuk retreat & Bali villa.' },
                ].map(tmpl => (
                  <div
                    key={tmpl.id}
                    onClick={() => setObTemplate(tmpl.id as any)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      obTemplate === tmpl.id
                        ? 'bg-white border-[#173B30] ring-2 ring-[#173B30]/20 shadow-md'
                        : 'bg-white/60 border-zinc-200 hover:bg-white'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-sm text-[#173B30] uppercase">{tmpl.name}</span>
                      <p className="text-[11px] text-[#6E746F] mt-1.5 leading-relaxed">{tmpl.desc}</p>
                    </div>
                    {obTemplate === tmpl.id && (
                      <span className="text-[10px] font-bold text-emerald-700 mt-3 flex items-center gap-1">
                        <Check weight="duotone" className="h-3.5 w-3.5" /> Dipilih
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setObStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-[rgba(23,59,48,0.20)] text-xs font-bold text-[#173B30]"
                >
                  ← Kembali
                </button>
                <button
                  onClick={() => setObStep(4)}
                  className="px-6 py-3 rounded-xl bg-[#173B30] text-[#F5F1E8] font-bold text-xs hover:bg-[#0f2720] shadow-md flex items-center gap-2 cursor-pointer"
                >
                  Preview Website <ArrowRight weight="duotone" className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Preview Website */}
          {obStep === 4 && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-[#A8B7A1] uppercase tracking-wider block">
                  Langkah 4
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#171A18] font-editorial mt-1">
                  Preview Website Publik
                </h2>
                <p className="text-xs text-[#6E746F] mt-1">
                  Inilah tampilan awal website properti Anda yang siap diakses calon penghuni.
                </p>
              </div>

              {/* Mini Preview Mockup */}
              <div className="rounded-2xl border border-[rgba(23,59,48,0.15)] overflow-hidden bg-white shadow-md">
                <div className="bg-[#173B30] text-[#F5F1E8] px-4 py-2 text-[11px] font-mono flex items-center justify-between">
                  <span>https://{obSubdomain}.bisniesgo.id</span>
                  <span className="uppercase text-emerald-300 font-bold">{obTemplate}</span>
                </div>
                <div className="p-4 bg-[#F5F1E8] space-y-3">
                  <span className="text-[10px] uppercase font-bold text-[#A8B7A1]">{obPropType} di {obCity}</span>
                  <h4 className="text-xl font-bold text-[#171A18] font-editorial">{obPropName}</h4>
                  <p className="text-xs text-[#6E746F]">{obAddress}</p>
                  <div className="p-3 bg-white rounded-xl border border-[rgba(23,59,48,0.08)] flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#6E746F] block">Tarif Mulai</span>
                      <strong className="text-[#173B30]">Rp {obBasePrice.toLocaleString('id-ID')} / bulan</strong>
                    </div>
                    <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded">
                      {obRoomCount} Kamar Siap Huni
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setObStep(3)}
                  className="px-4 py-2.5 rounded-xl border border-[rgba(23,59,48,0.20)] text-xs font-bold text-[#173B30]"
                >
                  ← Kembali
                </button>
                <button
                  onClick={() => setObStep(5)}
                  className="px-6 py-3 rounded-xl bg-[#173B30] text-[#F5F1E8] font-bold text-xs hover:bg-[#0f2720] shadow-md flex items-center gap-2 cursor-pointer"
                >
                  Lanjut ke Simpan <ArrowRight weight="duotone" className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Save */}
          {obStep === 5 && (
            <div className="space-y-5 text-center py-4">
              <div className="h-16 w-16 rounded-full bg-emerald-50 text-[#173B30] border border-[#173B30]/15 flex items-center justify-center mx-auto shadow-xs">
                <Globe className="h-8 w-8 stroke-[1.5]" />
              </div>

              <div>
                <span className="text-xs font-bold text-[#A8B7A1] uppercase tracking-wider block">
                  Langkah 5
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#171A18] font-editorial mt-1">
                  Simpan Properti Anda
                </h2>
                <p className="text-xs text-[#6E746F] max-w-sm mx-auto mt-1">
                  Simpan pengaturan dan kamar Anda untuk mulai mengelola properti. Alamat khusus memerlukan konfigurasi domain terpisah.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[rgba(23,59,48,0.12)] max-w-sm mx-auto space-y-2 text-xs">
                <span className="text-[10px] text-[#6E746F] block">Alamat khusus yang diminta:</span>
                <p className="font-mono font-bold text-[#173B30] text-sm">
                  {obSubdomain}.bisniesgo.id
                </p>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-flex items-center gap-1 font-semibold">
                  <CheckCircle weight="duotone" className="h-3 w-3" /> Belum aktif hingga domain dikonfigurasi
                </span>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                {onboardingError && <p role="alert" className="text-sm text-rose-700">{onboardingError}</p>}
                <button
                  onClick={handleFinishOnboarding}
                  disabled={onboardingSaving}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#173B30] text-[#F5F1E8] font-bold text-xs hover:bg-[#0f2720] shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {onboardingSaving ? 'Menyimpan properti...' : 'Buka Dashboard Pengelola'} <ArrowRight weight="duotone" className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-[#6E746F] py-2">
          BISNIESGO Living — Kelola properti. Terima booking. Tumbuh lebih baik.
        </div>

      </div>
    );
  }

  /* =========================================================================
   * LOGIN & REGISTER SCREENS
   * ========================================================================= */
  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#171A18] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-[#FBF9F5] border border-[rgba(23,59,48,0.12)] rounded-3xl p-7 sm:p-8 shadow-xl space-y-6">
        
        {/* Back Button */}
        <button
          onClick={onGoBackLanding}
          className="text-xs font-semibold text-[#6E746F] hover:text-[#171A18] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          Kembali ke Beranda
        </button>

        {/* Logo Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#173B30] text-[#F5F1E8] flex items-center justify-center font-black shadow-sm">
            <Buildings weight="duotone" className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-[#173B30]">
              BISNIESGO <span className="font-light text-[#315A49]">Living</span>
            </h1>
            <p className="text-[10px] text-[#6E746F] font-semibold uppercase">
              {viewMode === 'login' ? 'Masuk ke Dashboard' : 'Pendaftaran Pengelola Baru'}
            </p>
          </div>
        </div>

        {viewMode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {loginError && (
              <p className="text-rose-600 bg-rose-50 p-2.5 rounded-xl">{loginError}</p>
            )}

            <div>
              <label className="block font-bold text-[#171A18] mb-1">Nomor WhatsApp / HP</label>
              <input
                type="tel"
                required
                placeholder="081234567890"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2.5 text-xs text-[#171A18] focus:outline-none focus:ring-2 focus:ring-[#173B30]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#171A18] mb-1">Kata Sandi</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2.5 text-xs text-[#171A18] focus:outline-none focus:ring-2 focus:ring-[#173B30]"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-[#173B30] text-[#F5F1E8] font-bold text-xs hover:bg-[#0f2720] shadow-md transition-all cursor-pointer"
            >
              {loginLoading ? 'Memeriksa Akun...' : 'Masuk ke Akun'}
            </button>

            <div className="pt-2 text-center text-xs text-[#6E746F]">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => onSetViewMode('register')}
                className="font-bold text-[#173B30] hover:underline cursor-pointer"
              >
                Daftar Sekarang
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            {regError && (
              <p className="text-rose-600 bg-rose-50 p-2.5 rounded-xl">{regError}</p>
            )}

            <div>
              <label className="block font-bold text-[#171A18] mb-1">Nama Pemilik / Pengelola *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Hendra Wijaya"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#171A18] mb-1">Nama Properti Utama *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Green House Kemang"
                value={regKostName}
                onChange={(e) => setRegKostName(e.target.value)}
                className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#171A18] mb-1">Nomor WhatsApp *</label>
              <input
                type="tel"
                required
                placeholder="081234567890"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#171A18] mb-1">Buat Kata Sandi *</label>
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
              />
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full py-3 rounded-xl bg-[#173B30] text-[#F5F1E8] font-bold text-xs hover:bg-[#0f2720] shadow-md transition-all cursor-pointer"
            >
              {regLoading ? 'Mendaftarkan...' : 'Daftar & Siapkan Properti'}
            </button>

            <div className="pt-2 text-center text-xs text-[#6E746F]">
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={() => onSetViewMode('login')}
                className="font-bold text-[#173B30] hover:underline cursor-pointer"
              >
                Masuk di Sini
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
