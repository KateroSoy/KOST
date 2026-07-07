import { parseJson, stripNulls, T } from './db.js';
import { INITIAL_SETTINGS } from './seed-data.js';

// ---------- rooms ----------
const rowToRoom = (r) => stripNulls({
  id: r.id, number: r.number, status: r.status, type: r.type,
  price: r.price, floor: r.floor, size: r.size,
  facilities: parseJson(r.facilities, []),
  tenantId: r.tenantId, notes: r.notes, lastMaintenanceDate: r.lastMaintenanceDate,
});

export async function listRooms(db) {
  const [rows] = await db.query(`SELECT * FROM ${T.rooms} ORDER BY seq ASC`);
  return rows.map(rowToRoom);
}

export async function getRoom(db, id) {
  const [rows] = await db.query(`SELECT * FROM ${T.rooms} WHERE id = ?`, [id]);
  return rows[0] ? rowToRoom(rows[0]) : null;
}

export async function upsertRoom(db, r) {
  await db.query(
    `INSERT INTO ${T.rooms} (id, number, status, type, price, floor, size, facilities, tenantId, notes, lastMaintenanceDate)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE number=VALUES(number), status=VALUES(status), type=VALUES(type),
       price=VALUES(price), floor=VALUES(floor), size=VALUES(size), facilities=VALUES(facilities),
       tenantId=VALUES(tenantId), notes=VALUES(notes), lastMaintenanceDate=VALUES(lastMaintenanceDate)`,
    [r.id, r.number, r.status, r.type, r.price ?? 0, r.floor ?? 1, r.size ?? '',
     JSON.stringify(r.facilities ?? []), r.tenantId ?? null, r.notes ?? null, r.lastMaintenanceDate ?? null]
  );
}

export async function deleteRoom(db, id) {
  await db.query(`DELETE FROM ${T.rooms} WHERE id = ?`, [id]);
}

// ---------- tenants ----------
const rowToTenant = (r) => stripNulls({
  id: r.id, name: r.name, phone: r.phone, email: r.email,
  emergencyContact: parseJson(r.emergencyContact, { name: '', relation: '', phone: '' }),
  idNumber: r.idNumber, roomAssigned: r.roomAssigned, moveInDate: r.moveInDate,
  rentAmount: r.rentAmount, deposit: r.deposit, status: r.status,
  notes: r.notes, idPhotoUrl: r.idPhotoUrl,
});

export async function listTenants(db) {
  const [rows] = await db.query(`SELECT * FROM ${T.tenants} ORDER BY seq ASC`);
  return rows.map(rowToTenant);
}

export async function getTenant(db, id) {
  const [rows] = await db.query(`SELECT * FROM ${T.tenants} WHERE id = ?`, [id]);
  return rows[0] ? rowToTenant(rows[0]) : null;
}

export async function upsertTenant(db, t) {
  await db.query(
    `INSERT INTO ${T.tenants} (id, name, phone, email, emergencyContact, idNumber, roomAssigned, moveInDate, rentAmount, deposit, status, notes, idPhotoUrl)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), email=VALUES(email),
       emergencyContact=VALUES(emergencyContact), idNumber=VALUES(idNumber), roomAssigned=VALUES(roomAssigned),
       moveInDate=VALUES(moveInDate), rentAmount=VALUES(rentAmount), deposit=VALUES(deposit),
       status=VALUES(status), notes=VALUES(notes), idPhotoUrl=VALUES(idPhotoUrl)`,
    [t.id, t.name, t.phone ?? '', t.email ?? '',
     JSON.stringify(t.emergencyContact ?? { name: '', relation: '', phone: '' }),
     t.idNumber ?? '', t.roomAssigned ?? '', t.moveInDate ?? '',
     t.rentAmount ?? 0, t.deposit ?? 0, t.status, t.notes ?? null, t.idPhotoUrl ?? null]
  );
}

export async function deleteTenant(db, id) {
  await db.query(`DELETE FROM ${T.tenants} WHERE id = ?`, [id]);
}

// ---------- bills ----------
const rowToBill = (r) => stripNulls({
  id: r.id, tenantId: r.tenantId, tenantName: r.tenantName, roomId: r.roomId,
  roomNumber: r.roomNumber, period: r.period, dueDate: r.dueDate,
  rentAmount: r.rentAmount, electricityCharge: r.electricityCharge, waterCharge: r.waterCharge,
  additionalFee: r.additionalFee, discount: r.discount, lateFee: r.lateFee,
  totalAmount: r.totalAmount, paidAmount: r.paidAmount, status: r.status,
  paymentMethod: r.paymentMethod, paymentDate: r.paymentDate, notes: r.notes,
});

export async function listBills(db) {
  const [rows] = await db.query(`SELECT * FROM ${T.bills} ORDER BY seq DESC`);
  return rows.map(rowToBill);
}

export async function getBill(db, id) {
  const [rows] = await db.query(`SELECT * FROM ${T.bills} WHERE id = ?`, [id]);
  return rows[0] ? rowToBill(rows[0]) : null;
}

