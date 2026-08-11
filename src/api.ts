import { Room, Tenant, Bill, Expense, Complaint, KostSettings, Property } from './types';
import { 
  INITIAL_SETTINGS, 
  INITIAL_ROOMS, 
  INITIAL_TENANTS, 
  INITIAL_BILLS, 
  INITIAL_EXPENSES, 
  INITIAL_COMPLAINTS,
  INITIAL_PROPERTIES
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

// ─── Auth API calls ───────────────────────────────────────────────────────────

export interface AuthResult {
  token: string;
  user: { id: number; name: string; phone: string; slug?: string };
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
    throw new Error(data?.message || (data?.errors ? Object.values(data.errors).flat().join(', ') : 'Login gagal'));
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

// ─── Data fetch (GET) — tries API, falls back to LocalStorage ─────────────────

export const fetchAllData = async () => {
  if (!getToken()) {
    // No token → offline / not logged in
    isOfflineMode = true;
    return getLocalStorageFallback();
  }

  try {
    const healthRes = await fetchWithAuth('/api/settings');
    if (healthRes.status === 401) {
      // Token expired
      clearToken();
      throw new Error('Unauthorized');
    }
    if (!healthRes.ok) throw new Error('API not ok');

    isOfflineMode = false;

    // Fetch all endpoints in parallel; properties endpoint may not exist on older deploys
    const [settings, rooms, tenants, bills, expenses, complaints, propertiesResult] = await Promise.all([
      healthRes.json(),
      fetchWithAuth('/api/rooms').then(r => r.json()),
      fetchWithAuth('/api/tenants').then(r => r.json()),
      fetchWithAuth('/api/bills').then(r => r.json()),
      fetchWithAuth('/api/expenses').then(r => r.json()),
      fetchWithAuth('/api/complaints').then(r => r.json()),
      fetchWithAuth('/api/properties').then(r => r.ok ? r.json() : []).catch(() => []),
    ]);

    // Persist to localStorage for offline fallback
    localStorage.setItem('kostos_settings', JSON.stringify(settings));
    localStorage.setItem('kostos_rooms', JSON.stringify(rooms));
    localStorage.setItem('kostos_tenants', JSON.stringify(tenants));
    localStorage.setItem('kostos_bills', JSON.stringify(bills));
    localStorage.setItem('kostos_expenses', JSON.stringify(expenses));
    localStorage.setItem('kostos_complaints', JSON.stringify(complaints));
    
    // Merge API properties with local ones (API is authoritative if it has records)
    const properties: Property[] = Array.isArray(propertiesResult) && propertiesResult.length > 0
      ? propertiesResult
      : (() => {
          try {
            const raw = localStorage.getItem('kostos_properties');
            return raw ? JSON.parse(raw) : INITIAL_PROPERTIES;
          } catch { return INITIAL_PROPERTIES; }
        })();
    
    if (Array.isArray(propertiesResult) && propertiesResult.length > 0) {
      localStorage.setItem('kostos_properties', JSON.stringify(properties));
    }

    return { settings, rooms, tenants, bills, expenses, complaints, properties };

  } catch (error) {
    console.warn('⚠️ [Hybrid API] Backend tidak merespons. Mode offline.', error);
    isOfflineMode = true;
    return getLocalStorageFallback();
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
  };
};

// ─── Data sync (POST/PUT/PATCH/DELETE) ────────────────────────────────────────

export const syncToBackend = async (endpoint: string, method: 'POST'|'PUT'|'PATCH'|'DELETE', data?: any) => {
  if (isOfflineMode || !getToken()) return true;

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
      console.warn(`[Hybrid API] Gagal sinkronisasi /api/${endpoint}`, errData?.error || '');
      return false;
    }
    return true;
  } catch (error) {
    console.warn(`[Hybrid API] Koneksi terputus saat sinkronisasi /api/${endpoint}.`);
    return false;
  }
};
