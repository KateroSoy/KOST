import React from 'react';
import { 
  Building, Users, LogOut, CheckCircle2, AlertCircle, 
  TrendingUp, TrendingDown, Landmark, MessageSquare, Wrench, ChevronRight, HelpCircle
} from 'lucide-react';
import { Room, Tenant, Bill, Complaint, Expense, KostSettings } from '../types';

interface DashboardViewProps {
  rooms: Room[];
  tenants: Tenant[];
  bills: Bill[];
  expenses: Expense[];
  complaints: Complaint[];
  settings: KostSettings;
  selectedMonth: string;
  onNavigateToTab: (tab: string, arg?: string) => void;
  onOpenReminderModal: (bill: Bill) => void;
  onOpenPaymentForm: (bill: Bill) => void;
}

export function DashboardView({ 
  rooms, tenants, bills, expenses, complaints, settings, selectedMonth, 
  onNavigateToTab, onOpenReminderModal, onOpenPaymentForm
}: DashboardViewProps) {
  
  // Calculate stats for current month
  const activeBills = bills.filter(b => b.period === selectedMonth);
  const activeExpenses = expenses.filter(e => {
    // Basic helper: if expense date includes the month code
    // For June 2026: "2026-06"
    const monthKey = selectedMonth === 'Juni 2026' ? '2026-06' : selectedMonth === 'Mei 2026' ? '2026-05' : '2026-07';
    return e.date.startsWith(monthKey);
  });

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'Terisi' || r.status === 'Menunggak').length;
  const emptyRooms = rooms.filter(r => r.status === 'Kosong').length;
  const bookedRooms = rooms.filter(r => r.status === 'Booking').length;
  const repairingRooms = rooms.filter(r => r.status === 'Perbaikan').length;

  const unpaidBillsCount = activeBills.filter(b => b.status === 'Belum Bayar' || b.status === 'Terlambat' || b.status === 'Sebagian').length;
  
  // Financial summaries
  const totalIncomeThisMonth = activeBills
    .filter(b => b.status === 'Lunas' || b.status === 'Sebagian')
    .reduce((sum, b) => sum + b.paidAmount, 0);

  const totalExpensesThisMonth = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netEstimatedProfit = totalIncomeThisMonth - totalExpensesThisMonth;

  // Let's filter outstanding tenants for quick reminder
  const outstandingBills = activeBills.filter(b => b.status === 'Belum Bayar' || b.status === 'Terlambat' || b.status === 'Sebagian');
  
  // Active complaints
  const activeComplaints = complaints.filter(c => c.status === 'Baru' || c.status === 'Diproses');
  
  // Formatting helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-0">
      
      {/* 1. SEVEN KPI SUMMARY CARDS */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* KPI 1: Total Kamar */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">TOTAL KAMAR</span>
            <span className="p-1 rounded-lg bg-slate-50 text-slate-600"><Building className="h-3.5 w-3.5" /></span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl font-extrabold text-slate-900">{totalRooms}</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Kapasitas Maksimal</p>
          </div>
        </div>

        {/* KPI 2: Kamar Terisi */}
        <div 
          onClick={() => onNavigateToTab('rooms')} 
          className="p-4 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col justify-between transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-emerald-800 tracking-wider">TERISI</span>
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700"><Users className="h-3.5 w-3.5" /></span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl font-extrabold text-emerald-950 group-hover:text-emerald-700 transition-colors">{occupiedRooms}</h3>
            <p className="text-[9px] text-emerald-600 font-medium mt-0.5">Hunian Aktif ({(totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0).toFixed(0)}%)</p>
          </div>
        </div>

        {/* KPI 3: Kamar Kosong */}
        <div 
          onClick={() => onNavigateToTab('rooms')}
          className="p-4 bg-teal-50/50 hover:bg-teal-50 border border-teal-100 rounded-2xl flex flex-col justify-between transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-teal-800 tracking-wider">KOSONG</span>
            <span className="p-1 rounded-lg bg-teal-100 text-teal-700"><CheckCircle2 className="h-3.5 w-3.5" /></span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl font-extrabold text-teal-950 group-hover:text-teal-700 transition-colors">{emptyRooms}</h3>
            <p className="text-[9px] text-teal-600 font-medium mt-0.5">Siap Pasarkan ✓</p>
          </div>
        </div>

        {/* KPI 4: Belum Bayar */}
        <div 
          onClick={() => onNavigateToTab('bills')}
          className={`p-4 border rounded-2xl flex flex-col justify-between transition-all cursor-pointer group ${
            unpaidBillsCount > 0 
              ? 'bg-rose-50 border-rose-200 hover:bg-rose-100/70 animate-pulse-slow' 
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-[10px] font-extrabold tracking-wider ${unpaidBillsCount > 0 ? 'text-rose-800' : 'text-slate-400'}`}>TUNGGAKAN</span>
            <span className={`p-1 rounded-lg ${unpaidBillsCount > 0 ? 'bg-rose-200 text-rose-700' : 'bg-slate-50 text-slate-500'}`}><AlertCircle className="h-3.5 w-3.5" /></span>
          </div>
          <div className="mt-2.5">
            <h3 className={`text-xl font-extrabold ${unpaidBillsCount > 0 ? 'text-rose-950' : 'text-slate-900'}`}>{unpaidBillsCount} Kamar</h3>
            <p className="text-[9px] text-rose-600 font-bold mt-0.5">Perlu Reminder WhatsApp</p>
          </div>
        </div>

        {/* KPI 5: Pemasukan Bulan Ini */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between hover:border-slate-300 transition-all col-span-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">PEMASUKAN</span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600"><TrendingUp className="h-3.5 w-3.5" /></span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-sm font-extrabold text-slate-950 truncate">{formatIDR(totalIncomeThisMonth)}</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Dana masuk {selectedMonth}</p>
          </div>
        </div>

        {/* KPI 6: Pengeluaran */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between hover:border-slate-300 transition-all col-span-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">BIAYA OPERASIONAL</span>
            <span className="p-1 rounded-lg bg-rose-50 text-rose-600"><TrendingDown className="h-3.5 w-3.5" /></span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-sm font-extrabold text-slate-950 truncate">{formatIDR(totalExpensesThisMonth)}</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Operasional {selectedMonth}</p>
          </div>
        </div>

        {/* KPI 7: Estimasi Profit */}
        <div className={`p-4 border rounded-2xl flex flex-col justify-between transition-all ${
          netEstimatedProfit > 0 ? 'bg-teal-900 text-white border-teal-800' : 'bg-slate-900 text-white border-slate-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-teal-300 tracking-wider">LABA BERSIH</span>
            <span className="p-1 rounded-lg bg-teal-800 text-teal-300"><Landmark className="h-3.5 w-3.5" /></span>
          </div>
          <div className="mt-2.5">
            <h3 className="text-sm font-black truncate text-teal-100">{formatIDR(netEstimatedProfit)}</h3>
            <p className="text-[9px] text-teal-300 mt-0.5">Est. Bersih {selectedMonth}</p>
          </div>
        </div>
      </section>

      {/* 2. DUAL-COLUMN CONTENT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (8/12 length): Room Visual Grid & Income Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Room Visual Grid Widget */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Status Peta Kamar (Grid Visual)</h3>
                <p className="text-[10px] text-slate-400">Peta ketersediaan kamar pada Kost Anda secara instan.</p>
              </div>
              <button 
                onClick={() => onNavigateToTab('rooms')} 
                className="text-[10px] text-teal-600 hover:text-teal-700 font-bold flex items-center gap-0.5 cursor-pointer hover:underline"
              >
                Lihat Detail Kamar <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Custom Interactive Legend */}
            <div className="flex flex-wrap gap-2.5 pb-4 mb-4 border-b border-dashed border-slate-100 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500"></span>Terisi</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-slate-300"></span>Kosong</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-400"></span>Booking</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-orange-400"></span>Perbaikan</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-rose-500 animate-pulse"></span>Menunggak</span>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-6 gap-3">
              {rooms.map((room) => {
                let statusBg = '';
                let statusText = '';
                let borderStyle = 'border-slate-100 hover:border-slate-300';
                
                // Switch styling based on status
                switch (room.status) {
                  case 'Terisi':
                    statusBg = 'bg-emerald-500 text-white';
                    statusText = 'Terisi - ' + (tenants.find(t => t.id === room.tenantId)?.name.split(' ')[0] || 'Nama');
                    break;
                  case 'Kosong':
                    statusBg = 'bg-slate-100 text-slate-600';
                    statusText = 'Kosong';
                    break;
                  case 'Booking':
                    statusBg = 'bg-amber-400 text-amber-950';
                    statusText = 'Booked';
                    break;
                  case 'Perbaikan':
                    statusBg = 'bg-orange-400 text-white';
                    statusText = 'Reparasi';
                    break;
                  case 'Menunggak':
                    statusBg = 'bg-rose-500 text-white animate-pulse-slow';
                    statusText = 'Menunggak ⚠️';
                    break;
                }

                return (
                  <div 
                    key={room.id}
                    onClick={() => onNavigateToTab('rooms', room.id)}
                    className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-2xl cursor-pointer transition-all hover:translate-y-[-1px] flex flex-col justify-between min-h-[96px]"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800">Kmr {room.number}</span>
                      <span className="text-[8px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">Floor {room.floor}</span>
                    </div>

                    <div className="mt-3">
                      <span className={`block w-full py-1 px-1.5 rounded-lg text-center font-bold text-[9px] tracking-tight truncate ${statusBg}`}>
                        {statusText}
                      </span>
                    </div>

                    <p className="text-[8px] text-slate-400 text-right mt-1 font-mono font-bold">
                      {formatIDR(room.price / 1000)}k/bln
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recents Payments Activity */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3 tracking-tight">Riwayat Pembayaran Terbaru Bulan Ini</h3>
            
            {activeBills.filter(b => b.status === 'Lunas').length === 0 ? (
              <div className="p-6 text-center border border-slate-100 rounded-2xl bg-slate-50/30">
                <p className="text-xs text-slate-400 italic">Belum ada pembayaran lunas tercatat untuk periode ini.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {activeBills.filter(b => b.status === 'Lunas').map((b, idx) => (
                  <div key={idx} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">✓</div>
                      <div>
                        <p className="font-bold text-slate-800">{b.tenantName} (Kamar {b.roomNumber})</p>
                        <p className="text-[9px] text-slate-400">Lunas via {b.paymentMethod || 'Tunai'} • {b.paymentDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-teal-700">{formatIDR(b.paidAmount)}</p>
                      <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 px-1.5 rounded-full uppercase">Berhasil</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (4/12 length): Overdue List & Active Complaints */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Unpaid / Outstanding Bills reminders widget */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Tunggakan Belum Lunas</h3>
                <span className="text-[9px] text-rose-500 font-extrabold bg-rose-50 px-2 py-0.5 rounded-full mt-1 inline-block">Sedia Template WhatsApp</span>
              </div>
            </div>

            {outstandingBills.length === 0 ? (
              <div className="p-8 text-center border border-slate-100 rounded-2xl bg-slate-50">
                <span className="text-2xl">🎉</span>
                <p className="text-xs font-bold text-emerald-900 mt-2">Semua Tagihan Lunas!</p>
                <p className="text-[10px] text-slate-400 mt-1">Sangat rapi, tidak ada tunggakan sewa.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {outstandingBills.map((b) => (
                  <div key={b.id} className="p-3 border border-slate-200/80 rounded-2xl bg-slate-50/50 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800 text-xs truncate max-w-[170px]">{b.tenantName}</p>
                        <p className="text-[9px] text-slate-400 font-semibold font-mono">Kamar {b.roomNumber} • Due {b.dueDate}</p>
                      </div>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                        b.status === 'Terlambat' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 text-xs">
                      <div>
                        <p className="text-[9px] text-slate-400 font-medium">Sisa Tagihan:</p>
                        <p className="font-black text-slate-900">{formatIDR(b.totalAmount - b.paidAmount)}</p>
                      </div>

                      <div className="flex gap-1">
                        <button 
                          onClick={() => onOpenPaymentForm(b)}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] py-1.5 px-2.5 rounded-lg font-bold transition-all cursor-pointer"
                        >
                          Bayar
                        </button>
                        <button 
                          onClick={() => onOpenReminderModal(b)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] py-1.5 px-2 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Kirim template WA"
                        >
                          <MessageSquare className="h-3 w-3" /> WA
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Complaints Widget */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Daftar Komplain Penyewa ({activeComplaints.length})</h3>
              <button 
                onClick={() => onNavigateToTab('complaints')}
                className="text-[9px] text-teal-600 hover:underline font-bold"
              >
                Urus Komplain
              </button>
            </div>

            {activeComplaints.length === 0 ? (
              <div className="py-6 text-center border border-slate-100 rounded-2xl bg-emerald-50/20">
                <span className="text-base text-emerald-600">✓</span>
                <p className="text-xs font-semibold text-slate-500 mt-1">Semua komplain teratasi</p>
                <p className="text-[10px] text-slate-400">Kondisi kos terpantau nyaman.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeComplaints.map((c) => (
                  <div key={c.id} className="p-2.5 border border-slate-100 rounded-xl bg-slate-50 flex items-start gap-2.5">
                    <span className="text-xs p-1.5 rounded-lg bg-orange-100 text-orange-800 font-bold shrink-0">🛠️</span>
                    <div className="translate-y-[-1px] flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <p className="font-bold text-xs text-slate-800 truncate">{c.title}</p>
                        <span className={`text-[7px] font-black uppercase px-1 rounded ${
                          c.priority === 'Tinggi' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {c.priority}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-semibold">Anak Kost: {c.tenantName} (No {c.roomNumber})</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{c.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Cashflow breakdown */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl relative overflow-hidden">
            <span className="absolute right-[-20px] bottom-[-20px] text-7xl opacity-5 pointer-events-none">💰</span>
            <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-3">Pola Cashflow {selectedMonth}</h4>
            
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Rasio Pengeluaran vs Pendapatan:</span>
                  <span className="font-extrabold text-rose-400">
                    {totalIncomeThisMonth > 0 ? ((totalExpensesThisMonth / totalIncomeThisMonth) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                {/* CSS Bar Chart */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${totalIncomeThisMonth > 0 ? Math.min(100, (totalIncomeThisMonth / (totalIncomeThisMonth + totalExpensesThisMonth)) * 100) : 50}%` }} 
                    className="bg-teal-500"
                    title="Pemasukan"
                  ></div>
                  <div 
                    style={{ width: `${totalExpensesThisMonth > 0 ? Math.min(100, (totalExpensesThisMonth / (totalIncomeThisMonth + totalExpensesThisMonth)) * 100) : 50}%` }} 
                    className="bg-rose-500"
                    title="Pengeluaran"
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-teal-500"></span>
                  <span className="text-slate-400">Pemasukan (Lunas)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  <span className="text-slate-400">Pengeluaran</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
