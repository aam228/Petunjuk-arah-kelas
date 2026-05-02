# 🚀 Quick Start Guide

Panduan cepat untuk menjalankan aplikasi AR Penunjuk Arah Ruangan.

## ⚡ 3 Langkah Cepat

### 1️⃣ Persiapan Marker
```bash
# Buka marker-hiro.html di browser
# Atau download marker dari:
https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png

# Print marker atau tampilkan di layar lain
```

### 2️⃣ Jalankan Server
```bash
# Pilih salah satu cara:

# Cara 1: VS Code Live Server (Recommended)
# - Install extension "Live Server"
# - Klik kanan index.html
# - Pilih "Open with Live Server"

# Cara 2: Python
python -m http.server 8000

# Cara 3: Node.js
npx http-server -p 8000

# Cara 4: PHP
php -S localhost:8000
```

### 3️⃣ Buka Aplikasi
```
http://localhost:8000/index.html
```

## 📱 Testing Flow

### A. Di Halaman Index
1. ✅ Pilih ruang tujuan (contoh: Ruang 201)
2. ✅ Pilih lantai awal (contoh: Lantai 1)
3. ✅ Lihat preview: "NAIK 1 LANTAI"
4. ✅ Klik "Mulai AR"

### B. Di Halaman AR
1. ✅ Izinkan akses kamera
2. ✅ Arahkan kamera ke marker HIRO
3. ✅ Tunggu status: "Marker terdeteksi" (dot hijau)
4. ✅ Objek AR muncul di atas marker
5. ✅ Coba tombol "Naik 1 Lantai"
6. ✅ Lihat perubahan objek AR
7. ✅ Saat sampai lantai tujuan → notifikasi suara + getar

## 🎯 Checklist Testing

### ✅ Fitur Wajib
- [ ] Halaman index tampil dengan baik
- [ ] Dropdown ruangan terisi otomatis
- [ ] Preview update saat pilihan berubah
- [ ] Tombol "Mulai AR" berfungsi
- [ ] Redirect ke ar.html berhasil
- [ ] Kamera tampil di ar.html
- [ ] Marker HIRO terdeteksi
- [ ] Objek AR muncul di atas marker
- [ ] Teks lantai sesuai
- [ ] Instruksi NAIK/TURUN/SAMPAI benar
- [ ] Daftar ruangan tampil
- [ ] Panah 3D muncul
- [ ] Tombol "Naik 1 Lantai" berfungsi
- [ ] Tombol "Turun 1 Lantai" berfungsi
- [ ] Warna berubah saat sampai (hijau)
- [ ] Notifikasi suara saat sampai
- [ ] Tombol "Kembali" berfungsi

### ⚙️ Fitur Opsional
- [ ] Sensor gerak aktif (Android)
- [ ] Tombol "Aktifkan Sensor" muncul (iOS)
- [ ] Sensor permission granted (iOS)
- [ ] Getar saat sampai (Android/Chrome)
- [ ] Overlay UI responsive

## 🐛 Troubleshooting Cepat

### Kamera tidak muncul?
```
✅ Cek: Apakah menggunakan HTTPS atau localhost?
✅ Cek: Apakah browser meminta izin kamera?
✅ Cek: Apakah kamera tidak digunakan aplikasi lain?
✅ Solusi: Refresh halaman dan izinkan kamera
```

### Marker tidak terdeteksi?
```
✅ Cek: Apakah pencahayaan cukup?
✅ Cek: Apakah marker terlihat penuh?
✅ Cek: Apakah jarak 20-50 cm?
✅ Solusi: Perbaiki pencahayaan dan jarak
```

### Objek AR tidak muncul?
```
✅ Cek: Apakah status dot sudah hijau?
✅ Cek: Apakah console ada error?
✅ Solusi: Tunggu marker terdeteksi, refresh jika perlu
```

### Data hilang saat pindah halaman?
```
✅ Cek: Apakah localStorage diizinkan?
✅ Cek: Apakah mode incognito/private?
✅ Solusi: Gunakan mode normal browser
```

## 📸 Screenshot Testing

