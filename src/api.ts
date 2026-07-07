import { Room, Tenant, Bill, Expense, Complaint, KostSettings } from './types';
import { 
  INITIAL_SETTINGS, 
  INITIAL_ROOMS, 
  INITIAL_TENANTS, 
  INITIAL_BILLS, 
  INITIAL_EXPENSES, 
  INITIAL_COMPLAINTS 
} from './data';

// Helper function with timeout
const fetchWithTimeout = async (resource: string, options: RequestInit = {}) => {
  const timeout = 2500; // 2.5 seconds timeout
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);
  return response;
};

// Global indicator to track if we are in offline mode
export let isOfflineMode = false;

// 1. DATA FETCHING (GET) - Tries API, falls back to LocalStorage
export const fetchAllData = async () => {
  try {
    // Try to ping the backend to see if it's alive (we can ping /api/settings as a health check)
    const res = await fetchWithTimeout('/api/settings');
    if (!res.ok) throw new Error('API not ok');
    
    // If backend is alive, fetch all data
    isOfflineMode = false;
    const [settings, rooms, tenants, bills, expenses, complaints] = await Promise.all([
      res.json(),
      fetchWithTimeout('/api/rooms').then(r => r.json()),
      fetchWithTimeout('/api/tenants').then(r => r.json()),
      fetchWithTimeout('/api/bills').then(r => r.json()),
      fetchWithTimeout('/api/expenses').then(r => r.json()),
      fetchWithTimeout('/api/complaints').then(r => r.json())
    ]);

    // Save to localStorage so offline mode has the latest copy
    localStorage.setItem('kostos_settings', JSON.stringify(settings));
    localStorage.setItem('kostos_rooms', JSON.stringify(rooms));
    localStorage.setItem('kostos_tenants', JSON.stringify(tenants));
    localStorage.setItem('kostos_bills', JSON.stringify(bills));
    localStorage.setItem('kostos_expenses', JSON.stringify(expenses));
    localStorage.setItem('kostos_complaints', JSON.stringify(complaints));

    return { settings, rooms, tenants, bills, expenses, complaints };

  } catch (error) {
    // FALLBACK TO LOCALSTORAGE
    console.warn('⚠️ [Hybrid API] Backend tidak merespons. Berjalan dalam mode LocalStorage (Offline).', error);
    isOfflineMode = true;

    const parseLocal = (key: string, fallback: any) => {
      try {
        const item = localStorage.getItem(key);
        if (item) return JSON.parse(item);
        // If no item, set fallback
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
      } catch {
        return fallback;
      }
    };

    return {
      settings: parseLocal('kostos_settings', INITIAL_SETTINGS),
      rooms: parseLocal('kostos_rooms', INITIAL_ROOMS),
      tenants: parseLocal('kostos_tenants', INITIAL_TENANTS),
      bills: parseLocal('kostos_bills', INITIAL_BILLS),
      expenses: parseLocal('kostos_expenses', INITIAL_EXPENSES),
      complaints: parseLocal('kostos_complaints', INITIAL_COMPLAINTS),
    };
  }
};

// 2. DATA MUTATION (SYNC) - Updates LocalStorage instantly, tries to sync to API in background
// We export a generic sync function that App.tsx can call whenever state changes
export const syncToBackend = async (endpoint: string, method: 'POST'|'PUT'|'PATCH'|'DELETE', data?: any) => {
  if (isOfflineMode) {
    // If we know we are offline, don't even bother spamming the network, just return true
    // App.tsx already saves to localStorage via useEffect
    return true;
  }

  try {
    const res = await fetchWithTimeout(`/api/${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    });
    
    if (!res.ok) {
      console.warn(`[Hybrid API] Gagal sinkronisasi ke backend untuk /api/${endpoint}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn(`[Hybrid API] Koneksi terputus saat sinkronisasi /api/${endpoint}. Tersimpan lokal.`);
    // We don't throw an error here to prevent the UI from crashing. The data is safely in localStorage.
    return false;
  }
};
