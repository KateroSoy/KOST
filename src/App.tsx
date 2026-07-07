import React, { useState, useEffect } from 'react';
import { Room, Tenant, Bill, Expense, Complaint, KostSettings, ComplaintStatus, RoomStatus, TenantStatus } from './types';
import { 
  INITIAL_SETTINGS, 
  INITIAL_ROOMS, 
  INITIAL_TENANTS, 
  INITIAL_BILLS, 
  INITIAL_EXPENSES, 
  INITIAL_COMPLAINTS 
} from './data';
import { fetchAllData, syncToBackend } from './api';

// Import All Views
import { LandingPage } from './components/LandingPage';
import { AuthScreens } from './components/AuthScreens';
import { SidebarAndNav } from './components/SidebarAndNav';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RoomsView } from './components/RoomsView';
import { TenantsView } from './components/TenantsView';
import { BillsView } from './components/BillsView';
import { PaymentsView } from './components/PaymentsView';
import { ExpensesView } from './components/ExpensesView';
import { ComplaintsView } from './components/ComplaintsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';

export default function App() {
  
  // Authorization State: 'landing' | 'login' | 'register' | 'onboarding' | 'dashboard'
  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'register' | 'onboarding' | 'dashboard'>('landing');

  // Database core States
  const [kostSettings, setKostSettings] = useState<KostSettings>(INITIAL_SETTINGS);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Navigation and UI layouts
  const [selectedTab, setSelectedTab] = useState<string>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const now = new Date();
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Focus detail overlays / modals selection states
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Directly piped modals
  const [billForPayment, setBillForPayment] = useState<Bill | null>(null);
  const [billForReminder, setBillForReminder] = useState<Bill | null>(null);

  // 1. INITIALIZE DATABASE FROM HYBRID API (Backend first, fallback LocalStorage)
  useEffect(() => {
    try {
      const loggedIn = localStorage.getItem('kostos_logged_in');
      if (loggedIn === 'true') setAuthMode('dashboard');
    } catch { /* ignore */ }

    fetchAllData().then((data) => {
      setKostSettings(data.settings);
      setRooms(data.rooms);
      setTenants(data.tenants);
      setBills(data.bills);
      setExpenses(data.expenses);
      setComplaints(data.complaints);
    });
  }, []);

  // 2. SYNCHRONIZE STATE TO LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem('kostos_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('kostos_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('kostos_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('kostos_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('kostos_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('kostos_settings', JSON.stringify(kostSettings));
  }, [kostSettings]);


  // 3. CORE STATE MUTATORS (Optimistic UI + API Sync)
  const handleUpdateSettings = (newSettings: KostSettings) => {
    setKostSettings(newSettings);
    syncToBackend('settings', 'PUT', newSettings);
  };

  const handleAddRoom = (newRoom: Room) => {
    const updated = [...rooms, newRoom];
    setRooms(updated);
    syncToBackend('rooms', 'POST', newRoom);
  };

  const handleUpdateRoomStatus = (roomId: string, nextStatus: RoomStatus) => {
    const updated = rooms.map(r => r.id === roomId ? { ...r, status: nextStatus } : r);
    setRooms(updated);
    syncToBackend(`rooms/${roomId}`, 'PATCH', { status: nextStatus });
  };

  const handleDeleteRoom = (id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
    syncToBackend(`rooms/${id}`, 'DELETE');
  };

  const handleAddTenant = (newTenant: Tenant, assignedRoomId: string) => {
    // 1. Add tenant
    setTenants(prev => [...prev, newTenant]);

    // 2. Update Room: mark 'Terisi' and assign tenantId
    setRooms(prev => prev.map(r => 
      r.id === assignedRoomId ? { ...r, status: 'Terisi' as RoomStatus, tenantId: newTenant.id } : r
    ));

    // 3. Create initial bill for new tenant with correct due date
    const activeRoom = rooms.find(r => r.id === assignedRoomId);
    const roomNo = activeRoom ? activeRoom.number : newTenant.roomAssigned;
    const defaultRentAmount = activeRoom ? activeRoom.price : newTenant.rentAmount;

    // Compute due date from selectedMonth + kostSettings.defaultDueDateDay
    const computeDueDate = () => {
      const MONTHS: Record<string,string> = {
        'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
        'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
        'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
      };
      const parts = selectedMonth.split(' ');
      const monthNum = MONTHS[parts[0]] || '06';
      const year = parts[1] || String(new Date().getFullYear());
      const day = String(kostSettings.defaultDueDateDay || 5).padStart(2, '0');
      return `${year}-${monthNum}-${day}`;
    };

    const autoInceptionBill: Bill = {
      id: `bill-auto-${Date.now()}`,
      tenantId: newTenant.id,
      tenantName: newTenant.name,
      roomId: assignedRoomId,
      roomNumber: roomNo,
      period: selectedMonth,
      dueDate: computeDueDate(),
      rentAmount: defaultRentAmount,
      electricityCharge: 0,
      waterCharge: 0,
      additionalFee: 0,
      discount: 0,
      lateFee: 0,
      totalAmount: defaultRentAmount,
      paidAmount: 0,
      status: 'Belum Bayar'
    };

    setBills(prev => [autoInceptionBill, ...prev]);
    
    // Sync to backend (Tenant auto-creates bill in backend too, so we just send tenant)
    syncToBackend('tenants', 'POST', newTenant);
  };

  const handleMoveOutTenant = (tenantId: string, roomNumber: string) => {
    setTenants(prev => prev.filter(t => t.id !== tenantId));
    setRooms(prev => prev.map(r => 
      r.number === roomNumber ? { ...r, status: 'Kosong' as RoomStatus, tenantId: undefined } : r
    ));
    setBills(prev => prev.filter(b => !(b.tenantId === tenantId && b.status !== 'Lunas')));
    
    syncToBackend(`tenants/${tenantId}/move-out`, 'POST');
  };

  const handleDeleteTenant = (id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
    syncToBackend(`tenants/${id}`, 'DELETE');
  };

  const handleAddBill = (newBill: Bill) => {
    setBills(prev => [newBill, ...prev]);
    setTenants(prev => prev.map(t => 
      t.id === newBill.tenantId ? { ...t, status: 'Belum Bayar' as TenantStatus } : t
    ));
    setRooms(prev => prev.map(r =>
      r.number === newBill.roomNumber ? { ...r, status: 'Terisi' as RoomStatus } : r
    ));
    syncToBackend('bills', 'POST', newBill);
  };

  const handleDeleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
    syncToBackend(`bills/${id}`, 'DELETE');
  };

  const handleRecordPayment = (billId: string, amountPaid: number, method: string, date: string, notes?: string) => {
    setBills(prev => prev.map(b => {
      if (b.id === billId) {
        const nextPaid = b.paidAmount + amountPaid;
        const reachedLunas = nextPaid >= b.totalAmount;
        const statusVal = reachedLunas ? 'Lunas' : 'Sebagian';

        if (reachedLunas) {
          setTenants(tPrev => tPrev.map(t => 
            t.id === b.tenantId ? { ...t, status: 'Lunas' as TenantStatus } : t
          ));
          setRooms(rPrev => rPrev.map(r => 
            r.number === b.roomNumber ? { ...r, status: 'Terisi' as RoomStatus } : r
          ));
        }

        const updatedBill = {
          ...b,
          paidAmount: nextPaid,
          status: statusVal,
          paymentMethod: method,
          paymentDate: date,
          notes: notes || b.notes
        };
        syncToBackend(`bills/${billId}/payments`, 'POST', { amountPaid, method, date, notes });
        return updatedBill;
      }
      return b;
    }));
  };

  const handleAddExpense = (newExpense: Expense) => {
    setExpenses(prev => [newExpense, ...prev]);
    syncToBackend('expenses', 'POST', newExpense);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    syncToBackend(`expenses/${id}`, 'DELETE');
  };

  const handleAddComplaint = (newComplaint: Complaint) => {
    setComplaints(prev => [newComplaint, ...prev]);
    syncToBackend('complaints', 'POST', newComplaint);
  };

  const handleUpdateComplaintStatus = (id: string, status: ComplaintStatus, repairCost?: number, notes?: string) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === id) {
        // If Status === 'Selesai' and they log repair cost, automatically log corresponding EXPENSE!
        if (status === 'Selesai' && repairCost && repairCost > 0) {
          const autoRepairExpense: Expense = {
            id: `exp-auto-${Date.now()}`,
            category: 'Perbaikan',
            description: `Reparasi komplain: ${c.title} (Kmr ${c.roomNumber})`,
            date: new Date().toISOString().split('T')[0],
            amount: repairCost,
            notes: notes || 'Pekerjaan selesai via komplain tiket.'
          };
          handleAddExpense(autoRepairExpense);
        }

        syncToBackend(`complaints/${id}`, 'PATCH', { status, repairCost, notes });
        return {
          ...c,
          status,
          repairCost: repairCost !== undefined ? repairCost : c.repairCost,
          notes: notes !== undefined ? notes : c.notes
        };
      }
      return c;
    }));
  };

  const handleDeleteComplaint = (id: string) => {
    setComplaints(prev => prev.filter(c => c.id !== id));
    syncToBackend(`complaints/${id}`, 'DELETE');
  };


  // 4. LANDING, AUTHENTICATION AND ONBOARDING FLOW handlers
  const handleFirstTimeOnboard = (kostConfig: Partial<KostSettings>, roomCount: number, basePrice: number) => {
    const freshSettings: KostSettings = {
      ...kostSettings,
      kostName: kostConfig.kostName || 'Kost Saya',
      ownerName: kostConfig.ownerName || 'Pemilik',
      whatsapp: kostConfig.whatsapp || '',
      address: kostConfig.address || '',
      bankAccounts: kostConfig.bankAccounts || kostSettings.bankAccounts,
      defaultDueDateDay: kostConfig.defaultDueDateDay || 5,
    };
    setKostSettings(freshSettings);
    localStorage.setItem('kostos_settings', JSON.stringify(freshSettings));

    // Build fresh empty room grids from capacity
    const freshRooms: Room[] = [];
    for (let i = 1; i <= roomCount; i++) {
      const roomNo = i < 10 ? `A0${i}` : `A${i}`;
      freshRooms.push({
        id: `room-onb-${i}`,
        number: roomNo,
        status: 'Kosong',
        type: 'Standard',
        price: basePrice,
        floor: 1,
        size: '3x3 m',
        facilities: ['Kipas Angin', 'Kasur Single', 'WiFi', 'Lemari Baju']
      });
    }
    setRooms(freshRooms);
    setTenants([]);
    setBills([]);
    setExpenses([]);
    setComplaints([]);
    localStorage.setItem('kostos_rooms', JSON.stringify(freshRooms));
    localStorage.setItem('kostos_tenants', JSON.stringify([]));
    localStorage.setItem('kostos_bills', JSON.stringify([]));
    localStorage.setItem('kostos_expenses', JSON.stringify([]));
    localStorage.setItem('kostos_complaints', JSON.stringify([]));
    localStorage.setItem('kostos_logged_in', 'true');
    syncToBackend('restore', 'POST', {
      kostSettings: freshSettings,
      rooms: freshRooms,
      tenants: [],
      bills: [],
      expenses: [],
      complaints: []
    });
    setAuthMode('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('kostos_logged_in');
    setAuthMode('landing');
  };


  // 5. QUICK HEADER dropdown routing shortcuts
  const handleQuickActionSelection = (actionId: string) => {
    if (actionId === 'add-tenant') {
      setSelectedTab('tenants');
    } else if (actionId === 'record-payment') {
      setSelectedTab('payments');
      setBillForPayment(null);
    } else if (actionId === 'create-bill') {
      setSelectedTab('bills');
    } else if (actionId === 'add-expense') {
      setSelectedTab('expenses');
    } else if (actionId === 'add-room') {
      setSelectedTab('rooms');
    }
  };


  // 6. BACKUP DATABASE AND RESTORE JSON FLOWS
  const handleExportBackup = () => {
    const databaseState = {
      version: "Kostos-v1-2026",
      timestamp: new Date().toISOString(),
      kostSettings,
      rooms,
      tenants,
      bills,
      expenses,
      complaints
    };

    const blob = new Blob([JSON.stringify(databaseState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kostos_db_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const [backupMsg, setBackupMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        if (backupData.version && backupData.kostSettings) {
          setKostSettings(backupData.kostSettings);
          if (backupData.rooms) { setRooms(backupData.rooms); localStorage.setItem('kostos_rooms', JSON.stringify(backupData.rooms)); }
          if (backupData.tenants) { setTenants(backupData.tenants); localStorage.setItem('kostos_tenants', JSON.stringify(backupData.tenants)); }
          if (backupData.bills) { setBills(backupData.bills); localStorage.setItem('kostos_bills', JSON.stringify(backupData.bills)); }
          if (backupData.expenses) { setExpenses(backupData.expenses); localStorage.setItem('kostos_expenses', JSON.stringify(backupData.expenses)); }
          if (backupData.complaints) { setComplaints(backupData.complaints); localStorage.setItem('kostos_complaints', JSON.stringify(backupData.complaints)); }
          localStorage.setItem('kostos_settings', JSON.stringify(backupData.kostSettings));
          syncToBackend('restore', 'POST', {
            kostSettings: backupData.kostSettings,
            rooms: backupData.rooms || [],
            tenants: backupData.tenants || [],
            bills: backupData.bills || [],
            expenses: backupData.expenses || [],
            complaints: backupData.complaints || []
          });
          setBackupMsg({ type: 'success', text: '✓ Database KOSTOS sukses dipulihkan dari file backup!' });
          setTimeout(() => setBackupMsg(null), 4000);
        } else {
          setBackupMsg({ type: 'error', text: '⚠️ Format file JSON backup belum valid.' });
          setTimeout(() => setBackupMsg(null), 4000);
        }
      } catch {
        setBackupMsg({ type: 'error', text: '⚠️ Gagal membaca berkas backup. Pastikan file JSON sah.' });
        setTimeout(() => setBackupMsg(null), 4000);
      }
    };
    reader.readAsText(file);
  };


  // 7. MULTIPLEXING TAB ROUTING LAYOUTS
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'dashboard':
        return (
          <DashboardView 
            rooms={rooms} 
            tenants={tenants} 
            bills={bills} 
            expenses={expenses} 
            complaints={complaints}
            settings={kostSettings}
            selectedMonth={selectedMonth}
            onNavigateToTab={(tab, arg) => {
              setSelectedTab(tab);
              if (tab === 'rooms' && arg) setSelectedRoomId(arg);
              if (tab === 'tenants' && arg) setSelectedTenantId(arg);
              if (tab === 'bills' && arg) setSelectedBillId(arg);
            }}
            onOpenReminderModal={(bill) => setBillForReminder(bill)}
            onOpenPaymentForm={(bill) => {
              setBillForPayment(bill);
              setSelectedTab('payments');
            }}
          />
        );
      
      case 'rooms':
        return (
          <RoomsView 
            rooms={rooms} 
            tenants={tenants} 
            bills={bills}
            selectedRoomId={selectedRoomId}
            onSelectRoomId={setSelectedRoomId}
            onAddRoom={handleAddRoom}
            onUpdateRoomStatus={handleUpdateRoomStatus}
            onDeleteRoom={handleDeleteRoom}
            onNavigateToTab={(tab, arg) => {
              setSelectedTab(tab);
              if (tab === 'tenants' && arg) setSelectedTenantId(arg);
            }}
          />
        );

      case 'tenants':
        return (
          <TenantsView
            tenants={tenants}
            rooms={rooms}
            selectedTenantId={selectedTenantId}
            onSelectTenantId={setSelectedTenantId}
            onAddTenant={handleAddTenant}
            onMoveOutTenant={handleMoveOutTenant}
            onDeleteTenant={handleDeleteTenant}
            onNavigateToTab={(tab, arg) => {
              setSelectedTab(tab);
              if (tab === 'rooms' && arg) setSelectedRoomId(arg);
            }}
          />
        );

      case 'bills':
        return (
          <BillsView
            bills={bills}
            tenants={tenants}
            rooms={rooms}
            selectedBillId={selectedBillId}
            onSelectBillId={setSelectedBillId}
            onAddBill={handleAddBill}
            onOpenReminderModal={(bill) => setBillForReminder(bill)}
            onOpenPaymentForm={(bill) => {
              setBillForPayment(bill);
              setSelectedTab('payments');
            }}
            onDeleteBill={handleDeleteBill}
            selectedMonth={selectedMonth}
          />
        );

      case 'payments':
        return (
          <PaymentsView
            bills={bills}
            tenants={tenants}
            rooms={rooms}
            selectedBillForPayment={billForPayment}
            onClosePaymentForm={() => {
              setBillForPayment(null);
              setSelectedTab('dashboard');
            }}
            onRecordPayment={handleRecordPayment}
          />
        );

      case 'expenses':
        return (
          <ExpensesView
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            selectedMonth={selectedMonth}
          />
        );

      case 'complaints':
        return (
          <ComplaintsView
            complaints={complaints}
            tenants={tenants}
            rooms={rooms}
            selectedComplaintId={selectedComplaintId}
            onSelectComplaintId={setSelectedComplaintId}
            onAddComplaint={handleAddComplaint}
            onUpdateComplaintStatus={handleUpdateComplaintStatus}
            onDeleteComplaint={handleDeleteComplaint}
          />
        );

      case 'reports':
        return (
          <ReportsView
            bills={bills}
            rooms={rooms}
            tenants={tenants}
            expenses={expenses}
            selectedMonth={selectedMonth}
          />
        );

      case 'settings':
        return (
          <SettingsView
            kostSettings={kostSettings}
            onUpdateSettings={handleUpdateSettings}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        );

      default:
        return <div className="p-12 text-center text-slate-400">Section Under Dev</div>;
    }
  };

  // Switch layouts on Authentication Status
  if (authMode === 'landing') {
    return (
      <LandingPage 
        onStartDemo={() => {
          localStorage.setItem('kostos_logged_in', 'true');
          setAuthMode('dashboard');
        }}
        onGoToLogin={() => setAuthMode('login')} 
        onGoToRegister={() => setAuthMode('register')} 
      />
    );
  }

  if (authMode === 'login' || authMode === 'register' || authMode === 'onboarding') {
    return (
      <AuthScreens
        viewMode={authMode}
        onGoBackLanding={() => setAuthMode('landing')}
        onSetViewMode={(mode: any) => {
          if (mode === 'dashboard') {
            localStorage.setItem('kostos_logged_in', 'true');
          }
          setAuthMode(mode);
        }}
        onInitializeKost={handleFirstTimeOnboard}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased font-sans text-slate-800">
      
      {/* 1. COMPREHENSIVE SIDEBAR FOR TABLET & DESKTOP SCREEN */}
      <SidebarAndNav 
        currentTab={selectedTab} 
        onChangeTab={(tab) => {
          setSelectedTab(tab);
          setMobileMenuOpen(false);
          
          // Clear focus buffers
          setSelectedRoomId(null);
          setSelectedTenantId(null);
          setSelectedBillId(null);
          setSelectedComplaintId(null);
          setBillForPayment(null);
        }}
        onLogout={handleLogout}
        kostName={kostSettings.kostName}
        ownerName={kostSettings.ownerName}
      />

      {/* 2. MAIN WORKING CANVAS WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          settings={kostSettings} 
          currentTab={selectedTab} 
          onQuickAction={handleQuickActionSelection}
          selectedMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
          onLogout={handleLogout}
        />

        {/* Core Tab Canvas Render Frame */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-200">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* 3. FLOATING WHATSAPP BROADCAST MAKER MODAL WINDOW */}
      {billForReminder && (
      <WhatsAppReminderModal 
          bill={billForReminder} 
          kostSettings={kostSettings} 
          tenants={tenants}
          onClose={() => setBillForReminder(null)} 
        />
      )}

      {/* 4. GLOBAL TOAST NOTIFICATION for backup/restore feedback */}
      {backupMsg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-xs font-bold shadow-xl text-white animate-in slide-in-from-bottom-4 duration-300 ${
          backupMsg.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {backupMsg.text}
        </div>
      )}

    </div>
  );
}
