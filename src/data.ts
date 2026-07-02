import { Room, Tenant, Bill, Expense, Complaint, KostSettings } from './types';

export const INITIAL_SETTINGS: KostSettings = {
  kostName: "Kost Mawar Indah",
  address: "Jl. Dago Asri No. 42, Coblong, Bandung, Jawa Barat 40135",
  ownerName: "Ibu Indah Lestari",
  whatsapp: "081234567890",
  bankAccounts: [
    {
      id: "bank-1",
      bankName: "BCA",
      accountHolder: "INDAH LESTARI",
      accountNumber: "2330998877"
    },
    {
      id: "bank-2",
      bankName: "Mandiri",
      accountHolder: "INDAH LESTARI",
      accountNumber: "1310009988771"
    }
  ],
  defaultDueDateDay: 5,
  reminderTemplate: "Halo {nama}, ini pengingat pembayaran kost untuk kamar {kamar} periode {bulan}. Total tagihan: Rp {jumlah}. Mohon dibayarkan sebelum tanggal {tanggal}. Terima kasih - {nama_kost}.",
  autoWhatsAppReminder: false,
  qrisMerchantId: "NMID-12003892718",
  enableMultiKost: false
};

export const INITIAL_ROOMS: Room[] = [
  {
    id: "room-a01",
    number: "A01",
    status: "Terisi",
    type: "Deluxe",
    price: 1500000,
    floor: 1,
    size: "3x4 m",
    facilities: ["AC", "Kamar Mandi Dalam", "Kasur Queen", "WiFi", "Lemari Baju"],
    tenantId: "tenant-1",
    notes: "Dekat dengan gerbang depan"
  },
  {
    id: "room-a02",
    number: "A02",
    status: "Terisi",
    type: "Deluxe",
    price: 1500000,
    floor: 1,
    size: "3x4 m",
    facilities: ["AC", "Kamar Mandi Dalam", "Kasur Queen", "WiFi", "Lemari Baju"],
    tenantId: "tenant-2",
    notes: "Tenang, jauh dari jalan raya"
  },
  {
    id: "room-a03",
    number: "A03",
    status: "Kosong",
    type: "Standard",
    price: 1200000,
    floor: 1,
    size: "3x3 m",
    facilities: ["Kipas Angin", "Kamar Mandi Luar", "Kasur Single", "WiFi", "Lemari Baju"],
    notes: "Baru saja dicat ulang"
  },
  {
    id: "room-a04",
    number: "A04",
    status: "Menunggak",
    type: "Suite",
    price: 2000000,
    floor: 1,
    size: "4x4 m",
    facilities: ["AC", "Kamar Mandi Dalam", "Water Heater", "Kasur Queen", "WiFi", "TV"],
    tenantId: "tenant-3"
  },
  {
    id: "room-b01",
    number: "B01",
    status: "Terisi",
    type: "Standard",
    price: 1200000,
    floor: 2,
    size: "3x3 m",
    facilities: ["Kipas Angin", "Kamar Mandi Luar", "Kasur Single", "WiFi", "Lemari Baju"],
    tenantId: "tenant-4"
  },
  {
    id: "room-b02",
    number: "B02",
    status: "Booking",
    type: "Deluxe",
    price: 1500000,
    floor: 2,
    size: "3x4 m",
    facilities: ["AC", "Kamar Mandi Dalam", "Kasur Queen", "WiFi", "Lemari Baju"],
    notes: "Rencana masuk tanggal 10 Juni 2026"
  },
  {
    id: "room-b03",
    number: "B03",
    status: "Perbaikan",
    type: "Standard",
    price: 1200000,
    floor: 2,
    size: "3x3 m",
    facilities: ["Kipas Angin", "Kamar Mandi Luar", "Kasur Single", "WiFi"],
    notes: "Perbaikan saluran air wastafel"
  },
  {
    id: "room-b04",
    number: "B04",
    status: "Kosong",
    type: "Suite",
    price: 1800000,
    floor: 2,
    size: "3.5x4 m",
    facilities: ["AC", "Kamar Mandi Dalam", "Kasur Queen", "WiFi", "Meja Kerja"]
  }
];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: "tenant-1",
    name: "Andi Saputra",
    phone: "081298765432",
    email: "andi.saputra@gmail.com",
    emergencyContact: {
      name: "Bapak Maryono",
      relation: "Ayah Kandung",
      phone: "081211112222"
    },
    idNumber: "3273111204950001",
    roomAssigned: "A01",
    moveInDate: "2025-01-15",
    rentAmount: 1500000,
    deposit: 1500000,
    status: "Lunas",
    notes: "Mahasiswa ITB angkatan 2023, ramah dan rajin bersih-bersih"
  },
  {
    id: "tenant-2",
    name: "Rina Lestari",
    phone: "085733334444",
    email: "rina.lestari@office.com",
    emergencyContact: {
      name: "Ibu Hartati",
      relation: "Ibu Kandung",
      phone: "085755556666"
    },
    idNumber: "3273094803930002",
    roomAssigned: "A02",
    moveInDate: "2024-11-01",
    rentAmount: 1500000,
    deposit: 1500000,
    status: "Lunas",
    notes: "Karyawati bank swasta di Dago, pendiam"
  },
  {
    id: "tenant-3",
    name: "Budi Santoso",
    phone: "089912345678",
    email: "budi.santos@gmail.com",
    emergencyContact: {
      name: "Setyawan",
      relation: "Kakak",
      phone: "089922223333"
    },
    idNumber: "3204983204920005",
    roomAssigned: "A04",
    moveInDate: "2025-03-20",
    rentAmount: 2000000,
    deposit: 2000000,
    status: "Terlambat",
    notes: "Bekerja di startup bidang logistik, sering telat bayar 3-5 hari"
  },
  {
    id: "tenant-4",
    name: "Sari Wulandari",
    phone: "082199887766",
    email: "sari.wulan@student.com",
    emergencyContact: {
      name: "Bapak Joko",
      relation: "Paman",
      phone: "082177665544"
    },
    idNumber: "3273082910970003",
    roomAssigned: "B01",
    moveInDate: "2025-05-01",
    rentAmount: 1200000,
    deposit: 1000000,
    status: "Belum Bayar"
  }
];

