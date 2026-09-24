import React, { useState, useEffect } from 'react';
import { ChartBar, TrendUp, Users, CheckCircle, TrendDown, CalendarBlank, Faders, WarningCircle } from '@phosphor-icons/react';
import { fetchReports } from '../api';
import { ReportsAggregate } from '../types';

interface ReportsViewProps {
  selectedMonth: string;
}

const EMPTY_AGGREGATE: ReportsAggregate = {
  totalRevenue: 0,
  totalCosts: 0,
  actualProfit: 0,
  outstandingAmount: 0,
  paidBillsCount: 0,
  unpaidBillsCount: 0,
  occupancyRate: 0,
  roomStatusCounts: { terisi: 0, kosong: 0, perbaikan: 0 },
  trend: [],
  unpaidBills: [],
};

const dateKey = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return dateKey(date);
};

export function ReportsView({ selectedMonth }: ReportsViewProps) {
  const [reportTab, setReportTab] = useState<'financial' | 'occupancy'>('financial');
  const [filterMode, setFilterMode] = useState<'month' | 'range'>('month');
  const [startDate, setStartDate] = useState(() => daysAgo(29));
  const [endDate, setEndDate] = useState(() => dateKey(new Date()));

  const [data, setData] = useState<ReportsAggregate>(EMPTY_AGGREGATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the aggregate from the backend (server-side computed, plan-gated) whenever the filter changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = filterMode === 'month'
      ? { mode: 'month' as const, month: selectedMonth }
      : { mode: 'range' as const, startDate, endDate };

    fetchReports(params)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Gagal memuat laporan'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [filterMode, selectedMonth, startDate, endDate]);

  const {
    totalRevenue, totalCosts, actualProfit, outstandingAmount,
    paidBillsCount, occupancyRate, roomStatusCounts, trend, unpaidBills,
  } = data;

  const receivedBillsCount = paidBillsCount + unpaidBills.filter(b => b.status === 'Sebagian').length;

  const getDaysDiff = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diff) ? 0 : diff;
  };

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

  // Compute SVG coordinates from the server-provided trend series
  const maxValue = Math.max(...trend.map(d => Math.max(d.income, d.expense)), 1);
  const svgWidth = 400;
  const svgHeight = 150;
  const svgPadding = 30;
  const plotWidth = svgWidth - svgPadding * 2;
  const plotHeight = svgHeight - 20;

  const toSvgX = (i: number) => svgPadding + (i / (trend.length - 1 || 1)) * plotWidth;
  const toSvgY = (val: number) => svgHeight - 10 - (val / maxValue) * (plotHeight - 20);

  const incomePath = trend.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(i)} ${toSvgY(d.income)}`).join(' ');
  const expensePath = trend.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(i)} ${toSvgY(d.expense)}`).join(' ');

  return (
    <div className={`space-y-4 sm:space-y-6 max-w-7xl mx-auto px-1 sm:px-0 transition-opacity ${loading ? 'opacity-60' : ''}`}>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold">
          <WarningCircle weight="duotone" className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Master Configuration Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-[32px] shadow-sm animate-fade-in-up">
        {/* Tab Switcher controls */}
        <div className="flex bg-[#FBF9F5] p-1 rounded-xl border border-[rgba(23,59,48,0.15)]/30 w-full md:max-w-xs shrink-0 select-none">
          <button
            onClick={() => setReportTab('financial')}
            className={`flex-grow py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              reportTab === 'financial'
                ? 'bg-[#173B30] text-white shadow-xs'
                : 'text-[#6E746F] hover:text-[#171A18]'
            }`}
          >
            <ChartBar className="h-3.5 w-3.5" />
            Laporan Keuangan
          </button>
          <button
            onClick={() => setReportTab('occupancy')}
            className={`flex-grow py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              reportTab === 'occupancy'
                ? 'bg-[#173B30] text-white shadow-xs'
                : 'text-[#6E746F] hover:text-[#171A18]'
            }`}
          >
            <Users weight="duotone" className="h-3.5 w-3.5" />
            Hunian & Kamar
          </button>
        </div>

        {/* Dynamic Period/Date Picker Mode Toggle Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] font-extrabold text-[#6E746F] uppercase tracking-wider hidden md:inline shrink-0">Metode Analisis:</span>
          <div className="flex bg-[#FBF9F5] p-1 rounded-xl border border-[rgba(23,59,48,0.15)]/30 w-full sm:w-auto select-none">
            <button
              onClick={() => setFilterMode('month')}
              className={`flex-grow sm:flex-initial justify-center px-3 py-1.5 bg-transparent rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                filterMode === 'month'
                  ? 'bg-white text-[#171A18] shadow-xs'
                  : 'text-[#6E746F] hover:text-[#171A18]'
              }`}
            >
              <CalendarBlank weight="duotone" className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Bulan ({selectedMonth})</span>
            </button>
            <button
              onClick={() => setFilterMode('range')}
              className={`flex-grow sm:flex-initial justify-center px-3 py-1.5 bg-transparent rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                filterMode === 'range'
                  ? 'bg-white text-[#171A18] shadow-xs'
                  : 'text-[#6E746F] hover:text-[#171A18]'
              }`}
            >
              <Faders weight="duotone" className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Rentang Custom</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Custom Range Financial Summary Cards in the Top Section */}
      {filterMode === 'range' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Total Revenue Range Summary Card */}
          <div className="bg-white p-5 sm:p-6 rounded-[32px] shadow-sm transition-all duration-500 relative overflow-hidden group">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <span className="text-[10px] font-bold text-[#6E746F] uppercase tracking-wider block">Total Pendapatan Terkumpul</span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[#171A18] tracking-tight">
                    {formatIDR(totalRevenue)}
                  </span>
                </div>
              </div>
              <div className="p-3.5 bg-[#F5F1E8] text-[#173B30] rounded-2xl shrink-0">
                <TrendUp weight="duotone" className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-[10px] font-bold text-[#6E746F]">
              <span className="flex items-center gap-1.5 truncate max-w-[70%]">
                <CalendarBlank weight="duotone" className="h-3.5 w-3.5 shrink-0" />
                Periode: {formatIndoDate(startDate)} - {formatIndoDate(endDate)}
              </span>
              <span className="bg-[#173B30] text-white px-2.5 py-1 rounded-full font-bold shrink-0">
                {receivedBillsCount} Kwitansi
              </span>
            </div>
          </div>

          {/* Net Profit Range Summary Card */}
          <div className="bg-white p-5 sm:p-6 rounded-[32px] shadow-sm transition-all duration-500 relative overflow-hidden group delay-75">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <span className="text-[10px] font-bold text-[#6E746F] uppercase tracking-wider block">
                  Laba Bersih Organik
                </span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight ${
                    actualProfit >= 0 ? 'text-[#173B30]' : 'text-rose-600'
                  }`}>
                    {formatIDR(actualProfit)}
                  </span>
                </div>
              </div>
              <div className="p-3.5 bg-[#F5F1E8] text-[#173B30] rounded-2xl shrink-0">
                {actualProfit >= 0 ? <TrendUp weight="duotone" className="h-6 w-6" /> : <TrendDown className="h-6 w-6" />}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-[10px] font-bold text-[#6E746F]">
              <span className="flex items-center gap-1.5 truncate max-w-[70%]">
                <TrendUp weight="duotone" className="h-3.5 w-3.5 shrink-0" />
                Efisiensi Finansial Rentang Custom
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold shrink-0 ${
                actualProfit >= 0 ? 'bg-[#173B30] text-white' : 'bg-rose-600 text-white'
              }`}>
                {actualProfit >= 0 ? 'Surplus' : 'Rugi Kas'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Inline Date Range Picker Card (visible when 'range' mode is chosen) */}
      {filterMode === 'range' && (
        <div className="bg-white border border-[rgba(23,59,48,0.06)] p-3.5 xs:p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 bg-[#F5F1E8] rounded-xl text-[#173B30] shrink-0">
                <CalendarBlank weight="duotone" className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-[11px] sm:text-xs font-extrabold text-[#171A18] uppercase tracking-wider leading-snug sm:leading-none">Konfigurasi Rentang Tanggal Kustom</h4>
                <p className="text-[10px] text-[#6E746F] mt-1">Mengumpulkan data keuangan dari tanggal transaksi / jatuh tempo dalam batas yang ditentukan.</p>
              </div>
            </div>

            {/* Quick Presets for dates - Swipeable horizontal pill strip on mobile */}
            <div className="flex overflow-x-auto -mx-4 px-4 pb-1.5 scrollbar-none [&::-webkit-scrollbar]:hidden gap-2 sm:mx-0 sm:px-0 sm:flex-wrap select-none">
              <button
                type="button"
                onClick={() => {
                  setStartDate(daysAgo(6));
                  setEndDate(dateKey(new Date()));
                }}
                className="px-3.5 py-1.5 text-[10px] whitespace-nowrap font-extrabold rounded-full border border-[rgba(23,59,48,0.15)] bg-white hover:bg-[#FBF9F5] active:bg-[rgba(23,59,48,0.06)] text-[#171A18] transition-colors cursor-pointer shrink-0 min-h-[32px]"
              >
                7-Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate(daysAgo(29));
                  setEndDate(dateKey(new Date()));
                }}
                className="px-3.5 py-1.5 text-[10px] whitespace-nowrap font-extrabold rounded-full border border-[rgba(23,59,48,0.15)] bg-white hover:bg-[#FBF9F5] active:bg-[rgba(23,59,48,0.06)] text-[#171A18] transition-colors cursor-pointer shrink-0 min-h-[32px]"
              >
                30-Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => {
                  const start = new Date();
                  start.setDate(1);
                  start.setMonth(start.getMonth() - 1);
                  setStartDate(dateKey(start));
                  setEndDate(dateKey(new Date()));
                }}
                className="px-3.5 py-1.5 text-[10px] whitespace-nowrap font-extrabold rounded-full border border-[rgba(23,59,48,0.15)] bg-white hover:bg-[#FBF9F5] active:bg-[rgba(23,59,48,0.06)] text-[#171A18] transition-colors cursor-pointer shrink-0 min-h-[32px]"
              >
                2 Bulan Terakhir
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate(`${new Date().getFullYear()}-01-01`);
                  setEndDate(dateKey(new Date()));
                }}
                className="px-3.5 py-1.5 text-[10px] whitespace-nowrap font-extrabold rounded-full border border-[rgba(23,59,48,0.15)] bg-white hover:bg-[#FBF9F5] active:bg-[rgba(23,59,48,0.06)] text-[#171A18] transition-colors cursor-pointer shrink-0 min-h-[32px]"
              >
                Tahun Ini ({new Date().getFullYear()})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-end">
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-[#6E746F] uppercase tracking-wider">Mulai Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-3 border border-[rgba(23,59,48,0.15)] rounded-xl text-xs font-bold text-[#171A18] focus:outline-none focus:border-[#173B30] focus:ring-1 focus:ring-[#173B30] transition-all bg-white/50 min-h-[44px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-[#6E746F] uppercase tracking-wider">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-3 border border-[rgba(23,59,48,0.15)] rounded-xl text-xs font-bold text-[#171A18] focus:outline-none focus:border-[#173B30] focus:ring-1 focus:ring-[#173B30] transition-all bg-white/50 min-h-[44px]"
              />
            </div>
            <div className="bg-white/80 border border-[rgba(23,59,48,0.06)] p-3 rounded-xl text-[10px] font-bold text-[#6E746F] flex justify-between items-center sm:col-span-2 lg:col-span-1 min-h-[44px]">
              <span>Masa Evaluasi:</span>
              <span className="text-[#0f2720] font-extrabold bg-[#F5F1E8] px-2.5 py-1 rounded-md font-mono text-[11px]">{getDaysDiff()} Hari Kalender</span>
            </div>
          </div>
        </div>
      )}

      {reportTab === 'financial' && (
        <>
          {/* Active Filter Confirmation Badge */}
          <div className="bg-[#FBF9F5] border border-[rgba(23,59,48,0.15)]/40 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-bold text-[#171A18]">
            <span className="flex items-center gap-2 text-[#6E746F]">
              <span className="h-2 w-2 rounded-full bg-[#173B30] animate-pulse shrink-0"></span>
              <span className="leading-snug">
                Status Filter Aktif: <span className="text-[#171A18] font-extrabold">{filterMode === 'month' ? selectedMonth : `${formatIndoDate(startDate)} - ${formatIndoDate(endDate)}`}</span>
              </span>
            </span>
            <span className="text-[10px] w-fit bg-[rgba(23,59,48,0.06)]/60 text-[#6E746F] px-2.5 py-0.5 rounded-lg uppercase tracking-wider font-extrabold font-mono shrink-0">
              {filterMode === 'month' ? 'Bulanan' : `${getDaysDiff()} HARI`}
            </span>
          </div>

          {/* Financial KPIs Grid */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white border border-[rgba(23,59,48,0.1)] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs transition-all">
              <span className="text-[9px] xs:text-[10px] font-extrabold text-[#6E746F] block uppercase tracking-wider truncate">Pemasukan Kas</span>
              <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-black text-emerald-600 mt-1.5 font-mono truncate" title={formatIDR(totalRevenue)}>
                {formatIDR(totalRevenue)}
              </h3>
              <p className="text-[8px] xs:text-[9px] text-[#6E746F] mt-1 truncate">Sewa & penunjang</p>
            </div>

            <div className="bg-white border border-[rgba(23,59,48,0.1)] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs transition-all">
              <span className="text-[9px] xs:text-[10px] font-extrabold text-[#6E746F] block uppercase tracking-wider truncate">Pengeluaran Ops</span>
              <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-black text-rose-600 mt-1.5 font-mono truncate" title={formatIDR(totalCosts)}>
                {formatIDR(totalCosts)}
              </h3>
              <p className="text-[8px] xs:text-[9px] text-[#6E746F] mt-1 truncate">Reparasi & token</p>
            </div>

            <div className="bg-white border border-[rgba(23,59,48,0.1)] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs transition-all">
              <span className="text-[9px] xs:text-[10px] font-extrabold text-[#6E746F] block uppercase tracking-wider truncate">Laba Bersih</span>
              <h3 className={`text-sm xs:text-base sm:text-lg lg:text-xl font-black mt-1.5 font-mono truncate ${actualProfit >= 0 ? 'text-[#0f2720]' : 'text-[#171A18]'}`} title={formatIDR(actualProfit)}>
                {formatIDR(actualProfit)}
              </h3>
              <p className="text-[8px] xs:text-[9px] text-[#6E746F] mt-1 truncate">Est. Laba bersih</p>
            </div>

            <div className="bg-white border border-[rgba(23,59,48,0.1)] p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs transition-all">
              <span className="text-[9px] xs:text-[10px] font-extrabold text-[#6E746F] block uppercase tracking-wider truncate">Tunggakan</span>
              <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-black text-[#B89A68] mt-1.5 font-mono truncate" title={formatIDR(outstandingAmount)}>
                {formatIDR(outstandingAmount)}
              </h3>
              <p className="text-[8px] xs:text-[9px] text-[#6E746F] mt-1 truncate">{unpaidBills.length} kamar belum setor</p>
            </div>
          </section>

          {/* Graphical Cashflow trend visuals using HTML SVGs */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* SVG Interactive Line chart for monthly incomes */}
            <div className="bg-white rounded-[32px] p-5 shadow-sm lg:col-span-8 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#171A18] tracking-tight">Grafik Pertumbuhan Kas</h4>
                <p className="text-xs text-[#6E746F] mt-1">Tren penerimaan bersih lunas.</p>
              </div>

              {/* Pure SVG Line Plot */}
              <div className="w-full bg-white border border-[rgba(23,59,48,0.06)] rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] text-[#6E746F]">
                  <span className="font-semibold">Max: {formatIDR(maxValue)}</span>
                  <div className="flex flex-wrap gap-2.5">
                    <span className="flex items-center gap-1 font-semibold"><span className="h-2 w-2 rounded-full bg-[#173B30]"></span>Pendapatan</span>
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

                      {/* Income Line */}
                      <path
                        d={incomePath}
                        stroke="#0d9488"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {trend.map((d, i) => (
                        <circle key={`inc-${i}`} cx={toSvgX(i)} cy={toSvgY(d.income)} r="5" fill="#ffffff" stroke="#0d9488" strokeWidth="3" />
                      ))}

                      {/* Expense Line */}
                      <path
                        d={expensePath}
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {trend.map((d, i) => (
                        <circle key={`exp-${i}`} cx={toSvgX(i)} cy={toSvgY(d.expense)} r="4" fill="#ffffff" stroke="#f43f5e" strokeWidth="2.5" />
                      ))}
                    </svg>
                  </div>
                </div>

                <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-[#6E746F] border-t border-[rgba(23,59,48,0.06)] pt-2.5 font-mono gap-1">
                  {trend.map((d, i) => (
                    <span key={i} className="flex-1 text-center truncate">{d.name}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Side summary: unpaid list */}
            <div className="bg-white rounded-[32px] p-5 shadow-sm lg:col-span-4 space-y-4">
              <h4 className="text-sm font-bold text-[#171A18] tracking-tight">
                Rasio Realisasi
              </h4>

              <div className="space-y-4">
                <div className="p-3 border border-[rgba(23,59,48,0.06)] bg-white/50 rounded-xl text-[10px] sm:text-[11px] font-semibold text-[#6E746F] block leading-relaxed space-y-1 font-sans">
                  <p className="font-extrabold text-[#171A18] text-xs">Pencapaian Cashflow:</p>
                  <p className="flex justify-between"><span>Lunas Penuh (Realisasi):</span> <span className="text-[#0f2720] font-extrabold">{formatIDR(totalRevenue)}</span></p>
                  <p className="flex justify-between"><span>Tunggakan Outstanding:</span> <span className="text-rose-600 font-extrabold">{formatIDR(outstandingAmount)}</span></p>
                  <p className="flex justify-between pt-1 border-t border-[rgba(23,59,48,0.15)] font-bold"><span>Target Kas Maksimal:</span> <span className="text-[#171A18] font-black">{formatIDR(totalRevenue + outstandingAmount)}</span></p>
                </div>

                {/* Progress bar ratio */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-extrabold">
                    <span className="text-[#6E746F]">Kolektabilitas Selesai:</span>
                    <span className="text-[#0f2720] font-mono">
                      {( (totalRevenue + outstandingAmount) > 0 ? (totalRevenue / (totalRevenue + outstandingAmount)) * 100 : 0 ).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#FBF9F5] h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${( (totalRevenue + outstandingAmount) > 0 ? (totalRevenue / (totalRevenue + outstandingAmount)) * 100 : 0 )}%` }}
                      className="bg-[#173B30] h-full rounded-full transition-all duration-500 ease-out"
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
          <div className="bg-white rounded-[32px] p-5 shadow-sm text-center space-y-4 mx-auto w-full">
            <h4 className="text-sm font-bold text-[#171A18] tracking-tight text-left border-b border-zinc-100 pb-2">Tingkat Hunian</h4>

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
                <p className="text-3xl sm:text-4xl font-extrabold text-[#171A18] tracking-tighter font-mono">{occupancyRate.toFixed(0)}%</p>
                <p className="text-[9px] sm:text-[10px] text-[#6E746F] font-bold uppercase mt-0.5">Hunian Aktif</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-2 text-[10px] sm:text-[11px] font-semibold text-[#6E746F]">
              <div className="p-1 px-1.5 border border-[rgba(23,59,48,0.06)] bg-white/55 rounded-xl overflow-hidden leading-tight">
                <span className="text-[#6E746F] block text-[8px] xs:text-[9px] tracking-wider font-extrabold">TERISI</span>
                <span className="font-extrabold text-[#0f2720] text-[10px] sm:text-xs block truncate mt-0.5">
                  {roomStatusCounts.terisi} Kamar
                </span>
              </div>
              <div className="p-1 px-1.5 border border-[rgba(23,59,48,0.06)] bg-white/55 rounded-xl overflow-hidden leading-tight">
                <span className="text-[#6E746F] block text-[8px] xs:text-[9px] tracking-wider font-extrabold">KOSONG</span>
                <span className="font-extrabold text-[#6E746F] text-[10px] sm:text-xs block truncate mt-0.5">
                  {roomStatusCounts.kosong} Kamar
                </span>
              </div>
              <div className="p-1 px-1.5 border border-[rgba(23,59,48,0.06)] bg-white/55 rounded-xl overflow-hidden leading-tight">
                <span className="text-[#6E746F] block text-[8px] xs:text-[9px] tracking-wider font-extrabold">PERBAIKAN</span>
                <span className="font-extrabold text-orange-700 text-[10px] sm:text-xs block truncate mt-0.5">
                  {roomStatusCounts.perbaikan} Kamar
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#171A18] tracking-tight border-b border-zinc-100 pb-2">Status Pembukuan Kamar</h4>

            <div className="space-y-4">
              <p className="text-[11px] sm:text-xs text-[#6E746F] leading-relaxed font-semibold">
                Berikut adalah denda/tunggakan per-kamar penyewa untuk {filterMode === 'month' ? `bulan ${selectedMonth}` : 'periode kustom terpilih'}. Ingat untuk mengirim template WhatsApp pengingat secepatnya jika diperlukan.
              </p>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[rgba(23,59,48,0.15)]">
                {unpaidBills.map((b) => (
                  <div key={b.id} className="p-3 border border-[rgba(23,59,48,0.06)] rounded-xl bg-white/40 flex justify-between items-center text-xs font-semibold hover:bg-white transition-colors">
                    <div className="min-w-0 mr-2">
                      <p className="font-bold text-[#171A18] truncate">Kamar {b.roomNumber} - {b.tenantName}</p>
                      <p className="text-[9px] text-[#6E746F] font-semibold font-mono mt-0.5 font-sans">Metode: {b.paymentMethod || 'Manual'} ({b.status})</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-rose-600 font-extrabold">{formatIDR(b.remaining)}</p>
                      <p className="text-[9px] text-[#6E746F] font-semibold">Tunggakan</p>
                    </div>
                  </div>
                ))}

                {unpaidBills.length === 0 && (
                  <div className="text-center py-8 text-[#6E746F]">
                    <CheckCircle weight="duotone" className="h-8 w-8 text-[#173B30] mx-auto mb-2 animate-bounce" />
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
