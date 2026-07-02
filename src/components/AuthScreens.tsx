import React, { useState } from 'react';
import { Home, ArrowLeft, ArrowRight, User, Key, Building2, Phone, MapPin, DollarSign, Plus, Trash } from 'lucide-react';
import { KostSettings, Room, Tenant, BankAccount } from '../types';

interface AuthScreensProps {
  viewMode: 'login' | 'register' | 'onboarding';
  onGoBackLanding: () => void;
  onSetViewMode: (mode: 'login' | 'register' | 'onboarding' | 'dashboard') => void;
  onInitializeKost: (kostConfig: Partial<KostSettings>, roomCount: number, basePrice: number) => void;
}

export function AuthScreens({ viewMode, onGoBackLanding, onSetViewMode, onInitializeKost }: AuthScreensProps) {
  // Login states
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register states
  const [regName, setRegName] = useState('');
  const [regKostName, setRegKostName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');

  // Onboarding states
  const [obStep, setObStep] = useState(1);
  const [obKostName, setObKostName] = useState('Kost Mawar Indah');
  const [obOwnerName, setObOwnerName] = useState('Ibu Indah Lestari');
  const [obAddress, setObAddress] = useState('Jl. Dago Asri No. 42, Coblong, Bandung');
  const [obWhatsapp, setObWhatsapp] = useState('081234567890');
  
  const [obRoomCount, setObRoomCount] = useState(8);
  const [obBasePrice, setObBasePrice] = useState(1200000);
  const [obDefaultDueDateDay, setObDefaultDueDateDay] = useState(5);
  
  const [obBankName, setObBankName] = useState('BCA');
  const [obAccHolder, setObAccHolder] = useState('INDAH LESTARI');
  const [obAccNo, setObAccNo] = useState('2330998877');
  const [obBankList, setObBankList] = useState<BankAccount[]>([
    { id: 'bank-1', bankName: 'BCA', accountHolder: 'INDAH LESTARI', accountNumber: '2330998877' }
  ]);

  const handleAddBank = () => {
    if (!obBankName || !obAccHolder || !obAccNo) return;
    const newBank: BankAccount = {
      id: `bank-ob-${Date.now()}`,
      bankName: obBankName,
      accountHolder: obAccHolder,
      accountNumber: obAccNo
    };
    setObBankList([...obBankList, newBank]);
    setObBankName('');
    setObAccNo('');
  };

  const handleRemoveBank = (id: string) => {
    setObBankList(obBankList.filter(b => b.id !== id));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone || !loginPassword) {
      setLoginError('Nomor WhatsApp dan kata sandi wajib diisi!');
      return;
    }
    // Simple bypass
    onSetViewMode('dashboard');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regKostName || !regPhone || !regPassword) {
      setRegError('Semua kolom wajib diisi untuk mendaftarkan kos!');
      return;
    }
    if (regPhone.length < 9) {
      setRegError('Nomor WhatsApp belum valid (minimal 9 karakter)');
      return;
    }
    setObOwnerName(regName);
    setObKostName(regKostName);
    setObWhatsapp(regPhone);
    setRegError('');
    onSetViewMode('onboarding');
  };

  const handleOnboardingFinish = () => {
    onInitializeKost({
      kostName: obKostName,
      address: obAddress,
      ownerName: obOwnerName,
      whatsapp: obWhatsapp,
      bankAccounts: obBankList,
      defaultDueDateDay: obDefaultDueDateDay,
    }, obRoomCount, obBasePrice);
    
    onSetViewMode('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden flex flex-col">
        
        {/* Header Branding */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <Home className="h-4 w-4 text-slate-900" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">Kostos</span>
          </div>
          <button 
            onClick={onGoBackLanding}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" /> Beranda
          </button>
        </div>

        {/* 1. LOGIN SCREEN */}
        {viewMode === 'login' && (
          <div className="p-6 sm:p-8 flex-1">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Selamat Datang Kembali</h2>
            <p className="text-xs text-slate-400 mt-1">Masuk dengan akun pemilik/pengelola kost Anda.</p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              {loginError && (
                <div id="login-error-alert" className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-medium">
                  ⚠ {loginError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Nomor WhatsApp / Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="Contoh: 08123456789 atau email"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 block">Kata Sandi</label>
                  <span className="text-[10px] text-slate-400 cursor-pointer hover:text-teal-600">Lupa sandi?</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Key className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Sandi privat Anda"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-teal-600/10 transition-all cursor-pointer mt-2"
              >
                Masuk ke Aplikasi
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Belum mendaftarkan kost Anda?{' '}
                <button 
                  onClick={() => onSetViewMode('register')} 
                  className="text-teal-600 font-extrabold hover:underline"
                >
                  Daftar Kost Baru
                </button>
              </p>
            </div>
          </div>
        )}

        {/* 2. REGISTER SCREEN */}
        {viewMode === 'register' && (
          <div className="p-6 sm:p-8 flex-1">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daftarkan Usaha Kost</h2>
            <p className="text-xs text-slate-400 mt-1">Hanya butuh 10 detik untuk memulai pengelolaan yang rapi.</p>

            <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4">
              {regError && (
                <div id="register-error-alert" className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-medium">
                  ⚠ {regError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Nama Lengkap Pemilik / Pengelola</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Ibu Rindu Hartono"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Nama Rumah Kost</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={regKostName}
                    onChange={(e) => setRegKostName(e.target.value)}
                    placeholder="Contoh: Kost Mawar Indah"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Nomor WhatsApp Aktif</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-600 font-extrabold text-[10px]">
                    +62
                  </span>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="8129988776"
                    className="w-full pl-12 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Penting untuk mengirim tagihan ke WhatsApp anak kost.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Password Baru</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Key className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Sandi minimal 6 karakter"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-register-submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-teal-600/10 transition-all cursor-pointer mt-2"
              >
                Daftar & Konfigurasi Kost
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Sudah punya akun?{' '}
                <button 
                  onClick={() => onSetViewMode('login')} 
                  className="text-teal-600 font-extrabold hover:underline"
                >
                  Masuk Sekarang
                </button>
              </p>
            </div>
          </div>
        )}

        {/* 3. ONBOARDING (Kost Initial Configuration) */}
        {viewMode === 'onboarding' && (
          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
            {/* Steps Visualizer */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] uppercase font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
                  Konfigurasi Awal Kost: Step {obStep} dari 3
                </span>
                <div className="flex gap-1">
                  <div className={`h-1.5 w-6 rounded-full ${obStep >= 1 ? 'bg-teal-600' : 'bg-slate-200'}`}></div>
                  <div className={`h-1.5 w-6 rounded-full ${obStep >= 2 ? 'bg-teal-600' : 'bg-slate-200'}`}></div>
                  <div className={`h-1.5 w-6 rounded-full ${obStep >= 3 ? 'bg-teal-600' : 'bg-slate-200'}`}></div>
                </div>
              </div>

              {/* Step 1: Basic Profile */}
              {obStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-extrabold text-slate-950">Ayo, lengkapi profil usaha Anda!</h3>
                  <p className="text-xs text-slate-400">Data ini akan dicantumkan otomatis pada kwitansi kwitansi tagihan sewa bulanan.</p>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">NAMA USAHA KOST</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none focus:bg-white transition-all text-slate-800 font-medium"
                      value={obKostName}
                      onChange={(e) => setObKostName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">NOMOR WHATSAPP PEMILIK</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none focus:bg-white transition-all text-slate-800"
                      value={obWhatsapp}
                      onChange={(e) => setObWhatsapp(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">ALAMAT LENGKAP</label>
                    <textarea
                      rows={3}
                      className="w-full bg-slate-50 text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none focus:bg-white transition-all text-slate-800"
                      value={obAddress}
                      onChange={(e) => setObAddress(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Room Capacity & Price */}
              {obStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-extrabold text-slate-950">Berapa banyak kamar yang dikelola?</h3>
                  <p className="text-xs text-slate-400">Kami akan membuat draf nomor kamar secara instan untuk mempercepat setup.</p>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-extrabold text-slate-500 block">JUMLAH KAMAR</label>
                      <span className="text-xs font-bold text-teal-600">{obRoomCount} Kamar</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={40}
                      className="w-full accent-teal-600"
                      value={obRoomCount}
                      onChange={(e) => setObRoomCount(Number(e.target.value))}
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>1 Kamar</span>
                      <span>15 Kamar</span>
                      <span>30 Kamar</span>
                      <span>40 Kamar</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">HARGA SEWA BULANAN STANDAR</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">
                        Rp
                      </span>
                      <input
                        type="number"
                        className="w-full bg-slate-50 text-xs pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none focus:bg-white font-medium text-slate-800"
                        value={obBasePrice}
                        onChange={(e) => setObBasePrice(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">TANGGAL JATUH TEMPO DEFAULT</label>
                    <select
                      className="w-full bg-slate-50 text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800 font-medium"
                      value={obDefaultDueDateDay}
                      onChange={(e) => setObDefaultDueDateDay(Number(e.target.value))}
                    >
                      <option value={1}>Tanggal 1 Setiap Bulan</option>
                      <option value={5}>Tanggal 5 Setiap Bulan (Populer)</option>
                      <option value={10}>Tanggal 10 Setiap Bulan</option>
                      <option value={15}>Tanggal 15 Setiap Bulan</option>
                      <option value={20}>Tanggal 20 Setiap Bulan</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Bank accounts */}
              {obStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-extrabold text-slate-950">Rekening Transfer Pembayaran</h3>
                  <p className="text-xs text-slate-400">Informasi ini dicetak di tagihan agar penghuni kost bisa transfer langsung ke Bapak/Ibu.</p>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-500">NAMA BANK</label>
                        <select
                          className="w-full bg-white text-xs p-2 border border-slate-200 rounded-lg text-slate-800"
                          value={obBankName}
                          onChange={(e) => setObBankName(e.target.value)}
                        >
                          <option value="BCA">BCA</option>
                          <option value="Mandiri">Mandiri</option>
                          <option value="BRI">BRI</option>
                          <option value="BNI">BNI</option>
                          <option value="BSI">BSI</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-500">NO. REKENING</label>
                        <input
                          type="text"
                          placeholder="233099..."
                          className="w-full bg-white text-xs p-2 border border-slate-200 rounded-lg text-slate-800"
                          value={obAccNo}
                          onChange={(e) => setObAccNo(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-500">NAMA PEMILIK REKENING</label>
                      <input
                        type="text"
                        placeholder="INDAH LESTARI"
                        className="w-full bg-white text-xs p-2 border border-slate-200 rounded-lg text-slate-800 uppercase"
                        value={obAccHolder}
                        onChange={(e) => setObAccHolder(e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddBank}
                      className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="h-3 w-3" /> Tambah Rekening Ke Daftar
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 block">DAFTAR REKENING TERPASANG ({obBankList.length})</label>
                    {obBankList.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Belum ada bank ditambahkan. Harap tambahkan.</p>
                    ) : (
                      <div className="space-y-1 max-h-[110px] overflow-y-auto">
                        {obBankList.map((bk, i) => (
                          <div key={bk.id} className="p-2 border border-slate-100 rounded-lg bg-white flex justify-between items-center text-[11px]">
                            <span>
                              <strong>{bk.bankName}</strong> - {bk.accountNumber} ({bk.accountHolder})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveBank(bk.id)}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="mt-8 flex gap-3 pt-4 border-t border-slate-100">
              {obStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setObStep(obStep - 1)}
                  className="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  Sebelumnya
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSetViewMode('register')}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {obStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setObStep(obStep + 1)}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  Selanjutnya <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-onboarding-finish"
                  onClick={handleOnboardingFinish}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  Mulai Gunakan Kostos!
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
