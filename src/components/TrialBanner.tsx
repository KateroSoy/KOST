import React from 'react';
import { Clock, WarningCircle } from '@phosphor-icons/react';

interface TrialBannerProps {
  expiresAt: string;
  effectivePlan: string;
  onUpgradeClick: () => void;
}

export function TrialBanner({ expiresAt, effectivePlan, onUpgradeClick }: TrialBannerProps) {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isExpired = effectivePlan !== 'pro';

  return (
    <div className={`w-full text-xs font-bold py-2 px-4 flex items-center justify-between z-40 shrink-0 ${
      isExpired ? 'bg-rose-600 text-white' : 'bg-[#173B30] text-[#F5F1E8]'
    }`}>
      <span className="flex items-center gap-2">
        {isExpired ? <WarningCircle weight="duotone" className="h-4 w-4" /> : <Clock weight="duotone" className="h-4 w-4" />}
        {isExpired
          ? 'Masa uji coba Pro telah berakhir. Fitur Pro terkunci.'
          : `${daysLeft} hari tersisa dari masa uji coba Pro.`}
      </span>
      <button
        onClick={onUpgradeClick}
        className="bg-[#F5F1E8] text-[#173B30] px-3 py-1 rounded-lg text-[10px] font-extrabold hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
      >
        Upgrade Sekarang →
      </button>
    </div>
  );
}