export const INITIAL_BILLS: Bill[] = [
  {
    id: "bill-101",
    tenantId: "tenant-1",
    tenantName: "Andi Saputra",
    roomId: "room-a01",
    roomNumber: "A01",
    period: "Juni 2026",
    dueDate: "2026-06-05",
    rentAmount: 1500000,
    electricityCharge: 150000,
    waterCharge: 50000,
    additionalFee: 0,
    discount: 0,
    lateFee: 0,
    totalAmount: 1700000,
    paidAmount: 1700000,
    status: "Lunas",
    paymentMethod: "Transfer Bank",
    paymentDate: "2026-06-01",
    notes: "Sudah bayar tgl 1 pagi hari"
  },
  {
    id: "bill-102",
    tenantId: "tenant-2",
    tenantName: "Rina Lestari",
    roomId: "room-a02",
    roomNumber: "A02",
    period: "Juni 2026",
    dueDate: "2026-06-05",
    rentAmount: 1500000,
    electricityCharge: 120000,
    waterCharge: 50000,
    additionalFee: 0,
    discount: 50000, // Promo diskon bulanan
    lateFee: 0,
    totalAmount: 1620000,
    paidAmount: 1620000,
    status: "Lunas",
    paymentMethod: "Transfer Bank",
    paymentDate: "2026-05-31",
    notes: "Diskon tenant setia, bayar lebih awal"
  },
  {
    id: "bill-103",
    tenantId: "tenant-4",
    tenantName: "Sari Wulandari",
    roomId: "room-b01",
    roomNumber: "B01",
    period: "Juni 2026",
    dueDate: "2026-06-05",
    rentAmount: 1200000,
    electricityCharge: 80000,
    waterCharge: 50000,
    additionalFee: 0,
    discount: 0,
    lateFee: 0,
    totalAmount: 1330000,
    paidAmount: 0,
    status: "Belum Bayar",
    notes: "Gaji bulanan baru turun tanggal 5"
  },
  {
    id: "bill-104",
    tenantId: "tenant-3",
    tenantName: "Budi Santoso",
    roomId: "room-a04",
    roomNumber: "A04",
    period: "Mei 2026",
    dueDate: "2026-05-05",
    rentAmount: 2000000,
    electricityCharge: 220000,
    waterCharge: 50000,
    additionalFee: 30000, // Tambah biaya parkir mobil
    discount: 0,
    lateFee: 50000, // Denda tunggakan
    totalAmount: 2350000,
    paidAmount: 1000000, // Baru nyicil
    status: "Belum Bayar",
    notes: "Tunggakan Mei, sisa Rp 1.350.000 belum lunas. Janji dilunasi di tanggal 5 Juni."
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    category: "Listrik",
    description: "Bayar Listrik Token Induk Kost",
    date: "2026-05-25",
    amount: 1200000,
    notes: "Token 1.200.000 untuk sisa 2 bulan"
  },
  {
    id: "exp-2",
    category: "Air",
    description: "Iuran Bulanan PDAM Kost",
    date: "2026-05-20",
    amount: 350000,
    notes: "Tagihan normal, air bersih lancar"
  },
  {
    id: "exp-3",
    category: "Internet",
    description: "Internet Biznet 100 Mbps",
    date: "2026-05-18",
    amount: 450000,
    notes: "Biaya langganan bulanan"
  },
  {
    id: "exp-4",
    category: "Kebersihan",
    description: "Beli Alat & Sabun Pel, Pengharum Ruangan",
    date: "2026-05-12",
    amount: 150000
  },
  {
    id: "exp-5",
    category: "Perbaikan",
    description: "Service AC Kamar A01 dan A02",
    date: "2026-05-10",
    amount: 350000,
    notes: "Tambah freon dan cuci rutin"
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: "comp-1",
    tenantId: "tenant-1",
    tenantName: "Andi Saputra",
    roomId: "room-a01",
    roomNumber: "A01",
    title: "Air Washtafel Bocor",
    category: "Air",
    status: "Diproses",
    priority: "Sedang",
    date: "2026-05-30",
    description: "Saluran pembuangan air di wastafel kamar bocor, jadi membasahi lantai keramik. Mohon segera dicek karena becek.",
    notes: "Sudah hubungi tukang langganan, dijadwalkan datang besok sore."
  },
  {
    id: "comp-2",
    tenantId: "tenant-3",
    tenantName: "Budi Santoso",
    roomId: "room-a04",
    roomNumber: "A04",
    title: "AC Kamar Bocor Air",
    category: "AC/Kipas",
    status: "Selesai",
    priority: "Tinggi",
    date: "2026-05-15",
    description: "AC meneteskan air deras sekali di atas tempat tidur saya. Tidak bisa tidur malam.",
    repairCost: 150000,
    notes: "Telah dibersihkan filternya dan diservice oleh teknisi AC tgl 16 Mei. Biaya Rp150.000."
  },
  {
    id: "comp-3",
    tenantId: "tenant-4",
    tenantName: "Sari Wulandari",
    roomId: "room-b01",
    roomNumber: "B01",
    title: "WiFi Lambat Sekali Malam Hari",
    category: "Internet",
    status: "Baru",
    priority: "Rendah",
    date: "2026-05-31",
    description: "Sinyal WiFi penuh tapi koneksinya lemot sekali dari jam 8 sampai 11 malam, mohon dibantu restart router lantai 2.",
    notes: "Perlu cek apakah ada pembatasan bandwidth atau ada pemakaian berlebih."
  }
];
