import React, { useState } from 'react';
import { Search, Plus, Filter, Wrench, ShieldAlert, CheckSquare, Clock, User, X, AlertOctagon } from 'lucide-react';
import { Complaint, ComplaintCategory, ComplaintStatus, ComplaintPriority, Tenant, Room } from '../types';

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
      id: `comp-${Date.now()}`,
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
      <section className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari keluhan berdasarkan nama penyewa, nomor kamar..."
            className="w-full bg-slate-50 text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 transition-all font-medium"
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
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
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
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs animate-pulse-once"
        >
          <Plus className="h-4 w-4" /> Catat Komplain
        </button>
      </section>

      {/* COMPLAINT DETAILS MODAL OVERLAY */}
      {activeDetailComplaint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Heading */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Tiket Komplain: No {activeDetailComplaint.roomNumber}</span>
              </div>
              <button 
                onClick={() => {
                  onSelectComplaintId(null);
                  setShowCompleteAction(false);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-800 font-medium">
              
              {/* Card Meta details */}
              <div className="p-4 border border-slate-200 bg-slate-50 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-indigo-700 uppercase font-black tracking-wider">
                    {activeDetailComplaint.status}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    activeDetailComplaint.priority === 'Tinggi' ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Prioritas {activeDetailComplaint.priority}
                  </span>
                </div>

                <h3 className="text-sm font-black text-slate-950 mt-1">{activeDetailComplaint.title}</h3>
                
                <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/50">
                  <span>Nama Tenant: <strong>{activeDetailComplaint.tenantName} (Kamar {activeDetailComplaint.roomNumber})</strong></span>
                  <span>Tanggal Masuk: {activeDetailComplaint.date}</span>
                </div>
              </div>

              {/* Rincian Masalah */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest block">Rincian / Deskripsi Laporan:</p>
                <p className="text-xs text-slate-705 p-3 rounded-xl bg-slate-50 border border-slate-100 leading-relaxed font-semibold">
                  “ {activeDetailComplaint.description} ”
                </p>
              </div>

              {/* Form to log money if state selected is 'COMPLETE' */}
              {showCompleteAction && (
                <form onSubmit={handleCompleteExecution} className="p-3 bg-teal-50 border border-teal-200 rounded-2xl space-y-3">
                  <p className="font-extrabold text-teal-900 border-b border-teal-200/80 pb-1">🔧 Log Biaya & Perbaikan Selesai</p>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-teal-800 block">BIAYA PERBAIKAN REPARASI (IDR) *</label>
                    <input
                      type="number"
                      required
                      title="Biaya Perbaikan"
                      className="w-full bg-white p-2 border border-teal-300 rounded-xl focus:outline-none text-slate-800 font-extrabold"
                      value={logRepairCost}
                      onChange={(e) => setLogRepairCost(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-teal-800 block">CATATAN TEKNISI / PART REPLACED</label>
                    <input
                      type="text"
                      className="w-full bg-white p-2 border border-teal-300 rounded-xl text-slate-850"
                      placeholder="Ganti wastafel, cuci pipa, cuci filter, dll"
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold rounded-lg shadow"
                  >
                    Simpan & Daftarkan Pengeluaran
                  </button>
                </form>
              )}

              {activeDetailComplaint.status === 'Selesai' && activeDetailComplaint.repairCost && (
                <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-xl font-medium text-emerald-800 font-bold">
                  <p>✓ TAHAP PERBAIKAN SELESAI</p>
                  <p className="text-[10px] mt-1 text-slate-600">Total Biaya perbaikan terpotong ke kas: <span className="font-mono font-extrabold text-slate-900">{formatIDR(activeDetailComplaint.repairCost)}</span></p>
                  {activeDetailComplaint.notes && <p className="text-[10px] text-slate-500 font-serif italic mt-0.5">“{activeDetailComplaint.notes}”</p>}
                </div>
              )}

            </div>

            {/* Modal Controls footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between gap-3 shrink-0">
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
                  className="px-4 py-2.5 bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold rounded-xl cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-300 shadow-2xl overflow-hidden">
            
            <div className="p-5 bg-slate-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Catat Laporan Komplain</span>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs text-slate-800">
              {formError && (
                <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-medium">
                  ⚠️ {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 block">PILIH PENYEBAB / PENY_KOS *</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                  value={compTenantId}
                  onChange={(e) => setCompTenantId(e.target.value)}
                >
                  <option value="">-- Pilih Penyewa --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Kamar {t.roomAssigned})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 block">JUDUL KELUHAN (RINGKAS) *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AC Kamar bocor air kotor, Kunci pintu patah..."
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-800 font-bold"
                  value={compTitle}
                  onChange={(e) => setCompTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">KATEGORI PERUSAKAN</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-800 font-bold"
                    value={compCategory}
                    onChange={(e) => setCompCategory(e.target.value as ComplaintCategory)}
                  >
                    <option value="Air">Air / Saluran Pipa</option>
                    <option value="Listrik">Listrik / Lampu</option>
                    <option value="AC/Kipas">AC / Penyejuk Ruangan</option>
                    <option value="Kamar mandi">Kamar Mandi</option>
                    <option value="Pintu/Kunci">Kunci & Pintu Kamar</option>
                    <option value="Internet">Internet WiFi</option>
                    <option value="Kebersihan">Kebersihan Lorong</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 block">SKALA PRIORITAS</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-800 font-bold"
                    value={compPriority}
                    onChange={(e) => setCompPriority(e.target.value as ComplaintPriority)}
                  >
                    <option value="Rendah">Rendah (Santai)</option>
                    <option value="Sedang">Sedang (Butuh Dicek)</option>
                    <option value="Tinggi">Tinggi (Urgensi Ekstrim)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 block font-bold">RINCIAN DESKRIPSI MASALAH *</label>
                <textarea
                  required
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-800"
                  rows={3}
                  placeholder="AC menetes kencang sejak tadi malam jam 8 malam, kasur basah kuyup..."
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl font-bold cursor-pointer hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-complaint"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow shadow-teal-500/10 cursor-pointer animate-pulse-once"
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
        <div id="complaints-empty-state" className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-sm mx-auto">
          <span className="text-4xl text-slate-300 block">🛠️</span>
          <h3 className="text-sm font-black text-slate-700 mt-3">Tidak Ada Komplain</h3>
          <p className="text-[10px] text-slate-400 mt-1 mb-5">
            Lega! Belum ada tiket komplain aktif dikirim lewat filter kriteria "{statusFilter}" atau pencarian "{searchQuery}".
          </p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('Semua');
            }}
            className="py-1.5 px-4 bg-teal-600 text-white font-bold text-[10px] rounded-lg cursor-pointer"
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
            let cardStatusClass = 'border-slate-200 hover:border-slate-350';
            if (comp.status === 'Baru') cardStatusClass = 'border-amber-300 bg-amber-50/5 hover:border-amber-400';
            if (comp.status === 'Diproses') cardStatusClass = 'border-purple-355 hover:border-purple-400';
            
            return (
              <div 
                key={comp.id}
                className={`bg-white rounded-3xl border p-5 shadow-xs transition-all hover:translate-y-[-1px] flex flex-col justify-between ${cardStatusClass}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔧</span>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 leading-none">{comp.title}</h4>
                        <span className="text-[8px] font-bold text-slate-400 font-mono mt-1 block">Kmr {comp.roomNumber} • {comp.category}</span>
                      </div>
                    </div>

                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                      isCompleted ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
                    }`}>
                      {comp.status}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    “{comp.description}”
                  </p>

                  <div className="mt-3 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Penyetor: <strong>{comp.tenantName}</strong></span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${
                      isTinggi ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-600'
                    }`}>
                      Priority: {comp.priority}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSelectComplaintId(comp.id)}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-extrabold text-slate-700 rounded-lg text-center transition-all cursor-pointer"
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
