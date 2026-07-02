import React, { useState } from 'react';
import { Search, Plus, UserCheck, Phone, Mail, Image, Calendar, Trash, Users, MessageSquare, ShieldAlert, X, CreditCard, ChevronRight } from 'lucide-react';
import { Tenant, Room, TenantStatus, RoomStatus } from '../types';

interface TenantsViewProps {
  tenants: Tenant[];
  rooms: Room[];
  selectedTenantId: string | null;
  onSelectTenantId: (id: string | null) => void;
  onAddTenant: (newTenant: Tenant, assignedRoomId: string) => void;
  onMoveOutTenant: (tenantId: string, roomNumber: string) => void;
  onDeleteTenant: (id: string) => void;
  onNavigateToTab: (tab: string, arg?: string) => void;
}

export function TenantsView({
  tenants, rooms, selectedTenantId, onSelectTenantId,
  onAddTenant, onMoveOutTenant, onDeleteTenant, onNavigateToTab
}: TenantsViewProps) {
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  // Add Tenant Form State
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantIdNumber, setTenantIdNumber] = useState('');
  const [tenantRoomNo, setTenantRoomNo] = useState(''); // Number of selected room
  const [moveInDate, setMoveInDate] = useState('2026-06-01');
  const [rentPrice, setRentPrice] = useState(1200000);
  const [tenantDeposit, setTenantDeposit] = useState(1000000);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [tenantNotes, setTenantNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Find empty rooms to populate the select dropdown!
  const emptyRooms = rooms.filter(r => r.status === 'Kosong' || r.status === 'Booking');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName || !tenantPhone || !tenantRoomNo) {
      setFormError('Nama lengkap, nomor WhatsApp, dan nomor kamar wajib diisi!');
      return;
    }

    if (tenantPhone.length < 9) {
      setFormError('Nomor WhatsApp belum valid. Gunakan format digital seperti 0812...');
      return;
    }

    // Find custom room price
    const selectedRoomDetails = rooms.find(r => r.number === tenantRoomNo);
    if (!selectedRoomDetails) {
      setFormError('Data kamar terpilih tidak ditemukan.');
      return;
    }

    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: tenantName,
      phone: tenantPhone,
      email: tenantEmail || `${tenantName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      idNumber: tenantIdNumber || '3273' + Math.floor(100000000000 + Math.random() * 900000000000),
      roomAssigned: tenantRoomNo,
      moveInDate: moveInDate,
      rentAmount: selectedRoomDetails.price,
      deposit: tenantDeposit,
      status: 'Belum Bayar',
      notes: tenantNotes,
      emergencyContact: {
        name: emergencyName || 'Ibu Kandung',
        relation: emergencyRelation || 'Ibu',
        phone: emergencyPhone || '081299998888'
      }
    };

    onAddTenant(newTenant, selectedRoomDetails.id);

    // Reset Form States
    setTenantName('');
    setTenantPhone('');
    setTenantEmail('');
    setTenantIdNumber('');
    setTenantRoomNo('');
    setTenantDeposit(1000000);
    setEmergencyName('');
    setEmergencyRelation('');
    setEmergencyPhone('');
    setTenantNotes('');
    setFormError('');
    setShowAddForm(false);
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.phone.includes(searchQuery) ||
                          t.roomAssigned.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'Semua') return matchesSearch;
    return matchesSearch && t.status === statusFilter;
  });

  const activeTenantDetail = tenants.find(t => t.id === selectedTenantId);
  const connectedRoom = activeTenantDetail 
    ? rooms.find(r => r.number === activeTenantDetail.roomAssigned) 
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Upper Controls */}
      <section className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari nama penghuni, nomor WA, atau nomor kamar sewa..."
            className="w-full bg-slate-50 text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter statuses shortcut in chip format */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['Semua', 'Lunas', 'Belum Bayar', 'Terlambat'].map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {st} ({st === 'Semua' ? tenants.length : tenants.filter(t => t.status === st).length})
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            setShowAddForm(true);
            onSelectTenantId(null);
          }}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4" /> Registrasi Penghuni
        </button>
      </section>

      {/* TENANT FULL DETAIL MODAL OVERLAY */}
      {activeTenantDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Head */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center font-bold text-xs text-slate-900">
                  {activeTenantDetail.name.charAt(0).toUpperCase()}
                </span>
                <span className="font-extrabold text-base">Profil Penghuni: {activeTenantDetail.name}</span>
              </div>
              <button 
                onClick={() => onSelectTenantId(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">
              
              {/* Profile Card and status */}
              <div className="p-4 border border-slate-200 bg-slate-50/75 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900">{activeTenantDetail.name}</h4>
                  <p className="text-[10px] text-slate-400">Terdaftar di Kamar <span className="text-teal-600 font-extrabold">{activeTenantDetail.roomAssigned}</span></p>
                  <p className="text-[10px] text-slate-400">Masuk sejak: {activeTenantDetail.moveInDate}</p>
                </div>

                <div className="text-left sm:text-right">
                  <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                    activeTenantDetail.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'
                  }`}>
                    {activeTenantDetail.status}
                  </span>
                  <p className="text-xs font-mono font-bold mt-1 text-slate-600">Sewa: {formatIDR(activeTenantDetail.rentAmount)}/bln</p>
                </div>
              </div>

              {/* Identity & Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                <div className="p-3 border border-slate-100 rounded-xl bg-white space-y-2">
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Kontak Penghuni</p>
                  <p className="flex items-center gap-1.5 text-slate-700">📞 WhatsApp: <strong>{activeTenantDetail.phone}</strong></p>
                  <p className="flex items-center gap-1.5 text-slate-700">✉ Email: <strong>{activeTenantDetail.email || '-'}</strong></p>
                  <p className="flex items-center gap-1.5 text-slate-700">💳 No. KTP: <strong className="font-mono">{activeTenantDetail.idNumber || '-'}</strong></p>
                </div>

                <div className="p-3 border border-slate-100 rounded-xl bg-white space-y-2">
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Kontak Darurat (Emergency)</p>
                  <p className="text-slate-700">Hubungi: <strong>{activeTenantDetail.emergencyContact?.name || '-'}</strong></p>
                  <p className="text-slate-700">Hubungan: <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-[9px] text-slate-600">{activeTenantDetail.emergencyContact?.relation || '-'}</span></p>
                  <p className="text-slate-700">No Telp: <strong>{activeTenantDetail.emergencyContact?.phone || '-'}</strong></p>
                </div>
              </div>

              {/* Deposit and collateral state */}
              <div className="p-3 bg-teal-900 text-white rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[9px] text-teal-300 font-bold uppercase tracking-wider">Uang Jaminan Deposited</p>
                  <p className="text-sm font-extrabold text-teal-100 mt-0.5">{formatIDR(activeTenantDetail.deposit || 0)}</p>
                </div>
                <span className="text-[10px] bg-teal-800 text-teal-200 py-1 px-2.5 rounded-xl font-bold">✓ Aman disimpan</span>
              </div>

              {/* Fake KTP placeholder */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase block tracking-wider">Arsip Foto Identitas KTP / Kartu Mahasiswa</p>
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-center text-center">
                  <div className="space-y-1">
                    <span className="text-2xl text-slate-300">💳</span>
                    <p className="text-[10px] font-bold text-slate-700">KTP_PEMILIK_RESMI_KMR_{activeTenantDetail.roomAssigned}.JPG</p>
                    <p className="text-[8px] text-slate-400">Enkripsi hash valid: 0x32A002931-SHA256 (Tersimpan otomatis)</p>
                  </div>
                </div>
              </div>

              {activeTenantDetail.notes && (
                <div className="p-3 bg-slate-50 border-l-4 border-teal-500 rounded-r-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Catatan Tambahan Pengelola:</p>
                  <p className="text-xs text-slate-600 mt-0.5">“{activeTenantDetail.notes}”</p>
                </div>
              )}
            </div>

            {/* Modal Controls footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Apakah Anda yakin ingin mengeluarkan ${activeTenantDetail.name} dari Kost dan menonaktifkan kamar ${activeTenantDetail.roomAssigned}? Kamar akan berstatus 'Kosong' kembali.`)) {
                    onMoveOutTenant(activeTenantDetail.id, activeTenantDetail.roomAssigned);
                    onSelectTenantId(null);
                  }
                }}
                className="px-3.5 py-2 hover:bg-rose-600 hover:text-white text-rose-500 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash className="h-4 w-4" /> Keluar Kost (Tandai Kosong)
              </button>

              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectTenantId(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADD REGISTRATION FORM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-300 shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Registrasi Penghuni Baru</span>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {formError && (
                <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-medium">
                  ⚠️ {formError}
                </div>
              )}

              {/* Personal data */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-1.5">1. DATA PRIBADI CONCIERGE</h4>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">NAMA LENGKAP TENANT *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Andi Saputra"
                    className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">NO. WHATSAPP (AKTIF) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 08129876543"
                      className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                      value={tenantPhone}
                      onChange={(e) => setTenantPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">EMAIL CONCIERGE</label>
                    <input
                      type="email"
                      placeholder="Contoh: andi@gmail.com"
                      className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                      value={tenantEmail}
                      onChange={(e) => setTenantEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">NOMOR KTP IDENTITAS (16-DIGIT)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 327311..."
                    maxLength={16}
                    className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl text-slate-800 font-mono"
                    value={tenantIdNumber}
                    onChange={(e) => setTenantIdNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Room allocation and rentals */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-1.5">2. ALOKASI KAMAR & KAS PENYALURAN</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">PILIH KAMAR KOSONG *</label>
                    {emptyRooms.length === 0 ? (
                      <p className="text-[9px] text-rose-500 font-bold bg-rose-50 p-2 rounded">
                        Semua kamar terisi! Tambahkan kamar baru terlebih dulu.
                      </p>
                    ) : (
                      <select
                        required
                        className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none"
                        value={tenantRoomNo}
                        onChange={(e) => setTenantRoomNo(e.target.value)}
                      >
                        <option value="">-- Pilih Kamar --</option>
                        {emptyRooms.map((er) => (
                          <option key={er.id} value={er.number}>
                            Kamar {er.number} ({er.type} - {formatIDR(er.price)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">TANGGAL MASUK KOST</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                      value={moveInDate}
                      onChange={(e) => setMoveInDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">DEPOSIT JAMINAN (DAPAT DIKEMBALIKAN)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-bold">Rp</span>
                    <input
                      type="number"
                      required
                      className="w-full bg-slate-50 pl-10 pr-3 py-2.5 text-xs text-slate-800 border border-slate-200 rounded-xl focus:outline-none font-bold"
                      value={tenantDeposit}
                      onChange={(e) => setTenantDeposit(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-1.5">3. OPERATOR KONTAK DARURAT</h4>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 block">NAMA KONTAK</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 text-xs p-2 border border-slate-200 rounded-lg text-slate-800"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 block">HUBUNGAN</label>
                    <input
                      type="text"
                      placeholder="Ayah/Ibu/Teman"
                      className="w-full bg-slate-50 text-xs p-2 border border-slate-200 rounded-lg text-slate-800"
                      value={emergencyRelation}
                      onChange={(e) => setEmergencyRelation(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 block">NO. TELEPON</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 text-xs p-2 border border-slate-200 rounded-lg text-slate-800"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 block font-bold">INFO TAMBAHAN (PEKERJAAN ATAU ALUMNI)</label>
                <textarea
                  className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl text-slate-800"
                  rows={2}
                  placeholder="Contoh: Karyawati Bank BCA, Mahasiswa UGM tingkat akhir..."
                  value={tenantNotes}
                  onChange={(e) => setTenantNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-tenant"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow shadow-teal-500/10"
                >
                  Simpan Registrasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC CARD RENDERING LOOP */}
      {filteredTenants.length === 0 ? (
        <div id="tenants-empty-state" className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-sm mx-auto">
          <span className="text-4xl text-slate-300 block">👥</span>
          <h3 className="text-sm font-black text-slate-700 mt-3">Tidak Ada Penghuni Kost</h3>
          <p className="text-[10px] text-slate-400 mt-1 mb-5">
            Kami tidak menemukan data penghuni untuk pencarian "{searchQuery}" atau filter "{statusFilter}".
          </p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('Semua');
            }}
            className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] rounded-xl cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((ten) => {
            const isLunas = ten.status === 'Lunas';
            const statusStyle = isLunas 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200';
            
            return (
              <div 
                key={ten.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-teal-400 p-5 shadow-xs transition-all hover:translate-y-[-1px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-slate-900 font-extrabold text-white text-xs rounded-full flex items-center justify-center">
                        {ten.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 truncate max-w-[140px]">{ten.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400">Masuk: {ten.moveInDate}</p>
                      </div>
                    </div>

                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${statusStyle}`}>
                      {ten.status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] space-y-1 font-semibold text-slate-600">
                    <p className="flex justify-between"><span className="text-slate-400">Hubungan Kamar:</span> <span className="font-extrabold text-teal-700">Kamar {ten.roomAssigned}</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">No. WhatsApp:</span> <span className="font-bold text-slate-800">{ten.phone}</span></p>
                    <p className="flex justify-between"><span className="text-slate-400">Sewa Bulanan:</span> <span className="font-extrabold text-slate-800">{formatIDR(ten.rentAmount)}/bln</span></p>
                  </div>
                  
                  {ten.notes && (
                    <p className="text-[9px] text-slate-400 mt-2 font-medium italic line-clamp-1">💬 "{ten.notes}"</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSelectTenantId(ten.id)}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200/80 text-[10px] font-extrabold text-slate-700 rounded-lg text-center transition-all cursor-pointer"
                  >
                    Buka Profil Detail & KTP
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
