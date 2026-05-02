# Dokumentasi Teknis - AR Penunjuk Arah Ruangan

## 📐 Arsitektur Aplikasi

### Alur Data
```
index.html (Setting)
    ↓
  app.js (Logic)
    ↓
localStorage (Data Storage)
    ↓
  ar.html (AR View)
    ↓
  ar.js (AR Logic)
    ↓
A-Frame + AR.js (Rendering)
```

### Komponen Utama

#### 1. **index.html** - Halaman Konfigurasi
- Form input untuk memilih ruang tujuan
- Dropdown lantai awal
- Preview informasi navigasi
- Validasi sebelum memulai AR

#### 2. **ar.html** - Halaman AR
- A-Frame scene dengan AR.js
- Marker HIRO tracking
- Objek 3D AR
- Overlay UI untuk kontrol

#### 3. **app.js** - Logic Halaman Index
```javascript
// Fungsi utama:
- populateRoomDropdown()  // Isi dropdown ruangan
- updatePreview()         // Update preview real-time
- startAR()              // Simpan data & redirect
```

#### 4. **ar.js** - Logic Halaman AR
```javascript
// Fungsi utama:
- checkData()            // Validasi localStorage
- updateARContent()      // Update objek 3D
- setupMarkerEvents()    // Event marker found/lost
- setupMotionSensor()    // Aktivasi sensor gerak
- checkArrival()         // Cek sampai tujuan
- speakNotification()    // Notifikasi suara
```

#### 5. **style.css** - Styling
- Mobile-first design
- Responsive layout
- AR overlay positioning
- Glassmorphism effects

## 🎨 Struktur Objek AR

### Hierarki A-Frame
```
<a-scene>
  └── <a-marker preset="hiro">
      ├── <a-box>           (Panel background)
      ├── <a-text>          (Lantai)
      ├── <a-text>          (Instruksi)
      ├── <a-text>          (Tujuan)
      ├── <a-text>          (Daftar ruangan)
      └── <a-entity>        (Panah)
          ├── <a-cylinder>  (Batang panah)
          └── <a-cone>      (Kepala panah)
  └── <a-entity camera>
```

### Posisi Objek 3D
```
Y-axis (tinggi):
  1.0  → Teks Lantai
  0.7  → Teks Instruksi
  0.5  → Panel Background (center)
  0.4  → Teks Tujuan
  0.1  → Teks Daftar Ruangan
 -0.3  → Panah

Z-axis (kedalaman):
  0.03 → Teks (di depan panel)
  0.0  → Panel
  0.1  → Panah (lebih ke depan)
```

## 🔄 State Management

### LocalStorage Keys
```javascript
{
  selectedRoomId: "201",           // ID ruangan tujuan
  targetRoomName: "Ruang 201",     // Nama ruangan
  targetFloor: "2",                // Lantai tujuan
  startFloor: "1",                 // Lantai awal
  currentFloor: "1"                // Lantai saat ini (dinamis)
}
```

### Global Variables (ar.js)
```javascript
let currentFloor = 1;              // Lantai sekarang
let targetFloor = 1;               // Lantai tujuan
let targetRoomName = '';           // Nama ruangan tujuan
let markerDetected = false;        // Status marker
let hasArrivedNotified = false;    // Flag notifikasi
let sensorActive = false;          // Status sensor
let lastMotionTime = 0;            // Timestamp terakhir
```

## 🎯 Algoritma Navigasi

### 1. Perhitungan Instruksi
```javascript
function getInstruction(current, target) {
    const diff = target - current;
    if (diff > 0) return `NAIK ${diff} LANTAI`;
    if (diff < 0) return `TURUN ${Math.abs(diff)} LANTAI`;
    return `SAMPAI`;
}
```

### 2. Update Konten AR
```javascript
updateARContent() {
    1. Hitung instruksi
    2. Ambil daftar ruangan di lantai saat ini
    3. Update teks 3D di marker
    4. Ubah warna panah (merah/hijau)
    5. Rotasi panah (atas/bawah)
    6. Update overlay UI
    7. Simpan ke localStorage
    8. Cek arrival
}
```

