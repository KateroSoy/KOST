import React from 'react';
import { Buildings, Users, CheckCircle, WarningCircle, TrendUp, Receipt, ChatTeardropText, Wrench, CaretRight, CalendarBlank, ArrowUpRight, Clock, Check, Plus, ArrowRight, MapPin, House, CaretDown, Sparkle, HouseLine, Receipt as PhosphorReceipt, Wrench as PhosphorWrench } from '@phosphor-icons/react';
import { Room, Tenant, Bill, Complaint, Expense, KostSettings, Booking, OperationTask, Property } from '../types';

interface DashboardViewProps {
  rooms: Room[];
  tenants: Tenant[];
  bills: Bill[];
  expenses: Expense[];
  complaints: Complaint[];
  bookings?: Booking[];
  operationTasks?: OperationTask[];
  settings: KostSettings;
  selectedMonth: string;
  onNavigateToTab: (tab: string, arg?: string) => void;
  onOpenReminderModal: (bill: Bill) => void;
  onOpenPaymentForm: (bill: Bill) => void;
  onAddTenant?: (tenant: Tenant, roomId: string) => void;
  activeProperty?: Property;
  properties?: Property[];
}

export function DashboardView({ 
  rooms, tenants, bills, expenses, complaints, bookings = [], operationTasks = [],
  settings, selectedMonth, onNavigateToTab, onOpenReminderModal, onOpenPaymentForm,
  activeProperty, properties = []
}: DashboardViewProps) {

  // Occupancy metrics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'Terisi').length;
  const availableRooms = rooms.filter(r => r.status === 'Kosong').length;
  const bookedRooms = rooms.filter(r => r.status === 'Booking').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Revenue metrics
  const totalPaidRevenue = bills.filter(b => b.status === 'Lunas').reduce((acc, b) => acc + (b.paidAmount || b.totalAmount), 0);
  const totalOutstanding = bills.filter(b => b.status === 'Belum Bayar' || b.status === 'Terlambat').reduce((acc, b) => acc + (b.totalAmount - (b.paidAmount || 0)), 0);

  // Outstanding bills list
  const pendingBills = bills.filter(b => b.status === 'Belum Bayar' || b.status === 'Terlambat');

  // Pending bookings
  const pendingBookings = bookings.filter(b => b.status === 'Pending' || b.status === 'Inquiry');

  // Open maintenance / operation tasks
  const openTasks = operationTasks.filter(t => t.status !== 'Completed');

  const occupancyBars = [{ month: 'Saat ini', rate: occupancyRate, label: `${occupancyRate}%`, current: true }];

  // Selected property fallback
  const currentProperty = activeProperty || properties[0] || {
    id: 'prop-1',
    name: settings.kostName || 'LuxeApart Living',
    city: 'Jakarta Selatan',
    address: 'Jl. Kemang Raya No. 45, Jakarta Selatan',
    type: 'Coliving Premium',
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80']
  };

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-300">
      
      {/* ─────────────────────────────────────────────────────────────
          1. PROPERTY HERO SHOWCASE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden transition-all">
        <div className="relative h-44 sm:h-52 w-full overflow-hidden">
          <img 
            src={currentProperty.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80'} 
            alt={currentProperty.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          
          {/* Top floating badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="bg-white/90 backdrop-blur-md text-[#173B30] text-[10px] font-extrabold px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {currentProperty.type || 'Hunian Aktif'}
            </span>
            <button 
              onClick={() => onNavigateToTab('website')}
              className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Website</span>
              <ArrowUpRight weight="duotone" className="h-3 w-3" />
            </button>
          </div>

          {/* Bottom text inside hero image */}
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <h2 className="text-xl sm:text-2xl font-bold font-editorial tracking-tight drop-shadow-sm">
              {currentProperty.name}
            </h2>
            <p className="text-xs text-white/85 flex items-center gap-1.5 mt-0.5 font-medium">
              <MapPin weight="duotone" className="h-3.5 w-3.5 text-amber-300 shrink-0" />
              <span className="truncate">{currentProperty.address || 'Jakarta'}</span>
            </p>
          </div>
        </div>

        {/* Quick Strip info below hero */}
        <div className="px-5 py-4 bg-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-[#6E746F] block font-medium uppercase tracking-wider mb-0.5">Status Hunian</span>
              <span className="font-bold text-[#173B30] text-sm">{occupancyRate}% Terisi</span>
            </div>
            <div className="h-8 w-px bg-zinc-100" />
            <div>
              <span className="text-[10px] text-[#6E746F] block font-medium uppercase tracking-wider mb-0.5">Kamar Kosong</span>
              <span className="font-bold text-emerald-700 text-sm">{availableRooms} Siap Huni</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('rooms')}
            className="h-10 w-10 rounded-full bg-[#FBF9F5] flex items-center justify-center text-[#173B30] hover:bg-[#E5DCC5] transition-colors cursor-pointer"
          >
            
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. PROPERTY SUMMARY (2x2 CARD GRID)
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg font-bold text-[#171A18] font-editorial tracking-tight">
            Ringkasan
          </h3>
          <span className="text-[11px] text-[#6E746F] font-medium bg-white px-3 py-1 rounded-full shadow-sm">
            Hari ini
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          
          {/* Card 1: Properties / Units */}
          <div 
            onClick={() => onNavigateToTab('rooms')}
            className="bg-white p-5 rounded-[28px] shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] flex flex-col justify-between"
          >
            <div className="h-10 w-10 rounded-[18px] bg-[#F5F1E8] text-[#173B30] flex items-center justify-center mb-4">
              <Buildings weight="duotone" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#6E746F] font-medium uppercase tracking-wider mb-1">Total Unit</p>
              <p className="text-3xl font-extrabold text-[#171A18] leading-none">
                {totalRooms < 10 ? `0${totalRooms}` : totalRooms}
              </p>
            </div>
          </div>

          {/* Card 2: Occupied */}
          <div 
            onClick={() => onNavigateToTab('rooms')}
            className="bg-white p-5 rounded-[28px] shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] flex flex-col justify-between"
          >
            <div className="h-10 w-10 rounded-[18px] bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
              <HouseLine weight="duotone" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#6E746F] font-medium uppercase tracking-wider mb-1">Terisi</p>
              <p className="text-3xl font-extrabold text-[#173B30] leading-none">
                {occupiedRooms}<span className="text-base text-[#A8B7A1]">/{totalRooms}</span>
              </p>
            </div>
          </div>

          {/* Card 3: Rent Collected */}
          <div 
            onClick={() => onNavigateToTab('payments')}
            className="bg-white p-5 rounded-[28px] shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] flex flex-col justify-between"
          >
            <div className="h-10 w-10 rounded-[18px] bg-teal-50 text-teal-800 flex items-center justify-center mb-4">
              <PhosphorReceipt weight="duotone" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#6E746F] font-medium uppercase tracking-wider mb-1">Pemasukan</p>
              <p className="text-xl font-extrabold text-[#173B30] truncate leading-none">
                Rp {(totalPaidRevenue / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>

          {/* Card 4: Maintenance & Due Bills */}
          <div 
            onClick={() => onNavigateToTab(pendingBills.length > 0 ? 'payments' : 'operations')}
            className="bg-white p-5 rounded-[28px] shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] flex flex-col justify-between"
          >
            <div className="h-10 w-10 rounded-[18px] bg-rose-50 text-rose-700 flex items-center justify-center mb-4">
              <PhosphorWrench weight="duotone" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#6E746F] font-medium uppercase tracking-wider mb-1">Perlu Aksi</p>
              <p className="text-3xl font-extrabold text-amber-700 leading-none">
                {(pendingBills.length + openTasks.length) < 10 ? `0${pendingBills.length + openTasks.length}` : pendingBills.length + openTasks.length}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. OCCUPANCY RATES VISUAL CHART (Matches Screen 1 of Reference!)
          Modern bar chart with gradient bars and monthly toggle
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[rgba(23,59,48,0.08)] p-5 shadow-xs transition-all">
        
        {/* Chart Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-[#171A18] font-editorial">
              Keterisian Saat Ini
            </h3>
            <p className="text-[11px] text-[#6E746F]">Berdasarkan status kamar yang tersimpan</p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F5F1E8] px-2.5 py-1 rounded-full text-[11px] font-bold text-[#173B30]">
            <span>Saat ini</span>
            <CaretDown weight="duotone" className="h-3 w-3 text-[#6E746F]" />
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="flex items-end justify-between gap-2 sm:gap-4 h-40 pt-4 px-2">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between h-full text-[10px] text-[#A8B7A1] font-mono pr-2 py-1 select-none">
            <span>100%</span>
            <span>70%</span>
            <span>50%</span>
            <span>10%</span>
          </div>

          {/* Vertical Bars */}
          <div className="flex-1 flex items-end justify-around h-full gap-2 border-b border-[rgba(23,59,48,0.08)] pb-1">
            {occupancyBars.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                
                {/* Tooltip on hover/active */}
                <span className="text-[10px] font-bold text-[#173B30] opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.label}
                </span>

                {/* Vertical Bar Capsule */}
                <div className="w-full max-w-[36px] bg-zinc-100 rounded-t-2xl overflow-hidden flex flex-col justify-end h-28">
                  <div 
                    className={`w-full rounded-t-2xl transition-all duration-500 ${
                      item.current 
                        ? 'bg-gradient-to-t from-[#173B30] to-[#315A49] shadow-sm shadow-emerald-950/20' 
                        : 'bg-gradient-to-t from-[#B89A68] to-[#D8CEB8] opacity-80 group-hover:opacity-100'
                    }`}
                    style={{ height: `${item.rate}%` }}
                  />
                </div>

                {/* Month label */}
                <span className={`text-[11px] font-semibold ${item.current ? 'text-[#173B30] font-bold' : 'text-[#6E746F]'}`}>
                  {item.month}
                </span>

              </div>
            ))}
          </div>
        </div>

        {/* Chart Footer Link */}
        <div className="mt-4 pt-3 border-t border-[rgba(23,59,48,0.06)] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#6E746F]">Keterisian saat ini: <strong className="text-[#173B30]">{occupancyRate}%</strong></span>
          <button
            onClick={() => onNavigateToTab('rooms')}
            className="font-bold text-[#173B30] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua Unit</span>
            
          </button>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. LIST OF UNITS (HORIZONTAL SCROLL)
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <div>
            <h3 className="text-lg font-bold text-[#171A18] font-editorial tracking-tight">
              Unit Kamar
            </h3>
          </div>
        </div>

        {/* Horizontal Scrollable Unit Cards */}
        <div className="flex gap-4 overflow-x-auto pb-4 px-2 -mx-2 hide-scrollbar snap-x">
          {rooms.slice(0, 8).map((room) => {
            const isOccupied = room.status === 'Terisi';
            const isBooked = room.status === 'Booking';
            
            return (
              <div
                key={room.id}
                onClick={() => onNavigateToTab('rooms', room.id)}
                className="snap-start shrink-0 w-36 bg-white p-4 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-95"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-base text-[#171A18] group-hover:text-[#173B30] transition-colors">
                    {room.number}
                  </span>
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    isOccupied 
                      ? 'bg-zinc-400' 
                      : isBooked 
                      ? 'bg-amber-400' 
                      : 'bg-emerald-400'
                  }`} />
                </div>
                
                <p className="text-xs text-[#6E746F] truncate">{room.type}</p>
                <p className="text-sm font-bold text-[#173B30] mt-1.5">
                  Rp {((room.pricePerMonth || room.price || 0) / 1000000).toFixed(1)}<span className="text-[10px] font-medium text-[#6E746F]">jt/bln</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. RECENT ACTIVITY
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg font-bold text-[#171A18] font-editorial tracking-tight">
            Aktivitas
          </h3>
          <button
            onClick={() => onNavigateToTab('bookings')}
            className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#171A18] shadow-sm cursor-pointer"
          >
            
          </button>
        </div>

        <div className="space-y-3">
          {pendingBookings.length === 0 && pendingBills.length === 0 && (
            <p className="rounded-2xl bg-white p-4 text-sm text-[#6E746F]">Belum ada booking atau tagihan yang perlu ditindaklanjuti.</p>
          )}
          
          {/* Item 1: Pending Bookings */}
          {pendingBookings.slice(0, 2).map((b) => (
            <div 
              key={b.id}
              onClick={() => onNavigateToTab('bookings')}
              className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-between gap-3 hover:bg-zinc-50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 rounded-[20px] bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                  <CalendarBlank weight="duotone" className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#171A18] truncate">{b.guestName}</p>
                  <p className="text-xs text-[#6E746F] truncate mt-0.5">
                    Kamar {b.roomNumber || b.roomType}
                  </p>
                </div>
              </div>

              <div className="h-10 w-10 rounded-full bg-[#F5F1E8] flex items-center justify-center shrink-0">
                <ArrowUpRight weight="duotone" className="h-4 w-4 text-[#173B30]" />
              </div>
            </div>
          ))}

          {/* Item 2: Outstanding Bills */}
          {pendingBills.slice(0, 2).map((bill) => (
            <div 
              key={bill.id}
              className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-between gap-3 hover:bg-zinc-50 transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 rounded-[20px] bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                  <Receipt className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#171A18] truncate">{bill.tenantName}</p>
                  <p className="text-xs text-amber-700 truncate mt-0.5">
                    Rp {bill.totalAmount.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onOpenReminderModal(bill)}
                className="h-10 w-10 rounded-full bg-[#F5F1E8] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <ChatTeardropText weight="duotone" className="h-4 w-4 text-emerald-800" />
              </button>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
}
