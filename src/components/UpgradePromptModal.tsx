import React from 'react';
import { Crown, X, Check } from '@phosphor-icons/react';

interface UpgradePromptModalProps {
  onClose: () => void;
}

const PRO_FEATURES = [
  'Booking online & manajemen reservasi',
  'Website publik properti',
  'Manajemen tugas operasional & tim staf',
  'Laporan keuangan & okupansi lengkap',
];

export function UpgradePromptModal({ onClose }: UpgradePromptModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center cursor-pointer"
        >
          <X weight="duotone" className="h-4 w-4 text-[#171A18]" />
        </button>

        <div className="h-12 w-12 rounded-2xl bg-[#173B30] text-[#F5F1E8] flex items-center justify-center">
          <Crown weight="duotone" className="h-6 w-6" />
        </div>

        <div>
          <h3 className="text-lg font-black text-[#171A18]">Fitur Pro Terkunci</h3>
          <p className="text-xs text-[#6E746F] mt-1 leading-relaxed">
            Upgrade ke paket Pro untuk membuka fitur pertumbuhan bisnis Anda.
          </p>
        </div>

        <ul className="space-y-2">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-xs font-semibold text-[#171A18]">
              <Check weight="bold" className="h-4 w-4 text-[#173B30] shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <p className="text-[11px] text-[#6E746F] leading-relaxed bg-[#FBF9F5] p-3 rounded-xl">
          Hubungi tim BISNIESGO Living untuk mengaktifkan paket Pro pada akun Anda.
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 bg-[#173B30] text-[#F5F1E8] rounded-xl text-xs font-extrabold hover:bg-[#0f2720] transition-colors cursor-pointer"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}
