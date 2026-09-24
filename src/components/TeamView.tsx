import React, { useState } from 'react';
import { Users, UserPlus, Shield, Phone, EnvelopeSimple, CheckCircle, X, Trash } from '@phosphor-icons/react';
import { StaffMember } from '../types';
import { ElegantSelect } from './ElegantSelect';
import { generateId } from '../utils';

interface TeamViewProps {
  staffList: StaffMember[];
  onAddStaff: (staff: StaffMember) => void;
  onDeleteStaff?: (id: string) => void;
}

export function TeamView({ staffList, onAddStaff, onDeleteStaff }: TeamViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Owner' | 'Manager' | 'Staff' | 'Finance' | 'Reception' | 'Housekeeping'>('Staff');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStaff({
      id: generateId('staff'),
      name,
      role,
      phone,
      email,
      status: 'Active'
    });
    setShowModal(false);
    setName('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FBF9F5] p-5 rounded-2xl border border-[rgba(23,59,48,0.10)] shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[#171A18] font-editorial">
            Tim & Pengelola
          </h2>
          <p className="text-xs text-[#6E746F] mt-0.5">
            Kelola staf, manajer operasional, dan hak akses properti Anda.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4.5 py-2.5 rounded-xl bg-[#173B30] text-[#F5F1E8] hover:bg-[#0f2720] text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-md self-start sm:self-auto"
        >
          Tambah Anggota Tim
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map(member => (
          <div key={member.id} className="bg-[#FBF9F5] border border-[rgba(23,59,48,0.10)] rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-full bg-[#173B30] text-[#F5F1E8] flex items-center justify-center font-bold text-sm">
                  {member.name.charAt(0)}
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                  {member.role}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-base text-[#171A18]">{member.name}</h4>
                <div className="text-xs text-[#6E746F] space-y-1 mt-2">
                  <p className="flex items-center gap-1.5">
                    <Phone weight="duotone" className="h-3.5 w-3.5 text-emerald-700 shrink-0" /> {member.phone}
                  </p>
                  {member.email && (
                    <p className="flex items-center gap-1.5">
                      <EnvelopeSimple weight="duotone" className="h-3.5 w-3.5 text-emerald-700 shrink-0" /> {member.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[rgba(23,59,48,0.06)] flex items-center justify-between text-xs text-[#6E746F]">
              <span className="flex items-center gap-1 text-emerald-800 font-semibold text-[11px]">
                <CheckCircle weight="duotone" className="h-3.5 w-3.5 text-emerald-600" /> Aktif
              </span>
              {onDeleteStaff && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus anggota tim "${member.name}"?`)) {
                      onDeleteStaff(member.id);
                    }
                  }}
                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Staf"
                >
                  <Trash  weight="duotone" className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FBF9F5] border border-[rgba(23,59,48,0.15)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(23,59,48,0.10)] pb-3">
              <h3 className="text-lg font-bold text-[#171A18] font-editorial">Tambah Anggota Tim</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-[#6E746F]">
                <X weight="duotone" className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#171A18] mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Maya Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#171A18] mb-1">Peran / Posisi</label>
                <ElegantSelect
                  value={role}
                  onChange={(val) => setRole(val as any)}
                  options={[
                    { value: 'Manager', label: 'Manager Operasional' },
                    { value: 'Staff', label: 'Staff Umum' },
                    { value: 'Housekeeping', label: 'Housekeeping / Kebersihan' },
                    { value: 'Finance', label: 'Keuangan / Finance' },
                    { value: 'Reception', label: 'Resepsionis' }
                  ]}
                />
              </div>

              <div>
                <label className="block font-bold text-[#171A18] mb-1">No. WhatsApp / HP *</label>
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#171A18] mb-1">Email</label>
                <input
                  type="email"
                  placeholder="email@bisnis.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                />
              </div>

              <div className="pt-3 border-t border-[rgba(23,59,48,0.10)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-[rgba(23,59,48,0.20)] text-xs font-bold text-[#173B30]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#173B30] text-[#F5F1E8] font-bold text-xs hover:bg-[#0f2720]"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
