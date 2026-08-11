#!/bin/bash
# Restore initial seed data to Hostinger production DB via /api/restore
# Usage: bash restore_seed_to_db.sh

API_URL="https://blueviolet-gorilla-427889.hostingersite.com/api/restore"

echo "🔄 Mengirim restore ke $API_URL ..."

curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "kostSettings": {
      "kostName": "StayFlow Residence Gejayan",
      "address": "Jl. Gejayan No. 45, Condongcatur, Sleman, DIY",
      "ownerName": "Pemilik StayFlow",
      "whatsapp": "081234567890",
      "checkInTime": "14:00",
      "checkOutTime": "12:00",
      "bankAccounts": [
        {"id":"bca-1","bankName":"BCA","accountNumber":"8830918239","accountHolder":"StayFlow Official"},
        {"id":"mandiri-1","bankName":"Mandiri","accountNumber":"137001928374","accountHolder":"StayFlow Official"}
      ],
      "defaultDueDateDay": 5,
      "reminderTemplate": "Halo {nama}, pengingat tagihan sewa Kamar {kamar} periode {bulan}. Total: Rp {jumlah}. Mohon transfer sebelum tanggal {tanggal}. Terima kasih — {nama_kost}.",
      "dailyWelcomeTemplate": "Selamat Datang di {nama_kost}! Kamar {kamar}. Check-out jam 12:00 WIB.",
      "dailyCheckoutTemplate": "Halo {nama}, pengingat waktu check-out Kamar {kamar} adalah hari ini pukul 12:00 WIB. Terima kasih telah menginap di {nama_kost}!",
      "autoWhatsAppReminder": false,
      "qrisMerchantId": "NMID-12003892718",
      "enableMultiKost": true
    },
    "rooms": [
      {
        "id": "room-g01", "number": "A01", "status": "Kosong", "housekeepingStatus": "Bersih",
        "type": "Standard", "price": 1750000, "pricePerDay": 180000, "pricePerMonth": 1750000, "pricePerWeek": 0,
        "floor": 1, "size": "3x4 m", "maxGuests": 2,
        "facilities": ["AC","WiFi","Kasur Queen","Lemari Baju","Kamar Mandi Dalam"],
        "images": ["https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80"],
        "description": "Kamar lantai 1 pencahayaan alami bagus dengan kasur empuk queen-size."
      },
      {
        "id": "room-g02", "number": "A02", "status": "Kosong", "housekeepingStatus": "Bersih",
        "type": "Deluxe", "price": 2100000, "pricePerDay": 220000, "pricePerMonth": 2100000, "pricePerWeek": 0,
        "floor": 1, "size": "4x4 m", "maxGuests": 2,
        "facilities": ["AC","WiFi","Water Heater","Smart TV 32\"","Meja Kerja","Kamar Mandi Dalam"],
        "images": ["https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&auto=format&fit=crop&q=80"],
        "description": "Kamar Deluxe luas lantai 1 dilengkapi TV Smart dan shower air panas."
      },
      {
        "id": "room-g03", "number": "A03", "status": "Kosong", "housekeepingStatus": "Bersih",
        "type": "VIP", "price": 2500000, "pricePerDay": 280000, "pricePerMonth": 2500000, "pricePerWeek": 0,
        "floor": 2, "size": "4x5 m", "maxGuests": 2,
        "facilities": ["AC","WiFi High-Speed","Water Heater","Kulkas Mini","Balkon Private","Smart TV 43\""],
        "images": ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80"],
        "description": "Kamar VIP Lantai 2 dengan balkon pribadi dan pemandangan kota."
      },
      {
        "id": "room-m01", "number": "H01", "status": "Kosong", "housekeepingStatus": "Bersih",
        "type": "Suite", "price": 3500000, "pricePerDay": 300000, "pricePerMonth": 3500000, "pricePerWeek": 0,
        "floor": 1, "size": "5x5 m", "maxGuests": 3,
        "facilities": ["AC Inverter","WiFi Dedicated","TV LED 43\"","Kulkas","Sprei Hotel","Water Heater"],
        "images": ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80"],
        "description": "Kamar Homestay Suite Malioboro untuk keluarga / grup liburan."
      },
      {
        "id": "room-m02", "number": "H02", "status": "Kosong", "housekeepingStatus": "Bersih",
        "type": "Standard", "price": 2800000, "pricePerDay": 250000, "pricePerMonth": 2800000, "pricePerWeek": 0,
        "floor": 1, "size": "4x4 m", "maxGuests": 2,
        "facilities": ["AC","WiFi","Water Heater","Smart TV","Kamar Mandi Dalam"],
        "images": ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&auto=format&fit=crop&q=80"],
        "description": "Kamar Homestay harian super bersih & tenang dekat Malioboro."
      },
      {
        "id": "room-s01", "number": "S01", "status": "Kosong", "housekeepingStatus": "Bersih",
        "type": "VIP", "price": 3000000, "pricePerDay": 320000, "pricePerMonth": 3000000, "pricePerWeek": 0,
        "floor": 2, "size": "5x5 m", "maxGuests": 2,
        "facilities": ["AC Inverter","WiFi Dedicated","Balkon","Water Heater","Smart Key"],
        "images": ["https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&auto=format&fit=crop&q=80"],
        "description": "Kamar eksekutif Seturan dengan suasana tenang dan fasilitas mewah."
      }
    ],
    "tenants": [],
    "bills": [],
    "expenses": [],
    "complaints": []
  }'

echo ""
echo "✅ Selesai!"