### Halaman Index
```
✅ Harus terlihat:
- Judul "AR Penunjuk Arah Ruangan"
- Dropdown ruang tujuan
- Dropdown lantai awal
- Preview box dengan info
- Tombol "Mulai AR" (biru)
- Info box dengan catatan
```

### Halaman AR
```
✅ Harus terlihat:
- Kamera real-time (background)
- Panel info atas (hitam transparan)
- Status marker dengan dot
- Info lantai, tujuan, instruksi
- Panduan marker HIRO dengan gambar
- Panel kontrol bawah
- Tombol Naik/Turun Lantai
- Tombol Kembali (merah)
```

### Objek AR (saat marker terdeteksi)
```
✅ Harus terlihat di atas marker:
- Panel biru transparan
- Teks "LANTAI X" (kuning)
- Teks instruksi (putih)
- Teks "Tujuan: Ruang XXX"
- Teks daftar ruangan
- Panah 3D (merah/hijau)
```

## 🎓 Demo untuk Presentasi

### Skenario 1: Naik Lantai
```
1. Pilih: Ruang 301 (Lantai 3)
2. Lantai awal: Lantai 1
3. Mulai AR
4. Tunjukkan marker → Objek muncul
5. Instruksi: "NAIK 2 LANTAI"
6. Klik "Naik 1 Lantai" → "NAIK 1 LANTAI"
7. Klik lagi → "SAMPAI" (hijau + suara)
```

### Skenario 2: Turun Lantai
```
1. Pilih: Ruang 101 (Lantai 1)
2. Lantai awal: Lantai 3
3. Mulai AR
4. Tunjukkan marker → Objek muncul
5. Instruksi: "TURUN 2 LANTAI"
6. Klik "Turun 1 Lantai" → "TURUN 1 LANTAI"
7. Klik lagi → "SAMPAI" (hijau + suara)
```

### Skenario 3: Sudah di Lantai yang Sama
```
1. Pilih: Ruang 201 (Lantai 2)
2. Lantai awal: Lantai 2
3. Mulai AR
4. Tunjukkan marker → Objek muncul
5. Instruksi: "SAMPAI" (langsung hijau + suara)
```

## 📋 Checklist Sebelum Demo

### Persiapan Hardware
- [ ] Smartphone/laptop dengan kamera
- [ ] Marker HIRO sudah dicetak/ditampilkan
- [ ] Pencahayaan ruangan cukup
- [ ] Volume perangkat tidak mute
- [ ] Koneksi internet (untuk load CDN)

### Persiapan Software
- [ ] Browser modern (Chrome/Firefox)
- [ ] Server lokal sudah running
- [ ] Aplikasi bisa diakses
- [ ] Kamera sudah diizinkan
- [ ] LocalStorage tidak diblokir

### Persiapan Presentasi
- [ ] Sudah test run minimal 1x
- [ ] Marker mudah dijangkau
- [ ] Backup marker (print 2-3 lembar)
- [ ] Screenshot/video backup jika gagal
- [ ] Penjelasan konsep AR siap

## 🎯 Poin Penting untuk Dijelaskan

### Konsep AR yang Diterapkan
```
1. Digital Object: Panel 3D, teks, panah (A-Frame)
2. AR Library: AR.js untuk marker tracking
3. Tracking: Marker HIRO sebagai anchor
4. Rendering: Real-time rendering di atas marker
```

### Teknologi yang Digunakan
```
- HTML5, CSS3, JavaScript (vanilla)
- A-Frame 1.4.0 (WebVR/AR framework)
- AR.js 3.4.5 (marker-based AR)
- Web APIs: Speech, Vibration, DeviceMotion
- LocalStorage untuk state management
```

### Fitur Unggulan
```
✅ Marker-based AR (stabil)
✅ Real-time tracking
✅ Navigasi multi-lantai
✅ Kontrol manual + sensor
✅ Notifikasi multimedia (suara + getar)
✅ Responsive design
✅ No backend required
```

## 📞 Support

Jika ada masalah:
1. Cek console browser (F12)
2. Baca TECHNICAL.md untuk detail
3. Cek README.md untuk troubleshooting
4. Test di browser berbeda

---

**Selamat mencoba dan sukses untuk presentasinya! 🎉**
