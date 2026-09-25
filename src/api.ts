import { Room, Tenant, Bill, Expense, Complaint, KostSettings, Property, SuperAdminMetrics, TenantAccount } from './types';
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
  INITIAL_STAFF,
  INITIAL_WEBSITE_CONFIGS
} from './data';

// ─── Token helpers ────────────────────────────────────────────────────────────

export const getToken = (): string | null => localStorage.getItem('kostos_token');
export const setToken = (token: string) => localStorage.setItem('kostos_token', token);
export const clearToken = () => {
  localStorage.removeItem('kostos_token');
  localStorage.removeItem('kostos_owner_slug');
  localStorage.removeItem('kostos_settings');
  localStorage.removeItem('kostos_rooms');
  localStorage.removeItem('kostos_tenants');
  localStorage.removeItem('kostos_bills');
  localStorage.removeItem('kostos_expenses');
  localStorage.removeItem('kostos_complaints');
  localStorage.removeItem('kostos_properties');
  localStorage.removeItem('kostos_logged_in');
  localStorage.removeItem('kostos_selected_property');
  localStorage.removeItem('kostos_user_role');
};

// ─── Fetch with auth headers & timeout ───────────────────────────────────────

const parseJsonResponse = async (res: Response) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Respon server tidak valid (bukan JSON)');
  }
};

const fetchWithAuth = async (resource: string, options: RequestInit = {}) => {
  const timeout = 8000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(resource, {
    ...options,
    headers,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
};

// ─── Offline mode flag ────────────────────────────────────────────────────────

export let isOfflineMode = false;

// ─── Plan-lock notification (decouples api.ts from React state) ──────────────

type PlanLockedHandler = () => void;
let planLockedHandler: PlanLockedHandler | null = null;

export const setPlanLockedHandler = (handler: PlanLockedHandler | null) => {
  planLockedHandler = handler;
};

// ─── Auth API calls ───────────────────────────────────────────────────────────

export interface AuthResult {
  token: string;
  user: {
    id: number;
    name: string;
    phone: string;
    slug?: string;
    role?: 'super_admin' | 'owner';
    status?: 'active' | 'suspended';
    plan?: 'basic' | 'pro';
    effectivePlan?: 'basic' | 'pro';
    expiresAt?: string | null;
  };
}

export const authRegister = async (params: {
  name: string;
  phone: string;
  password: string;
  kostName?: string;
  address?: string;
}): Promise<AuthResult> => {
  const res = await fetchWithAuth('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.message || (data?.errors ? Object.values(data.errors).flat().join(', ') : 'Registrasi gagal'));
  }
  return data;
};

export const authLogin = async (params: {
  phone: string;
  password: string;
}): Promise<AuthResult> => {
  const res = await fetchWithAuth('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.error || data?.message || (data?.errors ? Object.values(data.errors).flat().join(', ') : 'Login gagal'));
  }
  return data;
};

export const authLogout = async (): Promise<void> => {
  // Only call API if we have a token; clearToken is called by the caller (App.tsx)
  await fetchWithAuth('/api/auth/logout', { method: 'POST' }).catch(() => {});
};

export const authChangePassword = async (params: {
  oldPassword: string;
  newPassword: string;
}): Promise<void> => {
  const res = await fetchWithAuth('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.message || (data?.errors ? Object.values(data.errors).flat().join(', ') : 'Gagal mengubah kata sandi'));
  }
};

export const authMe = async (): Promise<AuthResult['user'] & { email?: string }> => {
  const res = await fetchWithAuth('/api/auth/me');
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Gagal memuat data akun');
  }
  return data;
};

// ─── Super Admin API Calls ───────────────────────────────────────────────────

export const fetchAdminMetrics = async (): Promise<SuperAdminMetrics> => {
  const res = await fetchWithAuth('/api/admin/metrics');
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Gagal mengambil metrik Super Admin');
  }
  return data;
};

export const fetchAdminUsers = async (): Promise<TenantAccount[]> => {
  const res = await fetchWithAuth('/api/admin/users');
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Gagal mengambil daftar akun pengguna SaaS');
  }
  return data;
};

