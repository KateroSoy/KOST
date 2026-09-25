import React, { useState, useEffect } from 'react';
import {
  Room, Tenant, Bill, Expense, Complaint, KostSettings, Property,
  ComplaintStatus, RoomStatus, TenantStatus, HousekeepingStatus, UserRole,
  Booking, BookingStatus, WebsiteConfig, OperationTask, OperationStatus, StaffMember,
  AuthUser, PropertyType
} from './types';
import { 
  INITIAL_SETTINGS, 
  INITIAL_ROOMS, 
  INITIAL_TENANTS, 
  INITIAL_BILLS, 
  INITIAL_EXPENSES, 
  INITIAL_COMPLAINTS,
  INITIAL_PROPERTIES,
  INITIAL_BOOKINGS,
  INITIAL_OPERATION_TASKS,
  INITIAL_WEBSITE_CONFIGS,
  INITIAL_STAFF
} from './data';
import { fetchAllData, syncToBackend, getToken, clearToken, authLogout, authMe, setPlanLockedHandler, fetchPublicPropertyData, submitPublicBooking, PublicPropertyData } from './api';
import { generateId } from './utils';

// Import All Views
import { LandingPage } from './components/LandingPage';
import { PropertyPublicWebsite } from './components/PropertyPublicWebsite';
import { AuthScreens } from './components/AuthScreens';
import { SidebarAndNav } from './components/SidebarAndNav';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RoomsView } from './components/RoomsView';
import { BookingsView } from './components/BookingsView';
import { TenantsView } from './components/TenantsView';
import { BillsView } from './components/BillsView';
import { PaymentsView } from './components/PaymentsView';
import { OperationsView } from './components/OperationsView';
import { WebsiteEditorView } from './components/WebsiteEditorView';
import { TeamView } from './components/TeamView';
import { ExpensesView } from './components/ExpensesView';
import { ComplaintsView } from './components/ComplaintsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { SuperAdminView } from './components/SuperAdminView';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';
import { UpgradePromptModal } from './components/UpgradePromptModal';
import { TrialBanner } from './components/TrialBanner';
import {
  parseCurrentRoute, 
  navigateTo, 
  goBackWithFallback, 
  AuthMode, 
  DashboardTab
} from './router';

const PRO_TAB_IDS: DashboardTab[] = ['bookings', 'website', 'operations', 'team', 'reports'];

// Website config for a property that has none saved yet. Demo configs are only reused for the
// demo property ids themselves; real properties get their own subdomain and copy, because
// subdomain/customDomain are globally unique on the backend.
const websiteConfigFor = (prop: Property | undefined, subdomain?: string): WebsiteConfig => {
  if (!prop) return INITIAL_WEBSITE_CONFIGS['prop-1'];
  if (INITIAL_WEBSITE_CONFIGS[prop.id]) return INITIAL_WEBSITE_CONFIGS[prop.id];
  const demo = INITIAL_WEBSITE_CONFIGS['prop-1'];
  return {
    ...demo,
    propertyId: prop.id,
    subdomain: subdomain || prop.slug || prop.name.toLowerCase().replace(/[^a-z0-9]/g, '') || prop.id,
    customDomain: undefined,
    headline: `Selamat datang di ${prop.name}.`,
    subheadline: 'Kamar nyaman, fasilitas lengkap, dan pengelolaan yang responsif.',
    aboutText: `${prop.name} siap menjadi tempat tinggal yang nyaman untuk Anda.`,
    whatsappDirect: prop.whatsapp || demo.whatsappDirect,
  };
};

