// Behavioural smoke test. Usage: node scripts/smoke-api.mjs [baseUrl]
// Requires the API server running with a reachable MySQL.
const BASE = process.argv[2] || 'http://localhost:3001';
let failed = 0;

const call = async (method, path, body) => {
  const res = await fetch(`${BASE}/api/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} /api/${path} -> ${res.status}`);
  return res.json();
};

const check = (name, cond) => {
  console.log(`${cond ? '  ✅' : '  ❌'} ${name}`);
  if (!cond) failed++;
};

const ts = Date.now();

// settings
const settings = await call('GET', 'settings');
check('GET settings returns kostName', typeof settings.kostName === 'string');

// rooms CRUD
const room = { id: `smoke-room-${ts}`, number: `Z${ts % 1000}`, status: 'Kosong', type: 'Standard', price: 500000, floor: 9, size: '3x3 m', facilities: ['WiFi'] };
await call('POST', 'rooms', room);
let rooms = await call('GET', 'rooms');
check('POST room persists', rooms.some(r => r.id === room.id && r.facilities[0] === 'WiFi'));
await call('PATCH', `rooms/${room.id}`, { status: 'Perbaikan' });
rooms = await call('GET', 'rooms');
check('PATCH room status', rooms.find(r => r.id === room.id)?.status === 'Perbaikan');

// tenant -> auto bill + room flip
const tenant = { id: `smoke-tenant-${ts}`, name: 'Smoke Tester', phone: '08123', email: 's@t.id', emergencyContact: { name: 'X', relation: 'Y', phone: '0' }, idNumber: '1', roomAssigned: room.id, moveInDate: '2026-07-07', rentAmount: 500000, deposit: 0, status: 'Belum Bayar' };
await call('POST', 'tenants', tenant);
rooms = await call('GET', 'rooms');
check('room becomes Terisi with tenantId', rooms.find(r => r.id === room.id)?.tenantId === tenant.id);
let bills = await call('GET', 'bills');
const autoBill = bills.find(b => b.tenantId === tenant.id);
check('auto bill created for tenant', !!autoBill && autoBill.totalAmount === 500000 && autoBill.status === 'Belum Bayar');

// partial then full payment
await call('POST', `bills/${autoBill.id}/payments`, { amountPaid: 200000, method: 'Tunai', date: '2026-07-07' });
bills = await call('GET', 'bills');
check('partial payment -> Sebagian', bills.find(b => b.id === autoBill.id)?.status === 'Sebagian');
await call('POST', `bills/${autoBill.id}/payments`, { amountPaid: 300000, method: 'Tunai', date: '2026-07-07' });
bills = await call('GET', 'bills');
check('full payment -> Lunas', bills.find(b => b.id === autoBill.id)?.status === 'Lunas');
let tenants = await call('GET', 'tenants');
check('tenant flips to Lunas', tenants.find(t => t.id === tenant.id)?.status === 'Lunas');

// expense + complaint CRUD
const expense = { id: `smoke-exp-${ts}`, category: 'Lainnya', description: 'smoke', date: '2026-07-07', amount: 1000 };
await call('POST', 'expenses', expense);
check('POST expense persists', (await call('GET', 'expenses')).some(e => e.id === expense.id));
const complaint = { id: `smoke-comp-${ts}`, tenantId: tenant.id, tenantName: tenant.name, roomId: room.id, roomNumber: room.number, title: 'smoke', category: 'Lainnya', status: 'Baru', priority: 'Rendah', date: '2026-07-07', description: 'smoke' };
await call('POST', 'complaints', complaint);
const expCountBeforePatch = (await call('GET', 'expenses')).length;
await call('PATCH', `complaints/${complaint.id}`, { status: 'Selesai', repairCost: 5000 });
const comps = await call('GET', 'complaints');
check('PATCH complaint merges fields', comps.find(c => c.id === complaint.id)?.status === 'Selesai' && comps.find(c => c.id === complaint.id)?.repairCost === 5000);
check('complaint PATCH did NOT auto-create expense', (await call('GET', 'expenses')).length === expCountBeforePatch);

// move-out: unpaid bill dropped, room freed, tenant deleted
const bill2 = { id: `smoke-bill-${ts}`, tenantId: tenant.id, tenantName: tenant.name, roomId: room.id, roomNumber: room.number, period: 'Juli 2026', dueDate: '2026-07-05', rentAmount: 500000, electricityCharge: 0, waterCharge: 0, additionalFee: 0, discount: 0, lateFee: 0, totalAmount: 500000, paidAmount: 0, status: 'Belum Bayar' };
await call('POST', 'bills', bill2);
await call('POST', `tenants/${tenant.id}/move-out`);
tenants = await call('GET', 'tenants');
bills = await call('GET', 'bills');
rooms = await call('GET', 'rooms');
check('move-out deletes tenant', !tenants.some(t => t.id === tenant.id));
check('move-out drops unpaid bill, keeps Lunas bill', !bills.some(b => b.id === bill2.id) && bills.some(b => b.id === autoBill.id));
check('move-out frees room', rooms.find(r => r.id === room.id)?.status === 'Kosong' && !rooms.find(r => r.id === room.id)?.tenantId);

// cleanup smoke rows
await call('DELETE', `bills/${autoBill.id}`);
await call('DELETE', `complaints/${complaint.id}`);
await call('DELETE', `expenses/${expense.id}`);
await call('DELETE', `rooms/${room.id}`);

console.log(failed === 0 ? '\nSEMUA SMOKE TEST LULUS ✅' : `\n${failed} CHECK GAGAL ❌`);
process.exit(failed === 0 ? 0 : 1);
