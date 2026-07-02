import React, { useState } from 'react';
import { TrendingDown, Plus, Search, Calendar, Landmark, DollarSign, Filter, Trash2, X, AlertTriangle, ArrowUpRight, BarChart3 } from 'lucide-react';
import { Expense, ExpenseCategory } from '../types';

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
  const [expDate, setExpDate] = useState('2026-06-01');
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
      case 'Internet': return { val: '🌐', color: 'bg-blue-100 text-blue-800' };
      case 'Kebersihan': return { val: '🧹', color: 'bg-emerald-100 text-emerald-800' };
      case 'Perbaikan': return { val: '🛠️', color: 'bg-orange-100 text-orange-850' };
      case 'Keamanan': return { val: '🛡️', color: 'bg-rose-100 text-rose-800' };
      case 'Perabot': return { val: '🛏️', color: 'bg-slate-150 text-slate-800' };
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
      id: `expense-${Date.now()}`,
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

  // Extract monthly key (e.g., "6" or "5") for current month filter
  const monthKey = selectedMonth === 'Juni 2026' ? '2026-06' : selectedMonth === 'Mei 2026' ? '2026-05' : '2026-07';

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
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total Bulan Ini */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 flex justify-between items-center hover:border-slate-300 transition-all">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Total Pengeluaran Bulan Ini</span>
            <h3 className="text-xl font-extrabold text-rose-600 font-mono mt-1">{formatIDR(totalThisMonth)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Operasional tercatat pada {selectedMonth}</p>
          </div>
          <span className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><TrendingDown className="h-6 w-6" /></span>
        </div>

        {/* Metric 2: Category Pengeluaran Tertinggi */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Alokasi Biaya Tertinggi</span>
            <h4 className="text-base font-extrabold text-slate-900 mt-1">
              {highestSpendingCategory} ({formatIDR(highestSpendingValue)})
            </h4>
            <p className="text-[9px] text-slate-400 mt-1">Tipe pembiayaan paling dominan diserap</p>
          </div>
          <span className="p-3 bg-amber-50 text-amber-700 rounded-2xl"><BarChart3 className="h-6 w-6" /></span>
        </div>

        {/* Metric 3: Rekomedasi efisiensi */}
        <div className="bg-slate-900 text-teal-100 p-5 rounded-3xl relative overflow-hidden">
          <span className="absolute right-[-10px] top-[-10px] text-white opacity-5 text-6xl font-black">💡</span>
          <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">Tips Efisensi Kostos</span>
          <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed font-medium">
            Service AC secara berkala {selectedMonth} terbukti mengurangi beban tagihan listrik token kost hingga 15%.
          </p>
        </div>
      </section>

      {/* 2. DUAL COLUMN DETAILS AND TRANSACTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8/12 length): Expenses tables listing */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Listing Header Controls */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Cari rincian pengeluaran..."
                className="w-full bg-white text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 transition-all font-semibold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Quick Filter Category Select dropdown */}
            <select
              className="px-3.5 py-2 bg-white text-xs text-slate-700 font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="Semua">Semua Kategori</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <button
              onClick={() => setShowAddForm(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" /> Catat Pengeluaran
            </button>
          </div>

          {/* List display */}
          {filteredExpenses.length === 0 ? (
            <div id="expenses-empty-state" className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-4xl">🧾</span>
              <h3 className="text-sm font-black text-slate-700 mt-3">Sirkulasi Kas Bersih</h3>
              <p className="text-[10px] text-slate-400 mt-1 mb-5">
                Belum ada pengeluaran dicatatkan untuk filter kategori "{selectedCategoryFilter}" atau pencarian "{searchQuery}" pada periode {selectedMonth}.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryFilter('Semua');
                }}
                className="py-1.5 px-4 bg-teal-600 text-white font-bold text-[10px] rounded-lg cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((exp) => {
                const uiTheme = getCategoryTheme(exp.category);
                return (
                  <div key={exp.id} className="p-4 border border-slate-200 bg-white rounded-2xl flex justify-between items-center transition-all hover:border-slate-350">
                    <div className="flex items-center gap-3">
                      <span className={`h-11 w-11 rounded-full flex items-center justify-center text-lg ${uiTheme.color}`}>
                        {uiTheme.val}
                      </span>
                      <div>
                        <p className="font-extrabold text-xs text-slate-900">{exp.description}</p>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase">{exp.category} • {exp.date}</p>
                        {exp.notes && (
                          <p className="text-[9px] text-slate-500 font-serif italic mt-0.5">“{exp.notes}”</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="font-black text-red-600 text-xs font-mono">-{formatIDR(exp.amount)}</p>
                        <span className="text-[9px] font-bold text-slate-400">Kas Keluar</span>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Apakah Anda yakin ingin menghapus catatan pengeluaran "${exp.description}"?`)) {
                            onDeleteExpense(exp.id);
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                        title="Hapus Pengeluaran"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Right Column (4/12 length): Category breakdown breakdown values */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <h4 className="text-xs font-extrabold text-slate-900 tracking-tight border-b border-slate-100 pb-2">Distribusi Operasional - {selectedMonth}</h4>
          
          <div className="space-y-2.5">
            {ALL_CATEGORIES.map((cat) => {
              const categoryTotal = categorySpendingSums[cat] || 0;
              const ratio = totalThisMonth > 0 ? (categoryTotal / totalThisMonth) * 100 : 0;
              const theme = getCategoryTheme(cat);
              return (
                <div key={cat} className="space-y-1 text-[11px] font-semibold text-slate-700">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span>{theme.val}</span>
                      <span>{cat}</span>
                    </span>
                    <span className="font-mono text-xs">{formatIDR(categoryTotal)} ({ratio.toFixed(0)}%)</span>
                  </div>
                  {/* CSS Bar ratios */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${ratio}%` }} 
                      className={`h-full rounded-full ${
                        cat === 'Listrik' ? 'bg-amber-400' : cat === 'Air' ? 'bg-indigo-400' : 'bg-teal-500'
                      }`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 p-2 text-[10px] text-slate-400 italic">
            * Kategori Listrik & AC mendominasi 72% dari total pengeluran kost di Indonesia secara global (Survey Kostos 2026).
          </div>
        </div>

      </div>

      {/* 3. ADD OPERATIONAL TRANSACTION DIALOG FORM MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-300 shadow-2xl overflow-hidden">
            
            <div className="p-5 bg-slate-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-rose-400" />
                <span className="font-extrabold text-base">Catat Pengeluaran Baru</span>
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
                <label className="text-[10px] font-extrabold text-slate-500 block">KATEGORI TRANSAKSI *</label>
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
                          isSelected ? 'border-2 border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
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
                <label className="text-[10px] font-extrabold text-slate-500 block">DESKRIPSI OPERASIONAL *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli AC baru Kamar A04, Iuran sampah rukun warga..."
                  className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 block">NILAI PENGELUARAN (IDR) *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    required
                    title="Jumlah Pengeluaran"
                    className="w-full bg-slate-50 pl-10 pr-3 py-2.5 font-extrabold text-slate-800 border border-slate-200 rounded-xl focus:outline-none"
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 block">TANGGAL TRANSAKSI</label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl text-slate-800"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 block">CATATAN KHUSUS (OPSIONAL)</label>
                <textarea
                  className="w-full bg-slate-50 text-xs p-2.5 border border-slate-200 rounded-xl text-slate-800"
                  rows={2}
                  placeholder="Beli di Toko Sinar Terang Dago, garansi AC 1 tahun..."
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl font-bold cursor-pointer hover:bg-slate-100"
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
