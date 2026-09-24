import React, { useState } from 'react';
import { MagnifyingGlass, Plus, Faders, Receipt, CalendarBlank, CreditCard, Copy, Check, ChatTeardropText, WarningCircle, X, CaretRight, Calculator, FileText, PaperPlaneRight, QrCode } from '@phosphor-icons/react';
import { Bill, Tenant, Room, BillStatus } from '../types';
import { ElegantSelect } from './ElegantSelect';
import { generateId } from '../utils';

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
      id: generateId('bill'),
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.name,
      roomId: associatedRoom?.id || generateId('room'),
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
      
      {/* 1. TOP HEADER & FILTER */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#171A18] font-editorial tracking-tight">
            Tagihan
          </h2>
        </div>

        <button
          onClick={() => {
            setShowAddForm(true);
            onSelectBillId(null);
          }}
          className="px-4 py-2.5 rounded-full bg-[#173B30] text-[#F5F1E8] hover:bg-[#0f2720] transition-all flex items-center justify-center cursor-pointer shadow-md shadow-[#173b30]/20 text-xs whitespace-nowrap shrink-0 font-bold">
          Tagihan Baru
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative w-full">
          <MagnifyingGlass weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E746F]" />
          <input
            type="text"
            placeholder="Cari tagihan atau kamar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl text-sm text-[#171A18] placeholder-[#6E746F] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#173B30] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          {['Semua', 'Belum Bayar', 'Lunas', 'Terlambat'].map((st) => {
            const count = st === 'Semua' ? bills.length : bills.filter(b => b.status === st).length;
            const isActive = statusFilter === st;
            
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shadow-sm ${
                  isActive
                    ? 'bg-[#173B30] text-white shadow-md shadow-[#173b30]/20'
                    : 'bg-white text-[#6E746F] hover:text-[#171A18]'
                }`}
              >
                {st} <span className="opacity-60 ml-1">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER BILL RECEIPT DETAIL MODAL OVERLAY */}
      {activeDetailBill && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-[#FBF9F5] sm:rounded-3xl rounded-t-3xl max-w-md w-full p-6 shadow-2xl space-y-6 slide-up-animation max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-black">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#171A18] leading-tight">Invoice Kmr {activeDetailBill.roomNumber}</h3>
                  <span className="text-xs text-[#6E746F] font-medium">{activeDetailBill.period}</span>
                </div>
              </div>
              <button 
                onClick={() => onSelectBillId(null)}
                className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#6E746F] shadow-sm"
              >
                <X weight="duotone" className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-white p-4 rounded-3xl shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#6E746F] uppercase">Penyewa</span>
                  <span className="font-bold text-[#171A18] text-right">{activeDetailBill.tenantName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#6E746F] uppercase">Tipe</span>
                  <span className="font-bold text-[#171A18] text-right">{activeDetailBill.rentalType || 'Bulanan'}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-zinc-100 mt-1">
                  <span className="text-xs font-bold text-[#6E746F] uppercase">Total Tagihan</span>
                  <span className="font-extrabold text-[#173B30] text-lg">{formatIDR(activeDetailBill.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              {activeDetailBill.status !== 'Lunas' && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectBillId(null);
                    onOpenPaymentForm(activeDetailBill);
                  }}
                  className="w-full py-4 bg-[#173B30] text-white font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2"
                >
                  <QrCode className="h-5 w-5" />
                  <span>Bayar Tagihan</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={() => {
                  if (confirm("Hapus tagihan?")) {
                    onDeleteBill(activeDetailBill.id);
                    onSelectBillId(null);
                  }
                }}
                className="w-full py-4 bg-white text-rose-700 font-bold rounded-2xl shadow-sm flex items-center justify-center"
              >
                Hapus Tagihan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE BILL FLOW WIZARD FORM */}
      {showAddForm && (
        <div className="fixed inset-0 bg-[#171A18]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-[rgba(23,59,48,0.15)] shadow-2xl overflow-hidden">
            <div className="p-5 bg-[#173B30] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-teal-400" />
                <span className="font-extrabold text-base">Buat Tagihan Baru</span>
              </div>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded-full text-[#6E746F] hover:text-white">
                <X weight="duotone" className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBillSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {formError && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl font-bold">⚠️ {formError}</div>}

              <div>
                <label className="block font-bold text-[#171A18] mb-1">Pilih Tamu / Penghuni *</label>
                <ElegantSelect
                  value={selTenantId}
                  onChange={(val) => setSelTenantId(val)}
                  placeholder="-- Pilih Tamu / Penghuni --"
                  options={tenants.map(t => ({
                    value: t.id,
                    label: `${t.name} (Kmr ${t.roomAssigned} • Stay ${t.guestType || 'Bulanan'})`
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Periode Stay</label>
                  <input
                    type="text"
                    value={billPeriod}
                    onChange={(e) => setBillPeriod(e.target.value)}
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={dueDateStr}
                    onChange={(e) => setDueDateStr(e.target.value)}
                    className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[rgba(23,59,48,0.15)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-[#FBF9F5] text-[#171A18] font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#173B30] text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Simpan & Buat Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENDER BILLS LIST CARDS */}
      <section className="grid grid-cols-1 gap-4 pb-10">
        {filteredBills.map((b) => {
          const isLunas = b.status === 'Lunas';

          return (
            <div 
              key={b.id}
              onClick={() => onSelectBillId(b.id)}
              className="bg-white p-4 rounded-[28px] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl ${
                    isLunas ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {b.roomNumber}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#171A18] truncate max-w-[140px] group-hover:text-[#173B30] transition-colors">{b.tenantName}</h4>
                    <p className="text-xs font-medium text-[#6E746F] mt-0.5">{b.period}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isLunas && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPaymentForm(b);
                      }}
                      className="h-10 w-10 rounded-full bg-[#173B30] text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                  isLunas ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {b.status}
                </span>
                <strong className="text-sm font-extrabold text-[#171A18]">{formatIDR(b.totalAmount)}</strong>
              </div>
            </div>
          );
        })}
      </section>

    </div>
  );
}
