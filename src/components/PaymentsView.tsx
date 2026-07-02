import React, { useState } from 'react';
import { Coins, CheckCircle, Receipt, User, ArrowRight, Share2, Clipboard, MessageSquare, Plus, Clock, Landmark, Smartphone, X } from 'lucide-react';
import { Bill, Tenant, Room } from '../types';

interface PaymentsViewProps {
  bills: Bill[];
  tenants: Tenant[];
  rooms: Room[];
  selectedBillForPayment: Bill | null;
  onClosePaymentForm: () => void;
  onRecordPayment: (billId: string, amountPaid: number, method: string, date: string, notes?: string) => void;
}

export function PaymentsView({
  bills, tenants, rooms, selectedBillForPayment, onClosePaymentForm, onRecordPayment
}: PaymentsViewProps) {
  
  // Unpaid bills helper to let user select ANY unpaid invoice freely
  const unpaidBills = bills.filter(b => b.status === 'Belum Bayar' || b.status === 'Terlambat' || b.status === 'Sebagian');

  // Master states
  const [activeBillSelection, setActiveBillSelection] = useState<Bill | null>(selectedBillForPayment);
  const [paymentAmount, setPaymentAmount] = useState<number>(selectedBillForPayment ? selectedBillForPayment.totalAmount - selectedBillForPayment.paidAmount : 0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Transfer Bank');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Controlling Success State Overlay
  const [successRecorded, setSuccessRecorded] = useState<boolean>(false);
  const [lastRecordedBill, setLastRecordedBill] = useState<Bill | null>(null);

  const handleActiveBillChange = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (bill) {
      setActiveBillSelection(bill);
      setPaymentAmount(bill.totalAmount - bill.paidAmount);
      setFormError('');
    } else {
      setActiveBillSelection(null);
      setPaymentAmount(0);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBillSelection) {
      setFormError('Silakan pilih salah satu tagihan yang belum lunas!');
      return;
    }
    if (paymentAmount <= 0) {
      setFormError('Jumlah pembayaran tidak murni / harus lebih besar dari Rp 0!');
      return;
    }

    const outstanding = activeBillSelection.totalAmount - activeBillSelection.paidAmount;
    if (paymentAmount > outstanding) {
      setFormError(`Jumlah pembayaran (Rp ${paymentAmount}) melebihi tunggakan sisa (Rp ${outstanding})!`);
      return;
    }

    // Call mutation in parent
    onRecordPayment(activeBillSelection.id, paymentAmount, paymentMethod, paymentDate, paymentNotes);
    
    // Save last state for showing success message!
    setLastRecordedBill({
      ...activeBillSelection,
      paidAmount: activeBillSelection.paidAmount + paymentAmount,
      status: (activeBillSelection.paidAmount + paymentAmount) >= activeBillSelection.totalAmount ? 'Lunas' : 'Sebagian',
      paymentMethod,
      paymentDate
    });

    setSuccessRecorded(true);
    setFormError('');
  };

  const handleResetForm = () => {
    setSuccessRecorded(false);
    setLastRecordedBill(null);
    setActiveBillSelection(null);
    setPaymentAmount(0);
    setPaymentNotes('');
    onClosePaymentForm();
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="max-w-xl mx-auto">
      
      {/* SUCCESS SCREEN CONFIRMATION */}
      {successRecorded && lastRecordedBill && (
        <section id="payment-success-screen" className="bg-white p-6 sm:p-8 border border-slate-200/80 rounded-3xl shadow-xl space-y-6 text-center animate-in zoom-in-95 duration-150">
          
          <div className="mx-auto h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border-4 border-emerald-100">
            <CheckCircle className="h-10 w-10 animate-bounce-once" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Pembayaran Berhasil Dicatat!</h3>
            <p className="text-xs text-slate-400">Kas masuk terupdate otomatis dan data kwitansi aman tersimpan.</p>
          </div>

          {/* Mini receipt detail */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-semibold text-slate-700 space-y-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-200/60 font-black">Informasi Setoran</p>
            <div className="flex justify-between">
              <span className="text-slate-400">Penyewa Kost:</span>
              <span className="text-slate-900 font-bold">{lastRecordedBill.tenantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Nomor Kamar:</span>
              <span className="text-teal-700 font-extrabold">Kamar {lastRecordedBill.roomNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Nilai Setoran:</span>
              <span className="text-slate-900 font-extrabold text-sm">{formatIDR(paymentAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cara Bayar / Tanggal:</span>
              <span className="text-slate-500 font-bold">{lastRecordedBill.paymentMethod} • {lastRecordedBill.paymentDate}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                const messageText = `Halo ${lastRecordedBill.tenantName}, kwitansi sewa kamar ${lastRecordedBill.roomNumber} periode ${lastRecordedBill.period} telah lunas diterima sebesar Rp ${paymentAmount.toLocaleString('id-ID')} via ${lastRecordedBill.paymentMethod} pada ${lastRecordedBill.paymentDate}. Terima kasih lunas ya!`;
                navigator.clipboard.writeText(messageText);
                alert("✓ Pesan bukti kwitansi berhasil dicopy ke clipboard!");
              }}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Clipboard className="h-4 w-4" /> Copy Bukti WA untuk Anak Kost
            </button>

            <button
              onClick={handleResetForm}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Catat Pembayaran Lain
            </button>
          </div>
        </section>
      )}

      {/* REGULAR RECORD PAYMENT FORM */}
      {!successRecorded && (
        <section className="bg-white border border-slate-200/85 shadow-xl rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-teal-600" />
              <div>
                <h3 className="font-extrabold text-slate-950 text-base leading-none">Formulir Catat Pembayaran</h3>
                <p className="text-[10px] text-slate-400 mt-1">Gunakan untuk memasukkan uang sewa dari penghuni.</p>
              </div>
            </div>
            <button 
              onClick={onClosePaymentForm}
              className="p-1 rounded-full text-slate-300 hover:text-slate-500 cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
            {formError && (
              <div id="payment-form-error" className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-medium">
                ⚠️ {formError}
              </div>
            )}

            {/* Select unpaid tagihan */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 block">PILIH KAMAR / BELUM LUNAS *</label>
              
              {unpaidBills.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50">
                  <p className="text-slate-400 italic">Semua tagihan bulan ini sudah Lunas penuh! Tidak ada tunggakan sewa.</p>
                </div>
              ) : (
                <select
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  value={activeBillSelection?.id || ''}
                  onChange={(e) => handleActiveBillChange(e.target.value)}
                >
                  <option value="">-- Pilih Kamar & Tenant --</option>
                  {unpaidBills.map((b) => {
                    const outstanding = b.totalAmount - b.paidAmount;
                    return (
                      <option key={b.id} value={b.id} className="font-semibold text-slate-800">
                        Kmr {b.roomNumber} - {b.tenantName} (Periode {b.period}, Tunggakan: {formatIDR(outstanding)})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {activeBillSelection && (
              <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-2xl block text-[11px] text-slate-600 space-y-1 font-semibold leading-relaxed">
                <p className="font-extrabold text-slate-800 text-[12px] pb-1 border-b border-slate-200">Rincian Invoice Terpilih:</p>
                <p className="flex justify-between"><span className="text-slate-400">Total Nilai Tagihan:</span> <span className="font-mono text-slate-800">{formatIDR(activeBillSelection.totalAmount)}</span></p>
                <p className="flex justify-between"><span className="text-slate-400">Telah Dicicil Sebelumnya:</span> <span className="font-mono text-slate-800">{formatIDR(activeBillSelection.paidAmount)}</span></p>
                <p className="flex justify-between pt-1 border-t border-slate-200 border-dashed font-bold text-slate-900"><span className="text-slate-500">Tunggakan Bersih:</span> <span className="font-mono text-rose-600">{formatIDR(activeBillSelection.totalAmount - activeBillSelection.paidAmount)}</span></p>
              </div>
            )}

            {/* Input payment parameters */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 block">JUMLAH SETORAN RUPIAH *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-extrabold">Rp</span>
                <input
                  type="number"
                  required
                  title="Jumlah Setoran"
                  className="w-full bg-slate-50 pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 font-extrabold"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                />
              </div>
              <p className="text-[10px] text-slate-400">Pembayaran parsial/nyicil diperbolehkan (otomatis mengubah status tagihan menjadi 'Sebagian').</p>
            </div>

            {/* Selector cara bayar */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 block">METODE PEMBAYARAN *</label>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                {[
                  { name: 'Transfer Bank', icon: Landmark, color: 'border-teal-500 text-teal-800 bg-teal-50' },
                  { name: 'Tunai / Cash', icon: Coins, color: 'border-slate-200 hover:border-slate-350' },
                  { name: 'QRIS', icon: CheckCircle, color: 'border-slate-200 hover:border-slate-350' },
                  { name: 'E-Wallet', icon: Smartphone, color: 'border-slate-200 hover:border-slate-350' }
                ].map((m) => {
                  const isSelected = paymentMethod === m.name;
                  const Icon = m.icon;
                  return (
                    <button
                      type="button"
                      key={m.name}
                      onClick={() => setPaymentMethod(m.name)}
                      className={`p-2 border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        isSelected ? 'border-2 border-teal-600 bg-teal-50 text-teal-950 font-bold' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 opacity-80" />
                      <span>{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Setoran tanggal */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 block">TANGGAL PENYETORAN</label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-slate-850 focus:outline-none"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 block">CATATAN TRANSFER / REMARKS</label>
              <input
                type="text"
                placeholder="Contoh: Bukti transfer BCA terlampir via WA"
                className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClosePaymentForm}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                id="btn-confirm-payment-record"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow shadow-teal-500/10 cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Simpan Kwitansi Bayar
              </button>
            </div>
          </form>
        </section>
      )}

    </div>
  );
}
