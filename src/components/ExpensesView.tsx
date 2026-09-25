import React, { useState } from 'react';
import { TrendDown, Plus, MagnifyingGlass, CalendarBlank, Bank, CurrencyDollar, Faders, Trash, X, Warning, ArrowUpRight, ChartBar } from '@phosphor-icons/react';
import { Expense, ExpenseCategory } from '../types';
import { generateId } from '../utils';

interface ExpensesViewProps {
  expenses: Expense[];
  onAddExpense: (newExpense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  selectedMonth: string;
}

export function ExpensesView({ expenses, onAddExpense, onDeleteExpense, selectedMonth }: ExpensesViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Semua');

  // Add Expense form state
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Listrik');
  const [expDesc, setExpDesc] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expAmount, setExpAmount] = useState(150000);
  const [expNotes, setExpNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Sorter / categories lists
  const ALL_CATEGORIES: ExpenseCategory[] = ['Listrik', 'Air', 'Internet', 'Kebersihan', 'Perbaikan', 'Keamanan', 'Perabot', 'Lainnya'];

  // Helper mapping category elements to emojis
  const getCategoryTheme = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'Listrik': return { val: '⚡', color: 'bg-amber-100 text-amber-800' };
      case 'Air': return { val: '💧', color: 'bg-indigo-100 text-indigo-800' };
      case 'Internet': return { val: '🌐', color: 'bg-[#E5DCC5] text-blue-800' };
      case 'Kebersihan': return { val: '🧹', color: 'bg-emerald-100 text-emerald-800' };
      case 'Perbaikan': return { val: '🛠️', color: 'bg-orange-100 text-orange-850' };
      case 'Keamanan': return { val: '🛡️', color: 'bg-rose-100 text-rose-800' };
      case 'Perabot': return { val: '🛏️', color: 'bg-[#E5DCC5] text-[#171A18]' };
      default: return { val: '✏️', color: 'bg-purple-100 text-purple-800' };
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc || expAmount <= 0) {
      setFormError('Deskripsi transaksi dan jumlah pengeluaran di atas Rp 0 wajib diisi!');
      return;
    }

    const newExpense: Expense = {
      id: generateId('expense'),
      category: expCategory,
      description: expDesc,
      date: expDate,
      amount: expAmount,
      notes: expNotes
    };

    onAddExpense(newExpense);

    // Reset States
    setExpDesc('');
    setExpCategory('Listrik');
    setExpAmount(150000);
    setExpDate(new Date().toISOString().slice(0, 10));
    setExpNotes('');
    setFormError('');
    setShowAddForm(false);
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Dynamic month key builder: "Juni 2026" -> "2026-06"
  const getMonthKey = (month: string): string => {
    const monthMap: Record<string, string> = {
      'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
      'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
      'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
    };
    const parts = month.split(' ');
    const monthNum = monthMap[parts[0]] || '06';
    const year = parts[1] || '2026';
    return `${year}-${monthNum}`;
  };
  const monthKey = getMonthKey(selectedMonth);

  // Filter local listings
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // We restrict active expenses shown in core list to the chosen Month in Header!
    const matchesPeriod = e.date.startsWith(monthKey);
    const matchesCategory = selectedCategoryFilter === 'Semua' ? true : e.category === selectedCategoryFilter;

