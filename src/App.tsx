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
  const [selectedMonth, setSelectedMonth] = useState<string>('Juni 2026');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Focus detail overlays / modals selection states
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Directly piped modals
  const [billForPayment, setBillForPayment] = useState<Bill | null>(null);
  const [billForReminder, setBillForReminder] = useState<Bill | null>(null);

  // 1. INITIALIZE DATABASE FROM LOCALSTORAGE OR FALLBACK SEEDS
  useEffect(() => {
    try {
      const loggedIn = localStorage.getItem('kostos_logged_in');
      if (loggedIn === 'true') {
        setAuthMode('dashboard');
      }

      const localSettings = localStorage.getItem('kostos_settings');
      if (localSettings) setKostSettings(JSON.parse(localSettings));

      const localRooms = localStorage.getItem('kostos_rooms');
      if (localRooms) {
        setRooms(JSON.parse(localRooms));
      } else {
        setRooms(INITIAL_ROOMS);
        localStorage.setItem('kostos_rooms', JSON.stringify(INITIAL_ROOMS));
      }

      const localTenants = localStorage.getItem('kostos_tenants');
      if (localTenants) {
        setTenants(JSON.parse(localTenants));
      } else {
        setTenants(INITIAL_TENANTS);
        localStorage.setItem('kostos_tenants', JSON.stringify(INITIAL_TENANTS));
      }

      const localBills = localStorage.getItem('kostos_bills');
      if (localBills) {
        setBills(JSON.parse(localBills));
      } else {
        setBills(INITIAL_BILLS);
        localStorage.setItem('kostos_bills', JSON.stringify(INITIAL_BILLS));
      }

      const localExpenses = localStorage.getItem('kostos_expenses');
      if (localExpenses) {
        setExpenses(JSON.parse(localExpenses));
      } else {
        setExpenses(INITIAL_EXPENSES);
        localStorage.setItem('kostos_expenses', JSON.stringify(INITIAL_EXPENSES));
      }

      const localComplaints = localStorage.getItem('kostos_complaints');
      if (localComplaints) {
        setComplaints(JSON.parse(localComplaints));
      } else {
        setComplaints(INITIAL_COMPLAINTS);
        localStorage.setItem('kostos_complaints', JSON.stringify(INITIAL_COMPLAINTS));
      }

    } catch (e) {
      console.error("Gagal memuat LocalStorage data. Mulai dengan seed default.", e);
    }
  }, []);

  // 2. SYNCHRONIZE STATE TO LOCALSTORAGE
  useEffect(() => {
    if (rooms.length > 0) localStorage.setItem('kostos_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    if (tenants.length > 0) localStorage.setItem('kostos_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    if (bills.length > 0) localStorage.setItem('kostos_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    if (expenses.length > 0) localStorage.setItem('kostos_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    if (complaints.length > 0) localStorage.setItem('kostos_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('kostos_settings', JSON.stringify(kostSettings));
  }, [kostSettings]);


  // 3. CORE STATE MUTATORS
  const handleUpdateSettings = (newSettings: KostSettings) => {
    setKostSettings(newSettings);
  };

  const handleAddRoom = (newRoom: Room) => {
    const updated = [...rooms, newRoom];
    setRooms(updated);
  };

  const handleUpdateRoomStatus = (roomId: string, nextStatus: RoomStatus) => {
    const updated = rooms.map(r => r.id === roomId ? { ...r, status: nextStatus } : r);
    setRooms(updated);
  };

  const handleDeleteRoom = (id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
  };

  const handleAddTenant = (newTenant: Tenant, assignedRoomId: string) => {
    // 1. Add tenant
    setTenants(prev => [...prev, newTenant]);

    // 2. Update Room: mark 'Terisi' and assign tenantId
    setRooms(prev => prev.map(r => 
      r.id === assignedRoomId ? { ...r, status: 'Terisi' as RoomStatus, tenantId: newTenant.id } : r
    ));

    // 3. Create a default bill invoice for June 2026 for this new tenant automatically!
    const activeRoom = rooms.find(r => r.id === assignedRoomId);
    const roomNo = activeRoom ? activeRoom.number : newTenant.roomAssigned;
    const defaultRentAmount = activeRoom ? activeRoom.price : newTenant.rentAmount;

    const autoInceptionBill: Bill = {
      id: `bill-auto-${Date.now()}`,
      tenantId: newTenant.id,
      tenantName: newTenant.name,
      roomId: assignedRoomId,
      roomNumber: roomNo,
      period: selectedMonth,
      dueDate: `2026-06-05`,
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
  };

  const handleMoveOutTenant = (tenantId: string, roomNumber: string) => {
    // 1. Filter out or remove from active tenants list
    setTenants(prev => prev.filter(t => t.id !== tenantId));

    // 2. Clear Room assigned: set to 'Kosong' and remove tenantId
    setRooms(prev => prev.map(r => 
      r.number === roomNumber ? { ...r, status: 'Kosong' as RoomStatus, tenantId: undefined } : r
    ));

    // 3. Automatically cancel/clear unpaid bills of this tenant
    setBills(prev => prev.filter(b => !(b.tenantId === tenantId && b.status !== 'Lunas')));
  };

  const handleDeleteTenant = (id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
  };

  const handleAddBill = (newBill: Bill) => {
    setBills(prev => [newBill, ...prev]);

    // Update corresponding tenant status to 'Belum Bayar'
    setTenants(prev => prev.map(t => 
      t.id === newBill.tenantId ? { ...t, status: 'Belum Bayar' as TenantStatus } : t
    ));
    
    // Update corresponding Room status if necessary
    setRooms(prev => prev.map(r =>
      r.number === newBill.roomNumber ? { ...r, status: 'Terisi' as RoomStatus } : r
    ));
  };

  const handleDeleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const handleRecordPayment = (billId: string, amountPaid: number, method: string, date: string, notes?: string) => {
    setBills(prev => prev.map(b => {
      if (b.id === billId) {
        const nextPaid = b.paidAmount + amountPaid;
        const reachedLunas = nextPaid >= b.totalAmount;
        const statusVal = reachedLunas ? 'Lunas' : 'Sebagian';

        // 1. Immediately update corresponding Tenant and Room status!
        if (reachedLunas) {
          setTenants(tPrev => tPrev.map(t => 
            t.id === b.tenantId ? { ...t, status: 'Lunas' as TenantStatus } : t
          ));
          setRooms(rPrev => rPrev.map(r => 
            r.number === b.roomNumber ? { ...r, status: 'Terisi' as RoomStatus } : r
          ));
        }

        return {
          ...b,
          paidAmount: nextPaid,
          status: statusVal,
          paymentMethod: method,
          paymentDate: date,
          notes: notes || b.notes
        };
      }
      return b;
    }));
  };

  const handleAddExpense = (newExpense: Expense) => {
    setExpenses(prev => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleAddComplaint = (newComplaint: Complaint) => {
    setComplaints(prev => [newComplaint, ...prev]);
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
  };


  // 4. LANDING, AUTHENTICATION AND ONBOARDING FLOW handlers
  const handleFirstTimeOnboard = (kostIn: any) => {
    const freshSettings: KostSettings = {
      ...kostSettings,
      kostName: kostIn.name,
      ownerName: kostIn.owner,
      whatsapp: kostIn.phone,
      bankAccounts: [
        { id: 'bank-a', bankName: 'BCA', accountNumber: kostIn.bankNo, accountHolder: kostIn.owner.toUpperCase() }
      ]
    };
    setKostSettings(freshSettings);

    // Build fresh empty room grids from capacity
    const freshRooms: Room[] = [];
    for (let i = 1; i <= kostIn.capacity; i++) {
      const roomNo = `A0${i}`;
      freshRooms.push({
        id: `room-onb-${i}`,
        number: roomNo,
        status: 'Kosong',
        type: 'Standard',
        price: kostIn.standardPrice,
        floor: 1,
        size: '3x3 m',
        facilities: ['Kipas Angin', 'Kasur Single', 'WiFi', 'Lemari Baju']
      });
    }
    setRooms(freshRooms);
    localStorage.setItem('kostos_rooms', JSON.stringify(freshRooms));

    localStorage.setItem('kostos_logged_in', 'true');
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

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        if (backupData.version && backupData.kostSettings) {
          setKostSettings(backupData.kostSettings);
          if (backupData.rooms) setRooms(backupData.rooms);
          if (backupData.tenants) setTenants(backupData.tenants);
          if (backupData.bills) setBills(backupData.bills);
          if (backupData.expenses) setExpenses(backupData.expenses);
          if (backupData.complaints) setComplaints(backupData.complaints);
          alert("✓ Database KOSTOS sukses dipulihkan dari file backup!");
        } else {
          alert("⚠️ Format file JSON backup belum valid.");
        }
      } catch (err) {
        alert("⚠️ Gagal membaca berkas backup. Pastikan file JSON sah.");
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
        onInitializeKost={(kostConfig, roomCount, basePrice) => {
          handleFirstTimeOnboard({
            name: kostConfig.kostName || 'Kost Mawar Indah',
            owner: kostConfig.ownerName || 'Ibu Indah Lestari',
            phone: kostConfig.whatsapp || '081234567890',
            bankNo: kostConfig.bankAccounts?.[0]?.accountNumber || '2330998877',
            capacity: roomCount,
            standardPrice: basePrice
          });
        }}
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
          onClose={() => setBillForReminder(null)} 
        />
      )}

    </div>
  );
}
