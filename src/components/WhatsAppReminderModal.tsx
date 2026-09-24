import React, { useState, useEffect } from 'react';
import { ChatTeardropText, Copy, Check, ArrowUpRight, X, CalendarBlank, User, DeviceMobile } from '@phosphor-icons/react';
import { Bill, KostSettings, Tenant } from '../types';

interface WhatsAppReminderModalProps {
  bill: Bill | null;
  kostSettings: KostSettings;
  tenants?: Tenant[];
  onClose: () => void;
}

export function WhatsAppReminderModal({ bill, kostSettings, tenants = [], onClose }: WhatsAppReminderModalProps) {
  const [copied, setCopied] = useState(false);
  const [formattedMessage, setFormattedMessage] = useState('');

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Compile the template dynamically
  useEffect(() => {
    if (!bill) return;

    const outstanding = bill.totalAmount - bill.paidAmount;
    let template = kostSettings.reminderTemplate;

    // Replace bracket indicators safely
    template = template.replace(/{nama}/g, bill.tenantName);
    template = template.replace(/{kamar}/g, bill.roomNumber);
    template = template.replace(/{bulan}/g, bill.period);
    template = template.replace(/{jumlah}/g, formatIDR(outstanding));
    template = template.replace(/{tanggal}/g, bill.dueDate);

    setFormattedMessage(template);
  }, [bill, kostSettings]);

  if (!bill) return null;

  // Formatting local Indonesian phone numbers (e.g. 08129876 to 628129876) dynamically
  const getWhatsAppLink = () => {
    // Look up actual tenant phone number from tenants list
    const tenant = tenants.find(t => t.id === bill.tenantId);
    const rawPhone = tenant?.phone || '081299998888'; // fallback
    const cleanedPhone = rawPhone.replace(/[^0-9]/g, '');
    
    let formattedPhone = cleanedPhone;
    if (cleanedPhone.startsWith('0')) {
      formattedPhone = '62' + cleanedPhone.substring(1);
    } else if (cleanedPhone.startsWith('8')) {
      formattedPhone = '62' + cleanedPhone;
    }

    const encodedText = encodeURIComponent(formattedMessage);
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
  };

  // Get tenant phone for display
  const getTenantPhone = () => {
    const tenant = tenants.find(t => t.id === bill.tenantId);
    return tenant?.phone || '-';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#173B30]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="glass-panel rounded-3xl w-full max-w-md border border-white/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Head */}
        <div className="p-5 bg-gradient-to-r from-teal-900 to-emerald-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <ChatTeardropText weight="duotone" className="h-5 w-5 text-teal-350" />
            <span className="font-extrabold text-base">Reminder Invoice: Kmr {bill.roomNumber}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-teal-300 hover:text-white hover:bg-teal-800 cursor-pointer"
          >
            <X weight="duotone" className="h-5 w-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-[#171A18] font-semibold">
          <div>
            <h4 className="font-extrabold text-sm text-[#171A18]">Pratinjau Pengingat Sesi Tagihan</h4>
            <p className="text-[10px] text-[#6E746F] mt-1">Gunakan template di bawah ini untuk broadcast langsung ke penyewa.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[#6E746F]">
            <div className="p-2 border border-[rgba(23,59,48,0.06)] bg-white/50 rounded-xl space-y-0.5">
              <span className="text-[9px] text-[#6E746F] uppercase">PENYEWA KOST:</span>
              <p className="font-extrabold text-[#171A18]">{bill.tenantName}</p>
              <p className="text-[9px] text-[#6E746F]">📱 {getTenantPhone()}</p>
            </div>
            <div className="p-2 border border-[rgba(23,59,48,0.06)] bg-white/50 rounded-xl space-y-0.5">
              <span className="text-[9px] text-[#6E746F] uppercase">JUMLAH TUNGGAKAN:</span>
              <p className="font-extrabold text-[#0f2720]">{formatIDR(bill.totalAmount - bill.paidAmount)}</p>
              <p className="text-[9px] text-[#6E746F]">Kamar {bill.roomNumber} • {bill.period}</p>
            </div>
          </div>

          {/* Realistic WhatsApp Green Bubble Preview Box */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-[#6E746F] block tracking-widest">Pratinjau SMS/WA (Chat Bubble):</span>
            <div className="p-4 bg-[url('https://user-images.githubusercontent.com/15075759/145195045-8f63ab9d-7f72-463d-82d2-c4bc089856df.png')] bg-repeat bg-center rounded-2xl border border-emerald-400/30 shadow-inner flex flex-col justify-end min-h-[160px]">
              
              {/* WhatsApp chat bubble */}
              <div className="ml-auto bg-[#dcf8c6] text-[#171A18] rounded-2xl rounded-tr-none p-3 max-w-[90%] relative shadow-xs flex flex-col justify-between">
                <p className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-[#171A18] font-medium font-serif">
                  {formattedMessage}
                </p>
                
                {/* Check ticks */}
                <div className="flex justify-end items-center gap-1 mt-1 text-[8px] text-[#6E746F] font-sans font-normal">
                  <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-[#34b7f1] font-bold">✓✓</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Modal footer control bar */}
        <div className="p-4 bg-white/50 border-t border-white/40 flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              copied ? 'bg-emerald-600 text-white' : 'bg-[rgba(23,59,48,0.06)] text-[#171A18] hover:bg-[rgba(23,59,48,0.1)]'
            }`}
          >
            {copied ? (
              <>✓ Pengingat Berhasil Dicopy!</>
            ) : (
              <>
                <Copy weight="duotone" className="h-4 w-4" /> Salin Pesan Manual
              </>
            )}
          </button>

          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer referrer"
            className="flex-1 py-2.5 bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-center"
          >
            <DeviceMobile weight="duotone" className="h-4 w-4" /> Buka WhatsApp Web <ArrowUpRight weight="duotone" className="h-3 w-3" />
          </a>
        </div>

      </div>
    </div>
  );
}
