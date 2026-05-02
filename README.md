# AR Penunjuk Arah Ruangan di Gedung Kampus

Aplikasi Augmented Reality sederhana untuk navigasi ruangan di gedung kampus menggunakan marker-based AR.

## 🎯 Tujuan Aplikasi

Aplikasi ini dibuat untuk mata kuliah Virtual Augmented Reality dengan menerapkan konsep dasar AR:
1. **3D Models / Digital Object** - Objek 3D (teks, panel, panah)
2. **AR SDK / Library** - A-Frame dan AR.js
3. **Tracking** - Marker HIRO
4. **Rendering** - Render objek AR di atas marker

## 🛠️ Teknologi yang Digunakan

- **HTML5** - Struktur halaman
- **CSS3** - Styling dan layout
- **JavaScript** - Logika aplikasi
- **A-Frame 1.4.0** - Framework WebVR/AR
- **AR.js 3.4.5** - Library marker-based AR
- **LocalStorage** - Penyimpanan data sementara

## 📁 Struktur File

```
├── index.html      # Halaman setting/konfigurasi
├── ar.html         # Halaman AR dengan kamera
├── style.css       # Styling untuk semua halaman
├── app.js          # Logic untuk index.html
├── ar.js           # Logic untuk ar.html
└── README.md       # Dokumentasi
```

## 🚀 Cara Menjalankan

1. **Persiapan:**
   - Download atau print marker HIRO dari: https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png
   - Pastikan browser mendukung WebRTC (Chrome, Firefox, Safari)
   - Izinkan akses kamera saat diminta

2. **Menjalankan Aplikasi:**
   - Buka folder project dengan Live Server (VS Code extension)
   - Atau gunakan server lokal lainnya (http-server, Python SimpleHTTPServer, dll)
   - Akses `index.html` melalui browser

3. **Menggunakan Aplikasi:**
   - Pilih ruang tujuan dari dropdown
   - Pilih lantai awal Anda
   - Lihat preview navigasi
   - Klik tombol "Mulai AR"
   - Arahkan kamera ke marker HIRO
   - Objek AR akan muncul di atas marker
   - Gunakan tombol manual untuk koreksi lantai
   - Sensor gerak (opsional) akan otomatis mendeteksi perpindahan lantai

## 📱 Fitur Aplikasi

### Halaman Index (index.html)
- ✅ Pilih ruang tujuan
- ✅ Pilih lantai awal
- ✅ Preview informasi navigasi
- ✅ Validasi input sebelum mulai AR

### Halaman AR (ar.html)
- ✅ Kamera real-time
- ✅ Deteksi marker HIRO
- ✅ Objek AR 3D (panel, teks, panah)
- ✅ Informasi lantai saat ini
- ✅ Instruksi arah (NAIK/TURUN/SAMPAI)
- ✅ Daftar ruangan di lantai saat ini
- ✅ Panah 3D dinamis
- ✅ Kontrol manual (tombol naik/turun lantai)
- ✅ Sensor gerak (opsional, untuk iOS perlu permission)
- ✅ Notifikasi suara saat sampai tujuan
- ✅ Notifikasi getar saat sampai tujuan
- ✅ Status marker real-time
- ✅ Panduan marker HIRO

## 🎮 Kontrol

### Manual
- **Naik 1 Lantai** - Naikkan lantai saat ini
- **Turun 1 Lantai** - Turunkan lantai saat ini
- **Kembali** - Kembali ke halaman setting

### Sensor Gerak (Opsional)
- Deteksi gerakan perangkat
- Otomatis update lantai menuju tujuan
- Cooldown 3 detik antar deteksi
- Untuk iOS: klik tombol "Aktifkan Sensor" terlebih dahulu

## 📊 Data Ruangan

Aplikasi menggunakan data contoh 9 ruangan di 3 lantai:

**Lantai 1:**
- Ruang 101
- Ruang 102
- Ruang 103

**Lantai 2:**
- Ruang 201
- Ruang 202
- Ruang 203

**Lantai 3:**
- Ruang 301
- Ruang 302
- Ruang 303

## 🔧 Konfigurasi

### Mengubah Data Ruangan
Edit array `rooms` di `app.js` dan `ar.js`:

```javascript
const rooms = [
    { id: "101", name: "Ruang 101", floor: 1 },
    // tambahkan ruangan lain...
];
```

### Mengubah Threshold Sensor
Edit di `ar.js`:

```javascript
const motionThreshold = 5;      // Sensitivitas gerakan
const motionCooldown = 3000;    // Cooldown dalam ms
```

## 🐛 Troubleshooting

### Kamera tidak muncul
- Pastikan browser memiliki izin akses kamera
- Gunakan HTTPS atau localhost
- Coba browser lain (Chrome/Firefox)

### Marker tidak terdeteksi
- Pastikan pencahayaan cukup
- Jaga jarak 20-50 cm dari marker
- Pastikan marker tidak terlipat atau rusak
- Marker harus terlihat penuh oleh kamera

### Objek AR tidak muncul
- Tunggu hingga marker terdeteksi (status dot hijau)
- Pastikan marker HIRO yang benar
- Refresh halaman dan coba lagi

### Sensor tidak aktif
- Untuk iOS: klik tombol "Aktifkan Sensor"
- Pastikan perangkat memiliki accelerometer
- Beberapa browser desktop tidak mendukung sensor gerak

### Notifikasi suara tidak keluar
- Pastikan volume perangkat tidak mute
- Beberapa browser memblokir autoplay audio
- Coba interaksi dengan halaman terlebih dahulu

## 📝 Catatan Pengembangan

### Kenapa 2 Halaman?
- `index.html` untuk setting agar tidak membebani kamera
- `ar.html` khusus AR agar kamera lebih stabil
- Menghindari bug display:none pada a-scene

### Kenapa Tidak Pakai Service Worker?
- Menghindari masalah cache saat development
- Lebih mudah untuk testing dan debugging
- Bisa ditambahkan nanti untuk production

### Konsep AR yang Diterapkan
1. **Digital Object**: Panel 3D, teks, panah menggunakan A-Frame primitives
2. **AR Library**: AR.js untuk marker tracking
3. **Tracking**: Marker HIRO sebagai anchor point
4. **Rendering**: A-Frame renderer dengan alpha channel

## 🎓 Untuk Keperluan Akademik

Aplikasi ini cocok untuk:
- Demo konsep dasar AR
- Tugas mata kuliah Virtual/Augmented Reality
- Pembelajaran marker-based AR
- Prototype navigasi indoor sederhana

## 📄 Lisensi

Project ini dibuat untuk keperluan edukasi dan pembelajaran.

## 👨‍💻 Pengembangan Lebih Lanjut

Ide pengembangan:
- [ ] Tambah lebih banyak ruangan
- [ ] Integrasi dengan database
- [ ] Multi-marker support
- [ ] Animasi objek AR
- [ ] Peta lantai 2D
- [ ] Riwayat navigasi
- [ ] Mode markerless (location-based)
- [ ] PWA dengan offline support

---

**Selamat mencoba! 🚀**
