# 🎯 AR Simplification - Floor Number Only

## ✅ Perubahan yang Diterapkan

### 🎯 Konsep Utama
Objek AR sekarang **hanya menampilkan angka lantai** yang ditentukan oleh:
1. **Sensor gerak** dengan mapping koordinat
2. **Tombol manual** sebagai koreksi
3. **Marker HIRO** hanya sebagai tempat munculnya objek AR (tidak menentukan lantai)

---

## 📁 File yang Diubah

### 1. **ar.html** ✅

#### Objek AR Sebelum (Kompleks)
```html
<a-marker preset="hiro">
    <a-box id="panelBg">...</a-box>
    <a-text id="floorText">LANTAI 1</a-text>
    <a-text id="instructionText">NAIK</a-text>
    <a-text id="targetText">Tujuan: Ruang 201</a-text>
    <a-text id="roomListText">Ruangan: ...</a-text>
    <a-entity id="arrowEntity">
        <a-cylinder id="arrowShaft">...</a-cylinder>
        <a-cone id="arrowHead">...</a-cone>
    </a-entity>
</a-marker>
```

#### Objek AR Sesudah (Sederhana)
```html
<a-marker id="hiroMarker" preset="hiro">
    <a-entity id="floor-number-object">
        <!-- Background Circle -->
        <a-circle 
            id="floorBackground"
            position="0 0.05 0" 
            rotation="-90 0 0" 
            radius="0.7" 
            color="#0f766e" 
            opacity="0.9">
        </a-circle>
        
        <!-- Floor Number Text -->
        <a-text 
            id="ar-floor-number"
            value="1" 
            position="0 0.08 0" 
            rotation="-90 0 0" 
            align="center" 
            color="#ffffff" 
            width="5"
            font="roboto">
        </a-text>
    </a-entity>
</a-marker>
```

**Perubahan:**
- ✅ Hapus panel background (a-box)
- ✅ Hapus teks instruksi (NAIK/TURUN)
- ✅ Hapus teks tujuan ruangan
- ✅ Hapus daftar ruangan
- ✅ Hapus panah 3D (cylinder + cone)
- ✅ Tambah circle background untuk angka
- ✅ Sederhanakan menjadi hanya angka lantai

**Struktur Baru:**
- Circle background (teal, radius 0.7)
- Text angka lantai (putih, width 5)
- Rotasi -90 derajat (horizontal di atas marker)
- Position Y: 0.05 (circle), 0.08 (text)

---

### 2. **ar.js** ✅

#### A. Global Variables - Sensor Mapping
```javascript
// SEBELUM
let lastMotionTime = 0;
const motionCooldown = 3000;
const motionThreshold = 5;

// SESUDAH
let lastMotionTime = 0;
const motionCooldown = 3000;

// Sensor mapping untuk deteksi naik/turun lantai
const floorStepPattern = {
    up: { deltaY: -4.0, deltaZ: 2.6 },
    down: { deltaY: 4.0, deltaZ: -2.6 }
};
const sensorTolerance = 2.0;

// Baseline coordinates (titik awal)
let baselineCoords = { y: 0, z: 0 };
let coordsInitialized = false;
```

**Perubahan:**
- ✅ Hapus `motionThreshold` (tidak dipakai lagi)
- ✅ Tambah `floorStepPattern` untuk mapping naik/turun
- ✅ Tambah `sensorTolerance` untuk matching pattern
- ✅ Tambah `baselineCoords` untuk menyimpan titik awal
- ✅ Tambah `coordsInitialized` flag

---

#### B. Update AR Content - Simplified
```javascript
// SEBELUM (Kompleks - update banyak objek)
function updateARContent() {
    // Update 3D Objects
    floorText.setAttribute('value', `LANTAI ${currentFloor}`);
    instructionText.setAttribute('value', instruction);
    targetText.setAttribute('value', `Tujuan: ${targetRoomName}`);
    roomListTextEl.setAttribute('value', `Ruangan: ${roomListText}`);
    
    // Change arrow color
    arrowShaft.setAttribute('color', arrowColor);
    arrowHead.setAttribute('color', arrowColor);
    panelBg.setAttribute('color', panelColor);
    
    // Rotate arrow
    arrowEntity.setAttribute('rotation', ...);
    
    // Update Overlay UI
    // ...
}

// SESUDAH (Sederhana - hanya angka)
function updateARFloorNumber() {
    const floorNumberText = document.getElementById('ar-floor-number');
    if (floorNumberText) {
        floorNumberText.setAttribute('value', String(currentFloor));
        console.log('AR floor number updated to:', currentFloor);
    }
}

function updateARContent() {
    // Update AR Floor Number Object
    updateARFloorNumber();
    
    // Update Overlay UI
    document.getElementById('currentFloorDisplay').textContent = `Lantai ${currentFloor}`;
    document.getElementById('targetRoomDisplay').textContent = targetRoomName;
    document.getElementById('instructionDisplay').textContent = instruction;
    
    // Save & check arrival
    localStorage.setItem('currentFloor', currentFloor);
    checkArrival();
}
```

