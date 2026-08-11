import React, { useState } from 'react';
import { Landmark, FileText, Database, Building2, Save, ShieldCheck, Eye, EyeOff, Phone, Lock, Plus, Layers, ExternalLink, Copy, Check, Trash2, MapPin, Globe } from 'lucide-react';
import { KostSettings, Property, PropertyType } from '../types';
import { authChangePassword } from '../api';

interface SettingsViewProps {
  kostSettings: KostSettings;
  onUpdateSettings: (newSettings: KostSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
  properties?: Property[];
  onAddProperty?: (newProp: Property) => void;
  onUpdateProperty?: (updatedProp: Property) => void;
  onDeleteProperty?: (id: string) => void;
  onPreviewPropertyLanding?: (propertyId: string) => void;
  openAddPropertyModalDefault?: boolean;
}

// Helper to get/set the kostos_user credential record
const getUserCredentials = (): { phone: string; password: string } => {
  try {
    const raw = localStorage.getItem('kostos_user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { phone: '', password: '' };
};

const saveUserCredentials = (data: { phone: string; password: string }) => {
  localStorage.setItem('kostos_user', JSON.stringify(data));
};

export function SettingsView({ 
  kostSettings, 
  onUpdateSettings, 
  onExportBackup, 
  onImportBackup,
  properties = [],
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty,
  onPreviewPropertyLanding,
  openAddPropertyModalDefault = false
}: SettingsViewProps) {
  
  const [activeSegment, setActiveSegment] = useState<'properties' | 'profile' | 'bank' | 'template' | 'backup' | 'account'>(
    openAddPropertyModalDefault ? 'properties' : 'properties'
  );
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedPropId, setCopiedPropId] = useState<string | null>(null);

  // Property Modal Form State
  const [showPropertyModal, setShowPropertyModal] = useState<boolean>(openAddPropertyModalDefault);
  const [editingProp, setEditingProp] = useState<Property | null>(null);

  const [propName, setPropName] = useState('');
  const [propType, setPropType] = useState<PropertyType>('Kost');
  const [propAddress, setPropAddress] = useState('');
  const [propCity, setPropCity] = useState('Yogyakarta');
  const [propPhone, setPropPhone] = useState(kostSettings.whatsapp || '');
  const [propDesc, setPropDesc] = useState('');
  const [propCover, setPropCover] = useState('https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80');
  const [propFacilities, setPropFacilities] = useState('AC, WiFi, Water Heater, Smart Key');
  const [propPriceDay, setPropPriceDay] = useState<number>(180000);
  const [propPriceMonth, setPropPriceMonth] = useState<number>(1750000);

  // Local state initialized with current prop values
  const [kostName, setKostName] = useState(kostSettings.kostName);
  const [kostOwnerName, setKostOwnerName] = useState(kostSettings.ownerName);
  const [kostPhone, setKostPhone] = useState(kostSettings.whatsapp);
  const [kostAddress, setKostAddress] = useState(kostSettings.address);

  const [bankName, setBankName] = useState(kostSettings.bankAccounts[0]?.bankName || 'BCA');
  const [bankNumber, setBankNumber] = useState(kostSettings.bankAccounts[0]?.accountNumber || '');
  const [bankOwner, setBankOwner] = useState(kostSettings.bankAccounts[0]?.accountHolder || '');

  const [reminderTemplate, setReminderTemplate] = useState(kostSettings.reminderTemplate);

  // Account & Security state
  const [currentCredPhone, setCurrentCredPhone] = useState(getUserCredentials().phone);
  const [newPhone, setNewPhone] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);

  const triggerSuccessBubble = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingProp(null);
    setPropName('');
    setPropType('Kost');
    setPropAddress('');
    setPropCity('Yogyakarta');
    setPropPhone(kostSettings.whatsapp || '081234567890');
    setPropDesc('');
    setPropCover('https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80');
    setPropFacilities('AC, WiFi, Water Heater, Smart Key');
    setPropPriceDay(180000);
    setPropPriceMonth(1750000);
    setShowPropertyModal(true);
  };