export const updateAdminUserStatus = async (id: number, status: 'active' | 'suspended'): Promise<void> => {
  const res = await fetchWithAuth(`/api/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const data = await parseJsonResponse(res);
    throw new Error(data?.error || 'Gagal memperbarui status akun');
  }
};

export const updateAdminUserPlan = async (id: number, plan: 'basic' | 'pro'): Promise<void> => {
  const res = await fetchWithAuth(`/api/admin/users/${id}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) {
    const data = await parseJsonResponse(res);
    throw new Error(data?.error || 'Gagal memperbarui paket langganan');
  }
};

export const deleteAdminUser = async (id: number): Promise<void> => {
  const res = await fetchWithAuth(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await parseJsonResponse(res);
    throw new Error(data?.error || 'Gagal menghapus akun pengguna');
  }
};

// ─── Public landing page data (no auth) ──────────────────────────────────────

export interface PublicOwnerData {
  owner: { name: string; slug: string; phone: string };
  settings: Record<string, any>;
  rooms: any[];
}

export const fetchPublicOwnerData = async (slug: string): Promise<PublicOwnerData | null> => {
  try {
    const res = await fetch(`/api/public/owner/${slug}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
};

export interface PublicPropertyData {
  property: Property;
  rooms: Room[];
  websiteConfig: import('./types').WebsiteConfig;
}

export const fetchPublicPropertyData = async (id: string): Promise<PublicPropertyData | null> => {
  const res = await fetch(`/api/public/properties/${encodeURIComponent(id)}`, {
    headers: { Accept: 'application/json' },
  });
  if (res.status === 404) return null;
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.error || 'Gagal memuat properti');
  return data;
};

export interface PublicListing {
  id: string;
  name: string;
  type: string;
  city?: string;
  address?: string;
  coverImage?: string | null;
  facilities: string[];
  availableRooms: number;
  startPriceMonth?: number | null;
  startPriceDay?: number | null;
  rentalTypes: ('Bulanan' | 'Harian')[];
}

export interface ListingFilters {
  q?: string;
  type?: string;
  duration?: '' | 'Bulanan' | 'Harian';
}

export const fetchPublicListings = async (filters: ListingFilters = {}): Promise<PublicListing[]> => {
  const query = new URLSearchParams();
  if (filters.q?.trim()) query.set('q', filters.q.trim());
  if (filters.type) query.set('type', filters.type);
  if (filters.duration) query.set('duration', filters.duration);
  const res = await fetch(`/api/public/properties${query.toString() ? `?${query}` : ''}`, {
    headers: { Accept: 'application/json' },
  });
  const data = await parseJsonResponse(res);
  if (!res.ok || !Array.isArray(data)) throw new Error(data?.error || 'Gagal memuat daftar hunian');
  return data;
};

export const submitPublicBooking = async (propertyId: string, booking: Partial<import('./types').Booking>): Promise<void> => {
  const res = await fetch(`/api/public/properties/${encodeURIComponent(propertyId)}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(booking),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data?.error || data?.message || 'Permintaan booking gagal dikirim.');
};

export const fetchReports = async (params: {
  mode: 'month' | 'range';
  month?: string;
  startDate?: string;
  endDate?: string;
}): Promise<import('./types').ReportsAggregate> => {
  const query = new URLSearchParams();
  query.set('mode', params.mode);
  if (params.month) query.set('month', params.month);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  if (getToken()) {
    let res: Response | null = null;
    let data: any = null;
    try {
      res = await fetchWithAuth(`/api/reports?${query.toString()}`);
      data = await parseJsonResponse(res);
    } catch {
      // Network/timeout failure — fall through to the local computation below.
    }

    if (res?.ok) return data;

    if (data?.code === 'PLAN_LOCKED') {
      planLockedHandler?.();
      throw new Error(data?.error || 'Gagal memuat laporan');
    }
  }

  // No token (offline / "Coba Demo Interaktif") or a non-plan-lock server/network
  // failure: compute the aggregate locally so the tab still works, mirroring the
  // local fallback every other resource already has (bookings/operations/staff/website-configs).
  return computeLocalReportsAggregate(params);
};

// ─── Client-side Reports aggregate (offline / demo fallback) ─────────────────
// Mirrors backend/app/Http/Controllers/ReportController.php so the Laporan tab
// still works without a backend session.

const REPORT_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const reportMonthKey = (month: string): string => {
  const [name, year] = month.split(' ');
  const index = REPORT_MONTHS.indexOf(name);
  const monthNum = index === -1 ? '06' : String(index + 1).padStart(2, '0');
  return `${year || '2026'}-${monthNum}`;
};

const reportMonthLabelFromDate = (date: string): string | null => {
  const parts = date.split('-');
  if (parts.length < 2 || isNaN(Number(parts[0])) || isNaN(Number(parts[1]))) return null;
  const monthIndex = Number(parts[1]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  return `${REPORT_MONTHS[monthIndex]} ${parts[0]}`;
};

const reportTrendMonths = (selectedMonth: string): string[] => {
  const [name, yearStr] = selectedMonth.split(' ');
  const baseIndex = REPORT_MONTHS.indexOf(name);
  const baseYear = Number(yearStr || 2026);
  if (baseIndex === -1) return [selectedMonth];

  const result: string[] = [];
  for (let i = -1; i <= 1; i++) {
    let mi = baseIndex + i;
    let yr = baseYear;
    if (mi < 0) { mi = 11; yr--; }
    if (mi > 11) { mi = 0; yr++; }
    result.push(`${REPORT_MONTHS[mi]} ${yr}`);
  }
  return result;
};

const computeLocalReportsAggregate = (params: {
  mode: 'month' | 'range';
  month?: string;
  startDate?: string;
  endDate?: string;
}): import('./types').ReportsAggregate => {
  const parseLocal = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch { return fallback; }
  };

  const allBills: Bill[] = parseLocal('kostos_bills', INITIAL_BILLS);
  const allExpenses: Expense[] = parseLocal('kostos_expenses', INITIAL_EXPENSES);
  const rooms: Room[] = parseLocal('kostos_rooms', INITIAL_ROOMS);

  const selectedMonth = params.month || `${REPORT_MONTHS[5]} 2026`;

  let activeBills: Bill[];
  let activeExpenses: Expense[];
  let trendAnchorMonth: string;

  if (params.mode === 'range' && params.startDate && params.endDate) {
    const { startDate, endDate } = params;
    activeBills = allBills.filter(b => {
      const date = b.paymentDate || b.dueDate;
      return date >= startDate && date <= endDate;
    });
    activeExpenses = allExpenses.filter(e => e.date >= startDate && e.date <= endDate);
    trendAnchorMonth = reportMonthLabelFromDate(endDate) || selectedMonth;
  } else {
    activeBills = allBills.filter(b => b.period === selectedMonth);
    const activeMonthKey = reportMonthKey(selectedMonth);
    activeExpenses = allExpenses.filter(e => e.date.startsWith(activeMonthKey));
    trendAnchorMonth = selectedMonth;
  }

  const totalRevenue = activeBills
    .filter(b => b.status === 'Lunas' || b.status === 'Sebagian')
    .reduce((sum, b) => sum + b.paidAmount, 0);
  const totalCosts = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const outstandingAmount = activeBills.reduce((sum, b) => sum + (b.totalAmount - b.paidAmount), 0);

  const paidBillsCount = activeBills.filter(b => b.status === 'Lunas').length;
  const unpaidBillsCount = activeBills.filter(b => b.status !== 'Lunas').length;

  const occupancyRate = rooms.length > 0
    ? (rooms.filter(r => r.status === 'Terisi' || r.status === 'Menunggak').length / rooms.length) * 100
    : 0;

  const trend = reportTrendMonths(trendAnchorMonth).map(m => {
    const mKey = reportMonthKey(m);
    const mBills = allBills.filter(b => b.period === m);
    const mExpenses = allExpenses.filter(e => e.date.startsWith(mKey));
    return {
      name: m.split(' ')[0],
      income: mBills.filter(b => b.status === 'Lunas' || b.status === 'Sebagian').reduce((s, b) => s + b.paidAmount, 0),
      expense: mExpenses.reduce((s, e) => s + e.amount, 0),
    };
  });

  const unpaidBills = activeBills.filter(b => b.status !== 'Lunas').map(b => ({
    id: b.id,
    roomNumber: b.roomNumber,
    tenantName: b.tenantName,
    paymentMethod: b.paymentMethod,
    status: b.status,
    remaining: b.totalAmount - b.paidAmount,
  }));

  return {
    totalRevenue,
    totalCosts,
    actualProfit: totalRevenue - totalCosts,
    outstandingAmount,
    paidBillsCount,
    unpaidBillsCount,
    occupancyRate: Math.round(occupancyRate * 100) / 100,
    roomStatusCounts: {
      terisi: rooms.filter(r => r.status === 'Terisi' || r.status === 'Menunggak').length,
      kosong: rooms.filter(r => r.status === 'Kosong').length,
      perbaikan: rooms.filter(r => r.status === 'Perbaikan').length,
    },
    trend,
    unpaidBills,
  };
};

// ─── Data fetch (GET) — tries API, falls back to LocalStorage ─────────────────

// GET with retries for transient failures. Shared hosting caps concurrent MySQL
// connections, so a burst of parallel GETs can briefly return 500 ("[2002] Operation
// not permitted"). Treating that as "no data" would wipe the user's view.
const getWithRetry = async (path: string, attempts = 3): Promise<Response> => {
  for (let i = 1; ; i++) {
    try {
      const res = await fetchWithAuth(path);
      if (res.status < 500 || i >= attempts) return res;
    } catch (err) {
      if (i >= attempts) throw err;
    }
    await new Promise(r => setTimeout(r, 400 * i));
  }
};

// GET a list endpoint; throws unless the response is a successful JSON array.
const getList = async (path: string): Promise<any[]> => {
  const res = await getWithRetry(path);
  if (!res.ok) throw new Error(`${path} gagal dimuat (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`${path} mengembalikan data tidak valid`);
  return data;
};

// Returns null when the fetch failed (so callers can fall back to cache),
// or the (possibly empty) array on a genuine successful response.
const fetchProResource = async (path: string): Promise<any[] | null> => {
  try {
    const res = await getWithRetry(path);
    if (res.status === 403) {
      const data = await parseJsonResponse(res).catch(() => null);
      if (data?.code === 'PLAN_LOCKED') planLockedHandler?.();
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
};

export const fetchAllData = async () => {
  if (!getToken()) {
    // No token → offline / not logged in
    isOfflineMode = true;
    return getLocalStorageFallback();
  }

  try {
    const healthRes = await getWithRetry('/api/settings');
    if (healthRes.status === 401) {
      // Token expired
      clearToken();
      throw new Error('Unauthorized');
    }
    if (!healthRes.ok) throw new Error('API not ok');

    isOfflineMode = false;

    // Fetch all endpoints in parallel
    const [settings, rooms, tenants, bills, expenses, complaints, propertiesResult, bookingsResult, operationsResult, staffResult, websiteConfigsResult] = await Promise.all([
      healthRes.json(),
      getList('/api/rooms'),
      getList('/api/tenants'),
      getList('/api/bills'),
      getList('/api/expenses'),
      getList('/api/complaints'),
      getList('/api/properties'),
      fetchProResource('/api/bookings'),
      fetchProResource('/api/operations'),
      fetchProResource('/api/staff'),
      fetchProResource('/api/website-configs'),
    ]);

    // Persist to localStorage for offline fallback
    localStorage.setItem('kostos_settings', JSON.stringify(settings));
    localStorage.setItem('kostos_rooms', JSON.stringify(rooms));
    localStorage.setItem('kostos_tenants', JSON.stringify(tenants));
    localStorage.setItem('kostos_bills', JSON.stringify(bills));
    localStorage.setItem('kostos_expenses', JSON.stringify(expenses));
    localStorage.setItem('kostos_complaints', JSON.stringify(complaints));
    
    // This is the authenticated path (health check above already confirmed we're online), so
    // the API result is authoritative: an empty array means the signed-in user genuinely has
    // zero properties yet. Never substitute the bundled demo properties or a locally-cached
    // value here — 'kostos_properties' also doubles as a generic UI-convenience cache written
    // from in-memory state (including the pre-fetch demo fallback), so reading it back as a
    // signal for "previously synced real data" is unreliable and can re-surface stale/demo rows.
    const properties: Property[] = Array.isArray(propertiesResult) ? propertiesResult : [];
    localStorage.setItem('kostos_properties', JSON.stringify(properties));

    const bookings = bookingsResult !== null ? bookingsResult : JSON.parse(localStorage.getItem('kostos_bookings') || '[]');
    const operations = operationsResult !== null ? operationsResult : JSON.parse(localStorage.getItem('kostos_operations') || '[]');
    const staffList = staffResult !== null ? staffResult : JSON.parse(localStorage.getItem('kostos_staff') || '[]');
    // Uses its own cache key (distinct from 'kostos_website_configs', which App.tsx uses for the
    // propertyId-keyed Record it renders from) to avoid the two disagreeing on shape.
    const websiteConfigs = websiteConfigsResult !== null ? websiteConfigsResult : JSON.parse(localStorage.getItem('kostos_website_configs_array') || '[]');

    if (bookingsResult !== null) localStorage.setItem('kostos_bookings', JSON.stringify(bookings));
    if (operationsResult !== null) localStorage.setItem('kostos_operations', JSON.stringify(operations));
    if (staffResult !== null) localStorage.setItem('kostos_staff', JSON.stringify(staffList));
    if (websiteConfigsResult !== null) localStorage.setItem('kostos_website_configs_array', JSON.stringify(websiteConfigs));

    return { settings, rooms, tenants, bills, expenses, complaints, properties, bookings, operations, staffList, websiteConfigs };

  } catch (error) {
    console.warn('⚠️ [Hybrid API] Backend tidak merespons.', error);
    isOfflineMode = true;
    throw error;
  }
};

const getLocalStorageFallback = () => {
  const parseLocal = (key: string, fallback: any) => {
    try {
      const item = localStorage.getItem(key);
      if (item) return JSON.parse(item);
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    } catch { return fallback; }
  };

  return {
    settings:   parseLocal('kostos_settings',   INITIAL_SETTINGS),
    rooms:      parseLocal('kostos_rooms',       INITIAL_ROOMS),
    tenants:    parseLocal('kostos_tenants',     INITIAL_TENANTS),
    bills:      parseLocal('kostos_bills',       INITIAL_BILLS),
    expenses:   parseLocal('kostos_expenses',    INITIAL_EXPENSES),
    complaints: parseLocal('kostos_complaints',  INITIAL_COMPLAINTS),
    properties: parseLocal('kostos_properties',  INITIAL_PROPERTIES),
    bookings:   parseLocal('kostos_bookings', INITIAL_BOOKINGS),
    operations: parseLocal('kostos_operations', INITIAL_OPERATION_TASKS),
    staffList:  parseLocal('kostos_staff', INITIAL_STAFF),
    websiteConfigs: parseLocal('kostos_website_configs_array', Object.values(INITIAL_WEBSITE_CONFIGS)),
  };
};

// ─── Data sync (POST/PUT/PATCH/DELETE) ────────────────────────────────────────

export const syncToBackend = async (endpoint: string, method: 'POST'|'PUT'|'PATCH'|'DELETE', data?: any) => {
  if (!getToken()) return true; // Explicit unauthenticated demo mode

  try {
    const res = await fetchWithAuth(`/api/${endpoint}`, {
      method,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (res.status === 401) {
      clearToken();
      return false;
    }
    if (!res.ok) {
      const errData = await parseJsonResponse(res).catch(() => null);
      if (errData?.code === 'PLAN_LOCKED') planLockedHandler?.();
      console.warn(`[Hybrid API] Gagal sinkronisasi /api/${endpoint}`, errData?.error || '');
      return false;
    }
    isOfflineMode = false;
    return true;
  } catch (error) {
    console.warn(`[Hybrid API] Koneksi terputus saat sinkronisasi /api/${endpoint}.`);
    return false;
  }
};
