import React, { useState } from 'react';
import { Wrench, CheckCircle, Clock, Warning, Plus, User, Buildings, Check, Faders, MagnifyingGlass, X } from '@phosphor-icons/react';
import { OperationTask, OperationPriority, OperationStatus, Room, StaffMember, Property } from '../types';
import { ElegantSelect } from './ElegantSelect';
import { generateId } from '../utils';

interface OperationsViewProps {
  tasks: OperationTask[];
  rooms: Room[];
  staffList: StaffMember[];
  properties: Property[];
  onAddTask: (task: OperationTask) => void;
  onUpdateTaskStatus: (taskId: string, status: OperationStatus) => void;
  selectedPropertyId?: string;
}

export function OperationsView({
  tasks,
  rooms,
  staffList,
  properties,
  onAddTask,
  onUpdateTaskStatus,
  selectedPropertyId = 'all'
}: OperationsViewProps) {

  const [activeTypeTab, setActiveTypeTab] = useState<'All' | 'Maintenance' | 'Cleaning'>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [taskType, setTaskType] = useState<'Maintenance' | 'Cleaning'>('Maintenance');
  const [title, setTitle] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [priority, setPriority] = useState<OperationPriority>('Sedang');
  const [assignedTo, setAssignedTo] = useState('Budi (Teknisi)');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const filteredTasks = tasks.filter(t => {
    if (selectedPropertyId !== 'all' && t.propertyId !== selectedPropertyId) return false;
    if (activeTypeTab !== 'All' && t.type !== activeTypeTab) return false;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: OperationTask = {
      id: generateId('task'),
      propertyId: selectedPropertyId !== 'all' ? selectedPropertyId : (properties[0]?.id || 'prop-1'),
      type: taskType,
      title,
      roomNumber,
      priority,
      status: 'Open',
      assignedTo,
      estimatedCost: Number(estimatedCost) || 0,
      notes,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddTask(newTask);
    setShowAddModal(false);
    setTitle('');
    setNotes('');
  };

  const priorityBadge = (p: OperationPriority) => {
    switch (p) {
      case 'Tinggi':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">Prioritas Tinggi</span>;
      case 'Sedang':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">Prioritas Sedang</span>;
      case 'Rendah':
        return <span className="bg-zinc-100 text-zinc-700 text-[10px] font-bold px-2 py-0.5 rounded">Prioritas Rendah</span>;
    }
  };

  const statusBadge = (s: OperationStatus) => {
    switch (s) {
      case 'Open':
        return <span className="bg-[#E5DCC5] text-blue-900 text-xs font-bold px-2.5 py-1 rounded-full">Open</span>;
      case 'In Progress':
        return <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">In Progress</span>;
      case 'Completed':
        return <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-full">Selesai</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#171A18] font-editorial tracking-tight leading-none">
            Operasional
          </h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-full bg-[#173B30] text-[#F5F1E8] hover:bg-[#0f2720] text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-md shadow-[#173b30]/20 whitespace-nowrap shrink-0"
        >
          Tugas Baru
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 px-2 hide-scrollbar">
        {(['All', 'Maintenance', 'Cleaning'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTypeTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shadow-sm ${
              activeTypeTab === tab
                ? 'bg-[#173B30] text-white shadow-md shadow-[#173b30]/20'
                : 'bg-white text-[#6E746F] hover:text-[#171A18]'
            }`}
          >
            {tab === 'All' ? 'Semua Tugas' : tab === 'Maintenance' ? 'Perbaikan' : 'Kebersihan'}
          </button>
        ))}
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 gap-4 pb-10">
        {filteredTasks.map(task => (
          <div
            key={task.id}
            className="bg-white rounded-[28px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-[#F5F1E8] text-[#173B30]">
                  {task.type}
                </span>
                {priorityBadge(task.priority)}
              </div>

              <h4 className="text-base font-bold text-[#171A18]">
                {task.title}
              </h4>

              <div className="flex items-center gap-2 text-xs text-[#6E746F] mt-1.5 font-medium">
                <Buildings weight="duotone" className="h-4 w-4 text-[#A8B7A1]" />
                <span className="text-[#171A18]">Kamar {task.roomNumber}</span>
                <span>•</span>
                <span>{task.createdAt}</span>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-[#FBF9F5] text-xs space-y-2">
                <div className="flex items-center justify-between text-[#6E746F]">
                  <span>Petugas:</span>
                  <span className="font-bold text-[#171A18]">{task.assignedTo}</span>
                </div>
                {task.estimatedCost ? (
                  <div className="flex items-center justify-between text-[#6E746F]">
                    <span>Estimasi Biaya:</span>
                    <span className="font-bold text-[#173B30]">Rp {task.estimatedCost.toLocaleString('id-ID')}</span>
                  </div>
                ) : null}
                {task.notes && (
                  <p className="text-[11px] text-[#6E746F] pt-2 mt-2 border-t border-zinc-200/50 italic">{task.notes}</p>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
              <div>{statusBadge(task.status)}</div>

              <div className="flex items-center gap-2">
                {task.status === 'Open' && (
                  <button
                    onClick={() => onUpdateTaskStatus(task.id, 'In Progress')}
                    className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Mulai Kerjakan
                  </button>
                )}
                {task.status === 'In Progress' && (
                  <button
                    onClick={() => onUpdateTaskStatus(task.id, 'Completed')}
                    className="px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Selesaikan Tugas
                  </button>
                )}
                {task.status === 'Completed' && (
                  <span className="text-xs text-emerald-800 font-bold flex items-center gap-1.5 px-2 py-1">
                    <CheckCircle weight="duotone" className="h-4 w-4" /> Selesai
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-[#FBF9F5] sm:rounded-3xl rounded-t-3xl max-w-md w-full p-6 shadow-2xl space-y-4 slide-up-animation max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5DCC5] pb-3">
              <h3 className="text-lg font-bold text-[#171A18] font-editorial">Buat Tiket Tugas Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#6E746F] shadow-sm">
                <X weight="duotone" className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#171A18] mb-1">Tipe Tugas</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTaskType('Maintenance')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs cursor-pointer ${
                      taskType === 'Maintenance' ? 'bg-[#173B30] text-[#F5F1E8]' : 'bg-white border text-[#6E746F]'
                    }`}
                  >
                    Pemeliharaan (Perbaikan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskType('Cleaning')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs cursor-pointer ${
                      taskType === 'Cleaning' ? 'bg-[#173B30] text-[#F5F1E8]' : 'bg-white border text-[#6E746F]'
                    }`}
                  >
                    Kebersihan (Cleaning)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#171A18] mb-1">Deskripsi Tugas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: AC tidak dingin atau Deep cleaning kamar A102"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Nomor Unit / Kamar</label>
                  <ElegantSelect
                    value={roomNumber}
                    onChange={(val) => setRoomNumber(val)}
                    placeholder="Pilih Kamar..."
                    options={rooms.map(r => ({ value: r.number, label: r.number }))}
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#171A18] mb-1">Prioritas</label>
                  <ElegantSelect
                    value={priority}
                    onChange={(val) => setPriority(val as OperationPriority)}
                    options={[
                      { value: 'Tinggi', label: 'Tinggi (Mendesak)' },
                      { value: 'Sedang', label: 'Sedang' },
                      { value: 'Rendah', label: 'Rendah' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#171A18] mb-1">Tugaskan Kepada</label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Contoh: Budi (Teknisi) atau Siti (Housekeeping)"
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#171A18] mb-1">Estimasi Biaya (Rp)</label>
                <input
                  type="number"
                  value={estimatedCost || ''}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#171A18] mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informasi detail..."
                  className="w-full bg-white border border-[rgba(23,59,48,0.15)] rounded-xl px-3.5 py-2 text-xs text-[#171A18]"
                />
              </div>

              <div className="pt-3 border-t border-[rgba(23,59,48,0.10)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[rgba(23,59,48,0.20)] text-xs font-bold text-[#173B30]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#173B30] text-[#F5F1E8] font-bold text-xs hover:bg-[#0f2720]"
                >
                  Simpan Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
