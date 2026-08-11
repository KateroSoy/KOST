import React, { useState } from 'react';
import { Search, Plus, Filter, Receipt, Calendar, CreditCard, Copy, Check, MessageSquare, AlertCircle, X, ChevronRight, Calculator, FileText, Send, QrCode } from 'lucide-react';
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
  const [rentalTypeFilter, setRentalTypeFilter] = useState<string>('Semua');
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
      setDueDateStr('2026-06-05');
      setFormError('');
      setBillStep(2);
    }
  };

  const handleCreateBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTenant = tenants.find(t => t.id === selTenantId);
    const associatedRoom = rooms.find(r => r.tenantId === selTenantId || r.number === selectedTenant?.roomAssigned);
    
    if (!selectedTenant) {
      setFormError('Pilih tenant terlebih dulu!');
      return;
    }

    const rentPrice = selectedTenant.rentAmount;
    const totalCalc = rentPrice + electricCharge + waterCharge + addFee + lateFeeVal - discountVal;

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.name,
      roomId: associatedRoom?.id || `room-${Date.now()}`,
      roomNumber: selectedTenant.roomAssigned,
      rentalType: selectedTenant.guestType || 'Bulanan',
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
    
    const matchesStatus = statusFilter === 'Semua' || b.status === statusFilter;
    const matchesRentalType = rentalTypeFilter === 'Semua' || b.rentalType === rentalTypeFilter;

    return matchesSearch && matchesStatus && matchesRentalType;
  });

  const activeDetailBill = bills.find(b => b.id === selectedBillId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Search & Filter Header Menu */}
      <section className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari tagihan dengan nama penyewa atau kamar..."
            className="w-full bg-slate-50 text-xs pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter status */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['Semua', 'Belum Bayar', 'Lunas', 'Terlambat'].map((st) => {
              const isActive = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Buat Invoice Baru
          </button>
        </div>
      </section>

      {/* RENDER BILL RECEIPT DETAIL MODAL OVERLAY */}
      {activeDetailBill && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Invoice Kwitansi: Kmr {activeDetailBill.roomNumber}</span>
              </div>
              <button 
                onClick={() => onSelectBillId(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              
              <div className="text-center space-y-1 pb-3 border-b border-slate-200">
                <h3 className="text-lg font-black text-slate-900">GRAND STAYFLOW RECEIPT</h3>
                <p className="text-[10px] text-slate-400">Bukti Tagihan {activeDetailBill.rentalType || 'Sewa'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Penyewa / Guest:</span>
                  <strong className="text-slate-900">{activeDetailBill.tenantName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipe Sewa:</span>
                  <strong className="text-teal-700">{activeDetailBill.rentalType || 'Bulanan'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Periode Stay:</span>
                  <strong className="text-slate-900">{activeDetailBill.period}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-sm">
                  <span>Total Tagihan:</span>
                  <span className="text-teal-700">{formatIDR(activeDetailBill.totalAmount)}</span>
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Hapus tagihan?")) {
                    onDeleteBill(activeDetailBill.id);
                    onSelectBillId(null);
                  }
                }}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl"
              >
                Hapus
              </button>

              <div className="flex gap-2">
                {activeDetailBill.status !== 'Lunas' && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBillId(null);
                      onOpenPaymentForm(activeDetailBill);
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Setor Bayar / QRIS
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectBillId(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Buat Tagihan Baru</span>
              </div>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded-full text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBillSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {formError && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl font-bold">⚠️ {formError}</div>}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Tamu / Penghuni *</label>
                <select
                  required
                  value={selTenantId}
                  onChange={(e) => setSelTenantId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                >
                  <option value="">-- Pilih Tamu / Penghuni --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Kmr {t.roomAssigned} • Stay {t.guestType || 'Bulanan'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Periode Stay</label>
                  <input
                    type="text"
                    value={billPeriod}
                    onChange={(e) => setBillPeriod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={dueDateStr}
                    onChange={(e) => setDueDateStr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Simpan & Buat Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENDER BILLS LIST CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBills.map((b) => {
          const outstandingAmount = b.totalAmount - b.paidAmount;
          const isLunas = b.status === 'Lunas';

          return (
            <div 
              key={b.id}
              className="bg-white rounded-3xl border border-slate-200 hover:border-teal-400 p-5 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                      {b.roomNumber}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 truncate max-w-[140px]">{b.tenantName}</h4>
                      <p className="text-[10px] font-bold text-slate-400">{b.period}</p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                    isLunas ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
                  }`}>
                    {b.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] space-y-1 font-semibold text-slate-600">
                  <p className="flex justify-between">
                    <span className="text-slate-400">Total Invoice:</span> 
                    <strong className="text-teal-700 font-black">{formatIDR(b.totalAmount)}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Tipe Sewa:</span> 
                    <strong className="text-slate-800">{b.rentalType || 'Bulanan'}</strong>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5">
                <button
                  onClick={() => onSelectBillId(b.id)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 rounded-xl text-center cursor-pointer"
                >
                  Detail
                </button>

                {!isLunas && (
                  <>
                    <button
                      onClick={() => onOpenPaymentForm(b)}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-xl cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <QrCode className="h-3 w-3" /> Bayar
                    </button>

                    <button
                      onClick={() => onOpenReminderModal(b)}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold p-1.5 rounded-xl cursor-pointer"
                      title="Kirim reminder WhatsApp"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </section>

    </div>
  );
}
