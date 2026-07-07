import React, { useState } from 'react';
import { Search, Plus, Filter, Receipt, Calendar, CreditCard, Copy, Check, MessageSquare, AlertCircle, X, ChevronRight, Calculator, FileText, Send } from 'lucide-react';
import { Bill, Tenant, Room, BillStatus } from '../types';

interface BillsViewProps {
  bills: Bill[];
  tenants: Tenant[];
  rooms: Room[];
  selectedBillId: string | null;
  onSelectBillId: (id: string | null) => void;
  onAddBill: (newBill: Bill) => void;
  onOpenReminderModal: (bill: Bill) => void;
  onOpenPaymentForm: (bill: Bill) => void;
  onDeleteBill: (id: string) => void;
  selectedMonth: string;
}

export function BillsView({ 
  bills, tenants, rooms, selectedBillId, onSelectBillId, 
  onAddBill, onOpenReminderModal, onOpenPaymentForm, onDeleteBill, selectedMonth
}: BillsViewProps) {
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Bill Form States
  const [billStep, setBillStep] = useState(1);
  const [formError, setFormError] = useState('');
  
  const [selTenantId, setSelTenantId] = useState('');
  const [billPeriod, setBillPeriod] = useState(selectedMonth);
  const [dueDateStr, setDueDateStr] = useState('2026-06-05');
  const [electricCharge, setElectricCharge] = useState(120000);
  const [waterCharge, setWaterCharge] = useState(50000);
  const [addFee, setAddFee] = useState(0);
  const [discountVal, setDiscountVal] = useState(0);
  const [lateFeeVal, setLateFeeVal] = useState(0);
  const [billNotes, setBillNotes] = useState('');

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const handleTenantSelect = (tenantId: string) => {
    setSelTenantId(tenantId);
    const selectedTenant = tenants.find(t => t.id === tenantId);
    if (selectedTenant) {
      // Set tentative due date based on current month/year representation
      setDueDateStr('2026-06-05');
      setFormError('');
      setBillStep(2);
    }
  };

  const handleCreateBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTenant = tenants.find(t => t.id === selTenantId);
    const associatedRoom = rooms.find(r => r.tenantId === selTenantId);
    
    if (!selectedTenant || !associatedRoom) {
      setFormError('Tenant terpilih harus memiliki alokasi kamar aktif!');
      return;
    }

    const rentPrice = selectedTenant.rentAmount;
    const totalCalc = rentPrice + electricCharge + waterCharge + addFee + lateFeeVal - discountVal;

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.name,
      roomId: associatedRoom.id,
      roomNumber: associatedRoom.number,
      period: billPeriod,
      dueDate: dueDateStr,
      rentAmount: rentPrice,
      electricityCharge: electricCharge,
      waterCharge: waterCharge,
      additionalFee: addFee,
      discount: discountVal,
      lateFee: lateFeeVal,
      totalAmount: totalCalc,
      paidAmount: 0,
      status: 'Belum Bayar',
      notes: billNotes
    };

    onAddBill(newBill);

    // Reset states
    setSelTenantId('');
    setBillStep(1);
    setElectricCharge(120000);
    setWaterCharge(50000);
    setAddFee(0);
    setDiscountVal(0);
    setLateFeeVal(0);
    setBillNotes('');
    setShowAddForm(false);
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.period.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'Semua') return matchesSearch;
    return matchesSearch && b.status === statusFilter;
  });

  const activeDetailBill = bills.find(b => b.id === selectedBillId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Search & Filter Header Menu */}
      <section className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari tagihan dengan nama penghuni atau nomor kamar..."
            className="w-full bg-slate-50 text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter statuses chip format */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['Semua', 'Belum Bayar', 'Lunas', 'Terlambat'].map((st) => {
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
                {st} ({st === 'Semua' ? bills.length : bills.filter(b => b.status === st).length})
              </button>
            );
          })}
        </div>

        {/* Add bill button */}
        <button
          onClick={() => {
            setShowAddForm(true);
            onSelectBillId(null);
          }}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs animate-pulse-once"
        >
          <Plus className="h-4 w-4" /> Buat Tagihan
        </button>
      </section>

      {/* RENDER BILL RECEIPT DETAIL MODAL OVERLAY */}
      {activeDetailBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Head */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Invoice Kwitansi: {activeDetailBill.roomNumber}</span>
              </div>
              <button 
                onClick={() => onSelectBillId(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt invoice format */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Receipt Visual Header */}
              <div className="text-center space-y-1.5 pb-4 border-b border-dashed border-slate-200">
                <h3 className="text-lg font-black tracking-tight text-slate-950 uppercase">KOSTOS RECEIPT</h3>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Tanda Bukti Tagihan Bulanan / Kamar {activeDetailBill.roomNumber}</p>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold leading-none bg-indigo-50 border border-indigo-100 mt-2 text-slate-800">
                  Status: <strong>{activeDetailBill.status}</strong>
                </div>
              </div>

              {/* Informational core metadata */}
              <div className="grid grid-cols-2 gap-4 text-slate-600 font-medium">
                <div>
                  <p className="text-[9px] text-slate-400">NAMA PENYETOR / TENANT:</p>
                  <p className="text-xs font-extrabold text-slate-900">{activeDetailBill.tenantName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400">PERIODE BULAN:</p>
                  <p className="text-xs font-bold text-slate-900 font-mono">{activeDetailBill.period}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400">DUE DATE (JATUH TEMPO):</p>
                  <p className="text-xs font-semibold text-rose-600 font-mono">{activeDetailBill.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400">NOMOR INVOICE HASH:</p>
                  <p className="text-xs font-mono font-bold text-slate-400">#{activeDetailBill.id.substring(5, 12).toUpperCase()}</p>
                </div>
              </div>

              {/* Breakdown Table Grid */}
              <div className="border border-slate-200 rounded-2xl bg-slate-50/50 p-4 space-y-2 text-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-200/60">Rincian Tagihan</p>
                
                <div className="flex justify-between font-semibold">
                  <span>Uang Sewa Bulanan Kamar:</span>
                  <span className="font-mono text-slate-900">{formatIDR(activeDetailBill.rentAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Iuran Listrik Bulanan:</span>
                  <span className="font-mono text-slate-900">{formatIDR(activeDetailBill.electricityCharge)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Iuran Air PDAM:</span>
                  <span className="font-mono text-slate-900">{formatIDR(activeDetailBill.waterCharge)}</span>
                </div>
                
                {activeDetailBill.additionalFee > 0 && (
                  <div className="flex justify-between text-slate-600 font-semibold">
                    <span>Biaya Tambahan (Lain-lain):</span>
                    <span className="font-mono text-slate-950 font-bold">{formatIDR(activeDetailBill.additionalFee)}</span>
                  </div>
                )}
                {activeDetailBill.lateFee > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Denda Keterlambatan:</span>
                    <span className="font-mono">+{formatIDR(activeDetailBill.lateFee)}</span>
                  </div>
                )}
                {activeDetailBill.discount > 0 && (
                  <div className="flex justify-between text-teal-600 font-bold">
                    <span>Potongan / Diskon:</span>
                    <span className="font-mono">-{formatIDR(activeDetailBill.discount)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between font-black text-sm text-slate-900">
                  <span>TOTAL TRANSFER MANDATO:</span>
                  <span className="font-mono text-teal-700">{formatIDR(activeDetailBill.totalAmount)}</span>
                </div>
              </div>

              {/* Bank Transfer template instructions mock */}
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/60 font-medium text-amber-900 space-y-1 text-[11px]">
                <p className="font-bold">🏦 REKENING TUJUAN TRANSFER:</p>
                <p>Silakan infokan penghuni untuk transfer ke BCA Mandiri.</p>
                <p className="font-mono text-slate-700">A/N: Ibu Indah Lestari • Rek BCA: 233-099-8877</p>
              </div>

              {activeDetailBill.paymentDate && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-medium text-[11px]">
                  <p className="font-bold">✓ TELAH DIBAYAR PADA : {activeDetailBill.paymentDate}</p>
                  <p>Metode yang dipakai: <strong>{activeDetailBill.paymentMethod}</strong> (Lunas penuh)</p>
                </div>
              )}
            </div>

            {/* Modal footer controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Kwitansi ini akan dianulir / dihapus secara permanen. Lanjutkan?")) {
                    onDeleteBill(activeDetailBill.id);
                    onSelectBillId(null);
                  }
                }}
                className="px-3 py-2 text-rose-500 hover:text-white hover:bg-rose-600 font-semibold text-xs rounded-xl"
              >
                Hapus Tagihan
              </button>

              <div className="flex gap-2">
                {activeDetailBill.status !== 'Lunas' && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBillId(null);
                      onOpenPaymentForm(activeDetailBill);
                    }}
                    className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Setorkan Lunas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectBillId(null)}
                  className="px-4 py-2.5 bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CREATE BILL FLOW WIZARD FORM */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-300 shadow-2xl overflow-hidden">
            
            <div className="p-5 bg-slate-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Buat Tagihan Bulanan</span>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-teal-600">Aliran Pembuatan Tagihan</span>
              <span className="font-bold text-slate-500">Step {billStep} dari 3</span>
            </div>

            <form onSubmit={handleCreateBillSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-slate-800">
              
              {formError && (
                <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-medium">
                  ⚠️ {formError}
                </div>
              )}

              {/* Step 1: Select Tenant / Room */}
              {billStep === 1 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-1.5">Pilih Tenant & Kamar</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 block">PILIH PENYEWA AKTIF *</label>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto border border-slate-200 rounded-2xl bg-slate-50 p-2.5">
                      {tenants.map((ten) => (
                        <div 
                          key={ten.id}
                          onClick={() => handleTenantSelect(ten.id)}
                          className={`p-3 border rounded-xl bg-white hover:border-teal-400 transition-all cursor-pointer flex justify-between items-center ${
                            selTenantId === ten.id ? 'border-2 border-teal-500 shadow-xs' : 'border-slate-100'
                          }`}
                        >
                          <div>
                            <p className="font-extrabold text-xs text-slate-850">{ten.name}</p>
                            <p className="text-[9px] text-slate-400 font-semibold font-mono">Kamar {ten.roomAssigned} • WA {ten.phone}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Configure Rent details */}
              {billStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-1.5">Urus Biaya Listrik & Air</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-500 block">PERIODE BULANAN</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                        value={billPeriod}
                        onChange={(e) => setBillPeriod(e.target.value)}
                      >
                        {(() => {
                          const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                          const now = new Date();
                          const options = [];
                          for (let i = -2; i <= 3; i++) {
                            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
                            const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
                            options.push(<option key={label} value={label}>{label}</option>);
                          }
                          return options;
                        })()}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-500 block">JATUH TEMPO (DUE DATE)</label>
                      <input
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                        value={dueDateStr}
                        onChange={(e) => setDueDateStr(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 block">BIAYA LISTRIK TOKEN (IDR)</label>
                      <input
                        type="number"
                        title="Biaya Listrik"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold"
                        value={electricCharge}
                        onChange={(e) => setElectricCharge(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 block">BIAYA AIR PDAM / MINUM (IDR)</label>
                      <input
                        type="number"
                        title="Biaya Air"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold"
                        value={waterCharge}
                        onChange={(e) => setWaterCharge(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">BIAYA LAIN (PARKIR, LAUNDRY, DLL) (IDR)</label>
                    <input
                      type="number"
                      title="Biaya Tambahan"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold"
                      value={addFee}
                      onChange={(e) => setAddFee(Number(e.target.value))}
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setBillStep(1)}
                      className="px-4 py-2 text-slate-500 hover:bg-slate-100 font-bold rounded-lg"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillStep(3)}
                      className="px-5 py-2 bg-teal-600 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Discounts & Confirm and Submit */}
              {billStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-1.5">Potongan / Denda & Finalisasi</h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 block">DISKON / POTONGAN (IDR)</label>
                      <input
                        type="number"
                        title="Potongan"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold"
                        value={discountVal}
                        onChange={(e) => setDiscountVal(Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 block">DENDA KETERLAMBATAN (IDR)</label>
                      <input
                        type="number"
                        title="Denda"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold"
                        value={lateFeeVal}
                        onChange={(e) => setLateFeeVal(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 block">CATATAN KHUSUS KWITANSI</label>
                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                      rows={2}
                      placeholder="Contoh: Diskon pendaftaran awal, denda telat sebulan..."
                      value={billNotes}
                      onChange={(e) => setBillNotes(e.target.value)}
                    />
                  </div>

                  {/* Dynamic invoice mock preview total */}
                  <div className="p-4 bg-teal-900 text-teal-100 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-bold text-teal-300 uppercase block tracking-wider">Estimasi Total Tagihan Baru</p>
                      <span className="text-[9px] text-teal-200 block">Sudah termasuk sewa kamar tenant & utilitas</span>
                    </div>
                    <span className="text-base font-black font-mono">
                      {formatIDR(
                        (tenants.find(t => t.id === selTenantId)?.rentAmount || 1200000)
                        + electricCharge + waterCharge + addFee + lateFeeVal - discountVal
                      )}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setBillStep(2)}
                      className="px-4 py-2 text-slate-500 hover:bg-slate-100 font-bold rounded-lg cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      id="btn-save-bill"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow shadow-emerald-600/10"
                    >
                      Simpan & Kirim Tagihan
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      )}

      {/* RENDER BILLS LIST CARDS */}
      {filteredBills.length === 0 ? (
        <div id="bills-empty-state" className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-sm mx-auto">
          <span className="text-4xl text-slate-300 block">🧾</span>
          <h3 className="text-sm font-black text-slate-700 mt-3">Tagihan Tidak Ditemukan</h3>
          <p className="text-[10px] text-slate-400 mt-1 mb-5">
            Kami tidak menemukan data penagihan sewa untuk pencarian "{searchQuery}" atau filter "{statusFilter}".
          </p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('Semua');
            }} 
            className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] rounded-xl cursor-pointer"
          >
            Bersihkan Filter
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBills.map((b) => {
            const outstandingAmount = b.totalAmount - b.paidAmount;
            const isLunas = b.status === 'Lunas';
            const statusColor = isLunas 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : b.status === 'Terlambat'
                ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse-slow'
                : 'bg-amber-50 text-amber-800 border-amber-200';
            
            return (
              <div 
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-teal-400 p-5 shadow-xs transition-all hover:translate-y-[-1px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs font-mono">
                        {b.roomNumber}
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 truncate max-w-[150px]">{b.tenantName}</h4>
                        <p className="text-[10px] font-bold text-slate-400">Periode: {b.period}</p>
                      </div>
                    </div>

                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColor}`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <p className="text-[9px] text-slate-400 font-semibold font-mono">Sisa Tagihan / Total:</p>
                      <p className="font-extrabold text-slate-900">
                        {outstandingAmount > 0 ? formatIDR(outstandingAmount) : 'Selesai dilunasi'} 
                        <span className="text-[9px] text-slate-400 font-normal"> / {formatIDR(b.totalAmount)}</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-[9px] text-rose-600 font-bold mt-2 font-mono">
                    ⚠️ Jatuh Tempo: {b.dueDate}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => onSelectBillId(b.id)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 rounded-lg text-center cursor-pointer"
                  >
                    Buka Kwitansi
                  </button>

                  {!isLunas && (
                    <>
                      <button
                        onClick={() => onOpenPaymentForm(b)}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg cursor-pointer"
                      >
                        Bayar
                      </button>

                      <button
                        onClick={() => onOpenReminderModal(b)}
                        className="bg-slate-950 hover:bg-slate-900 text-white text-[10px] font-bold p-1.5 rounded-lg flex items-center justify-center cursor-pointer"
                        title="Kirim reminder WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

    </div>
  );
}