### 3. Deteksi Arrival
```javascript
checkArrival() {
    if (currentFloor === targetFloor && !hasArrivedNotified) {
        - Jalankan speech synthesis
        - Trigger vibration
        - Set flag hasArrivedNotified = true
    }
    if (currentFloor !== targetFloor) {
        - Reset flag hasArrivedNotified = false
    }
}
```

## 📱 Sensor Gerak

### Flow Sensor
```
1. Check DeviceMotionEvent support
2. Check if permission needed (iOS)
   ├─ Yes → Show "Aktifkan Sensor" button
   └─ No  → Activate directly
3. Listen to devicemotion event
4. Read accelerationIncludingGravity.y
5. Check threshold (> 5)
6. Check cooldown (3000ms)
7. Update floor towards target
```

### Implementasi
```javascript
handleMotion(event) {
    // Ambil nilai akselerasi
    const acc = event.accelerationIncludingGravity;
    const motionValue = Math.abs(acc.y);
    
    // Cek threshold
    if (motionValue > motionThreshold) {
        // Gerak menuju target
        if (currentFloor < targetFloor) {
            currentFloor++;
        } else if (currentFloor > targetFloor) {
            currentFloor--;
        }
        updateARContent();
    }
}
```

## 🎤 Speech Synthesis

### Konfigurasi
```javascript
const utterance = new SpeechSynthesisUtterance(
    'Anda diperkirakan sudah sampai di lantai tujuan'
);
utterance.lang = 'id-ID';  // Bahasa Indonesia
utterance.rate = 1.0;      // Kecepatan normal
utterance.pitch = 1.0;     // Pitch normal
```

### Browser Support
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ⚠️ Beberapa browser memerlukan user interaction

## 📳 Vibration API

### Pattern
```javascript
navigator.vibrate([300, 150, 300]);
// Getar 300ms → Pause 150ms → Getar 300ms
```

### Browser Support
- ✅ Chrome/Edge (Mobile)
- ✅ Firefox (Mobile)
- ❌ Safari (tidak support)
- ❌ Desktop browsers (tidak support)

## 🎯 Marker Tracking

### AR.js Configuration
```html
<a-scene
    embedded
    arjs="sourceType: webcam; debugUIEnabled: false;"
    vr-mode-ui="enabled: false"
    renderer="logarithmicDepthBuffer: true; alpha: true; antialias: true;">
```

### Parameter Penting
- `sourceType: webcam` - Gunakan webcam sebagai sumber
- `debugUIEnabled: false` - Nonaktifkan debug UI
- `embedded` - Mode embedded (bukan fullscreen)
- `alpha: true` - Transparent background
- `antialias: true` - Smooth rendering

### Marker Events
```javascript
marker.addEventListener('markerFound', () => {
    // Marker terdeteksi
    markerDetected = true;
    // Update UI
});

marker.addEventListener('markerLost', () => {
    // Marker hilang
    markerDetected = false;
    // Update UI
});
```

## 🎨 Styling Dinamis

### Warna Berdasarkan Status
```javascript
// Belum sampai
panelColor = '#1a237e'  // Biru gelap
arrowColor = '#FF5252'  // Merah

// Sudah sampai
panelColor = '#1B5E20'  // Hijau gelap
arrowColor = '#4CAF50'  // Hijau
```

### Rotasi Panah
```javascript
if (currentFloor < targetFloor) {
    rotation = '0 0 0'      // Atas
} else if (currentFloor > targetFloor) {
    rotation = '0 0 180'    // Bawah
} else {
    rotation = '0 0 0'      // Netral
}
```

## 🔒 Validasi & Error Handling

### 1. Validasi Data (ar.js)
```javascript
function checkData() {
    // Cek semua key localStorage
    if (!selectedRoomId || !targetRoomName || 
        !targetFloor || !startFloor) {
        // Redirect ke index.html
        window.location.href = 'index.html';
        return false;
    }
    return true;
}
```

