import { Room, Tenant, Bill, Expense, Complaint, KostSettings, Property } from './types';

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    name: 'StayFlow Residence Gejayan',
    type: 'Kost',
    slug: 'stayflow-gejayan',
    address: 'Jl. Gejayan No. 45, Condongcatur, Depok, Sleman, DIY',
    city: 'Yogyakarta',
    description: 'Kost exclusive & penginapan harian modern di kawasan strategis Gejayan. Dekat UNY, UGM, dan fasilitas kuliner 24 jam.',
    coverImage: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80',
    facilities: ['AC', 'WiFi 150 Mbps', 'Kamar Mandi Dalam', 'Water Heater', 'Smart Key 24 jam', 'Dapur Bersama'],
    whatsapp: '081234567890',
    ownerName: 'Pemilik StayFlow',
    startPriceDay: 180000,
    startPriceMonth: 1750000,
  },
  {
    id: 'prop-2',
    name: 'StayFlow Malioboro Homestay & Villa',
    type: 'Homestay',
    slug: 'stayflow-malioboro',
    address: 'Jl. Malioboro Gg. Sosrowijayan No. 12, Danurejan, Yogyakarta',
    city: 'Yogyakarta',
    description: 'Homestay harian eksklusif hanya 3 menit jalan kaki ke Jalan Malioboro & Stasiun Tugu. Cocok untuk wisatawan & keluarga.',
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    facilities: ['AC Super Cold', 'WiFi Dedicated', 'TV LED 43"', 'Kulkas Mini', 'Sprei Hotel Premium', 'Sarapan Gratis'],
    whatsapp: '081298765432',
    ownerName: 'Pemilik StayFlow',
    startPriceDay: 250000,
    startPriceMonth: 3500000,
  },
  {
    id: 'prop-3',
    name: 'StayFlow Executive Residence Seturan',
    type: 'Guesthouse',
    slug: 'stayflow-seturan',
    address: 'Jl. Seturan Raya No. 88, Kledokan, Caturtunggal, Sleman, DIY',
    city: 'Yogyakarta',
    description: 'Penginapan & kost eksekutif full furnished dengan pemandangan kota dan parkir mobil luas. Akses cepat ke bandara & mall.',
    coverImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
    facilities: ['AC Inverter', 'WiFi High Speed', 'Balkon Private', 'Kolam Renang', 'Parkir Mobil Luas', 'Keamanan 24/7'],
    whatsapp: '081311223344',
    ownerName: 'Pemilik StayFlow',
    startPriceDay: 300000,
    startPriceMonth: 2800000,
  }
];

export const INITIAL_SETTINGS: KostSettings = {
  kostName: "StayFlow Residence Gejayan",
  address: "Jl. Gejayan No. 45, Condongcatur, Sleman, DIY",
  ownerName: "Pemilik StayFlow",
  whatsapp: "081234567890",
  checkInTime: "14:00",
  checkOutTime: "12:00",
  bankAccounts: [
    { id: 'bca-1', bankName: 'BCA', accountNumber: '8830918239', accountHolder: 'StayFlow Official' },
    { id: 'mandiri-1', bankName: 'Mandiri', accountNumber: '137001928374', accountHolder: 'StayFlow Official' }
  ],
  defaultDueDateDay: 5,
  reminderTemplate: "Halo {nama}, pengingat tagihan sewa Kamar {kamar} periode {bulan}. Total: Rp {jumlah}. Mohon transfer sebelum tanggal {tanggal}. Terima kasih — {nama_kost}.",
  dailyWelcomeTemplate: "Selamat Datang di {nama_kost}! Kamar {kamar}. Check-out jam 12:00 WIB.",
  dailyCheckoutTemplate: "Halo {nama}, pengingat waktu check-out Kamar {kamar} adalah hari ini pukul 12:00 WIB. Terima kasih telah menginap di {nama_kost}!",
  autoWhatsAppReminder: false,
  qrisMerchantId: "NMID-12003892718",
  enableMultiKost: true
};

