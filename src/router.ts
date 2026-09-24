export type AuthMode = 'landing' | 'login' | 'register' | 'onboarding' | 'dashboard' | 'property-website';

export type DashboardTab = 
  | 'dashboard' 
  | 'rooms' 
  | 'bookings' 
  | 'tenants' 
  | 'bills' 
  | 'payments' 
  | 'operations' 
  | 'website' 
  | 'team' 
  | 'expenses' 
  | 'complaints' 
  | 'reports' 
  | 'settings' 
  | 'super_admin';

export interface RouteState {
  authMode: AuthMode;
  tab: DashboardTab;
  propertyId: string;
  from?: string;
  queryParams?: Record<string, string>;
}

const VALID_TABS: DashboardTab[] = [
  'dashboard', 'rooms', 'bookings', 'tenants', 'bills', 
  'payments', 'operations', 'website', 'team', 'expenses', 
  'complaints', 'reports', 'settings', 'super_admin'
];

/**
 * Parse current browser URL (hash, search, pathname) into RouteState
 */
export function parseCurrentRoute(): RouteState {
  if (typeof window === 'undefined') {
    return { authMode: 'landing', tab: 'dashboard', propertyId: 'prop-1' };
  }

  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const pathname = window.location.pathname || '';

  // 1. Check search params first (backward compatibility for ?property=prop-1 or ?owner=slug)
  const urlSearch = new URLSearchParams(search);
  const propParam = urlSearch.get('property');
  if (propParam) {
    return {
      authMode: 'property-website',
      tab: 'dashboard',
      propertyId: propParam,
      from: urlSearch.get('from') || 'landing',
      queryParams: Object.fromEntries(urlSearch.entries())
    };
  }

  // 2. Parse hash: e.g. #/p/prop-1?from=website or #/app/rooms or #/login
  let hashPath = hash.replace(/^#\/?/, '/');
  let hashQueryString = '';
  if (hashPath.includes('?')) {
    const [pathPart, queryPart] = hashPath.split('?');
    hashPath = pathPart;
    hashQueryString = queryPart;
  }
  const hashParams = new URLSearchParams(hashQueryString);

  // Normalize path
  const effectivePath = (hashPath && hashPath !== '/') ? hashPath : (pathname !== '/' ? pathname : '/');

  // Match /p/:id or /property/:id
  if (effectivePath.startsWith('/p/') || effectivePath.startsWith('/property/')) {
    const segments = effectivePath.split('/').filter(Boolean);
    const propId = segments[1] || 'prop-1';
    return {
      authMode: 'property-website',
      tab: 'dashboard',
      propertyId: propId,
      from: hashParams.get('from') || urlSearch.get('from') || 'landing',
      queryParams: Object.fromEntries(hashParams.entries())
    };
  }

  // Match /login
  if (effectivePath === '/login') {
    return {
      authMode: 'login',
      tab: 'dashboard',
      propertyId: 'prop-1',
      from: hashParams.get('from') || undefined,
      queryParams: Object.fromEntries(hashParams.entries())
    };
  }

  // Match /register
  if (effectivePath === '/register') {
    return {
      authMode: 'register',
      tab: 'dashboard',
      propertyId: 'prop-1',
      from: hashParams.get('from') || undefined,
      queryParams: Object.fromEntries(hashParams.entries())
    };
  }

  // Match /onboarding
  if (effectivePath === '/onboarding') {
    return {
      authMode: 'onboarding',
      tab: 'dashboard',
      propertyId: 'prop-1',
      from: hashParams.get('from') || undefined,
      queryParams: Object.fromEntries(hashParams.entries())
    };
  }

  // Match /app or /app/:tab
  if (effectivePath === '/app' || effectivePath.startsWith('/app/')) {
    const segments = effectivePath.split('/').filter(Boolean);
    const tabPart = (segments[1] as DashboardTab) || 'dashboard';
    const tab = VALID_TABS.includes(tabPart) ? tabPart : 'dashboard';
    return {
      authMode: 'dashboard',
      tab,
      propertyId: hashParams.get('property') || 'prop-1',
      from: hashParams.get('from') || undefined,
      queryParams: Object.fromEntries(hashParams.entries())
    };
  }

  // Default to landing page
  return {
    authMode: 'landing',
    tab: 'dashboard',
    propertyId: 'prop-1',
    from: undefined,
    queryParams: Object.fromEntries(hashParams.entries())
  };
}

/**
 * Build target URL string from route definition
 */
export function buildRouteUrl(route: Partial<RouteState>): string {
  const authMode = route.authMode || 'landing';

  if (authMode === 'landing') {
    return '#/';
  }

  if (authMode === 'login') {
    return '#/login';
  }

  if (authMode === 'register') {
    return '#/register';
  }

  if (authMode === 'onboarding') {
    return '#/onboarding';
  }

  if (authMode === 'property-website') {
    const propId = route.propertyId || 'prop-1';
    const fromParam = route.from ? `?from=${encodeURIComponent(route.from)}` : '';
    return `#/p/${propId}${fromParam}`;
  }

  if (authMode === 'dashboard') {
    const tab = route.tab || 'dashboard';
    const q = route.queryParams && Object.keys(route.queryParams).length > 0
      ? `?${new URLSearchParams(route.queryParams).toString()}`
      : '';
    return `#/app/${tab}${q}`;
  }

  return '#/';
}

/**
 * Navigate to a new route, updating browser history (pushState)
 */
export function navigateTo(target: Partial<RouteState>, options?: { replace?: boolean }) {
  if (typeof window === 'undefined') return;

  const targetUrl = buildRouteUrl(target);
  const stateData: RouteState = {
    authMode: target.authMode || 'landing',
    tab: target.tab || 'dashboard',
    propertyId: target.propertyId || 'prop-1',
    from: target.from,
    queryParams: target.queryParams
  };

  if (options?.replace) {
    window.history.replaceState(stateData, '', targetUrl);
  } else {
    window.history.pushState(stateData, '', targetUrl);
  }

  // Notify active listeners
  window.dispatchEvent(new CustomEvent('app-route-change', { detail: stateData }));
}

/**
 * Navigate to a well-defined fallback route (e.g. closing a form/modal).
 *
 * This deliberately does not use window.history.back(): history.length counts the
 * whole browser tab's session (not just this app's navigations), so it is almost
 * always > 1 and "back" would land on whatever page the user happened to visit
 * before this one rather than the caller's intended destination.
 */
export function goBackWithFallback(fallbackRoute: Partial<RouteState>) {
  if (typeof window === 'undefined') return;
  navigateTo(fallbackRoute, { replace: true });
}
