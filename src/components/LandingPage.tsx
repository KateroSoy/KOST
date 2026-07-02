import React from 'react';
import { Home, ShieldCheck, Zap, Users, Receipt, MessageSquare, ArrowRight, BarChart3, HelpCircle, Laptop } from 'lucide-react';

interface LandingPageProps {
  onStartDemo: () => void;
  onGoToLogin: () => void;
  onGoToRegister: () => void;
}

export function LandingPage({ onStartDemo, onGoToLogin, onGoToRegister }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-teal-100 selection:text-teal-900">
      {/* Navbar Container */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/10">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Kost<span className="text-teal-600">os</span>
            </span>
          </div>

          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-teal-600 transition-colors">Fitur</a>
            <a href="#why-us" className="hover:text-teal-600 transition-colors">Mengapa Kostos</a>
            <a href="#pricing" className="hover:text-teal-600 transition-colors">Harga</a>
            <a href="#faq" className="hover:text-teal-600 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={onGoToLogin}
              className="text-sm font-semibold text-slate-600 hover:text-teal-600 px-3 py-1.5 transition-colors"
            >
              Masuk
            </button>
            <button 
              onClick={onGoToRegister}
              className="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl transition-all shadow-sm shadow-teal-500/10 cursor-pointer"
            >
              Daftar Gratis
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 mb-6">
            <ShieldCheck className="h-3.5 w-3.5" /> Terpercaya untuk Ratusan Pemilik Kost di Indonesia
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Kelola Kost Jadi <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Lebih Mudah & Praktis</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Semua kamar, data penghuni, tagihan bulanan, pembayaran real-time, laporan keuangan, hingga pengingat WhatsApp terintegrasi dalam satu sistem super sederhana.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button 
              onClick={onStartDemo}
              className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-2xl shadow-lg shadow-teal-600/15 flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px] active:translate-y-0 cursor-pointer"
            >
              Coba Demo Instan <ArrowRight className="h-5 w-5" />
            </button>
            <button 
              onClick={onGoToRegister}
              className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              Daftar Akun Pemilik
            </button>
          </div>

          <div className="mt-6 flex justify-center items-center gap-5 text-xs text-slate-400">
            <span>✓ Tanpa Kartu Kredit</span>
            <span>•</span>
            <span>✓ Setup Kurang dari 2 Menit</span>
            <span>•</span>
            <span>✓ Bahasa Indonesia</span>
          </div>
        </div>
      </section>

      {/* Pain Points / Problem Section */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Sering Mengalami Masalah Ini?</h2>
            <p className="mt-2 text-slate-500">Bisnis kost sering memicu pusing kepala jika dikelola secara manual.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Tagihan Berceceran & Telat",
                desc: "Masih catat manual di notes atau buku kasir. Sering lupa tanggal jatuh tempo penghuni dan menumpuk sampai berbulan-bulan."
              },
              {
                title: "Komplain Tersendat",
                desc: "Anak kost komplain pipa bocor atau internet mati lewat WA, tapi pesannya tenggelam dan lupa ditindaklanjuti."
              },
              {
                title: "Profit tidak Terhitung Rapi",
                desc: "Uang kost menyatu dengan rekening pribadi. Token listrik, kebersihan, air, dan gaji penjaga kost tak tercatat dengan akurat."
              }
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs hover:border-teal-300 transition-all">
                <div className="h-10 w-10 text-red-600 bg-rose-50 rounded-xl flex items-center justify-center font-bold text-lg mb-4">✕</div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Fitur Unggulan</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">Dirancang khusus untuk mengelola Kost</h2>
            <p className="text-slate-500 mt-2">Dibuat sesederhana WhatsApp namun seakurat dashboard perbankan.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Home,
                title: "Dasbor Kamar Visual",
                desc: "Tampilan grid interaktif. Tahu instan kamar terisi (hijau), kosong (biru), menunggak (merah), atau sedang perbaikan (ungu)."
              },
              {
                icon: Users,
                title: "Data Penghuni Rapi",
                desc: "Arsip lengkap kontak darurat, foto KTP, tanggal masuk, uang jaminan (deposit), serta catatan khusus tiap penyewa."
              },
              {
                icon: Receipt,
                title: "Pembuat Tagihan Otomatis",
                desc: "Gabungkan sewa bulanan, tagihan listrik, air, katering, biaya parkir menjadi satu invoice rapi dalam 3 klik."
              },
              {
                icon: MessageSquare,
                title: "Kirim Pengingat WhatsApp",
                desc: "Prediksi template teks secara dinamis. Copy and go untuk chat langsung ke WhatsApp anak kost yang belum melunasi kewajiban."
              },
              {
                icon: BarChart3,
                title: "Laporan Profit Bersih",
                desc: "Tampilan visual otomatis yang mempertemukan pemasukan total dengan biaya operasional. Tahu laba bersih bulanan seketika."
              },
              {
                icon: Zap,
                title: "Pencatatan Cepat & Instan",
                desc: "UI mobile-first yang responsif. Catat pembayaran di tengah jalan dari smartphone Anda dengan satu tangan."
              }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Kostos */}
      <section id="why-us" className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div className="lg:col-span-5 mb-10 lg:mb-0">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Kelebihan</span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1 mb-4">Mengapa Kostos Sangat Istimewa?</h2>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Kami tahu Bapak/Ibu pemilik kost tidak ingin dipusingkan dengan istilah akuntansi rumit atau sistem berbelit-belit. Kostos fokus memberikan kenyamanan bertransaksi tanpa ribet.
              </p>
              <div className="space-y-4">
                {[
                  "3-Tap Rule: Catat transaksi hanya dalam 3 sentuhan layar.",
                  "Penyimpanan Lokal & Cloud: Data aman tersimpan otomatis.",
                  "Siap WhatsApp: Klik kirim, Kostos akan merumuskan teks penagihan yang sopan.",
                  "100% Menggunakan Bahasa Indonesia yang ramah & dimengerti orang tua."
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">✓</div>
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md">
              <div className="flex border-b border-slate-100 pb-4 mb-4 items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                  <span className="text-sm font-bold text-slate-800">Preview Dashboard Kostos</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-3 advisory h-3 rounded-full bg-slate-200"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                </div>
              </div>

              {/* Miniature Grid */}
              <div className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100">
                    <p className="text-slate-400">Total Kamar</p>
                    <p className="text-lg font-bold text-teal-800">8 Kamar</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-slate-400 font-medium">Terisi</p>
                    <p className="text-lg font-bold text-emerald-800">5 Kamar</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                    <p className="text-slate-400 font-medium">Menunggak</p>
                    <p className="text-lg font-bold text-rose-800">1 Kamar</p>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
                  <p className="font-bold text-slate-800 text-[11px] flex justify-between">
                    <span>STATUS KAMAR</span>
                    <span className="text-[9px] text-teal-600 font-normal">Sangat Intuitif ✓</span>
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["A01", "A02", "A03", "A04", "B01", "B02", "B03", "B04"].map((no, idx) => {
                      let color = "bg-emerald-500 text-white"; // terisi
                      if (no === "A03" || no === "B04") color = "bg-slate-300 text-slate-700"; // kosong
                      if (no === "A04") color = "bg-rose-500 text-white animate-pulse"; // menunggak
                      if (no === "B02") color = "bg-amber-400 text-amber-950"; // booked
                      if (no === "B03") color = "bg-indigo-400 text-white"; // repair
                      return (
                        <div key={idx} className={`p-1.5 rounded-lg text-center font-bold text-[10px] ${color}`}>
                          {no}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-xl flex items-center justify-between text-[11px]">
                  <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <span className="p-1 rounded bg-amber-200 text-amber-950">📢</span>
                    <span>Budi Santoso (A04) terlambat 27 hari</span>
                  </div>
                  <button onClick={onStartDemo} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1 px-2.5 rounded-lg text-[9px] transition-colors cursor-pointer">
                    Kirim WA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Pricing Teaser */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Harga Berlangganan</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1 mb-2">Harga Sederhana & Ramah Kantong</h2>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">Tidak ada biaya tersembunyi. Mulai gratis, tingkatkan jika usaha semakin besar.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto text-left">
            {/* Free */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Uji Coba Gratis</h3>
                <p className="text-xs text-slate-400">Cocok untuk pemilik kost pemula</p>
                <div className="my-4">
                  <span className="text-3xl font-black text-slate-900">Rp 0</span>
                  <span className="text-slate-400 text-xs font-medium"> / selamanya</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">✓ Maksimal 3 Kamar</li>
                  <li className="flex items-center gap-2">✓ Pencatatan Pembayaran</li>
                  <li className="flex items-center gap-2">✓ Copy Template WhatsApp</li>
                  <li className="flex items-center gap-2">✓ Dasbor Statistik</li>
                </ul>
              </div>
              <button onClick={onStartDemo} className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer">
                Mulai Gratis
              </button>
            </div>

            {/* Pro */}
            <div className="bg-teal-900 p-6 rounded-3xl border-2 border-teal-500 shadow-xl shadow-teal-900/10 text-white flex flex-col justify-between relative overflow-hidden">
              <span className="absolute top-3 right-3 bg-teal-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Populer
              </span>
              <div>
                <h3 className="text-lg font-bold">Kostos Pro (MVP)</h3>
                <p className="text-xs text-teal-300">Untuk pengelolaan full-control rapi</p>
                <div className="my-4">
                  <span className="text-3xl font-black">Rp 29.000</span>
                  <span className="text-teal-300 text-xs font-medium"> / bulan</span>
                </div>
                <ul className="space-y-2 text-xs text-teal-100">
                  <li className="flex items-center gap-2">✓ Unlimited Kamar & Hunian</li>
                  <li className="flex items-center gap-2">✓ Pengingat WhatsApp One-Click</li>
                  <li className="flex items-center gap-2">✓ Laporan PDF & Pembukuan Kas</li>
                  <li className="flex items-center gap-2">✓ Support WhatsApp Prioritas</li>
                </ul>
              </div>
              <button onClick={onStartDemo} className="mt-6 w-full py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow shadow-teal-500/10 cursor-pointer">
                Coba Versi Demo Sekarang
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Pertanyaan Umum (FAQ)</h2>
            <p className="text-slate-500 mt-1">Kami merangkum keraguan yang sering ditanyakan para pengelola kost.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Bagaimana cara mengirim WA reminder tanpa pusing?",
                a: "Kostos memformulasikan kalimat penagihan dengan data nama tenant, nomor kamar, denda, dan jatuh tempo otomatis. Setelah itu, akan disiapkan tombol copy atau link terhubung ke WA Web/App, sehingga Anda tinggal menempel teksnya ke kontak WhatsApp mereka."
              },
              {
                q: "Apakah data saya aman dan tidak tersebar?",
                a: "Sangat aman. Kostos mengedepankan keamanan berlapis. Data disimpan di cloud tertutup dan salinan lokal di browser Anda sehingga tidak pernah bocor ke pihak lain."
              },
              {
                q: "Dapatkah saya menggunakannya dari HP / Smartphone?",
                a: "Tentu saja! Kostos didesain mobile-first. Tampilannya sangat pas di layar HP sehingga sangat efisien dipakai saat berkeliling mengontrol kamar kost."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm flex gap-2">
                  <span className="text-teal-600">Q.</span> {faq.q}
                </h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed pl-5 border-l-2 border-teal-100">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-teal-600 flex items-center justify-center">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">Kostos</span>
          </div>
          <p className="text-center md:text-left text-slate-500">
            © 2026 Kostos Indonesia. Seni mengelola properti kost rajin, tertib, dan berkah.
          </p>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-white transition-colors">Syarat Ketentuan</span>
            <span>•</span>
            <span className="cursor-pointer hover:text-white transition-colors font-semibold text-teal-400">Kembali ke Atas</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