export const INITIAL_ROOMS: Room[] = [
  // Property 1: StayFlow Residence Gejayan
  {
    id: 'room-g01',
    propertyId: 'prop-1',
    number: 'A01',
    status: 'Kosong',
    housekeepingStatus: 'Bersih',
    type: 'Standard',
    price: 1750000,
    pricePerDay: 180000,
    pricePerMonth: 1750000,
    floor: 1,
    size: '3x4 m',
    facilities: ['AC', 'WiFi', 'Kasur Queen', 'Lemari Baju', 'Kamar Mandi Dalam'],
    maxGuests: 2,
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80'],
    description: 'Kamar lantai 1 pencahayaan alami bagus dengan kasur empuk queen-size.'
  },
  {
    id: 'room-g02',
    propertyId: 'prop-1',
    number: 'A02',
    status: 'Kosong',
    housekeepingStatus: 'Bersih',
    type: 'Deluxe',
    price: 2100000,
    pricePerDay: 220000,
    pricePerMonth: 2100000,
    floor: 1,
    size: '4x4 m',
    facilities: ['AC', 'WiFi', 'Water Heater', 'Smart TV 32"', 'Meja Kerja', 'Kamar Mandi Dalam'],
    maxGuests: 2,
    images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&auto=format&fit=crop&q=80'],
    description: 'Kamar Deluxe luas lantai 1 dilengkapi TV Smart dan shower air panas.'
  },
  {
    id: 'room-g03',
    propertyId: 'prop-1',
    number: 'A03',
    status: 'Kosong',
    housekeepingStatus: 'Bersih',
    type: 'VIP',
    price: 2500000,
    pricePerDay: 280000,
    pricePerMonth: 2500000,
    floor: 2,
    size: '4x5 m',
    facilities: ['AC', 'WiFi High-Speed', 'Water Heater', 'Kulkas Mini', 'Balkon Private', 'Smart TV 43"'],
    maxGuests: 2,
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80'],
    description: 'Kamar VIP Lantai 2 dengan balkon pribadi dan pemandangan kota.'
  },

  // Property 2: StayFlow Malioboro Homestay
  {
    id: 'room-m01',
    propertyId: 'prop-2',
    number: 'H01',
    status: 'Kosong',
    housekeepingStatus: 'Bersih',
    type: 'Suite',
    price: 3500000,
    pricePerDay: 300000,
    pricePerMonth: 3500000,
    floor: 1,
    size: '5x5 m',
    facilities: ['AC Inverter', 'WiFi Dedicated', 'TV LED 43"', 'Kulkas', 'Sprei Hotel', 'Water Heater'],
    maxGuests: 3,
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80'],
    description: 'Kamar Homestay Suite Malioboro untuk keluarga / grup liburan.'
  },
  {
    id: 'room-m02',
    propertyId: 'prop-2',
    number: 'H02',
    status: 'Kosong',
    housekeepingStatus: 'Bersih',
    type: 'Standard',
    price: 2800000,
    pricePerDay: 250000,
    pricePerMonth: 2800000,
    floor: 1,
    size: '4x4 m',
    facilities: ['AC', 'WiFi', 'Water Heater', 'Smart TV', 'Kamar Mandi Dalam'],
    maxGuests: 2,
    images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&auto=format&fit=crop&q=80'],
    description: 'Kamar Homestay harian super bersih & tenang dekat Malioboro.'
  },

  // Property 3: StayFlow Executive Residence Seturan
  {
    id: 'room-s01',
    propertyId: 'prop-3',
    number: 'S01',
    status: 'Kosong',
    housekeepingStatus: 'Bersih',
    type: 'VIP',
    price: 3000000,
    pricePerDay: 320000,
    pricePerMonth: 3000000,
    floor: 2,
    size: '5x5 m',
    facilities: ['AC Inverter', 'WiFi Dedicated', 'Balkon', 'Water Heater', 'Smart Key'],
    maxGuests: 2,
    images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&auto=format&fit=crop&q=80'],
    description: 'Kamar eksekutif Seturan dengan suasana tenang dan fasilitas mewah.'
  }
];

export const INITIAL_TENANTS: Tenant[] = [];

export const INITIAL_BILLS: Bill[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_COMPLAINTS: Complaint[] = [];

