import React, { useState } from 'react';
import { MagnifyingGlass, Plus, Faders, Wrench, ShieldWarning, CheckSquare, Clock, User, X, WarningOctagon } from '@phosphor-icons/react';
import { Complaint, ComplaintCategory, ComplaintStatus, ComplaintPriority, Tenant, Room } from '../types';
import { ElegantSelect } from './ElegantSelect';
import { generateId } from '../utils';

interface ComplaintsViewProps {
  complaints: Complaint[];
  tenants: Tenant[];
  rooms: Room[];
  selectedComplaintId: string | null;
  onSelectComplaintId: (id: string | null) => void;
  onAddComplaint: (newComplaint: Complaint) => void;
  onUpdateComplaintStatus: (id: string, status: ComplaintStatus, repairCost?: number, notes?: string) => void;
  onDeleteComplaint: (id: string) => void;
}

export function ComplaintsView({
  complaints, tenants, rooms, selectedComplaintId, onSelectComplaintId,
  onAddComplaint, onUpdateComplaintStatus, onDeleteComplaint
}: ComplaintsViewProps) {
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  // Add Complaint Form States
  const [compTenantId, setCompTenantId] = useState('');
  const [compTitle, setCompTitle] = useState('');
  const [compCategory, setCompCategory] = useState<ComplaintCategory>('Air');
  const [compPriority, setCompPriority] = useState<ComplaintPriority>('Sedang');
  const [compDesc, setCompDesc] = useState('');
  const [formError, setFormError] = useState('');

  // Repair log states (on complete action)
  const [showCompleteAction, setShowCompleteAction] = useState(false);
  const [logRepairCost, setLogRepairCost] = useState(150000);
  const [logNotes, setLogNotes] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compTenantId || !compTitle || !compDesc) {
      setFormError('Nama penyewa, judul laporan, dan rincian deskripsi wajib diisi!');
      return;
    }

    const selectedTenant = tenants.find(t => t.id === compTenantId);
    if (!selectedTenant) {
      setFormError('Data penyewa tidak sah/valid.');
      return;
    }

    const newComplaint: Complaint = {
      id: generateId('comp'),
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.name,
      roomId: `room-${selectedTenant.roomAssigned.toLowerCase()}`,
      roomNumber: selectedTenant.roomAssigned,
      title: compTitle,
      category: compCategory,
      status: 'Baru',
      priority: compPriority,
      date: new Date().toISOString().split('T')[0],
      description: compDesc
    };

    onAddComplaint(newComplaint);

    // Reset Form
    setCompTenantId('');
    setCompTitle('');
    setCompCategory('Air');
    setCompPriority('Sedang');
    setCompDesc('');
    setFormError('');
    setShowAddForm(false);
  };

  const handleStatusChangeSubmit = (id: string, nextStatus: ComplaintStatus) => {
    if (nextStatus === 'Selesai') {
      setShowCompleteAction(true);
    } else {
      onUpdateComplaintStatus(id, nextStatus);
    }
  };

  const handleCompleteExecution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId) return;
    
    // Call mutation in parent
    onUpdateComplaintStatus(selectedComplaintId, 'Selesai', logRepairCost, logNotes);
    
    // Reset states
    setShowCompleteAction(false);
    setLogRepairCost(150000);
    setLogNotes('');
    onSelectComplaintId(null);
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'Semua') return matchesSearch;
    return matchesSearch && c.status === statusFilter;
  });

  const activeDetailComplaint = complaints.find(c => c.id === selectedComplaintId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Controls Container Bar */}
      <section className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 glass-panel p-5 rounded-[2rem] animate-fade-in-up">
        {/* MagnifyingGlass */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6E746F]">
            <MagnifyingGlass weight="duotone" className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari keluhan berdasarkan nama penyewa, nomor kamar..."
            className="w-full bg-white text-xs pl-9 pr-3 py-2.5 border border-[rgba(23,59,48,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#173B30] text-[#171A18] transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter statuses chip format */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['Semua', 'Baru', 'Diproses', 'Selesai'].map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#173B30] text-white shadow-xs' 
                    : 'bg-white text-[#6E746F] hover:bg-[#FBF9F5] hover:text-[#171A18]'
                }`}
              >
                {st} ({st === 'Semua' ? complaints.length : complaints.filter(c => c.status === st).length})
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            setShowAddForm(true);
            onSelectComplaintId(null);
          }}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer transition-transform hover:-translate-y-0.5 animate-pulse-once"
        >
           Catat Komplain
        </button>
      </section>

      {/* COMPLAINT DETAILS MODAL OVERLAY */}
      {activeDetailComplaint && (
        <div className="fixed inset-0 bg-[#173B30]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-[rgba(23,59,48,0.20)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Heading */}
            <div className="p-5 bg-[#173B30] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Wrench weight="duotone" className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Tiket Komplain: No {activeDetailComplaint.roomNumber}</span>
              </div>
              <button 
                onClick={() => {
                  onSelectComplaintId(null);
                  setShowCompleteAction(false);
                }}
                className="p-1 rounded-full text-[#6E746F] hover:text-white hover:bg-[#0f2720] cursor-pointer"
              >
                <X weight="duotone" className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-[#171A18] font-medium">
              
              {/* Card Meta details */}
              <div className="p-4 border border-[rgba(23,59,48,0.15)] bg-white rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-indigo-700 uppercase font-black tracking-wider">
                    {activeDetailComplaint.status}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    activeDetailComplaint.priority === 'Tinggi' ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-[#FBF9F5] text-[#6E746F]'
                  }`}>
                    Prioritas {activeDetailComplaint.priority}
                  </span>
                </div>

                <h3 className="text-sm font-black text-[#171A18] mt-1">{activeDetailComplaint.title}</h3>
                
                <div className="flex justify-between text-[11px] text-[#6E746F] pt-2 border-t border-[rgba(23,59,48,0.15)]/50">
                  <span>Nama Tenant: <strong>{activeDetailComplaint.tenantName} (Kamar {activeDetailComplaint.roomNumber})</strong></span>
                  <span>Tanggal Masuk: {activeDetailComplaint.date}</span>
                </div>
              </div>

              {/* Rincian Masalah */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-extrabold text-[#6E746F] uppercase tracking-widest block">Rincian / Deskripsi Laporan:</p>
                <p className="text-xs text-[#171A18] p-3 rounded-xl bg-white border border-[rgba(23,59,48,0.06)] leading-relaxed font-semibold">
                  “ {activeDetailComplaint.description} ”
                </p>
              </div>

              {/* Form to log money if state selected is 'COMPLETE' */}
              {showCompleteAction && (
                <form onSubmit={handleCompleteExecution} className="p-3 bg-[#F5F1E8] border border-[rgba(23,59,48,0.2)] rounded-2xl space-y-3">
                  <p className="font-extrabold text-teal-900 border-b border-[rgba(23,59,48,0.2)]/80 pb-1">🔧 Log Biaya & Perbaikan Selesai</p>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-[#0f2720] block">BIAYA PERBAIKAN REPARASI (IDR) *</label>
                    <input
                      type="number"
                      required
                      title="Biaya Perbaikan"
                      className="w-full bg-white p-2 border border-teal-300 rounded-xl focus:outline-none text-[#171A18] font-extrabold"
                      value={logRepairCost}
                      onChange={(e) => setLogRepairCost(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-[#0f2720] block">CATATAN TEKNISI / PART REPLACED</label>
                    <input
                      type="text"
                      className="w-full bg-white p-2 border border-teal-300 rounded-xl text-[#171A18]"
                      placeholder="Ganti wastafel, cuci pipa, cuci filter, dll"
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#0f2720] hover:bg-teal-800 text-white font-extrabold rounded-lg shadow"
                  >
                    Simpan & Daftarkan Pengeluaran
                  </button>
                </form>
              )}

              {activeDetailComplaint.status === 'Selesai' && activeDetailComplaint.repairCost && (
                <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-xl font-medium text-emerald-800 font-bold">
                  <p>✓ TAHAP PERBAIKAN SELESAI</p>
                  <p className="text-[10px] mt-1 text-[#6E746F]">Total Biaya perbaikan terpotong ke kas: <span className="font-mono font-extrabold text-[#171A18]">{formatIDR(activeDetailComplaint.repairCost)}</span></p>
                  {activeDetailComplaint.notes && <p className="text-[10px] text-[#6E746F] font-serif italic mt-0.5">“{activeDetailComplaint.notes}”</p>}
                </div>
              )}

            </div>

            {/* Modal Controls footer */}
            <div className="p-4 bg-white border-t border-[rgba(23,59,48,0.06)] flex justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Apakah Anda yakin ingin menghapus tiket komplain ini?")) {
                    onDeleteComplaint(activeDetailComplaint.id);
                    onSelectComplaintId(null);
                  }
                }}
                className="px-3.5 py-2 hover:bg-rose-500 hover:text-white text-rose-500 font-bold rounded-xl transition-all"
              >
                Anulir Tiket
              </button>

              <div className="flex gap-1.5 text-xs">
                {activeDetailComplaint.status === 'Baru' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChangeSubmit(activeDetailComplaint.id, 'Diproses')}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Kerjakan / Proses 🛠️
                  </button>
                )}

                {activeDetailComplaint.status !== 'Selesai' && !showCompleteAction && (
                  <button
                    type="button"
                    onClick={() => handleStatusChangeSubmit(activeDetailComplaint.id, 'Selesai')}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Selesai & Log Biaya ✓
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onSelectComplaintId(null);
                    setShowCompleteAction(false);
                  }}
                  className="px-4 py-2.5 bg-[rgba(23,59,48,0.06)] text-[#171A18] hover:bg-[rgba(23,59,48,0.1)] font-bold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CREATE COMPLAINT DIALOG FORM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-[#173B30]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-[rgba(23,59,48,0.20)] shadow-2xl overflow-hidden">
            
            <div className="p-5 bg-[#171A18] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wrench weight="duotone" className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Catat Laporan Komplain</span>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-full text-[#6E746F] hover:text-white hover:bg-[#0f2720] cursor-pointer"
              >
                <X weight="duotone" className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs text-[#171A18]">
              {formError && (
                <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-medium">
                  ⚠️ {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#6E746F] block">PILIH PENYEBAB / PENY_KOS *</label>
                <ElegantSelect
                  value={compTenantId}
                  onChange={(val) => setCompTenantId(val)}
                  placeholder="-- Pilih Penyewa --"
                  options={tenants.map(t => ({
                    value: t.id,
                    label: `${t.name} (Kamar ${t.roomAssigned})`
                  }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#6E746F] block">JUDUL KELUHAN (RINGKAS) *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AC Kamar bocor air kotor, Kunci pintu patah..."
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] p-2.5 rounded-xl text-[#171A18] font-bold"
                  value={compTitle}
                  onChange={(e) => setCompTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-[#6E746F] block">KATEGORI PERUSAKAN</label>
                  <ElegantSelect
                    value={compCategory}
                    onChange={(val) => setCompCategory(val as ComplaintCategory)}
                    options={[
                      { value: 'Air', label: 'Air / Saluran Pipa' },
                      { value: 'Listrik', label: 'Listrik / Lampu' },
                      { value: 'AC/Kipas', label: 'AC / Penyejuk Ruangan' },
                      { value: 'Kamar mandi', label: 'Kamar Mandi' },
                      { value: 'Pintu/Kunci', label: 'Kunci & Pintu Kamar' },
                      { value: 'Internet', label: 'Internet WiFi' },
                      { value: 'Kebersihan', label: 'Kebersihan Lorong' },
                      { value: 'Lainnya', label: 'Lainnya' }
                    ]}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-[#6E746F] block">SKALA PRIORITAS</label>
                  <ElegantSelect
                    value={compPriority}
                    onChange={(val) => setCompPriority(val as ComplaintPriority)}
                    options={[
                      { value: 'Rendah', label: 'Rendah (Santai)' },
                      { value: 'Sedang', label: 'Sedang (Butuh Dicek)' },
                      { value: 'Tinggi', label: 'Tinggi (Urgensi Ekstrim)' }
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#6E746F] block font-bold">RINCIAN DESKRIPSI MASALAH *</label>
                <textarea
                  required
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] p-2.5 rounded-xl text-xs text-[#171A18]"
                  rows={3}
                  placeholder="AC menetes kencang sejak tadi malam jam 8 malam, kasur basah kuyup..."
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-[rgba(23,59,48,0.06)] flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-white text-[#6E746F] rounded-xl font-bold cursor-pointer hover:bg-[#FBF9F5]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-complaint"
                  className="px-5 py-2 bg-[#173B30] hover:bg-[#0f2720] text-white font-bold rounded-xl shadow shadow-teal-500/10 cursor-pointer animate-pulse-once"
                >
                  Daftarkan Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC LISTING TICKETS GRID */}
      {filteredComplaints.length === 0 ? (
        <div id="complaints-empty-state" className="p-12 text-center bg-white rounded-3xl border border-[rgba(23,59,48,0.15)] shadow-xs max-w-sm mx-auto">
          <span className="text-4xl text-[#A8B7A1] block">🛠️</span>
          <h3 className="text-sm font-black text-[#171A18] mt-3">Tidak Ada Komplain</h3>
          <p className="text-[10px] text-[#6E746F] mt-1 mb-5">
            Lega! Belum ada tiket komplain aktif dikirim lewat filter kriteria "{statusFilter}" atau pencarian "{searchQuery}".
          </p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('Semua');
            }}
            className="py-1.5 px-4 bg-[#173B30] text-white font-bold text-[10px] rounded-lg cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComplaints.map((comp) => {
            const isCompleted = comp.status === 'Selesai';
            const isTinggi = comp.priority === 'Tinggi';
            
            // Background classes status
            let cardStatusClass = 'hover:shadow-teal-500/10 border-transparent';
            if (comp.status === 'Baru') cardStatusClass = 'border-amber-200/50 hover:shadow-amber-500/10 bg-amber-50/20';
            if (comp.status === 'Diproses') cardStatusClass = 'border-indigo-200/50 hover:shadow-indigo-500/10 bg-indigo-50/20';
            
            return (
              <div 
                key={comp.id}
                className={`glass-panel p-5 sm:p-6 rounded-[2rem] border transition-all duration-500 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-2xl animate-fade-in-up delay-100 ${cardStatusClass}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-[rgba(23,59,48,0.15)] flex items-center justify-center text-xl shadow-sm">
                        🔧
                      </div>
                      <div>
                        <h4 className="text-sm font-display font-black text-[#171A18] leading-tight group-hover:text-[#173B30] transition-colors line-clamp-1">{comp.title}</h4>
                        <span className="text-[10px] font-bold text-[#6E746F] mt-1 block tracking-wider">Kmr {comp.roomNumber} • {comp.category}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-sm whitespace-nowrap ${
                      isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {comp.status}
                    </span>
                  </div>

                  <div className="p-3 bg-white/80 border border-[rgba(23,59,48,0.15)]/60 rounded-xl mt-3">
                    <p className="text-[11px] text-[#6E746F] line-clamp-2 leading-relaxed font-medium italic">
                      “{comp.description}”
                    </p>
                  </div>

                  <div className="mt-4 flex justify-between items-center text-[11px]">
                    <span className="text-[#6E746F]">Dari: <strong className="text-[#171A18]">{comp.tenantName}</strong></span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase shadow-sm border ${
                      isTinggi ? 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' : 'bg-white text-[#6E746F] border-[rgba(23,59,48,0.15)]'
                    }`}>
                      {comp.priority}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <button
                    onClick={() => onSelectComplaintId(comp.id)}
                    className="w-full py-2.5 bg-[#173B30] hover:bg-[#0f2720] text-white text-[11px] font-bold rounded-xl text-center transition-all cursor-pointer shadow-md"
                  >
                    Buka Tiket Laporan
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

    </div>
  );
}
