/**
 * Types and Interfaces for KOSTOS Management System
 */

export type RoomStatus = 'Kosong' | 'Terisi' | 'Booking' | 'Perbaikan' | 'Menunggak';

export type RoomType = 'Standard' | 'Deluxe' | 'Suite' | 'VIP';

export interface Room {
  id: string;
  number: string;
  status: RoomStatus;
  type: RoomType;
  price: number;
  floor: number;
  size: string;
  facilities: string[];
  tenantId?: string;
  notes?: string;
  lastMaintenanceDate?: string;
}

export type TenantStatus = 'Lunas' | 'Belum Bayar' | 'Terlambat' | 'Keluar';

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  idNumber: string; // KTP
  roomAssigned: string; // Room number or ID
  moveInDate: string;
  rentAmount: number;
  deposit: number;
  status: TenantStatus;
  notes?: string;
  idPhotoUrl?: string;
}

export type BillStatus = 'Lunas' | 'Belum Bayar' | 'Terlambat' | 'Sebagian';

export interface Bill {
  id: string;
  tenantId: string;
  tenantName: string;
  roomId: string;
  roomNumber: string;
  period: string; // e.g. "Juni 2026"
  dueDate: string;
  rentAmount: number;
  electricityCharge: number;
  waterCharge: number;
  additionalFee: number;
  discount: number;
  lateFee: number;
  totalAmount: number;
  paidAmount: number;
  status: BillStatus;
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
}

export type ExpenseCategory = 'Listrik' | 'Air' | 'Internet' | 'Kebersihan' | 'Perbaikan' | 'Keamanan' | 'Perabot' | 'Lainnya';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  date: string;
  amount: number;
  notes?: string;
}

export type ComplaintCategory = 'Listrik' | 'Air' | 'AC/Kipas' | 'Kamar mandi' | 'Pintu/Kunci' | 'Internet' | 'Kebersihan' | 'Lainnya';
export type ComplaintStatus = 'Baru' | 'Diproses' | 'Selesai' | 'Ditolak';
export type ComplaintPriority = 'Tinggi' | 'Sedang' | 'Rendah';

export interface Complaint {
  id: string;
  tenantId: string;
  tenantName: string;
  roomId: string;
  roomNumber: string;
  title: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  date: string;
  description: string;
  repairCost?: number;
  notes?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}

export interface KostSettings {
  kostName: string;
  address: string;
  ownerName: string;
  whatsapp: string;
  bankAccounts: BankAccount[];
  defaultDueDateDay: number;
  reminderTemplate: string;
  autoWhatsAppReminder: boolean;
  qrisMerchantId?: string;
  enableMultiKost: boolean;
}
