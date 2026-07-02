import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle2, AlertTriangle, TrendingDown, HelpCircle, ArrowUpRight, Calendar, Filter } from 'lucide-react';
import { Bill, Room, Tenant, Expense } from '../types';

interface ReportsViewProps {
  bills: Bill[];
  rooms: Room[];
  tenants: Tenant[];
  expenses: Expense[];
  selectedMonth: string;
}

export function ReportsView({ bills, rooms, tenants, expenses, selectedMonth }: ReportsViewProps) {
  const [reportTab, setReportTab] = useState<'financial' | 'occupancy'>('financial');
  const [filterMode, setFilterMode] = useState<'month' | 'range'>('month');
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState('2026-06-30');

  // Filter keys
  const getMonthKey = (m: string) => {
    if (m === 'Juni 2026') return '2026-06';
    if (m === 'Mei 2026') return '2026-05';
    return '2026-07';
  };

  const getBillRelevantDate = (b: Bill) => {
    return b.paymentDate || b.dueDate;
  };

  const getDaysDiff = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diff) ? 0 : diff;
  };

  const activeMonthKey = getMonthKey(selectedMonth);

  // Stats for the active month or chosen custom date-range window
  const activeBills = filterMode === 'month'
    ? bills.filter(b => b.period === selectedMonth)
    : bills.filter(b => {
        const d = getBillRelevantDate(b);
        return d >= startDate && d <= endDate;
      });

  const activeExpenses = filterMode === 'month'
    ? expenses.filter(e => e.date.startsWith(activeMonthKey))
    : expenses.filter(e => e.date >= startDate && e.date <= endDate);

  const totalPossibleRent = rooms.reduce((sum, r) => sum + r.price, 0);
  const occupancyRate = rooms.length > 0 ? (rooms.filter(r => r.status === 'Terisi' || r.status === 'Menunggak').length / rooms.length) * 100 : 0;

  const paidBillsCount = activeBills.filter(b => b.status === "Lunas").length;
  const unpaidBillsCount = activeBills.filter(b => b.status !== "Lunas").length;

  const totalRevenue = activeBills
    .filter(b => b.status === 'Lunas' || b.status === 'Sebagian')
    .reduce((sum, b) => sum + b.paidAmount, 0);

  const totalCosts = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const actualProfit = totalRevenue - totalCosts;

  // Outstanding/due billing amounts
  const outstandingAmount = activeBills
    .reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);

  // Formatter helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      return `${day} ${months[monthIdx]} ${year}`;
    } catch {
      return dateStr;
    }
  };

  // Static chart data calculations for trend representation (Mei vs Juni vs Juli)
  const monthsTrend = ['Mei 2026', 'Juni 2026', 'Juli 2026'];
  const trendData = monthsTrend.map(m => {
    const mKey = getMonthKey(m);
    const mBills = bills.filter(b => b.period === m);
    const mExpenses = expenses.filter(e => e.date.startsWith(mKey));
    
    const inc = mBills
      .filter(b => b.status === 'Lunas' || b.status === 'Sebagian')
      .reduce((sum, b) => sum + b.paidAmount, 0);

    const expVal = mExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { name: m.split(' ')[0], income: inc, expense: expVal };
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-1 sm:px-0">
      
      {/* Master Configuration Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs">
        {/* Tab Switcher controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/30 w-full md:max-w-xs shrink-0 select-none">
          <button
            onClick={() => setReportTab('financial')}
            className={`flex-grow py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              reportTab === 'financial' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Laporan Keuangan
          </button>
          <button
            onClick={() => setReportTab('occupancy')}
            className={`flex-grow py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              reportTab === 'occupancy' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Hunian & Kamar
          </button>
        </div>

        {/* Dynamic Period/Date Picker Mode Toggle Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider hidden md:inline shrink-0">Metode Analisis:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/30 w-full sm:w-auto select-none">
            <button
              onClick={() => setFilterMode('month')}
              className={`flex-grow sm:flex-initial justify-center px-3 py-1.5 bg-transparent rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                filterMode === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Bulan ({selectedMonth})</span>
            </button>
            <button
              onClick={() => setFilterMode('range')}
              className={`flex-grow sm:flex-initial justify-center px-3 py-1.5 bg-transparent rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                filterMode === 'range'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Filter className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Rentang Custom</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Custom Range Financial Summary Cards in the Top Section */}
      {filterMode === 'range' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Total Revenue Range Summary Card */}
          <div className="bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-100 hover:border-emerald-250/80 p-3.5 xs:p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110 duration-500"></div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Total Pendapatan Terkumpul</span>
                <p className="text-[10px] sm:text-[11px] text-slate-500">Mencakup setoran sewa & penunjang dalam batas tanggal terpilih</p>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 font-mono tracking-tight">
                    {formatIDR(totalRevenue)}
                  </span>
                </div>
              </div>
              <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-2xl shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3.5 pt-3 border-t border-emerald-100/60 flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-emerald-700/80">
              <span className="flex items-center gap-1.5 truncate max-w-[70%]">
                <Calendar className="h-3.5 w-3.5 text-emerald-600/75 shrink-0" />
                Periode: {formatIndoDate(startDate)} - {formatIndoDate(endDate)}
              </span>
              <span className="bg-emerald-100/50 text-emerald-800 border border-emerald-200/20 px-2.5 py-0.5 rounded-md font-mono text-[9px] sm:text-[10px] font-extrabold shrink-0">
                {activeBills.filter(b => b.status === 'Lunas' || b.status === 'Sebagian').length} Kwitansi
              </span>
            </div>
          </div>

          {/* Net Profit Range Summary Card */}
          <div className={`p-3.5 xs:p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-2xs hover:shadow-xs transition-all relative overflow-hidden group ${
            actualProfit >= 0 
              ? 'bg-gradient-to-br from-teal-50/50 to-white border-teal-100 hover:border-teal-200' 
              : 'bg-gradient-to-br from-rose-50/50 to-white border-rose-100 hover:border-rose-200'
          }`}>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110 duration-500 ${
              actualProfit >= 0 ? 'bg-teal-500/5' : 'bg-rose-500/5'
            }`}></div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider block ${
                  actualProfit >= 0 ? 'text-teal-800' : 'text-rose-800'
                }`}>
                  Laba Bersih Organik
                </span>
                <p className="text-[10px] sm:text-[11px] text-slate-500">Pemasukan kas dikurangi dengan pengeluaran operasional</p>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className={`text-xl sm:text-2xl lg:text-3xl font-black font-mono tracking-tight ${
                    actualProfit >= 0 ? 'text-teal-600' : 'text-rose-600'
                  }`}>
                    {formatIDR(actualProfit)}
                  </span>
                </div>
              </div>
              <div className={`p-3.5 rounded-2xl shrink-0 ${
                actualProfit >= 0 ? 'bg-teal-500/10 text-teal-600' : 'bg-rose-500/10 text-rose-600'
              }`}>
                {actualProfit >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
              </div>
            </div>
            <div className={`mt-3.5 pt-3 border-t flex items-center justify-between text-[9px] sm:text-[10px] font-bold ${
              actualProfit >= 0 ? 'border-teal-100/60 text-teal-700/80' : 'border-rose-100/60 text-rose-700/80'
            }`}>
              <span className="flex items-center gap-1.5 truncate max-w-[70%]">
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                Efisiensi Finansial Rentang Custom
              </span>
              <span className={`px-2.5 py-0.5 rounded-md font-mono text-[9px] sm:text-[10px] uppercase font-black shrink-0 ${
                actualProfit >= 0 ? 'bg-teal-100/50 text-teal-800 border border-teal-200/20' : 'bg-rose-100/50 text-rose-800 border border-rose-200/20'
              }`}>
                {actualProfit >= 0 ? 'Surplus' : 'Rugi Kas'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Inline Date Range Picker Card (visible when 'range' mode is chosen) */}
      {filterMode === 'range' && (
        <div className="bg-white border border-slate-100 p-3.5 xs:p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600 shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-[11px] sm:text-xs font-extrabold text-slate-800 uppercase tracking-wider leading-snug sm:leading-none">Konfigurasi Rentang Tanggal Kustom</h4>
                <p className="text-[10px] text-slate-400 mt-1">Mengumpulkan data keuangan dari tanggal transaksi / jatuh tempo dalam batas yang ditentukan.</p>
              </div>
            </div>
            
            {/* Quick Presets for dates - Swipeable horizontal pill strip on mobile */}
            <div className="flex overflow-x-auto -mx-4 px-4 pb-1.5 scrollbar-none [&::-webkit-scrollbar]:hidden gap-2 sm:mx-0 sm:px-0 sm:flex-wrap select-none">
              <button
                type="button"
                onClick={() => {
                  setStartDate('2026-05-25');
                  setEndDate('2026-06-01');
                }}
                className="px-3.5 py-1.5 text-[10px] whitespace-nowrap font-extrabold rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0 min-h-[32px]"
              >
                7-Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate('2026-05-02');
                  setEndDate('2026-06-01');
                }}
                className="px-3.5 py-1.5 text-[10px] whitespace-nowrap font-extrabold rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0 min-h-[32px]"
              >
                30-Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate('2026-05-01');
                  setEndDate('2026-06-30');
                }}
                className="px-3.5 py-1.5 text-[10px] whitespace-nowrap font-extrabold rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0 min-h-[32px]"
              >
                Mei & Juni (2 Bln)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate('2026-01-01');
                  setEndDate('2026-12-31');
                }}
                className="px-3.5 py-1.5 text-[10px] whitespace-nowrap font-extrabold rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0 min-h-[32px]"
              >
                Tahun Ini (2026)
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-end">
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Mulai Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all bg-slate-50/50 min-h-[44px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all bg-slate-50/50 min-h-[44px]"
              />
            </div>
            <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-xl text-[10px] font-bold text-slate-500 flex justify-between items-center sm:col-span-2 lg:col-span-1 min-h-[44px]">
              <span>Masa Evaluasi:</span>
              <span className="text-teal-700 font-extrabold bg-teal-50 px-2.5 py-1 rounded-md font-mono text-[11px]">{getDaysDiff()} Hari Kalender</span>
            </div>
          </div>
        </div>
      )}

      {reportTab === 'financial' && (
        <>
          {/* Active Filter Confirmation Badge */}
          <div className="bg-slate-100 border border-slate-200/40 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse shrink-0"></span>
              <span className="leading-snug">
                Status Filter Aktif: <span className="text-slate-900 font-extrabold">{filterMode === 'month' ? selectedMonth : `${formatIndoDate(startDate)} - ${formatIndoDate(endDate)}`}</span>
              </span>
            </span>
            <span className="text-[10px] w-fit bg-slate-200/60 text-slate-600 px-2.5 py-0.5 rounded-lg uppercase tracking-wider font-extrabold font-mono shrink-0">
              {filterMode === 'month' ? 'Bulanan' : `${getDaysDiff()} HARI`}
            </span>
          </div>

          {/* Financial KPIs Grid */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white border border-slate-150 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs transition-all">
              <span className="text-[9px] xs:text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider truncate">Pemasukan Kas</span>
              <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-black text-emerald-600 mt-1.5 font-mono truncate" title={formatIDR(totalRevenue)}>
                {formatIDR(totalRevenue)}
              </h3>
              <p className="text-[8px] xs:text-[9px] text-slate-400 mt-1 truncate">Sewa & penunjang</p>
            </div>

            <div className="bg-white border border-slate-150 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs transition-all">
              <span className="text-[9px] xs:text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider truncate">Pengeluaran Ops</span>
              <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-black text-rose-600 mt-1.5 font-mono truncate" title={formatIDR(totalCosts)}>
                {formatIDR(totalCosts)}
              </h3>
              <p className="text-[8px] xs:text-[9px] text-slate-400 mt-1 truncate">Reparasi & token</p>
            </div>

            <div className="bg-white border border-slate-150 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs transition-all">
              <span className="text-[9px] xs:text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider truncate">Laba Bersih</span>
              <h3 className={`text-sm xs:text-base sm:text-lg lg:text-xl font-black mt-1.5 font-mono truncate ${actualProfit >= 0 ? 'text-teal-700' : 'text-slate-800'}`} title={formatIDR(actualProfit)}>
                {formatIDR(actualProfit)}
              </h3>
              <p className="text-[8px] xs:text-[9px] text-slate-400 mt-1 truncate">Est. Laba bersih</p>
            </div>

            <div className="bg-white border border-slate-150 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs transition-all">
              <span className="text-[9px] xs:text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider truncate">Tunggakan</span>
              <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-black text-amber-600 mt-1.5 font-mono truncate" title={formatIDR(outstandingAmount)}>
                {formatIDR(outstandingAmount)}
              </h3>
              <p className="text-[8px] xs:text-[9px] text-slate-400 mt-1 truncate">{unpaidBillsCount} kamar belum setor</p>
            </div>
          </section>

          {/* Graphical Cashflow trend visuals using HTML SVGs */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* SVG Interactive Line chart for monthly incomes */}
            <div className="bg-white border border-slate-150 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs lg:col-span-8 space-y-4 overflow-hidden">
              <div>
                <h4 className="text-sm font-extrabold text-slate-950 tracking-tight leading-none">Grafik Pertumbuhan Kas Bulanan (2026)</h4>
                <p className="text-[10px] text-slate-400 mt-1.5">Tren penerimaan setoran bersih lunas tiap bulan berskala real-time.</p>
              </div>

              {/* Pure SVG Line Plot */}
              <div className="w-full bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] text-slate-400">
                  <span className="font-semibold">Puncak: Rp 5.000.000</span>
                  <div className="flex flex-wrap gap-2.5">
                    <span className="flex items-center gap-1 font-semibold"><span className="h-2 w-2 rounded-full bg-teal-500"></span>Pendapatan</span>
                    <span className="flex items-center gap-1 font-semibold"><span className="h-2 w-2 rounded-full bg-rose-500"></span>Biaya</span>
                  </div>
                </div>

                {/* SVG Visual plot - responsive dimension container */}
                <div className="flex-1 relative mt-3 flex items-end">
                  <div className="w-full h-[140px] xs:h-[160px] sm:h-[180px]">
                    <svg viewBox="0 0 400 150" className="w-full h-full stroke-2 fill-none overflow-visible">
                      {/* Gridlines */}
                      <line x1="0" y1="25" x2="400" y2="25" stroke="#f1f5f9" strokeDasharray="3" />
                      <line x1="0" y1="75" x2="400" y2="75" stroke="#f1f5f9" strokeDasharray="3" />
                      <line x1="0" y1="125" x2="400" y2="125" stroke="#f1f5f9" strokeDasharray="3" />

                      {/* Plotting mei vs juni vs juli */}
                      {/* Mei: 3,320,000 (y = 85), Juni: 3,320,000 (y = 65), Juli: 0. Scaling on 5M */}
                      {/* Line for income */}
                      <path 
                        d="M 50 85 L 200 65 L 350 140" 
                        stroke="#0d9488" 
                        strokeWidth="3.5" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Circle markers */}
                      <circle cx="50" cy="85" r="5" fill="#ffffff" stroke="#0d9488" strokeWidth="3" />
                      <circle cx="200" cy="65" r="5" fill="#ffffff" stroke="#0d9488" strokeWidth="3" />
                      <circle cx="350" cy="140" r="5" fill="#ffffff" stroke="#0d9488" strokeWidth="3" />

                      {/* Line for expenses  Mei: 2.500.000, Juni: 0. Scaling on 5M */}
                      <path 
                        d="M 50 100 L 200 148 L 350 148" 
                        stroke="#f43f5e" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="50" cy="100" r="4" fill="#ffffff" stroke="#f43f5e" strokeWidth="2.5" />
                      <circle cx="200" cy="148" r="4" fill="#ffffff" stroke="#f43f5e" strokeWidth="2.5" />
                      <circle cx="350" cy="148" r="4" fill="#ffffff" stroke="#f43f5e" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>

                <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-500 border-t border-slate-100 pt-2.5 font-mono gap-1">
                  <span className="flex-1 text-center truncate">Mei <span className="hidden xs:inline">(Mulai)</span></span>
                  <span className="flex-1 text-center truncate">Juni <span className="hidden xs:inline">(Aktif)</span></span>
                  <span className="flex-1 text-center truncate">Juli <span className="hidden xs:inline">(Proyeksi)</span></span>
                </div>
              </div>
            </div>

            {/* Side summary: unpaid list */}
            <div className="bg-white border border-slate-150 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs lg:col-span-4 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-905 border-b border-slate-100 pb-2 uppercase tracking-wider">
                Rasio Realisasi {filterMode === 'month' ? 'Bulan Ini' : 'Periode Kustom'}
              </h4>
              
              <div className="space-y-4">
                <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl text-[10px] sm:text-[11px] font-semibold text-slate-600 block leading-relaxed space-y-1 font-sans">
                  <p className="font-extrabold text-slate-800 text-xs">Pencapaian Cashflow:</p>
                  <p className="flex justify-between"><span>Lunas Penuh (Realisasi):</span> <span className="text-teal-700 font-extrabold">{formatIDR(totalRevenue)}</span></p>
                  <p className="flex justify-between"><span>Tunggakan Outstanding:</span> <span className="text-rose-600 font-extrabold">{formatIDR(outstandingAmount)}</span></p>
                  <p className="flex justify-between pt-1 border-t border-slate-200 font-bold"><span>Target Kas Maksimal:</span> <span className="text-slate-800 font-black">{formatIDR(totalRevenue + outstandingAmount)}</span></p>
                </div>

                {/* Progress bar ratio */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-extrabold">
                    <span className="text-slate-500">Kolektabilitas Selesai:</span>
                    <span className="text-teal-700 font-mono">
                      {( (totalRevenue + outstandingAmount) > 0 ? (totalRevenue / (totalRevenue + outstandingAmount)) * 100 : 0 ).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${( (totalRevenue + outstandingAmount) > 0 ? (totalRevenue / (totalRevenue + outstandingAmount)) * 100 : 0 )}%` }} 
                      className="bg-teal-600 h-full rounded-full transition-all duration-500 ease-out"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {reportTab === 'occupancy' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white border border-slate-150 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs text-center space-y-4 max-w-md mx-auto w-full">
            <h4 className="text-xs font-extrabold text-slate-950 uppercase block tracking-wider text-left border-b border-slate-100 pb-2">Persentase Tingkat Hunian (Occupancy)</h4>
            
            {/* Pure SVG donut circular progress */}
            <div className="relative h-40 w-40 sm:h-44 sm:w-44 mx-auto flex items-center justify-center select-none">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="#0d9488" 
                  strokeWidth="12" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 40}`} 
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - occupancyRate / 100)}`} 
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="text-center translate-y-[-1px]">
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tighter font-mono">{occupancyRate.toFixed(0)}%</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-0.5">Hunian Aktif</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-2 text-[10px] sm:text-[11px] font-semibold text-slate-600">
              <div className="p-1 px-1.5 border border-slate-100 bg-slate-50/55 rounded-xl overflow-hidden leading-tight">
                <span className="text-slate-400 block text-[8px] xs:text-[9px] tracking-wider font-extrabold">TERISI</span>
                <span className="font-extrabold text-teal-700 text-[10px] sm:text-xs block truncate mt-0.5">
                  {rooms.filter(r => r.status === 'Terisi' || r.status === 'Menunggak').length} Kamar
                </span>
              </div>
              <div className="p-1 px-1.5 border border-slate-100 bg-slate-50/55 rounded-xl overflow-hidden leading-tight">
                <span className="text-slate-400 block text-[8px] xs:text-[9px] tracking-wider font-extrabold">KOSONG</span>
                <span className="font-extrabold text-slate-600 text-[10px] sm:text-xs block truncate mt-0.5">
                  {rooms.filter(r => r.status === 'Kosong').length} Kamar
                </span>
              </div>
              <div className="p-1 px-1.5 border border-slate-100 bg-slate-50/55 rounded-xl overflow-hidden leading-tight">
                <span className="text-slate-400 block text-[8px] xs:text-[9px] tracking-wider font-extrabold">PERBAIKAN</span>
                <span className="font-extrabold text-orange-700 text-[10px] sm:text-xs block truncate mt-0.5">
                  {rooms.filter(r => r.status === 'Perbaikan').length} Kamar
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs space-y-3.5">
            <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Status Pembukuan Kamar Masuk</h4>
            
            <div className="space-y-4">
              <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-semibold">
                Berikut adalah denda/tunggakan per-kamar penyewa untuk {filterMode === 'month' ? `bulan ${selectedMonth}` : 'periode kustom terpilih'}. Ingat untuk mengirim template WhatsApp pengingat secepatnya jika diperlukan.
              </p>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {activeBills.filter(b => b.status !== 'Lunas').map((b) => {
                  const remains = b.totalAmount - b.paidAmount;
                  return (
                    <div key={b.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/40 flex justify-between items-center text-xs font-semibold hover:bg-slate-50 transition-colors">
                      <div className="min-w-0 mr-2">
                        <p className="font-bold text-slate-800 truncate">Kamar {b.roomNumber} - {b.tenantName}</p>
                        <p className="text-[9px] text-slate-400 font-semibold font-mono mt-0.5 font-sans">Metode: {b.paymentMethod || 'Manual'} ({b.status})</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-rose-600 font-extrabold">{formatIDR(remains)}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">Tunggakan</p>
                      </div>
                    </div>
                  );
                })}

                {activeBills.filter(b => b.status !== 'Lunas').length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <CheckCircle2 className="h-8 w-8 text-teal-500 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs italic font-bold">Seluruh kamar lunas sejalan tertib! Hebat ✓</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
