/**
 * Types and Interfaces for StayFlow - Daily & Monthly Lodging Management System
 */

export type UserRole = 'super_admin' | 'owner';
export type UserAccountStatus = 'active' | 'suspended';
export type UserPlan = 'basic' | 'pro';

export interface AuthUser {
  id: number;
  name: string;
  phone: string;
  slug: string;
  role: UserRole;
  status: UserAccountStatus;
  plan: UserPlan;
  email?: string;
}

export interface SuperAdminMetrics {
  totalOwners: number;
  activeOwners: number;
  suspendedOwners: number;
  totalRooms: number;
  occupiedRooms: number;
  totalTenants: number;
  totalRevenuePaid: number;
  totalRevenuePending: number;
}

export interface TenantAccount {
  id: number;
  name: string;
  phone: string;
  slug: string;
  email?: string;
  role: UserRole;
  status: UserAccountStatus;
  plan: UserPlan;
  kostName: string;
  roomCount: number;
  tenantCount: number;
  propertyCount: number;
  createdAt?: string;
}

export type RoomStatus = 'Kosong' | 'Terisi' | 'Booking' | 'Perbaikan' | 'Menunggak';
export type HousekeepingStatus = 'Bersih' | 'Kotor' | 'Dibersihkan';
export type RoomType = 'Standard' | 'Deluxe' | 'Suite' | 'VIP';
export type RentalType = 'Harian' | 'Bulanan' | 'Mingguan';
export type PropertyType = 'Kost' | 'Homestay' | 'Guesthouse' | 'Villa' | 'Hotel';

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  slug: string;
  address: string;
  city: string;
  description: string;
  coverImage?: string;
  images?: string[];
  facilities?: string[];
  whatsapp: string;
  ownerName: string;
  checkInTime?: string;
  checkOutTime?: string;
  bankAccounts?: BankAccount[];
  qrisMerchantId?: string;
  startPriceDay?: number;
  startPriceMonth?: number;
}

export interface Room {
  id: string;
  propertyId?: string;
  number: string;
  status: RoomStatus;
  housekeepingStatus?: HousekeepingStatus;
  type: RoomType;
  price: number; // Primary rate (monthly rate default)
  pricePerDay?: number;
  pricePerMonth?: number;
  pricePerWeek?: number;
  rentalTypesAllowed?: RentalType[];
  floor: number;
  size: string;
  facilities: string[];
  maxGuests?: number;
  tenantId?: string;
  notes?: string;
  lastMaintenanceDate?: string;
  images?: string[];
  description?: string;
}

export type TenantStatus = 'Lunas' | 'Belum Bayar' | 'Terlambat' | 'Keluar';
export type GuestType = 'Harian' | 'Bulanan';

export interface Tenant {
  id: string;
  propertyId?: string;
  name: string;
  phone: string;
  email: string;
  guestType?: GuestType;
  checkInDate?: string; // YYYY-MM-DD
  checkOutDate?: string; // YYYY-MM-DD
  idType?: 'KTP' | 'SIM' | 'Paspor';
  vehicleNumber?: string;
  totalGuests?: number;
  bookingOrigin?: 'Walk-in' | 'Online Web' | 'WhatsApp' | 'Agoda/Traveloka';
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
  propertyId?: string;
  tenantId: string;
  tenantName: string;
  roomId: string;
  roomNumber: string;
  rentalType?: RentalType;
  stayDuration?: number; // Days for daily stay, months for monthly stay
  checkInDate?: string;
  checkOutDate?: string;
  period: string; // e.g. "Juni 2026" or "08-10 Jun 2026"
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
  propertyId?: string;
  category: ExpenseCategory;
  description: string;
  date: string;
  amount: number;
  notes?: string;
}

export type ComplaintCategory = 'Listrik' | 'Air' | 'AC/Kipas' | 'Kamar mandi' | 'Pintu/Kunci' | 'Internet' | 'Kebersihan' | 'Housekeeping' | 'Lainnya';
export type ComplaintStatus = 'Baru' | 'Diproses' | 'Selesai' | 'Ditolak';
export type ComplaintPriority = 'Tinggi' | 'Sedang' | 'Rendah';

export interface Complaint {
  id: string;
  propertyId?: string;
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
  dailyWelcomeTemplate?: string;
  dailyCheckoutTemplate?: string;
  autoWhatsAppReminder: boolean;
  qrisMerchantId?: string;
  enableMultiKost: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}