### 2. Validasi Input (app.js)
```javascript
// Disable tombol jika belum pilih ruangan
if (!selectedRoomId) {
    startARBtn.disabled = true;
    return;
}
```

### 3. Boundary Check
```javascript
// Lantai tidak boleh < 1 atau > 3
currentFloor = Math.max(1, Math.min(3, currentFloor));
```

## 🚀 Performance Optimization

### 1. Event Throttling
```javascript
// Cooldown untuk sensor gerak
const motionCooldown = 3000; // 3 detik
if (now - lastMotionTime < motionCooldown) return;
```

### 2. Conditional Rendering
```javascript
// Hanya update jika marker terdeteksi
if (markerDetected) {
    updateARContent();
}
```

### 3. Lazy Loading
```javascript
// A-Frame & AR.js hanya di ar.html
// Tidak di-load di index.html
```

## 🐛 Common Issues & Solutions

### Issue 1: Kamera Hitam
**Penyebab:** Scene tidak transparent
**Solusi:**
```javascript
renderer="alpha: true"
background="transparent"
```

### Issue 2: Marker Tidak Terdeteksi
**Penyebab:** Pencahayaan buruk, marker rusak
**Solusi:**
- Gunakan pencahayaan yang cukup
- Print marker dengan kualitas tinggi
- Jaga jarak 20-50 cm

### Issue 3: Sensor Tidak Aktif (iOS)
**Penyebab:** Permission tidak diminta
**Solusi:**
```javascript
if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
        .then(permissionState => {
            if (permissionState === 'granted') {
                activateMotionSensor();
            }
        });
}
```

### Issue 4: Speech Tidak Keluar
**Penyebab:** Browser block autoplay
**Solusi:**
- Pastikan ada user interaction
- Cek volume perangkat
- Gunakan fallback text notification

## 📊 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebRTC | ✅ | ✅ | ✅ | ✅ |
| A-Frame | ✅ | ✅ | ✅ | ✅ |
| AR.js | ✅ | ✅ | ⚠️ | ✅ |
| DeviceMotion | ✅ | ✅ | ⚠️* | ✅ |
| Speech Synthesis | ✅ | ✅ | ✅ | ✅ |
| Vibration | ✅📱 | ✅📱 | ❌ | ✅📱 |

*⚠️ Memerlukan permission request

## 🔧 Customization Guide

### Menambah Ruangan
```javascript
// Di app.js dan ar.js
const rooms = [
    { id: "401", name: "Ruang 401", floor: 4 },
    // ...
];
```

### Mengubah Warna
```javascript
// Di ar.js - updateARContent()
const panelColor = '#YOUR_COLOR';
const arrowColor = '#YOUR_COLOR';
```

### Mengubah Threshold Sensor
```javascript
// Di ar.js
const motionThreshold = 10;  // Lebih tinggi = kurang sensitif
const motionCooldown = 5000; // 5 detik
```

### Menambah Objek 3D
```html
<!-- Di ar.html dalam <a-marker> -->
<a-sphere 
    position="0 0 0" 
    radius="0.1" 
    color="#FF0000">
</a-sphere>
```

## 📈 Future Improvements

1. **Database Integration**
   - Simpan data ruangan di backend
   - Real-time updates

2. **Multi-Marker**
   - Gunakan marker berbeda per lantai
   - Lebih akurat

3. **Indoor Positioning**
   - Kombinasi dengan WiFi/Bluetooth
   - Location-based AR

4. **3D Models**
   - Import model GLTF
   - Animasi lebih kompleks

5. **Analytics**
   - Track user navigation
   - Heatmap penggunaan

## 📚 Resources

- [A-Frame Documentation](https://aframe.io/docs/)
- [AR.js Documentation](https://ar-js-org.github.io/AR.js-Docs/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [DeviceMotion API](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent)
- [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)

---

**Dokumentasi ini dibuat untuk membantu pengembangan dan maintenance aplikasi.**
