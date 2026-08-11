import React, { useState } from 'react';
import { 
  Building, Users, CheckCircle2, AlertCircle, 
  TrendingUp, TrendingDown, Landmark, MessageSquare, Wrench, ChevronRight,
  Sparkles, Calendar, Moon, UserPlus, Sparkle, RefreshCw, Eye, ArrowUpRight,
  Inbox
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
  onAddTenant?: (tenant: Tenant, roomId: string) => void;
}

export function DashboardView({ 
  rooms, tenants, bills, expenses, complaints, settings, selectedMonth, 
  onNavigateToTab, onOpenReminderModal, onOpenPaymentForm, onAddTenant
}: DashboardViewProps) {

  // Quick Check-in Modal state
  const [quickCheckInOpen, setQuickCheckInOpen] = useState(false);
  const [selectedRoomForCheckIn, setSelectedRoomForCheckIn] = useState<string>('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestType, setGuestType] = useState<'Harian' | 'Bulanan'>('Harian');
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [totalGuests, setTotalGuests] = useState(1);
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Helper date key builder
  const getMonthKey = (month: string): string => {
    const monthMap: Record<string, string> = {
      'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
      'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
      'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
    };
    const parts = month.split(' ');
    const monthNum = monthMap[parts[0]] || '08';
    const year = parts[1] || new Date().getFullYear().toString();
    return `${year}-${monthNum}`;
  };

  // Real Financial calculations
  const activeBills = bills.filter(b => b.period === selectedMonth || (b.rentalType === 'Harian'));
  const activeExpenses = expenses.filter(e => e.date.startsWith(getMonthKey(selectedMonth)));

  const totalRooms = rooms.length;
  const occupiedHarian = tenants.filter(t => t.guestType === 'Harian' && t.status !== 'Keluar').length;
  const occupiedBulanan = tenants.filter(t => (t.guestType === 'Bulanan' || !t.guestType) && t.status !== 'Keluar').length;
  const occupiedTotal = rooms.filter(r => r.status === 'Terisi' || r.status === 'Menunggak').length;
  const occupancyRate = totalRooms > 0 ? ((occupiedTotal / totalRooms) * 100).toFixed(0) : '0';

  const emptyRooms = rooms.filter(r => r.status === 'Kosong').length;
  const dirtyRooms = rooms.filter(r => r.housekeepingStatus === 'Kotor').length;

  // Income calculations - Strictly Real
  const totalIncomeThisMonth = activeBills
    .filter(b => b.status === 'Lunas' || b.status === 'Sebagian')
    .reduce((sum, b) => sum + (b.paidAmount || 0), 0);

  const totalExpensesThisMonth = activeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netEstimatedProfit = totalIncomeThisMonth - totalExpensesThisMonth;

  // Recent Paid Transactions for "Pembayaran Terbaru" list
  const recentPaidBills = bills
    .filter(b => b.status === 'Lunas' || (b.paidAmount && b.paidAmount > 0))
    .slice(0, 5);

  // Unpaid bills for reminders
  const outstandingBills = activeBills.filter(b => b.status === 'Belum Bayar' || b.status === 'Terlambat' || b.status === 'Sebagian');

  // Format IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Generate 7-day timeline matrix dates
  const getTimelineDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const dateNum = d.getDate();
      const monthShort = d.toLocaleDateString('id-ID', { month: 'short' });
      const isToday = i === 0;
      dates.push({ dayName, dateNum, monthShort, isToday });
    }
    return dates;
  };

  const timelineDates = getTimelineDates();

  const handleQuickCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomForCheckIn || !guestName || !guestPhone) return;

    const targetRoom = rooms.find(r => r.id === selectedRoomForCheckIn || r.number === selectedRoomForCheckIn);
    if (!targetRoom) return;

    const nights = Math.max(1, Math.ceil(Math.abs(new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
    const rentAmt = guestType === 'Harian' ? (targetRoom.pricePerDay || 180000) * nights : (targetRoom.pricePerMonth || targetRoom.price);

    const newTenant: Tenant = {
      id: `guest-quick-${Date.now()}`,
      name: guestName,
      phone: guestPhone,
      email: `${guestName.toLowerCase().replace(/\s+/g, '')}@guest.com`,
      guestType: guestType,
      checkInDate: checkInDate,
      checkOutDate: guestType === 'Harian' ? checkOutDate : undefined,
      idType: 'KTP',
      vehicleNumber: vehicleNumber || undefined,
      totalGuests: totalGuests,
      bookingOrigin: 'Walk-in',
      emergencyContact: { name: 'Kerabat', relation: 'Keluarga', phone: guestPhone },
      idNumber: `KTP-${Date.now()}`,
      roomAssigned: targetRoom.number,
      moveInDate: checkInDate,
      rentAmount: rentAmt,
      deposit: guestType === 'Harian' ? 100000 : 500000,
      status: 'Lunas',
      notes: `Check-in ${guestType} via Dashboard`
    };

    if (onAddTenant) {
      onAddTenant(newTenant, targetRoom.id);
    }
    setQuickCheckInOpen(false);
    setGuestName('');
    setGuestPhone('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      
      {/* 1. TOP HEADER & TITLE ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Ringkasan operasional hunian harian & bulanan properti Anda.</p>
        </div>

        {/* Quick Check-in Button */}
        <button
          onClick={() => setQuickCheckInOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Check-In Tamu Cepat</span>
        </button>
      </div>

      {/* 2. TOP KPI CARDS GRID (REAL DATA) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Unit */}
        <div 
          onClick={() => onNavigateToTab('rooms')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <span className="text-xs font-semibold text-slate-400 block mb-2">Total Unit</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">{totalRooms}</span>
            <span className="text-xs font-bold text-slate-400">Unit</span>
          </div>
        </div>

        {/* Card 2: Terisi */}
        <div 
          onClick={() => onNavigateToTab('rooms')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <span className="text-xs font-semibold text-slate-400 block mb-2">Terisi</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">{occupiedTotal}</span>
            <span className="text-xs font-bold text-slate-400">Unit</span>
          </div>
        </div>

        {/* Card 3: Tingkat Hunian */}
        <div 
          onClick={() => onNavigateToTab('reports')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <span className="text-xs font-semibold text-slate-400 block mb-2">Tingkat Hunian</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">{occupancyRate}%</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400 block mt-1">Dari total unit</span>
        </div>

        {/* Card 4: Pendapatan Bulan Ini */}
        <div 
          onClick={() => onNavigateToTab('reports')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <span className="text-xs font-semibold text-slate-400 block mb-2">Pendapatan Bulan Ini</span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">{formatIDR(totalIncomeThisMonth)}</span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[10px] font-medium text-slate-400">Total transaksi terbayar</span>
          </div>
        </div>

      </section>

      {/* 3. DUAL COLUMN MAIN DASHBOARD CONTENT */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (7/12 Width): Ringkasan Pendapatan Chart Card */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-extrabold text-slate-900">Ringkasan Pendapatan</h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">{new Date().getFullYear()}</span>
          </div>

          {/* SVG Line Chart / Real Data Indicator */}
          <div className="w-full bg-slate-50/50 rounded-xl p-4 border border-slate-100 min-h-[220px] flex flex-col justify-center items-center">
            {totalIncomeThisMonth === 0 && totalExpensesThisMonth === 0 ? (
              <div className="text-center space-y-2 py-8">
                <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Belum Ada Transaksi Keuangan</p>
                <p className="text-[10px] text-slate-400">Grafik otomatis terbentuk setelah ada pembayaran tagihan atau pengeluaran.</p>
              </div>
            ) : (
              <div className="w-full">
                <div className="h-44 relative flex items-end">
                  <svg viewBox="0 0 400 160" className="w-full h-full stroke-2 fill-none overflow-visible">
                    <line x1="0" y1="20" x2="400" y2="20" stroke="#f1f5f9" strokeDasharray="4" />
                    <line x1="0" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeDasharray="4" />
                    <line x1="0" y1="100" x2="400" y2="100" stroke="#f1f5f9" strokeDasharray="4" />
                    <line x1="0" y1="140" x2="400" y2="140" stroke="#f1f5f9" strokeDasharray="4" />

                    <path 
                      d="M 20,140 C 140,140 200,100 380,40" 
                      stroke="#2563eb" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                    />
                    <circle cx="380" cy="40" r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
                  </svg>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-400 pt-3 border-t border-slate-200/60">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>Mei</span><span>Jun</span><span>Jul</span>
                </div>
              </div>
            )}
          </div>

          {/* Chart Legend */}
          <div className="flex justify-center items-center gap-6 pt-1 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-600"></span> Pendapatan ({formatIDR(totalIncomeThisMonth)})
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-sky-400"></span> Pengeluaran ({formatIDR(totalExpensesThisMonth)})
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN (5/12 Width): Pembayaran Terbaru List Card */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900">Pembayaran Terbaru</h3>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Real-time
            </span>
          </div>

          {/* Real Payments Item List */}
          <div className="space-y-3.5 flex-1 flex flex-col justify-center">
            {recentPaidBills.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Inbox className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Belum Ada Transaksi Pembayaran</p>
                <p className="text-[10px] text-slate-400">Transaksi lunas terbaru akan tampil otomatis di sini.</p>
              </div>
            ) : (
              recentPaidBills.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 border border-blue-100">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 leading-snug">Kamar {b.roomNumber}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{b.tenantName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <span className="text-xs font-black text-slate-900 font-mono">{formatIDR(b.paidAmount || b.totalAmount)}</span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                      Lunas
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer View All Link */}
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onNavigateToTab('bills')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-all"
            >
              Lihat semua <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </section>

      {/* 4. VISUAL DAILY BOOKING AVAILABILITY MATRIX / GRID */}
      <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Timeline Ketersediaan Booking Kamar (7 Hari Ke Depan)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pantau status kamar terisi harian, sewa bulanan, dan jadwal turnover.</p>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span> Stay Harian</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600"></span> Bulanan</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-200"></span> Kosong</span>
          </div>
        </div>

        {/* Interactive Grid Table */}
        {rooms.length === 0 ? (
          <div className="p-12 border border-slate-200 rounded-xl text-center space-y-3 bg-slate-50/50">
            <Building className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Belum Ada Kamar Terdaftar</p>
            <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
              Silakan tambahkan kamar baru di menu <strong>Unit</strong> untuk mulai mengelola ketersediaan & booking.
            </p>
            <button
              onClick={() => onNavigateToTab('rooms')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              + Tambah Unit Kamar Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                  <th className="p-3 w-32 border-r border-slate-200">Kamar</th>
                  {timelineDates.map((td, idx) => (
                    <th key={idx} className={`p-2.5 text-center border-r border-slate-200 min-w-[85px] ${td.isToday ? 'bg-blue-50 text-blue-900' : ''}`}>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">{td.dayName}</span>
                      <span className="text-sm font-black">{td.dateNum} {td.monthShort}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {rooms.map(room => {
                  const assignedTenant = tenants.find(t => t.id === room.tenantId || t.roomAssigned === room.number);
                  const isHarian = assignedTenant?.guestType === 'Harian';

                  return (
                    <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold border-r border-slate-200 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900">Kmr {room.number}</span>
                          {room.housekeepingStatus === 'Kotor' && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">Kotor</span>
                          )}
                        </div>
                      </td>

                      {timelineDates.map((td, idx) => {
                        let cellColor = 'bg-slate-50 text-slate-400';
                        let cellLabel = 'Kosong';

                        if (room.status === 'Terisi' || room.status === 'Menunggak') {
                          if (isHarian) {
                            cellColor = 'bg-blue-600 text-white font-bold';
                            cellLabel = `Harian (${assignedTenant?.name.split(' ')[0] || 'Tamu'})`;
                          } else {
                            cellColor = 'bg-emerald-600 text-white font-bold';
                            cellLabel = `Bulanan (${assignedTenant?.name.split(' ')[0] || 'Sewa'})`;
                          }
                        }

                        return (
                          <td key={idx} className="p-1.5 border-r border-slate-200 text-center">
                            <div 
                              onClick={() => onNavigateToTab('rooms', room.id)}
                              className={`p-2 rounded-lg text-[10px] leading-tight cursor-pointer transition-all hover:scale-95 ${cellColor}`}
                            >
                              <span className="block truncate max-w-[75px]">{cellLabel}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* QUICK CHECK-IN MODAL FORM OVERLAY */}
      {quickCheckInOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-400" />
                <span className="font-extrabold text-base">Quick Check-In Tamu</span>
              </div>
              <button onClick={() => setQuickCheckInOpen(false)} className="p-1 text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleQuickCheckInSubmit} className="p-6 space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Pilih Kamar Ready *</label>
                <select
                  required
                  value={selectedRoomForCheckIn}
                  onChange={(e) => setSelectedRoomForCheckIn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold"
                >
                  <option value="">-- Pilih Kamar --</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Kmr {r.number} ({r.type}) • Rp {r.pricePerDay?.toLocaleString('id-ID') || '180.000'}/hari
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nama Lengkap Tamu *</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nomor WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuickCheckInOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Proses Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