export async function upsertBill(db, b) {
  await db.query(
    `INSERT INTO ${T.bills} (id, tenantId, tenantName, roomId, roomNumber, period, dueDate, rentAmount,
       electricityCharge, waterCharge, additionalFee, discount, lateFee, totalAmount, paidAmount,
       status, paymentMethod, paymentDate, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE tenantId=VALUES(tenantId), tenantName=VALUES(tenantName), roomId=VALUES(roomId),
       roomNumber=VALUES(roomNumber), period=VALUES(period), dueDate=VALUES(dueDate),
       rentAmount=VALUES(rentAmount), electricityCharge=VALUES(electricityCharge), waterCharge=VALUES(waterCharge),
       additionalFee=VALUES(additionalFee), discount=VALUES(discount), lateFee=VALUES(lateFee),
       totalAmount=VALUES(totalAmount), paidAmount=VALUES(paidAmount), status=VALUES(status),
       paymentMethod=VALUES(paymentMethod), paymentDate=VALUES(paymentDate), notes=VALUES(notes)`,
    [b.id, b.tenantId, b.tenantName ?? '', b.roomId ?? '', b.roomNumber ?? '', b.period ?? '',
     b.dueDate ?? '', b.rentAmount ?? 0, b.electricityCharge ?? 0, b.waterCharge ?? 0,
     b.additionalFee ?? 0, b.discount ?? 0, b.lateFee ?? 0, b.totalAmount ?? 0, b.paidAmount ?? 0,
     b.status, b.paymentMethod ?? null, b.paymentDate ?? null, b.notes ?? null]
  );
}

export async function deleteBill(db, id) {
  await db.query(`DELETE FROM ${T.bills} WHERE id = ?`, [id]);
}

// ---------- expenses ----------
const rowToExpense = (r) => stripNulls({
  id: r.id, category: r.category, description: r.description,
  date: r.date, amount: r.amount, notes: r.notes,
});

export async function listExpenses(db) {
  const [rows] = await db.query(`SELECT * FROM ${T.expenses} ORDER BY seq DESC`);
  return rows.map(rowToExpense);
}

export async function upsertExpense(db, e) {
  await db.query(
    `INSERT INTO ${T.expenses} (id, category, description, date, amount, notes)
     VALUES (?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE category=VALUES(category), description=VALUES(description),
       date=VALUES(date), amount=VALUES(amount), notes=VALUES(notes)`,
    [e.id, e.category, e.description ?? '', e.date ?? '', e.amount ?? 0, e.notes ?? null]
  );
}

export async function deleteExpense(db, id) {
  await db.query(`DELETE FROM ${T.expenses} WHERE id = ?`, [id]);
}

// ---------- complaints ----------
const rowToComplaint = (r) => stripNulls({
  id: r.id, tenantId: r.tenantId, tenantName: r.tenantName, roomId: r.roomId,
  roomNumber: r.roomNumber, title: r.title, category: r.category, status: r.status,
  priority: r.priority, date: r.date, description: r.description,
  repairCost: r.repairCost, notes: r.notes,
});

export async function listComplaints(db) {
  const [rows] = await db.query(`SELECT * FROM ${T.complaints} ORDER BY seq DESC`);
  return rows.map(rowToComplaint);
}

export async function getComplaint(db, id) {
  const [rows] = await db.query(`SELECT * FROM ${T.complaints} WHERE id = ?`, [id]);
  return rows[0] ? rowToComplaint(rows[0]) : null;
}

export async function upsertComplaint(db, c) {
  await db.query(
    `INSERT INTO ${T.complaints} (id, tenantId, tenantName, roomId, roomNumber, title, category, status, priority, date, description, repairCost, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE tenantId=VALUES(tenantId), tenantName=VALUES(tenantName), roomId=VALUES(roomId),
       roomNumber=VALUES(roomNumber), title=VALUES(title), category=VALUES(category), status=VALUES(status),
       priority=VALUES(priority), date=VALUES(date), description=VALUES(description),
       repairCost=VALUES(repairCost), notes=VALUES(notes)`,
    [c.id, c.tenantId ?? '', c.tenantName ?? '', c.roomId ?? '', c.roomNumber ?? '', c.title,
     c.category, c.status, c.priority, c.date ?? '', c.description ?? '', c.repairCost ?? null, c.notes ?? null]
  );
}

export async function deleteComplaint(db, id) {
  await db.query(`DELETE FROM ${T.complaints} WHERE id = ?`, [id]);
}

// ---------- settings (singleton row id=1) ----------
export async function getSettings(db) {
  const [rows] = await db.query(`SELECT data FROM ${T.settings} WHERE id = 1`);
  if (!rows[0]) {
    await putSettings(db, INITIAL_SETTINGS);
    return INITIAL_SETTINGS;
  }
  return parseJson(rows[0].data, INITIAL_SETTINGS);
}

export async function putSettings(db, s) {
  await db.query(
    `INSERT INTO ${T.settings} (id, data) VALUES (1, ?) ON DUPLICATE KEY UPDATE data=VALUES(data)`,
    [JSON.stringify(s)]
  );
}