  const handleOpenEditModal = (p: Property) => {
    setEditingProp(p);
    setPropName(p.name);
    setPropType(p.type);
    setPropAddress(p.address);
    setPropCity(p.city);
    setPropPhone(p.whatsapp);
    setPropDesc(p.description);
    setPropCover(p.coverImage || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80');
    setPropFacilities((p.facilities || []).join(', '));
    setPropPriceDay(p.startPriceDay || 180000);
    setPropPriceMonth(p.startPriceMonth || 1750000);
    setShowPropertyModal(true);
  };

  const handleSavePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propName || !propAddress) return;

    const facList = propFacilities.split(',').map(s => s.trim()).filter(Boolean);

    if (editingProp) {
      const updatedProp: Property = {
        ...editingProp,
        name: propName,
        type: propType,
        address: propAddress,
        city: propCity,
        whatsapp: propPhone,
        description: propDesc,
        coverImage: propCover,
        facilities: facList,
        startPriceDay: Number(propPriceDay),
        startPriceMonth: Number(propPriceMonth),
      };
      onUpdateProperty?.(updatedProp);
      triggerSuccessBubble(`✓ Properti "${propName}" berhasil diperbarui!`);
    } else {
      const newProp: Property = {
        id: `prop-${Date.now()}`,
        name: propName,
        type: propType,
        slug: propName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        address: propAddress,
        city: propCity,
        whatsapp: propPhone,
        ownerName: kostSettings.ownerName || 'Pengelola',
        description: propDesc || `Penginapan ${propType} di ${propCity}`,
        coverImage: propCover,
        facilities: facList,
        startPriceDay: Number(propPriceDay),
        startPriceMonth: Number(propPriceMonth),
      };
      onAddProperty?.(newProp);
      triggerSuccessBubble(`✓ Tempat Penginapan Baru "${propName}" berhasil ditambahkan!`);
    }
    setShowPropertyModal(false);
  };

  const handleCopyLink = (propId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?property=${propId}`;
    navigator.clipboard.writeText(url);
    setCopiedPropId(propId);
    triggerSuccessBubble('✓ Link Landing Page publik berhasil disalin!');
    setTimeout(() => setCopiedPropId(null), 2500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...kostSettings,
      kostName: kostName,
      ownerName: kostOwnerName,
      whatsapp: kostPhone,
      address: kostAddress
    });
    triggerSuccessBubble('✓ Profil Penginapan berhasil diperbarui!');
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...kostSettings,
      bankAccounts: [
        {
          id: (kostSettings?.bankAccounts || [])[0]?.id || 'bank-1',
          bankName,
          accountNumber: bankNumber,
          accountHolder: bankOwner
        },
        ...((kostSettings?.bankAccounts || []).slice(1))
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
    triggerSuccessBubble('✓ Template Broadcast WA berhasil disimpan!');
  };

  const handleChangePhone = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    if (!newPhone || newPhone.length < 9) {
      setPhoneError('Nomor WhatsApp baru harus minimal 9 digit.');
      return;
    }
    if (newPhone !== confirmPhone) {
      setPhoneError('Konfirmasi nomor tidak cocok.');
      return;
    }
    const creds = getUserCredentials();
    saveUserCredentials({ ...creds, phone: newPhone });
    setCurrentCredPhone(newPhone);
    setNewPhone('');
    setConfirmPhone('');
    triggerSuccessBubble('✓ Nomor WhatsApp / Login berhasil diperbarui!');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!oldPassword) {
      setPasswordError('Kata sandi lama wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }
    try {
      await authChangePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerSuccessBubble('✓ Kata sandi akun berhasil diubah!');
    } catch (err: any) {
      setPasswordError(err.message || 'Gagal mengubah kata sandi.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Upper Success alert banner toast style */}
      {successMsg && (
        <div id="settings-success-alert" className="p-3 text-xs bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 rounded-r-xl font-bold font-mono animate-in slide-in-from-top-4 duration-200 shadow-sm">
          {successMsg}
        </div>
      )}

      {/* Main Settings Panel Wrapper Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs text-slate-800">
        
        {/* Left Column Sidebar (Menu Segments picker) (3/12 width) */}
        <div className="md:col-span-3 space-y-1.5 pt-2">
          {[
            { id: 'properties', label: 'Multi Penginapan', icon: Building2 },
            { id: 'profile', label: 'Profil Utama', icon: Layers },
            { id: 'bank', label: 'Rekening Bank', icon: Landmark },
            { id: 'template', label: 'Template WA', icon: FileText },
            { id: 'backup', label: 'Backup & Restore', icon: Database },
            { id: 'account', label: 'Akun & Keamanan', icon: ShieldCheck },
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
                <Icon className="h-4 w-4 opacity-80" />
                <span>{seg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Column Body details form based on segment (9/12 width) */}
        <div className="md:col-span-9 p-1 md:border-l border-slate-100 md:pl-6">
          
          {/* 1. MULTI-PROPERTY MANAGEMENT SUB-SECTION */}
          {activeSegment === 'properties' && (
            <div className="space-y-6 text-xs font-medium">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-950 text-sm">Kelola Multi Tempat Penginapan & Cabang</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Kelola daftar tempat penginapan, homestay, villa, dan kost bulanan di akun ini.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const storedSlug = localStorage.getItem('kostos_owner_slug');
                      const ownerSlug = storedSlug || (kostSettings.kostName || kostSettings.ownerName || 'pengelola').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                      const catalogUrl = `${window.location.origin}${window.location.pathname}?owner=${ownerSlug}`;
                      navigator.clipboard.writeText(catalogUrl);
                      triggerSuccessBubble('✓ Link Beranda Katalog Anda berhasil disalin!');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer text-xs shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" /> Salin Link Katalog
                  </button>
                  <button
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer text-xs shrink-0"
                  >
                    <Plus className="h-4 w-4" /> + Tambah Penginapan
                  </button>
                </div>
              </div>

              {/* Properties Grid */}
              <div className="grid grid-cols-1 gap-4">
                {properties.map(p => (
                  <div key={p.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-teal-300 transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-bold overflow-hidden">
                        {p.coverImage ? (
                          <img src={p.coverImage} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="h-6 w-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900">{p.name}</h4>
                          <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">{p.type}</span>
                          <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{p.city}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{p.address}</span>
                        </p>
                        <p className="text-[10px] text-teal-700 font-bold mt-1">
                          WA Contact: {p.whatsapp} • Mulai Rp {(p.startPriceDay || 180000).toLocaleString('id-ID')}/mlm
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(p.id)}
                        className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                        title="Salin Link Landing Page Publik"
                      >
                        {copiedPropId === p.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                        <span>{copiedPropId === p.id ? 'Tersalin' : 'Salin Link'}</span>
                      </button>

                      {onPreviewPropertyLanding && (
                        <button
                          type="button"
                          onClick={() => onPreviewPropertyLanding(p.id)}
                          className="py-1.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          <span>Landing</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(p)}
                        className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Edit
                      </button>

                      {properties.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus penginapan "${p.name}" dari akun?`)) {
                              onDeleteProperty?.(p.id);
                              triggerSuccessBubble(`✓ Penginapan "${p.name}" dihapus.`);
                            }
                          }}
                          className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. PROFILE SUB-SECTION */}
          {activeSegment === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-medium">
              <div>
                <h3 className="font-extrabold text-slate-950 text-sm">Profil Akun & Instalasi Utama</h3>
                <p className="text-[10px] text-slate-400 mt-1">Mengubah identitas nama penginapan utama yang muncul di header dan kwitansi penagihan.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">NAMA INSTALASI PENGINAPAN *</label>
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
                <label className="text-[10px] font-extrabold text-slate-500 block">ALAMAT LENGKAP UTAMA</label>
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
                <p className="text-[10px] text-slate-400 mt-1">StayFlow berjalan penuh 100% luring/offline di peramban browser Anda. Unduh salinan database Anda untuk diunggah kapan saja.</p>
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
            </div>
          )}

          {/* ACCOUNT & SECURITY SUB-SECTION */}
          {activeSegment === 'account' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="font-extrabold text-slate-950 text-sm">Akun & Keamanan</h3>
                <p className="text-[10px] text-slate-400 mt-1">Ubah nomor WhatsApp login dan kata sandi akun StayFlow Anda.</p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="h-9 w-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-teal-700" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">NOMOR LOGIN AKTIF</p>
                  <p className="font-extrabold text-slate-800 text-sm">{currentCredPhone || kostSettings.whatsapp || '—'}</p>
                </div>
              </div>

              <form onSubmit={handleChangePhone} className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <h4 className="font-extrabold text-slate-700 text-xs">Ubah Nomor WhatsApp / Login</h4>
                </div>

                {phoneError && (
                  <div className="p-2.5 text-[10px] bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-semibold">
                    ⚠️ {phoneError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">NOMOR BARU *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">KONFIRMASI NOMOR BARU *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ulangi nomor baru"
                      className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={confirmPhone}
                      onChange={(e) => setConfirmPhone(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" /> Simpan Nomor
                </button>
              </form>

              {/* CHANGE PASSWORD FORM */}
              <form onSubmit={handleChangePassword} className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  <h4 className="font-extrabold text-slate-700 text-xs">Ubah Kata Sandi Akun</h4>
                </div>

                {passwordError && (
                  <div className="p-2.5 text-[10px] bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-semibold">
                    ⚠️ {passwordError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">KATA SANDI LAMA *</label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan kata sandi lama Anda"
                    className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">KATA SANDI BARU *</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">KONFIRMASI KATA SANDI BARU *</label>
                    <input
                      type="password"
                      required
                      placeholder="Ulangi kata sandi baru"
                      className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Lock className="h-3.5 w-3.5" /> Ubah Kata Sandi
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* ADD / EDIT PROPERTY MODAL */}
      {showPropertyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Form Penginapan</span>
                <h3 className="text-lg font-black">{editingProp ? `Edit: ${editingProp.name}` : '+ Tambah Tempat Penginapan Baru'}</h3>
              </div>
              <button
                onClick={() => setShowPropertyModal(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePropertySubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-600">NAMA TEMPAT PENGINAPAN *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: StayFlow Malioboro Villa"
                    value={propName}
                    onChange={(e) => setPropName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-600">TIPE PENGINAPAN *</label>
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value as PropertyType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Kost">Kost Bulanan</option>
                    <option value="Homestay">Homestay Harian</option>
                    <option value="Guesthouse">Guesthouse</option>
                    <option value="Villa">Villa / Resort</option>
                    <option value="Hotel">Hotel / Lodge</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-600">KOTA / LOKASI *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Yogyakarta / Sleman / Bali"
                    value={propCity}
                    onChange={(e) => setPropCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-600">WHATSAPP PENGELOLA *</label>
                  <input
                    type="text"
                    required
                    placeholder="0812xxxxxxxx"
                    value={propPhone}
                    onChange={(e) => setPropPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-600">ALAMAT LENGKAP *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Jl. Malioboro No. 12, Danurejan, Yogyakarta"
                  value={propAddress}
                  onChange={(e) => setPropAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-600">DESKRIPSI SHOWCASE</label>
                <textarea
                  rows={2}
                  placeholder="Homestay harian eksklusif 3 menit ke Malioboro..."
                  value={propDesc}
                  onChange={(e) => setPropDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-600">START HARGA HARIAN (RP)</label>
                  <input
                    type="number"
                    value={propPriceDay}
                    onChange={(e) => setPropPriceDay(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-600">START HARGA BULANAN (RP)</label>
                  <input
                    type="number"
                    value={propPriceMonth}
                    onChange={(e) => setPropPriceMonth(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-600">FASILITAS UTAMA (PISAH DENGAN KOMA)</label>
                <input
                  type="text"
                  placeholder="AC, WiFi Dedicated, Water Heater, Smart Key"
                  value={propFacilities}
                  onChange={(e) => setPropFacilities(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-600">URL FOTO COVER (OPSIONAL)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={propCover}
                  onChange={(e) => setPropCover(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-[11px] focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPropertyModal(false)}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingProp ? 'Simpan Perubahan' : 'Tambah Tempat Penginapan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