**Perubahan:**
- ✅ Buat fungsi khusus `updateARFloorNumber()`
- ✅ Hapus update untuk objek AR yang dihapus
- ✅ Fokus hanya update angka lantai
- ✅ Overlay UI tetap diupdate (untuk info user)

---

#### C. Sensor Motion - Coordinate Mapping
```javascript
// SEBELUM (Simple threshold)
function handleMotion(event) {
    const acc = event.accelerationIncludingGravity;
    const motionValue = Math.abs(acc.y);
    
    if (motionValue > motionThreshold) {
        if (currentFloor < targetFloor) {
            currentFloor++;
        } else if (currentFloor > targetFloor) {
            currentFloor--;
        }
    }
}

// SESUDAH (Coordinate mapping)
function matchesPattern(deltaY, deltaZ, pattern) {
    const yMatch = Math.abs(deltaY - pattern.deltaY) < sensorTolerance;
    const zMatch = Math.abs(deltaZ - pattern.deltaZ) < sensorTolerance;
    return yMatch && zMatch;
}

function handleMotion(event) {
    const acc = event.accelerationIncludingGravity;
    
    // Initialize baseline on first reading
    if (!coordsInitialized) {
        baselineCoords.y = acc.y;
        baselineCoords.z = acc.z;
        coordsInitialized = true;
        return;
    }
    
    // Calculate delta from baseline
    const deltaY = acc.y - baselineCoords.y;
    const deltaZ = acc.z - baselineCoords.z;
    
    // Check if delta matches "up" pattern
    if (matchesPattern(deltaY, deltaZ, floorStepPattern.up)) {
        if (currentFloor < 3) {
            currentFloor++;
            updateARContent();
            baselineCoords.y = acc.y;
            baselineCoords.z = acc.z;
        }
    }
    // Check if delta matches "down" pattern
    else if (matchesPattern(deltaY, deltaZ, floorStepPattern.down)) {
        if (currentFloor > 1) {
            currentFloor--;
            updateARContent();
            baselineCoords.y = acc.y;
            baselineCoords.z = acc.z;
        }
    }
}
```

**Perubahan:**
- ✅ Hapus logika threshold sederhana
- ✅ Tambah fungsi `matchesPattern()` untuk matching
- ✅ Inisialisasi baseline coordinates di awal
- ✅ Hitung delta dari baseline
- ✅ Match delta dengan pattern up/down
- ✅ Update baseline setelah deteksi berhasil
- ✅ Batasi lantai min 1, max 3
- ✅ Tidak bergantung pada targetFloor

---

#### D. Marker Events - No Floor Change
```javascript
// SEBELUM
marker.addEventListener('markerFound', function() {
    markerDetected = true;
    // Update status only
});

// SESUDAH
marker.addEventListener('markerFound', function() {
    markerDetected = true;
    document.getElementById('statusDot').classList.add('active');
    document.getElementById('markerStatusText').textContent = 'Marker terdeteksi';
    
    // Update AR floor number when marker is found
    updateARFloorNumber();
    
    console.log('Marker found - AR object visible');
});
```

**Perubahan:**
- ✅ Marker hanya mengubah status UI
- ✅ Marker TIDAK mengubah currentFloor
- ✅ Panggil `updateARFloorNumber()` saat marker ditemukan
- ✅ Console log lebih jelas

---

## 🎯 Alur Aplikasi Baru

### 1. User Memilih Ruang & Lantai Awal
```
index.html → pilih ruang tujuan & lantai awal
           → simpan ke localStorage
           → redirect ke ar.html
```

### 2. Inisialisasi AR
```
ar.html → load data dari localStorage
        → currentFloor = lantai awal
        → kamera aktif
        → tunggu marker HIRO
```

### 3. Marker Terdeteksi
```
Marker HIRO terdeteksi
→ markerFound event
→ updateARFloorNumber()
→ Angka currentFloor muncul di atas marker
```

