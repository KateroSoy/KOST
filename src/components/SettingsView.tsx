import React, { useState } from 'react';
import { Settings, Landmark, FileText, Check, Database, Eye, RefreshCw, Smartphone, MapPin, Building2, Save } from 'lucide-react';
import { KostSettings } from '../types';

interface SettingsViewProps {
  kostSettings: KostSettings;
  onUpdateSettings: (newSettings: KostSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SettingsView({ kostSettings, onUpdateSettings, onExportBackup, onImportBackup }: SettingsViewProps) {
  
  const [activeSegment, setActiveSegment] = useState<'profile' | 'bank' | 'template' | 'backup'>('profile');
  const [successMsg, setSuccessMsg] = useState('');

  // Local state initialized with current prop values
  const [kostName, setKostName] = useState(kostSettings.kostName);
  const [kostOwnerName, setKostOwnerName] = useState(kostSettings.ownerName);
  const [kostPhone, setKostPhone] = useState(kostSettings.whatsapp);
  const [kostAddress, setKostAddress] = useState(kostSettings.address);

  const [bankName, setBankName] = useState(kostSettings.bankAccounts[0]?.bankName || 'BCA');
  const [bankNumber, setBankNumber] = useState(kostSettings.bankAccounts[0]?.accountNumber || '');
  const [bankOwner, setBankOwner] = useState(kostSettings.bankAccounts[0]?.accountHolder || '');

  const [reminderTemplate, setReminderTemplate] = useState(kostSettings.reminderTemplate);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...kostSettings,
      kostName: kostName,
      ownerName: kostOwnerName,
      whatsapp: kostPhone,
      address: kostAddress
    });
    triggerSuccessBubble('✓ Profil Kost berhasil diperbarui!');
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...kostSettings,
      bankAccounts: [
        {
          id: kostSettings.bankAccounts[0]?.id || 'bank-1',
          bankName,
          accountNumber: bankNumber,
          accountHolder: bankOwner
        },
        ...(kostSettings.bankAccounts.slice(1))
      ]
    });
    triggerSuccessBubble('✓ Informasi Rekening Bank diperbarui!');
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...kostSettings,
      reminderTemplate: reminderTemplate
    });
    triggerSuccessBubble('✓ Template Broadcast SMS/WA berhasil disimpan!');
  };

  const triggerSuccessBubble = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Upper Success alert banner toast style */}
      {successMsg && (
        <div id="settings-success-alert" className="p-3 text-xs bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 rounded-r-xl font-bold font-mono animate-in slide-in-from-top-4 duration-200">
          {successMsg}
        </div>
      )}

      {/* Main Settings Panel Wrapper Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs text-slate-800">
        
        {/* Left Column Sidebar (Menu Segments picker) (3/12 width) */}
        <div className="md:col-span-3 space-y-1.5 pt-2">
          {[
            { id: 'profile', label: 'Profil Rumah Kost', icon: Building2 },
            { id: 'bank', label: 'Rekening Bank', icon: Landmark },
            { id: 'template', label: 'Template WA', icon: FileText },
            { id: 'backup', label: 'Backup & Restore', icon: Database }
          ].map((seg) => {
            const isSel = activeSegment === seg.id;
            const Icon = seg.icon;
            return (
              <button
                key={seg.id}
                onClick={() => setActiveSegment(seg.id as any)}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isSel ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4.5 w-4.5 opacity-80" />
                <span>{seg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Column Body details form based on segment (9/12 width) */}
        <div className="md:col-span-9 p-1 md:border-l border-slate-100 md:pl-6">
          
          {/* PROFILE SUB-SECTION */}
          {activeSegment === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-medium">
              <div>
                <h3 className="font-extrabold text-slate-950 text-sm">Profil Rumah Kost / Kontrakan</h3>
                <p className="text-[10px] text-slate-400 mt-1">Mengubah identitas nama kost yang muncul di header dan kwitansi penagihan.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">NAMA INSTALASI KOST *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                    value={kostName}
                    onChange={(e) => setKostName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">NAMA PEMILIK / PENGELOLA *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                    value={kostOwnerName}
                    onChange={(e) => setKostOwnerName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 block">TELEPON WHATSAPP (UTAMA) *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none font-mono"
                  value={kostPhone}
                  onChange={(e) => setKostPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 block">ALAMAT LENGKAP KOST</label>
                <textarea
                  className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  rows={3}
                  value={kostAddress}
                  onChange={(e) => setKostAddress(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Save className="h-4.5 w-4.5" /> Simpan Profil
                </button>
              </div>
            </form>
          )}

          {/* BANKING SUB-SECTION */}
          {activeSegment === 'bank' && (
            <form onSubmit={handleSaveBank} className="space-y-4 text-xs font-medium">
              <div>
                <h3 className="font-extrabold text-slate-950 text-sm">Rekening Penerima Setoran</h3>
                <p className="text-[10px] text-slate-400 mt-1">Detail transfer yang otomatis dicetak di bagian bawah kwitansi invoice anak kost.</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">PILIH BANK *</label>
                  <select
                    className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl font-bold"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  >
                    <option value="BCA">BCA (Bank Central Asia)</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                    <option value="BNI">BNI</option>
                    <option value="Standard">Other Bank</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-extrabold text-slate-500 block">NOMOR REKENING *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl font-mono font-bold"
                    value={bankNumber}
                    onChange={(e) => setBankNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 block font-bold">ATAS NAMA PEMILIK REK *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl"
                  value={bankOwner}
                  onChange={(e) => setBankOwner(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="h-4.5 w-4.5" /> Simpan Nomor Rekening
                </button>
              </div>
            </form>
          )}

          {/* TEMPLATE ENGINE SUB-SECTION */}
          {activeSegment === 'template' && (
            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs font-medium">
              <div>
                <h3 className="font-extrabold text-slate-950 text-sm">Mesin Template Pesan WhatsApp</h3>
                <p className="text-[10px] text-slate-400 mt-1">Sesuaikan bahasa broadcast pengingat tagihan. Gunakan variabel bracket di bawah ini:</p>
              </div>

              {/* Supported Dynamic Variables tag badges */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: '{nama}', desc: 'Nama Penyewa' },
                  { tag: '{kamar}', desc: 'Nomor Kamar' },
                  { tag: '{bulan}', desc: 'Periode Bulan' },
                  { tag: '{jumlah}', desc: 'Total Nilai Rupiah' },
                  { tag: '{tanggal}', desc: 'Jatuh Tempo' }
                ].map((item) => (
                  <span key={item.tag} className="px-2 py-1 bg-slate-100 text-slate-650 rounded-lg text-[9px] font-mono">
                    <strong className="text-teal-700">{item.tag}</strong>: {item.desc}
                  </span>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-550 block">DRAF FORMAT CHAT BROADCAST *</label>
                <textarea
                  className="w-full bg-slate-50 p-3 border border-slate-205 rounded-2xl text-xs font-mono font-medium leading-relaxed"
                  rows={6}
                  value={reminderTemplate}
                  onChange={(e) => setReminderTemplate(e.target.value)}
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800 leading-relaxed font-semibold">
                ⚠️ Tips WA: Anda bisa menggunakan bintang seperti *tebal* atau garis bawah _miring_ untuk memformat teks WhatsApp resmi secara manual.
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="h-4.5 w-4.5" /> Simpan Template WA
                </button>
              </div>
            </form>
          )}

          {/* BACKUP & RESTORE DATABASE SUB-SECTION */}
          {activeSegment === 'backup' && (
            <div className="space-y-5 text-xs text-slate-700">
              <div>
                <h3 className="font-extrabold text-slate-950 text-sm">Amankan Penyalinan Ekspor Data</h3>
                <p className="text-[10px] text-slate-400 mt-1">Kostos berjalan penuh 100% luring/offline di peramban browser Anda. Unduh salinan database Anda untuk diunggah kapan saja.</p>
              </div>

              <div className="p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-center bg-white p-3 border border-slate-100 rounded-xl">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900">1. Amankan File Ekspor (.JSON)</h5>
                    <p className="text-[9px] text-slate-400">Unduh data semua kamar, penyewa, & pembukuan kas.</p>
                  </div>
                  <button
                    onClick={onExportBackup}
                    className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Ekspor Database
                  </button>
                </div>

                <div className="flex justify-between items-center bg-white p-3 border border-slate-100 rounded-xl">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900">2. Unggah Salinan Cadangan (Restore)</h5>
                    <p className="text-[9px] text-slate-400">Pilih file backup (.json) yang diunduh sebelumnya.</p>
                  </div>
                  <label className="py-2 px-3.5 bg-teal-600 hover:bg-teal-700 text-cyan-50 font-bold rounded-lg cursor-pointer text-center whitespace-nowrap">
                    Pilih File Recovery
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={onImportBackup}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-[11px] font-semibold">
                <span>⚠️</span>
                <span><strong>PERINGATAN:</strong> Mengunggah backup lama (Restore) akan menimpa seluruh data Kostos yang diubah sesudah backup dibuat. Harap lakukan ekspor terlebih dahulu sebelum restore!</span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