export default function App() {
  const initialRoute = parseCurrentRoute();
  
  // Authorization State: 'landing' | 'login' | 'register' | 'onboarding' | 'dashboard' | 'property-website'
  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    if (initialRoute.authMode !== 'landing') return initialRoute.authMode;
    if (getToken() || localStorage.getItem('kostos_logged_in') === 'true') {
      return 'dashboard';
    }
    return 'landing';
  });

  // Preview property state for public website
  const [previewPropertyId, setPreviewPropertyId] = useState<string>(() => {
    return initialRoute.propertyId || 'prop-1';
  });
  const [publicPropertyData, setPublicPropertyData] = useState<PublicPropertyData | null>(null);
  const [publicPropertyLoading, setPublicPropertyLoading] = useState(initialRoute.authMode === 'property-website');

  // Contextual back navigation origin ('landing' | 'website' | 'settings' | 'dashboard')
  const [returnSource, setReturnSource] = useState<string | undefined>(() => {
    return initialRoute.from;
  });

  // User Role State: 'super_admin' | 'owner'
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('kostos_user_role') as UserRole) || 'owner';
  });

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('kostos_auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);

  const isProLockActive = authUser ? authUser.role !== 'super_admin' && authUser.effectivePlan !== 'pro' : false;
  const lockedTabIds: DashboardTab[] = isProLockActive ? PRO_TAB_IDS : [];

  // Demo Mode: true when user clicks "Try Demo" without registering
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() =>
    !getToken() && localStorage.getItem('kostos_logged_in') === 'true'
  );
  const [dataLoading, setDataLoading] = useState(() => Boolean(getToken()));
  const [dataLoadError, setDataLoadError] = useState('');

  // Multi-Property Account States
  const [properties, setProperties] = useState<Property[]>(() => {
    try {
      const raw = localStorage.getItem('kostos_properties');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_PROPERTIES;
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const propParam = urlParams.get('property');
      if (propParam) return propParam;
      return localStorage.getItem('kostos_selected_property') || 'all';
    } catch {
      return 'all';
    }
  });

  // Database core States
  const [kostSettings, setKostSettings] = useState<KostSettings>(INITIAL_SETTINGS);
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const raw = localStorage.getItem('kostos_rooms');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_ROOMS;
  });
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    try {
      const raw = localStorage.getItem('kostos_tenants');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_TENANTS;
  });
  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const raw = localStorage.getItem('kostos_bills');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_BILLS;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const raw = localStorage.getItem('kostos_expenses');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_EXPENSES;
  });
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      const raw = localStorage.getItem('kostos_complaints');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_COMPLAINTS;
  });

  // Extended States for BISNIESGO Living
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const raw = localStorage.getItem('kostos_bookings');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_BOOKINGS;
  });

  const [operationTasks, setOperationTasks] = useState<OperationTask[]>(() => {
    try {
      const raw = localStorage.getItem('kostos_operations');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_OPERATION_TASKS;
  });

  const [websiteConfigs, setWebsiteConfigs] = useState<Record<string, WebsiteConfig>>(() => {
    try {
      const raw = localStorage.getItem('kostos_website_configs');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_WEBSITE_CONFIGS;
  });

  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    try {
      const raw = localStorage.getItem('kostos_staff');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_STAFF;
  });

  // Navigation and UI layouts
  const [selectedTab, setSelectedTab] = useState<DashboardTab>(() => {
    return initialRoute.tab || 'dashboard';
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const now = new Date();
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  });

  // Focus detail overlays / modals selection states
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Directly piped modals
  const [billForPayment, setBillForPayment] = useState<Bill | null>(null);
  const [billForReminder, setBillForReminder] = useState<Bill | null>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  // Listen to browser history navigation (Back / Forward buttons) and internal route events
  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentRoute();

      if (route.authMode === 'dashboard' && isProLockActive && PRO_TAB_IDS.includes(route.tab)) {
        // Direct URL / back-forward navigation into a locked tab bypasses the sidebar's own
        // click-time guard — redirect back to the dashboard and surface the upgrade prompt.
        setUpgradePromptOpen(true);
        navigateTo({ authMode: 'dashboard', tab: 'dashboard' }, { replace: true });
        setSelectedTab('dashboard');
        return;
      }

      setAuthMode(route.authMode);
      setSelectedTab(route.tab);
      if (route.propertyId) setPreviewPropertyId(route.propertyId);
      setReturnSource(route.from);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('app-route-change', handlePopState as EventListener);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('app-route-change', handlePopState as EventListener);
    };
  }, [isProLockActive]);

  // 1. INITIALIZE DATABASE FROM HYBRID API
  useEffect(() => {
    if (authMode === 'onboarding') return;
    let cancelled = false;
    if (getToken() && authMode === 'dashboard') {
      setDataLoading(true);
      setDataLoadError('');
    }
    // Token-based auto-login
    if (getToken()) {
      const savedRole = localStorage.getItem('kostos_user_role');
      if (savedRole === 'super_admin') {
        setUserRole('super_admin');
        if (initialRoute.tab === 'dashboard') setSelectedTab('super_admin');
      }
    }

    fetchAllData().then((data) => {
      if (cancelled) return;
      if (data.settings) setKostSettings(data.settings);
      if (data.rooms) setRooms(data.rooms);
      if (data.tenants) setTenants(data.tenants);
      if (data.bills) setBills(data.bills);
      if (data.expenses) setExpenses(data.expenses);
      if (data.complaints) setComplaints(data.complaints);
      if (data.properties && data.properties.length > 0) {
        setProperties(data.properties);
      } else if (getToken()) {
        // Authenticated but the backend has no Property rows yet (registration only
        // creates Settings, not a Property). Show the user's own account as their
        // sole property instead of leaving the bundled demo properties in state.
        const s = data.settings || kostSettings;
        setProperties([{
          id: 'prop-1',
          name: s.kostName,
          type: 'Coliving',
          slug: '',
          address: s.address,
          city: '',
          description: '',
          whatsapp: s.whatsapp,
          ownerName: s.ownerName,
          checkInTime: s.checkInTime,
          checkOutTime: s.checkOutTime,
          bankAccounts: s.bankAccounts,
          qrisMerchantId: s.qrisMerchantId ?? undefined,
        }]);
      }
      if (data.bookings) setBookings(data.bookings);
      if (data.operations) setOperationTasks(data.operations);
      if (data.staffList) setStaffList(data.staffList);
      if (data.websiteConfigs) {
        // data.websiteConfigs is an array of rows keyed by propertyId; guard against a
        // non-array value too since it may come from a differently-shaped local cache.
        const configMap = Array.isArray(data.websiteConfigs)
          ? data.websiteConfigs.reduce((acc, c) => ({ ...acc, [c.propertyId]: c }), {})
          : data.websiteConfigs;
        setWebsiteConfigs(configMap);
      }
    }).catch(() => {
      if (!cancelled) setDataLoadError('Data akun gagal dimuat. Periksa koneksi lalu muat ulang.');
    }).finally(() => {
      if (!cancelled) setDataLoading(false);
    });
    return () => { cancelled = true; };
  }, [authMode]);

  // Register the PLAN_LOCKED notification handler once
  useEffect(() => {
    setPlanLockedHandler(() => setUpgradePromptOpen(true));
    return () => setPlanLockedHandler(null);
  }, []);

  // A signed-in owner previewing one of their own properties renders from local state;
  // any other property (e.g. opened from the landing-page catalog) comes from the public API.
  const isOwnPreview = !!getToken() && properties.some(p => p.id === previewPropertyId);

  useEffect(() => {
    if (authMode !== 'property-website' || isOwnPreview) return;
    let cancelled = false;
    setPublicPropertyData(null);
    setPublicPropertyLoading(true);
    fetchPublicPropertyData(previewPropertyId)
      .then(data => { if (!cancelled) setPublicPropertyData(data); })
      .catch(() => { if (!cancelled) setPublicPropertyData(null); })
      .finally(() => { if (!cancelled) setPublicPropertyLoading(false); });
    return () => { cancelled = true; };
  }, [authMode, previewPropertyId, isOwnPreview]);

  // Refresh the authenticated user (plan/trial fields) whenever we enter the dashboard
  useEffect(() => {
    if (authMode !== 'dashboard' || !getToken()) return;
    authMe().then((data: any) => {
      setAuthUser({
        id: data.id,
        name: data.name,
        phone: data.phone,
        slug: data.slug,
        role: data.role,
        status: data.status,
        plan: data.plan,
        effectivePlan: data.effectivePlan || data.plan,
        expiresAt: data.expiresAt ?? null,
      });
    }).catch(() => {});
  }, [authMode]);

  // Correct a deep-link (or stale) landing on a now-locked tab once plan status is known
  useEffect(() => {
    if (isProLockActive && PRO_TAB_IDS.includes(selectedTab)) {
      setUpgradePromptOpen(true);
      setSelectedTab('dashboard');
      navigateTo({ authMode: 'dashboard', tab: 'dashboard' }, { replace: true });
    }
  }, [isProLockActive]);

  // Persist authUser for offline resilience
  useEffect(() => {
    if (authUser) {
      localStorage.setItem('kostos_auth_user', JSON.stringify(authUser));
    } else {
      localStorage.removeItem('kostos_auth_user');
    }
  }, [authUser]);

  // 2. SYNCHRONIZE STATE TO LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem('kostos_properties', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('kostos_selected_property', selectedPropertyId);
  }, [selectedPropertyId]);

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

  useEffect(() => {
    localStorage.setItem('kostos_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('kostos_operations', JSON.stringify(operationTasks));
  }, [operationTasks]);

  useEffect(() => {
    localStorage.setItem('kostos_website_configs', JSON.stringify(websiteConfigs));
  }, [websiteConfigs]);

  useEffect(() => {
    localStorage.setItem('kostos_staff', JSON.stringify(staffList));
  }, [staffList]);

  // Scoped Filters based on selected property
  const filteredRooms = selectedPropertyId === 'all' ? rooms : rooms.filter(r => !r.propertyId || r.propertyId === selectedPropertyId);
  const filteredTenants = selectedPropertyId === 'all' ? tenants : tenants.filter(t => !t.propertyId || t.propertyId === selectedPropertyId);
  const filteredBills = selectedPropertyId === 'all' ? bills : bills.filter(b => !b.propertyId || b.propertyId === selectedPropertyId);
  const filteredExpenses = selectedPropertyId === 'all' ? expenses : expenses.filter(e => !e.propertyId || e.propertyId === selectedPropertyId);
  const filteredComplaints = selectedPropertyId === 'all' ? complaints : complaints.filter(c => !c.propertyId || c.propertyId === selectedPropertyId);
  const filteredBookings = selectedPropertyId === 'all' ? bookings : bookings.filter(b => !b.propertyId || b.propertyId === selectedPropertyId);
  const filteredOperationTasks = selectedPropertyId === 'all' ? operationTasks : operationTasks.filter(t => !t.propertyId || t.propertyId === selectedPropertyId);

  // PROPERTY MUTATORS
  const handleAddProperty = (newProp: Property) => {
    const updated = [...properties, newProp];
    setProperties(updated);
    setSelectedPropertyId(newProp.id);
    syncToBackend('properties', 'POST', newProp);
  };

  const handleUpdateProperty = (updatedProp: Property) => {
    const updated = properties.map(p => p.id === updatedProp.id ? updatedProp : p);
    setProperties(updated);
    syncToBackend(`properties/${updatedProp.id}`, 'PUT', updatedProp);
  };

  const handleDeleteProperty = (id: string) => {
    const updated = properties.filter(p => p.id !== id);
    setProperties(updated);
    if (selectedPropertyId === id) setSelectedPropertyId('all');
    syncToBackend(`properties/${id}`, 'DELETE');
  };

  // CORE STATE MUTATORS
  const handleUpdateSettings = (newSettings: KostSettings) => {
    setKostSettings(newSettings);
    syncToBackend('settings', 'PUT', newSettings);
  };

  const handleAddRoom = (newRoom: Room) => {
    const roomWithProp = { ...newRoom, propertyId: selectedPropertyId !== 'all' ? selectedPropertyId : (properties[0]?.id || 'prop-1') };
    setRooms(prev => [...prev, roomWithProp]);
    syncToBackend('rooms', 'POST', roomWithProp);
  };

  const handleUpdateRoomStatus = (id: string, status: RoomStatus, tenantId?: string) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status, tenantId } : r));
    syncToBackend(`rooms/${id}/status`, 'PATCH', { status, tenantId });
  };

  const handleUpdateHousekeepingStatus = (id: string, housekeepingStatus: HousekeepingStatus) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, housekeepingStatus } : r));
    syncToBackend(`rooms/${id}/housekeeping`, 'PATCH', { housekeepingStatus });
  };

  const handleDeleteRoom = (id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
    syncToBackend(`rooms/${id}`, 'DELETE');
  };

  const handleAddTenant = (newTenant: Tenant, assignedRoomId: string) => {
    const tenantWithProp = { ...newTenant, propertyId: selectedPropertyId !== 'all' ? selectedPropertyId : (properties[0]?.id || 'prop-1') };
    setTenants(prev => [...prev, tenantWithProp]);
    setRooms(prev => prev.map(r => (r.id === assignedRoomId || r.number === newTenant.roomAssigned) ? { ...r, status: 'Terisi', tenantId: tenantWithProp.id } : r));
    syncToBackend('tenants', 'POST', tenantWithProp);
  };

  const handleMoveOutTenant = (tenantId: string, roomNumber: string) => {
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status: 'Keluar' } : t));
    setRooms(prev => prev.map(r => r.number === roomNumber ? { ...r, status: 'Kosong', tenantId: undefined, housekeepingStatus: 'Kotor' } : r));
    syncToBackend(`tenants/${tenantId}/moveout`, 'POST', { roomNumber });
  };

  const handleDeleteTenant = (id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
    syncToBackend(`tenants/${id}`, 'DELETE');
  };

  const handleAddBill = (newBill: Bill) => {
    const billWithProp = { ...newBill, propertyId: selectedPropertyId !== 'all' ? selectedPropertyId : (properties[0]?.id || 'prop-1') };
    setBills(prev => [billWithProp, ...prev]);
    syncToBackend('bills', 'POST', billWithProp);
  };

  const handleRecordPayment = async (billId: string, amount: number, method: string, date: string, notes?: string) => {
    const saved = await syncToBackend(`bills/${billId}/payment`, 'POST', { amount, method, date, notes });
    if (!saved) throw new Error('Pembayaran gagal disimpan. Periksa koneksi dan coba lagi.');
    setBills(prev => prev.map(b => {
      if (b.id === billId) {
        const newPaid = (b.paidAmount || 0) + amount;
        const newStatus = newPaid >= b.totalAmount ? 'Lunas' : 'Sebagian';
        return {
          ...b,
          paidAmount: newPaid,
          status: newStatus,
          paymentMethod: method,
          paymentDate: date,
          notes: notes || b.notes
        };
      }
      return b;
    }));
  };

  const handleDeleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
    syncToBackend(`bills/${id}`, 'DELETE');
  };

  const handleAddExpense = (newExpense: Expense) => {
    const expWithProp = { ...newExpense, propertyId: selectedPropertyId !== 'all' ? selectedPropertyId : (properties[0]?.id || 'prop-1') };
    setExpenses(prev => [expWithProp, ...prev]);
    syncToBackend('expenses', 'POST', expWithProp);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    syncToBackend(`expenses/${id}`, 'DELETE');
  };

  const handleAddComplaint = (newComplaint: Complaint) => {
    const compWithProp = { ...newComplaint, propertyId: selectedPropertyId !== 'all' ? selectedPropertyId : (properties[0]?.id || 'prop-1') };
    setComplaints(prev => [compWithProp, ...prev]);
    syncToBackend('complaints', 'POST', compWithProp);
  };

  const handleUpdateComplaintStatus = (id: string, status: ComplaintStatus, repairCost?: number, notes?: string) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status, repairCost: repairCost || c.repairCost, notes: notes || c.notes } : c));
    syncToBackend(`complaints/${id}/status`, 'PATCH', { status, repairCost, notes });
  };

  const handleDeleteComplaint = (id: string) => {
    setComplaints(prev => prev.filter(c => c.id !== id));
    syncToBackend(`complaints/${id}`, 'DELETE');
  };

  const handleFirstTimeOnboard = async (
    kostConfig: Partial<KostSettings>,
    roomCount: number,
    basePrice: number,
    templateId?: string,
    subdomain?: string,
    propertyMeta?: { city: string; type: PropertyType }
  ) => {
    const newSettings = { ...kostSettings, ...kostConfig };
    const propId = localStorage.getItem('kostos_onboarding_property_id') || generateId('prop');
    localStorage.setItem('kostos_onboarding_property_id', propId);
    const property: Property = {
      id: propId,
      name: newSettings.kostName,
      type: propertyMeta?.type || 'Coliving',
      slug: subdomain || '',
      address: newSettings.address,
      city: propertyMeta?.city || '',
      description: '',
      whatsapp: newSettings.whatsapp,
      ownerName: newSettings.ownerName,
      startPriceMonth: basePrice,
    };
    if (!await syncToBackend('settings', 'PUT', newSettings) ||
        !await syncToBackend('properties', 'POST', property)) {
      throw new Error('Pengaturan properti gagal disimpan. Coba lagi.');
    }
    const generatedRooms: Room[] = [];
    for (let i = 1; i <= roomCount; i++) {
      generatedRooms.push({
        id: `room-${propId}-${i}`,
        propertyId: propId,
        number: i < 10 ? '0' + i : String(i), // views already prefix "Kamar "
        status: 'Kosong',
        housekeepingStatus: 'Bersih',
        type: i % 3 === 0 ? 'Studio Plus' : 'Studio',
        price: basePrice,
        pricePerMonth: basePrice,
        pricePerDay: Math.round(basePrice / 25),
        floor: i <= 10 ? 1 : 2,
        size: '4x4 m',
        facilities: ['AC', 'WiFi', 'Private Bathroom', 'Queen Bed'],
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80']
      });
    }
    // Small batches: shared hosting caps concurrent PHP/MySQL connections, and up to 40
    // parallel POSTs trip "[2002] Operation not permitted".
    for (let i = 0; i < generatedRooms.length; i += 4) {
      const batch = generatedRooms.slice(i, i + 4);
      const saved = await Promise.all(batch.map(room => syncToBackend('rooms', 'POST', room)));
      if (saved.some(ok => !ok)) throw new Error('Sebagian kamar gagal disimpan. Coba lagi.');
    }

    // Update website config if template and subdomain are provided
    if (templateId || subdomain) {
      const existingConfig = websiteConfigs[propId] || websiteConfigFor(property, subdomain);
      const newConfig = {
        ...existingConfig,
        propertyId: propId,
        templateId: (templateId || existingConfig.templateId) as any,
        subdomain: subdomain || existingConfig.subdomain,
      };
      if (!await syncToBackend('website-configs', 'POST', newConfig)) {
        throw new Error('Tampilan website gagal disimpan. Coba lagi.');
      }
      setWebsiteConfigs(prev => ({ ...prev, [propId]: newConfig }));
    }
    setKostSettings(newSettings);
    setProperties([property]);
    setSelectedPropertyId(propId);
    setRooms(generatedRooms);
    setTenants([]);
    setBills([]);
    setExpenses([]);
    setComplaints([]);
    setBookings([]);
    setOperationTasks([]);
    setStaffList([]);
    localStorage.removeItem('kostos_onboarding_property_id');
  };

  const handleLogout = () => {
    if (getToken()) void authLogout();
    clearToken();
    localStorage.removeItem('kostos_logged_in');
    localStorage.removeItem('kostos_owner_slug');
    localStorage.removeItem('kostos_user_role');
    setIsDemoMode(false);
    setAuthUser(null);
    setUserRole('owner');
    setDataLoading(false);
    setDataLoadError('');
    setProperties(INITIAL_PROPERTIES);
    setRooms(INITIAL_ROOMS);
    setTenants(INITIAL_TENANTS);
    setBills(INITIAL_BILLS);
    setExpenses(INITIAL_EXPENSES);
    setComplaints(INITIAL_COMPLAINTS);
    setBookings(INITIAL_BOOKINGS);
    setOperationTasks(INITIAL_OPERATION_TASKS);
    setStaffList(INITIAL_STAFF);
    setSelectedTab('dashboard');
    navigateTo({ authMode: 'landing' }, { replace: true });
  };

  const handleExportBackup = () => {
    const payload = {
      version: 'BISNIESGO-LIVING-1',
      exportedAt: new Date().toISOString(),
      kostSettings, rooms, tenants, bills, expenses, complaints, properties,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `bisniesgo-living-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackupMsg('File cadangan berhasil diunduh.');
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const keys = ['rooms', 'tenants', 'bills', 'expenses', 'complaints', 'properties'] as const;
      if (!data || typeof data !== 'object' ||
          !['BISNIESGO-LIVING-1', 'StayFlow-v1-2026'].includes(data.version) ||
          !data.kostSettings || typeof data.kostSettings !== 'object' || Array.isArray(data.kostSettings) ||
          keys.some(key => data[key] !== undefined && !Array.isArray(data[key]))) {
        throw new Error('Format file cadangan tidak valid.');
      }
      if (!window.confirm('Pulihkan cadangan ini? Data kamar, penghuni, tagihan, pengeluaran, dan keluhan saat ini akan diganti.')) return;
      const payload = {
        kostSettings: data.kostSettings,
        rooms: data.rooms || [], tenants: data.tenants || [], bills: data.bills || [],
        expenses: data.expenses || [], complaints: data.complaints || [],
        properties: data.properties || [],
      };
      const saved = await syncToBackend('restore', 'POST', payload);
      if (!saved) throw new Error('Pemulihan gagal disimpan di server. Data saat ini tidak diubah.');
      setKostSettings(payload.kostSettings);
      setRooms(payload.rooms);
      setTenants(payload.tenants);
      setBills(payload.bills);
      setExpenses(payload.expenses);
      setComplaints(payload.complaints);
      if (data.properties) setProperties(payload.properties);
      setBackupMsg('Cadangan berhasil dipulihkan.');
    } catch (error) {
      setBackupMsg(error instanceof Error ? error.message : 'Gagal membaca file cadangan.');
    }
  };

  const handleQuickActionSelection = (actionId: string) => {
    if (actionId === 'add-booking') {
      navigateTo({ authMode: 'dashboard', tab: 'bookings' });
    } else if (actionId === 'add-tenant') {
      navigateTo({ authMode: 'dashboard', tab: 'tenants' });
    } else if (actionId === 'record-payment') {
      setBillForPayment(null);
      navigateTo({ authMode: 'dashboard', tab: 'payments' });
    } else if (actionId === 'add-room') {
      navigateTo({ authMode: 'dashboard', tab: 'rooms' });
    }
  };

  // 7. MULTIPLEXING TAB ROUTING LAYOUTS
  const renderTabContent = () => {
    if (lockedTabIds.includes(selectedTab)) {
      return (
        <div className="bg-white rounded-[32px] p-10 text-center space-y-4 max-w-md mx-auto animate-fade-in-up">
          <p className="text-sm font-bold text-[#171A18]">Fitur ini memerlukan paket Pro.</p>
          <p className="text-xs text-[#6E746F]">Upgrade akun Anda untuk membuka tab ini.</p>
          <button
            onClick={() => setUpgradePromptOpen(true)}
            className="px-5 py-2.5 bg-[#173B30] text-[#F5F1E8] rounded-xl text-xs font-extrabold hover:bg-[#0f2720] transition-colors cursor-pointer"
          >
            Lihat Detail Upgrade
          </button>
        </div>
      );
    }

    switch (selectedTab) {
      case 'super_admin':
        return (
          <SuperAdminView 
            onOpenOwnerLandingPage={(slug) => {
              window.open(`/?owner=${slug}`, '_blank');
            }} 
          />
        );

      case 'dashboard':
        return (
          <DashboardView 
            rooms={filteredRooms} 
            tenants={filteredTenants} 
            bills={filteredBills} 
            expenses={filteredExpenses} 
            complaints={filteredComplaints}
            bookings={filteredBookings}
            operationTasks={filteredOperationTasks}
            settings={kostSettings}
            selectedMonth={selectedMonth}
            activeProperty={properties.find(p => p.id === selectedPropertyId)}
            properties={properties}
            onNavigateToTab={(tab, arg) => {
              if (tab === 'rooms' && arg) setSelectedRoomId(arg);
              if (tab === 'tenants' && arg) setSelectedTenantId(arg);
              if (tab === 'bills' && arg) setSelectedBillId(arg);
              navigateTo({ authMode: 'dashboard', tab: tab as DashboardTab });
            }}
            onOpenReminderModal={(bill) => setBillForReminder(bill)}
            onOpenPaymentForm={(bill) => {
              setBillForPayment(bill);
              navigateTo({ authMode: 'dashboard', tab: 'payments' });
            }}
          />
        );
      
      case 'rooms':
        return (
          <RoomsView 
            rooms={filteredRooms} 
            tenants={filteredTenants} 
            bills={filteredBills}
            selectedRoomId={selectedRoomId}
            onSelectRoomId={setSelectedRoomId}
            onAddRoom={handleAddRoom}
            onUpdateRoomStatus={handleUpdateRoomStatus}
            onUpdateHousekeepingStatus={handleUpdateHousekeepingStatus}
            onDeleteRoom={handleDeleteRoom}
            onNavigateToTab={(tab, arg) => {
              if (tab === 'tenants' && arg) setSelectedTenantId(arg);
              navigateTo({ authMode: 'dashboard', tab: tab as DashboardTab });
            }}
          />
        );

      case 'bookings':
        return (
          <BookingsView
            bookings={filteredBookings}
            rooms={filteredRooms}
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onAddBooking={(newBooking) => {
              setBookings([newBooking, ...bookings]);
              syncToBackend('bookings', 'POST', newBooking);
              if (newBooking.roomId) {
                handleUpdateRoomStatus(newBooking.roomId, 'Booking');
              }
            }}
            onUpdateBookingStatus={(bookingId, status) => {
              const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, status } : b);
              setBookings(updatedBookings);
              syncToBackend(`bookings/${bookingId}/status`, 'PATCH', { status });
              const found = updatedBookings.find(b => b.id === bookingId);

              if (found && found.roomId) {
                if (status === 'Confirmed' || status === 'Checked In') {
                  handleUpdateRoomStatus(found.roomId, 'Terisi');
                } else if (status === 'Cancelled' || status === 'Checked Out') {
                  handleUpdateRoomStatus(found.roomId, 'Kosong');
                }
              }
            }}
            onConvertToTenant={(booking) => {
              const newTenant: Tenant = {
                id: generateId('tenant'),
                propertyId: booking.propertyId,
                name: booking.guestName,
                phone: booking.guestPhone,
                email: booking.guestEmail || `${booking.guestName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
                idNumber: `ID-${Date.now().toString().slice(-6)}`,
                roomAssigned: booking.roomNumber || booking.roomType,
                moveInDate: booking.moveInDate,
                rentAmount: Math.round(booking.totalAmount / (booking.durationMonths || 1)),
                deposit: booking.depositAmount || 0,
                status: 'Lunas',
                bookingOrigin: (booking.source === 'Website' ? 'Online Web' : booking.source === 'WhatsApp' ? 'WhatsApp' : 'Walk-in') as any,
                emergencyContact: {
                  name: '-',
                  relation: 'Keluarga',
                  phone: '-'
                },
                notes: booking.notes
              };
              handleAddTenant(newTenant, booking.roomId || '');
              const updatedBookings = bookings.map(b => b.id === booking.id ? { ...b, status: 'Checked In' as const } : b);
              setBookings(updatedBookings);
              const updatedBooking = updatedBookings.find(b => b.id === booking.id);
              if (updatedBooking) syncToBackend('bookings', 'POST', updatedBooking);
              setSelectedTab('tenants');
            }}
          />
        );

      case 'tenants':
        return (
          <TenantsView
            tenants={filteredTenants}
            rooms={filteredRooms}
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
            bills={filteredBills}
            tenants={filteredTenants}
            rooms={filteredRooms}
            selectedBillId={selectedBillId}
            onSelectBillId={setSelectedBillId}
            onAddBill={handleAddBill}
            onOpenReminderModal={(bill) => setBillForReminder(bill)}
            onOpenPaymentForm={(bill) => {
              setBillForPayment(bill);
              navigateTo({ authMode: 'dashboard', tab: 'payments' });
            }}
            onDeleteBill={handleDeleteBill}
            selectedMonth={selectedMonth}
          />
        );

      case 'payments':
        return (
          <PaymentsView
            bills={filteredBills}
            tenants={filteredTenants}
            rooms={filteredRooms}
            selectedBillForPayment={billForPayment}
            onClosePaymentForm={() => {
              setBillForPayment(null);
              goBackWithFallback({ authMode: 'dashboard', tab: 'bills' });
            }}
            onRecordPayment={handleRecordPayment}
          />
        );

      case 'operations':
        return (
          <OperationsView
            tasks={filteredOperationTasks}
            rooms={filteredRooms}
            staffList={staffList}
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onAddTask={(task) => {
              setOperationTasks([task, ...operationTasks]);
              syncToBackend('operations', 'POST', task);
            }}
            onUpdateTaskStatus={(id, status) => {
              const updatedTasks = operationTasks.map(t => t.id === id ? { ...t, status } : t);
              setOperationTasks(updatedTasks);
              syncToBackend(`operations/${id}/status`, 'PATCH', { status });
            }}
          />
        );

      case 'website': {
        const propScope = selectedPropertyId !== 'all' ? selectedPropertyId : (properties[0]?.id || 'prop-1');
        const currentProp = properties.find(p => p.id === propScope) || properties[0];
        const currentConfig = websiteConfigs[propScope] || websiteConfigFor(currentProp);
        return (
          <WebsiteEditorView
            property={currentProp}
            rooms={filteredRooms}
            websiteConfig={currentConfig}
            onUpdateConfig={(newConfig) => {
              setWebsiteConfigs({ ...websiteConfigs, [propScope]: newConfig });
              syncToBackend('website-configs', 'POST', newConfig);
            }}
            onPreviewLive={(propId) => {
              setPreviewPropertyId(propId);
              setReturnSource('website');
              navigateTo({ authMode: 'property-website', propertyId: propId, from: 'website' });
            }}
          />
        );
      }

      case 'team':
        return (
          <TeamView
            staffList={staffList}
            onAddStaff={(newStaff) => {
              setStaffList([...staffList, newStaff]);
              syncToBackend('staff', 'POST', newStaff);
            }}
            onDeleteStaff={(id) => {
              setStaffList(prev => prev.filter(s => s.id !== id));
              syncToBackend(`staff/${id}`, 'DELETE');
            }}
          />
        );

      case 'expenses':
        return (
          <ExpensesView
            expenses={filteredExpenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            selectedMonth={selectedMonth}
          />
        );

      case 'complaints':
        return (
          <ComplaintsView
            complaints={filteredComplaints}
            tenants={filteredTenants}
            rooms={filteredRooms}
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
            properties={properties}
            onAddProperty={handleAddProperty}
            onUpdateProperty={handleUpdateProperty}
            onDeleteProperty={handleDeleteProperty}
            onPreviewPropertyLanding={(id) => {
              setPreviewPropertyId(id);
              setReturnSource('settings');
              navigateTo({ authMode: 'property-website', propertyId: id, from: 'settings' });
            }}
          />
        );

      default:
        return <div className="p-12 text-center text-[#6E746F]">Halaman dalam pengembangan</div>;
    }
  };

  // Switch layouts on Authentication Status
  if (authMode === 'landing') {
    return (
      <LandingPage 
        onStartDemo={() => {
          localStorage.setItem('kostos_logged_in', 'true');
          setIsDemoMode(true);
          navigateTo({ authMode: 'dashboard', tab: 'dashboard' });
        }}
        onGoToLogin={() => navigateTo({ authMode: 'login' })} 
        onGoToRegister={() => navigateTo({ authMode: 'register' })} 
        onViewPropertyWebsite={(propId) => {
          setPreviewPropertyId(propId);
          setReturnSource('landing');
          navigateTo({ authMode: 'property-website', propertyId: propId, from: 'landing' });
        }}
      />
    );
  }

  if (authMode === 'property-website') {
    if (!isOwnPreview && publicPropertyLoading) {
      return <div className="min-h-screen grid place-items-center text-[#173B30]">Memuat properti...</div>;
    }
    if (!isOwnPreview && !publicPropertyData && !properties.some(p => p.id === previewPropertyId)) {
      return <div className="min-h-screen grid place-items-center text-[#173B30]">Properti tidak ditemukan.</div>;
    }
    const currentProp = publicPropertyData?.property?.id === previewPropertyId
      ? publicPropertyData.property
      : properties.find(p => p.id === previewPropertyId) || properties[0];
    const currentConfig = publicPropertyData?.property?.id === previewPropertyId
      ? publicPropertyData.websiteConfig
      : websiteConfigs[currentProp.id] || websiteConfigFor(currentProp);
    
    const backButtonLabel = returnSource === 'website' 
      ? 'Kembali ke Editor' 
      : returnSource === 'settings' 
      ? 'Kembali ke Pengaturan' 
      : returnSource === 'dashboard' 
      ? 'Kembali ke Dashboard' 
      : 'Kembali ke Katalog';

    return (
      <PropertyPublicWebsite
        property={currentProp}
        rooms={publicPropertyData?.property?.id === previewPropertyId ? publicPropertyData.rooms : rooms}
        websiteConfig={currentConfig}
        backButtonLabel={backButtonLabel}
        onBookRoom={async (bookingData) => {
          const newBooking: Booking = {
            id: generateId('book'),
            propertyId: currentProp.id,
            roomId: bookingData.roomId,
            roomType: bookingData.roomType || 'Studio',
            roomNumber: bookingData.roomNumber,
            guestName: bookingData.guestName || 'Tamu',
            guestPhone: bookingData.guestPhone || '-',
            guestEmail: bookingData.guestEmail,
            moveInDate: bookingData.moveInDate || new Date().toISOString().split('T')[0],
            durationMonths: bookingData.durationMonths || 1,
            guestsCount: bookingData.guestsCount || 1,
            totalAmount: bookingData.totalAmount || 0,
            depositAmount: bookingData.depositAmount || 0,
            source: 'Website',
            status: 'Pending',
            notes: bookingData.notes,
            createdAt: new Date().toISOString().split('T')[0]
          };
          if (isOwnPreview) {
            const saved = await syncToBackend('bookings', 'POST', newBooking);
            if (!saved) throw new Error('Permintaan booking gagal disimpan.');
            setBookings(prev => [newBooking, ...prev]);
          } else {
            await submitPublicBooking(currentProp.id, newBooking);
          }
        }}
        onSelectTemplate={(tmpl) => {
          if (!isOwnPreview) return;
          const updatedConfig = {
            ...(websiteConfigs[currentProp.id] || currentConfig),
            templateId: tmpl
          };
          setWebsiteConfigs(prev => ({ ...prev, [currentProp.id]: updatedConfig }));
          syncToBackend('website-configs', 'POST', updatedConfig);
        }}
        onBackToDashboard={() => {
          if (returnSource === 'website') {
            navigateTo({ authMode: 'dashboard', tab: 'website' });
          } else if (returnSource === 'settings') {
            navigateTo({ authMode: 'dashboard', tab: 'settings' });
          } else if (returnSource === 'dashboard') {
            navigateTo({ authMode: 'dashboard', tab: 'dashboard' });
          } else {
            goBackWithFallback({ authMode: 'landing' });
          }
        }}
        isOwnerPreview={returnSource === 'website' || returnSource === 'settings' || returnSource === 'dashboard'}
      />
    );
  }

  if (authMode === 'login' || authMode === 'register' || authMode === 'onboarding') {
    return (
      <AuthScreens
        viewMode={authMode}
        onGoBackLanding={() => goBackWithFallback({ authMode: 'landing' })}
        onSetViewMode={(mode: any) => {
          if (mode === 'dashboard') {
            localStorage.setItem('kostos_logged_in', 'true');
            setDataLoading(Boolean(getToken()));
            navigateTo({ authMode: 'dashboard', tab: 'dashboard' });
          } else {
            navigateTo({ authMode: mode });
          }
        }}
        onInitializeKost={handleFirstTimeOnboard}
      />
    );
  }

  if (authMode === 'dashboard' && getToken() && dataLoading) {
    return <div className="min-h-screen grid place-items-center text-[#173B30]">Memuat data akun...</div>;
  }

  if (authMode === 'dashboard' && getToken() && dataLoadError) {
    return <div className="min-h-screen grid place-items-center text-center text-[#173B30]">
      <div><p>{dataLoadError}</p><button onClick={() => window.location.reload()} className="mt-3 underline">Coba Lagi</button></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex flex-col antialiased font-sans text-[#171A18]">

      {/* DEMO MODE BANNER */}
      {isDemoMode && (
        <div className="w-full bg-[#B89A68] text-[#171A18] text-xs font-bold py-2 px-4 flex items-center justify-between z-50 shrink-0">
          <span>✨ Mode Demo Interaktif BISNIESGO Living — Perubahan tersimpan di browser ini.</span>
          <button
            onClick={() => navigateTo({ authMode: 'register' })}
            className="ml-4 bg-[#173B30] text-[#F5F1E8] px-3 py-1 rounded-lg text-[10px] font-extrabold hover:bg-[#0f2720] transition-colors cursor-pointer whitespace-nowrap"
          >
            Daftar Akun Baru →
          </button>
        </div>
      )}

      {/* TRIAL / EXPIRED BANNER */}
      {authUser && authUser.role !== 'super_admin' && authUser.plan === 'pro' && authUser.expiresAt && (
        <TrialBanner
          expiresAt={authUser.expiresAt}
          effectivePlan={authUser.effectivePlan}
          onUpgradeClick={() => setUpgradePromptOpen(true)}
        />
      )}

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
      
        {/* 1. SIDEBAR */}
        <SidebarAndNav 
          currentTab={selectedTab}
          onChangeTab={(tab) => {
            if (lockedTabIds.includes(tab as DashboardTab)) {
              setUpgradePromptOpen(true);
              return;
            }
            setSelectedRoomId(null);
            setSelectedTenantId(null);
            setSelectedBillId(null);
            setSelectedComplaintId(null);
            setBillForPayment(null);
            navigateTo({ authMode: 'dashboard', tab: tab as DashboardTab });
          }}
          onLogout={handleLogout}
          kostName={kostSettings.kostName}
          ownerName={kostSettings.ownerName}
          properties={properties}
          selectedPropertyId={selectedPropertyId}
          onViewGuestPortal={() => {
            const propId = selectedPropertyId !== 'all' ? selectedPropertyId : (properties[0]?.id || 'prop-1');
            setPreviewPropertyId(propId);
            setReturnSource('dashboard');
            navigateTo({ authMode: 'property-website', propertyId: propId, from: 'dashboard' });
          }}
          userRole={userRole}
          lockedTabIds={lockedTabIds}
        />

        {/* 2. MAIN CANVAS WRAPPER */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header 
            settings={kostSettings} 
            currentTab={selectedTab} 
            onQuickAction={handleQuickActionSelection}
            selectedMonth={selectedMonth}
            onChangeMonth={setSelectedMonth}
            onLogout={handleLogout}
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onSelectPropertyId={(id) => setSelectedPropertyId(id)}
            onAddPropertyClick={() => navigateTo({ authMode: 'dashboard', tab: 'settings' })}
            onViewGuestPortal={() => {
              const propId = selectedPropertyId !== 'all' ? selectedPropertyId : (properties[0]?.id || 'prop-1');
              setPreviewPropertyId(propId);
              setReturnSource('dashboard');
              navigateTo({ authMode: 'property-website', propertyId: propId, from: 'dashboard' });
            }}
          />

          {/* Core Tab Canvas */}
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-28 lg:pb-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto animate-in fade-in duration-200">
              {renderTabContent()}
            </div>
          </main>
        </div>

      </div>

      {/* FLOATING WHATSAPP BROADCAST MODAL */}
      {billForReminder && (
        <WhatsAppReminderModal 
          bill={billForReminder} 
          kostSettings={kostSettings} 
          tenants={tenants}
          onClose={() => setBillForReminder(null)}
        />
      )}

      {/* UPGRADE PROMPT MODAL */}
      {upgradePromptOpen && (
        <UpgradePromptModal onClose={() => setUpgradePromptOpen(false)} />
      )}

      {backupMsg && (
        <div role="status" className="fixed bottom-24 right-4 z-[100] rounded-xl bg-[#173B30] px-4 py-3 text-sm text-white shadow-xl">
          {backupMsg}
          <button type="button" onClick={() => setBackupMsg(null)} className="ml-4 font-bold" aria-label="Tutup pesan">×</button>
        </div>
      )}

    </div>
  );
}