### 4. Sensor Gerak Aktif
```
Sensor membaca koordinat
→ Inisialisasi baseline (titik awal)
→ Hitung delta dari baseline
→ Match dengan pattern up/down
→ Jika match: currentFloor berubah
→ updateARFloorNumber()
→ Angka AR berubah
```

### 5. Manual Correction
```
User tekan tombol Naik/Turun
→ currentFloor berubah
→ updateARContent()
→ updateARFloorNumber()
→ Angka AR berubah
```

---

## 📊 Sensor Mapping

### Pattern Definition
```javascript
const floorStepPattern = {
    up: { 
        deltaY: -4.0,  // Y menurun saat naik
        deltaZ: 2.6    // Z bertambah saat naik
    },
    down: { 
        deltaY: 4.0,   // Y bertambah saat turun
        deltaZ: -2.6   // Z berkurang saat turun
    }
};
```

### Tolerance
```javascript
const sensorTolerance = 2.0;
// Jika |deltaY - pattern.deltaY| < 2.0 DAN
//    |deltaZ - pattern.deltaZ| < 2.0
// Maka pattern match
```

### Baseline Coordinates
```javascript
// Titik awal (referensi)
let baselineCoords = { y: 0, z: 0 };

// Inisialisasi saat sensor pertama aktif
if (!coordsInitialized) {
    baselineCoords.y = acc.y;
    baselineCoords.z = acc.z;
    coordsInitialized = true;
}

// Update baseline setelah deteksi berhasil
if (matchesPattern(...)) {
    currentFloor++;
    baselineCoords.y = acc.y;  // Reset baseline
    baselineCoords.z = acc.z;
}
```

---

## 🎨 Visual Comparison

### Objek AR Sebelum
```
┌─────────────────────┐
│                     │
│   LANTAI 1          │ ← Teks lantai
│                     │
│   NAIK 1 LANTAI     │ ← Instruksi
│                     │
│   Tujuan: Ruang 201 │ ← Tujuan
│                     │
│   Ruangan: 101,102  │ ← Daftar
│                     │
│        ↑            │ ← Panah
│        │            │
│                     │
└─────────────────────┘
```

### Objek AR Sesudah
```
┌─────────────────────┐
│                     │
│                     │
│       ┌───┐         │
│       │ 1 │         │ ← Angka lantai saja
│       └───┘         │
│                     │
│                     │
│                     │
│                     │
└─────────────────────┘
```

---

## 🔧 Fungsi Utama

### updateARFloorNumber()
```javascript
// Fungsi khusus untuk update angka AR
function updateARFloorNumber() {
    const floorNumberText = document.getElementById('ar-floor-number');
    if (floorNumberText) {
        floorNumberText.setAttribute('value', String(currentFloor));
    }
}
```

**Dipanggil saat:**
- ✅ Marker ditemukan (markerFound)
- ✅ Sensor mengubah lantai (handleMotion)
- ✅ Tombol manual ditekan (floorUp/floorDown)
- ✅ AR pertama dimulai (init)

### matchesPattern()
```javascript
// Fungsi untuk matching coordinate delta dengan pattern
function matchesPattern(deltaY, deltaZ, pattern) {
    const yMatch = Math.abs(deltaY - pattern.deltaY) < sensorTolerance;
    const zMatch = Math.abs(deltaZ - pattern.deltaZ) < sensorTolerance;
    return yMatch && zMatch;
}
```

**Digunakan untuk:**
- ✅ Cek apakah delta cocok dengan pattern up
- ✅ Cek apakah delta cocok dengan pattern down
- ✅ Toleransi 2.0 untuk fleksibilitas

---

## ✅ Yang Tidak Berubah

### Halaman Index
- ✅ Form pilih ruang tujuan
- ✅ Form pilih lantai awal
- ✅ Preview navigasi
- ✅ Tombol "Mulai AR"
- ✅ LocalStorage save

### AR Page - Overlay UI
- ✅ Panel info atas (status, lantai, tujuan, instruksi, sensor)
- ✅ Marker guide dengan gambar HIRO
- ✅ Tombol Naik/Turun (manual correction)
- ✅ Tombol Kembali
- ✅ Tombol Aktifkan Sensor (iOS)

### Fungsi Lain
- ✅ checkData() - validasi localStorage
- ✅ checkArrival() - notifikasi sampai
- ✅ speakNotification() - suara
- ✅ setupMarkerEvents() - marker events
- ✅ setupMotionSensor() - sensor setup
- ✅ floorUp() / floorDown() - manual control
- ✅ goBack() - kembali ke index