    return matchesSearch && matchesPeriod && matchesCategory;
  });

  // Calculate high-level expense metrics
  const totalThisMonth = expenses
    .filter(e => e.date.startsWith(monthKey))
    .reduce((sum, e) => sum + e.amount, 0);

  // Highest spending category query
  const categorySpendingSums = ALL_CATEGORIES.reduce((acc, cat) => {
    const totalCat = expenses
      .filter(e => e.date.startsWith(monthKey) && e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
    acc[cat] = totalCat;
    return acc;
  }, {} as Record<string, number>);

  let highestSpendingCategory: string = 'Tidak Ada';
  let highestSpendingValue: number = 0;
  
  Object.entries(categorySpendingSums).forEach(([cat, val]) => {
    if (val > highestSpendingValue) {
      highestSpendingValue = val;
      highestSpendingCategory = cat;
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. SECTIONS HEADER STATS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
        {/* Metric 1: Total Bulan Ini */}
        <div className="bg-white p-6 rounded-[28px] shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-[#6E746F] uppercase tracking-wider">Total Pengeluaran</span>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-[#171A18]">{formatIDR(totalThisMonth)}</h3>
            <p className="text-xs text-[#6E746F] mt-1">{selectedMonth}</p>
          </div>
        </div>

        {/* Metric 2: Category Pengeluaran Tertinggi */}
        <div className="bg-white p-6 rounded-[28px] shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-[#6E746F] uppercase tracking-wider">Kategori Tertinggi</span>
          <div className="mt-4">
            <h4 className="text-xl font-black text-[#171A18] truncate">
              {highestSpendingCategory}
            </h4>
            <p className="text-xs text-[#6E746F] mt-1">{formatIDR(highestSpendingValue)}</p>
          </div>
        </div>

        {/* Metric 3: Add Button Shortcut */}
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="bg-[#173B30] p-6 rounded-[28px] shadow-sm flex flex-col justify-between items-center text-white cursor-pointer hover:bg-[#0f2720] transition-colors"
        >
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mb-2">
            
          </div>
          <span className="text-sm font-bold">Catat Pengeluaran</span>
        </button>
      </section>

      {/* 2. TRANSACTIONS & BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 space-y-4">
          
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <MagnifyingGlass weight="duotone" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E746F]" />
              <input
                type="text"
                placeholder="Cari pengeluaran..."
                className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl text-sm text-[#171A18] placeholder-[#6E746F] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#173B30] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
              {['Semua', ...ALL_CATEGORIES].map((cat) => {
                const isActive = selectedCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shadow-sm ${
                      isActive
                        ? 'bg-[#173B30] text-white shadow-md shadow-[#173b30]/20'
                        : 'bg-white text-[#6E746F] hover:text-[#171A18]'
                    }`}
                  >
                    {cat === 'Semua' ? 'Semua Kategori' : cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List display */}
          {filteredExpenses.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-[28px] shadow-sm">
              <span className="text-4xl block mb-2">🧾</span>
              <h3 className="text-sm font-bold text-[#171A18]">Belum Ada Catatan</h3>
              <p className="text-xs text-[#6E746F] mt-1 mb-4">
                Tidak ada data untuk periode {selectedMonth} dengan filter ini.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryFilter('Semua');
                }}
                className="py-2 px-4 bg-[#173B30] text-white font-bold text-xs rounded-xl"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((exp) => {
                const uiTheme = getCategoryTheme(exp.category);
                return (
                  <div key={exp.id} className="p-4 bg-white rounded-[28px] shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-4 overflow-hidden pr-2">
                      <span className={`shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center text-xl ${uiTheme.color}`}>
                        {uiTheme.val}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-base text-[#171A18] truncate">{exp.description}</p>
                        <p className="text-xs text-[#6E746F] font-medium mt-0.5 truncate">{exp.category} • {exp.date}</p>
                        {exp.notes && (
                          <p className="text-[10px] text-[#6E746F] italic mt-1 truncate">“{exp.notes}”</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-extrabold text-[#171A18] text-sm">{formatIDR(exp.amount)}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Apakah Anda yakin ingin menghapus catatan pengeluaran "${exp.description}"?`)) {
                            onDeleteExpense(exp.id);
                          }
                        }}
                        className="h-10 w-10 flex items-center justify-center text-[#A8B7A1] hover:text-rose-500 bg-[#F5F1E8] hover:bg-rose-50 rounded-full cursor-pointer transition-colors"
                      >
                        <Trash  weight="duotone" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Right Column: Category breakdown */}
        <div className="lg:col-span-4 bg-white rounded-[28px] p-6 space-y-6 shadow-sm self-start">
          <h4 className="text-sm font-bold text-[#171A18] tracking-tight">Distribusi Operasional</h4>
          
          <div className="space-y-4">
            {ALL_CATEGORIES.map((cat) => {
              const categoryTotal = categorySpendingSums[cat] || 0;
              const ratio = totalThisMonth > 0 ? (categoryTotal / totalThisMonth) * 100 : 0;
              const theme = getCategoryTheme(cat);
              if (categoryTotal === 0) return null;

              return (
                <div key={cat} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2 font-bold text-[#171A18]">
                      <span>{theme.val}</span>
                      <span>{cat}</span>
                    </span>
                    <span className="font-extrabold text-[#171A18]">{formatIDR(categoryTotal)}</span>
                  </div>
                  {/* CSS Bar ratios */}
                  <div className="w-full bg-[#F5F1E8] h-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${ratio}%` }} 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        cat === 'Listrik' ? 'bg-amber-400' : cat === 'Air' ? 'bg-indigo-400' : 'bg-[#173B30]'
                      }`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-[10px] text-[#6E746F] italic">
            * Kategori Listrik & AC mendominasi 72% dari total pengeluran kost di Indonesia.
          </div>
        </div>

      </div>

      {/* 3. ADD OPERATIONAL TRANSACTION DIALOG FORM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-[#173B30]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-[rgba(23,59,48,0.20)] shadow-2xl overflow-hidden">
            
            <div className="p-5 bg-[#171A18] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendDown className="h-5 w-5 text-rose-400" />
                <span className="font-extrabold text-base">Catat Pengeluaran Baru</span>
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
                <label className="text-[10px] font-extrabold text-[#6E746F] block">KATEGORI TRANSAKSI *</label>
                <div className="grid grid-cols-4 gap-1.5 font-bold">
                  {ALL_CATEGORIES.map((cat) => {
                    const isSelected = expCategory === cat;
                    const ui = getCategoryTheme(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setExpCategory(cat)}
                        className={`p-2 border rounded-xl flex flex-col justify-center items-center gap-1 cursor-pointer text-[10px] ${
                          isSelected ? 'border-2 border-rose-500 bg-rose-50 text-rose-900' : 'border-[rgba(23,59,48,0.15)] text-[#6E746F] bg-white hover:bg-white'
                        }`}
                      >
                        <span className="text-base">{ui.val}</span>
                        <span className="truncate w-full text-center text-[8px]">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#6E746F] block">DESKRIPSI OPERASIONAL *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli AC baru Kamar A04, Iuran sampah rukun warga..."
                  className="w-full bg-white text-xs p-2.5 border border-[rgba(23,59,48,0.15)] rounded-xl focus:outline-none"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#6E746F] block">NILAI PENGELUARAN (IDR) *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6E746F] font-bold">Rp</span>
                  <input
                    type="number"
                    required
                    title="Jumlah Pengeluaran"
                    className="w-full bg-white pl-10 pr-3 py-2.5 font-extrabold text-[#171A18] border border-[rgba(23,59,48,0.15)] rounded-xl focus:outline-none"
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#6E746F] block">TANGGAL TRANSAKSI</label>
                <input
                  type="date"
                  required
                  className="w-full bg-white text-xs p-2.5 border border-[rgba(23,59,48,0.15)] rounded-xl text-[#171A18]"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#6E746F] block">CATATAN KHUSUS (OPSIONAL)</label>
                <textarea
                  className="w-full bg-white text-xs p-2.5 border border-[rgba(23,59,48,0.15)] rounded-xl text-[#171A18]"
                  rows={2}
                  placeholder="Beli di Toko Sinar Terang Dago, garansi AC 1 tahun..."
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-[rgba(23,59,48,0.06)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-white text-[#6E746F] rounded-xl font-bold cursor-pointer hover:bg-[#FBF9F5]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-expense"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-sm"
                >
                  Simpan Catatan Keluar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