---

## 🎯 Target Hasil

### Skenario 1: Mulai dari Lantai 1
```
1. User pilih Ruang 301 (Lantai 3), lantai awal 1
2. Masuk AR mode
3. Arahkan ke marker HIRO
4. Angka "1" muncul di atas marker
5. Sensor deteksi naik → angka berubah "2"
6. Sensor deteksi naik → angka berubah "3"
7. Notifikasi: "Anda sudah sampai di lantai tujuan"
```

### Skenario 2: Manual Correction
```
1. User di lantai 2, angka AR menampilkan "2"
2. User tekan tombol "Naik"
3. Angka AR berubah menjadi "3"
4. User tekan tombol "Turun"
5. Angka AR berubah menjadi "2"
```

### Skenario 3: Sensor Mapping
```
1. Baseline: y=0, z=0
2. User naik tangga
3. Sensor baca: y=-4.2, z=2.8
4. Delta: deltaY=-4.2, deltaZ=2.8
5. Match pattern up (toleransi 2.0)
6. currentFloor++
7. Angka AR update
8. Baseline reset ke y=-4.2, z=2.8
```

---

## 📊 Perbandingan

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| Objek AR | 7 elemen | **2 elemen** ✅ |
| Kompleksitas | Tinggi | **Rendah** ✅ |
| Fokus | Multi-info | **Angka lantai** ✅ |
| Sensor | Threshold | **Mapping** ✅ |
| Marker | Tempat objek | **Tempat objek** ✅ |
| Lantai | Sensor/Manual | **Sensor/Manual** ✅ |
| Update | 10+ setAttribute | **1 setAttribute** ✅ |

---

## 🚀 Keuntungan

### Performance
- ✅ Lebih ringan (2 objek vs 7 objek)
- ✅ Update lebih cepat (1 setAttribute)
- ✅ Rendering lebih smooth

### UX
- ✅ Fokus jelas (angka lantai)
- ✅ Tidak overwhelming
- ✅ Mudah dibaca
- ✅ Angka besar dan jelas

### Sensor
- ✅ Mapping lebih akurat
- ✅ Pattern-based detection
- ✅ Baseline tracking
- ✅ Toleransi fleksibel

### Maintenance
- ✅ Kode lebih sederhana
- ✅ Fungsi lebih modular
- ✅ Debugging lebih mudah
- ✅ Extensible untuk pattern baru

---

## 🔧 Customization

### Mengubah Pattern
```javascript
const floorStepPattern = {
    up: { deltaY: -5.0, deltaZ: 3.0 },    // Sesuaikan
    down: { deltaY: 5.0, deltaZ: -3.0 }   // Sesuaikan
};
```

### Mengubah Toleransi
```javascript
const sensorTolerance = 3.0;  // Lebih toleran
// atau
const sensorTolerance = 1.0;  // Lebih ketat
```

### Mengubah Warna Background
```javascript
// Di ar.html
<a-circle 
    color="#1e40af"  // Biru
    // atau
    color="#dc2626"  // Merah
    // atau
    color="#7c3aed"  // Ungu
>
```

### Mengubah Ukuran Angka
```javascript
// Di ar.html
<a-text 
    width="7"  // Lebih besar
    // atau
    width="3"  // Lebih kecil
>
```

---

## 📝 Console Logs

### Sensor Logs
```
Baseline coordinates initialized: {y: 0, z: 0}
Sensor delta: {deltaY: -4.20, deltaZ: 2.80}
Pattern matched: UP - Floor changed to 2
AR floor number updated to: 2
```

### Marker Logs
```
Marker found - AR object visible
AR floor number updated to: 2
Marker lost - AR object hidden
```

### Manual Logs
```
Floor up: 3
AR floor number updated to: 3
AR Content updated: {currentFloor: 3, targetFloor: 3, ...}
```

---

## ✅ Status

```
✅ Objek AR disederhanakan (angka saja)
✅ Sensor mapping implemented
✅ Baseline tracking implemented
✅ Pattern matching implemented
✅ updateARFloorNumber() created
✅ Marker tidak mengubah lantai
✅ Manual correction tetap berfungsi
✅ Overlay UI tetap informatif
✅ No breaking changes
✅ Ready to use
```

---

**Aplikasi sekarang fokus pada angka lantai dengan sensor mapping yang lebih akurat! 🎯**
