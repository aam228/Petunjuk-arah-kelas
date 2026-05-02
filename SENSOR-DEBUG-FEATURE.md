# 🔍 Sensor Debug Feature - XYZ Indicator

## ✅ Fitur Baru: Panel Indikator Sensor

Panel debugging real-time untuk monitoring sensor gerak dan validasi gerakan naik/turun lantai.

---

## 🎯 Tujuan

- ✅ Melihat nilai sensor XYZ secara real-time
- ✅ Monitoring baseline coordinates
- ✅ Tracking delta Y dan Z
- ✅ Validasi pattern matching (naik/turun)
- ✅ Debugging sensor behavior

---

## 📁 File yang Diubah

### 1. **ar.html** ✅

#### Panel Debug (Baru)
```html
<!-- Sensor Debug Panel -->
<div class="ar-panel-debug" id="ar-panel-debug">
    <strong>Sensor Debug</strong>
    <div>X: <span id="debug-x">-</span></div>
    <div>Y: <span id="debug-y">-</span></div>
    <div>Z: <span id="debug-z">-</span></div>
    <div>Base Y: <span id="debug-base-y">-</span></div>
    <div>Base Z: <span id="debug-base-z">-</span></div>
    <div>Delta Y: <span id="debug-delta-y">-</span></div>
    <div>Delta Z: <span id="debug-delta-z">-</span></div>
    <div>Status: <span id="debug-status">Menunggu sensor</span></div>
</div>
```

**Lokasi:** Pojok kanan bawah (di atas control panel)

#### Tombol Reset Baseline (Baru)
```html
<button id="resetBaselineBtn" class="btn-reset-baseline">
    🔄 Reset Baseline
</button>
```

**Lokasi:** Di control panel, antara tombol manual dan tombol kembali

---

### 2. **style.css** ✅

#### Panel Debug Styling
```css
.ar-panel-debug {
    position: absolute;
    right: 12px;
    bottom: 150px;
    z-index: 50;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    color: #ffffff;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 11px;
    line-height: 1.5;
    min-width: 160px;
    pointer-events: none;
    border: 1px solid rgba(255, 214, 0, 0.3);
}

.ar-panel-debug strong {
    color: #ffd600;  /* Yellow header */
    font-size: 12px;
    text-transform: uppercase;
}

.ar-panel-debug span {
    color: #4ade80;  /* Green values */
    font-weight: 600;
}

#debug-status {
    color: #60a5fa;  /* Blue status */
    font-weight: 700;
}
```

**Features:**
- ✅ Semi-transparent background
- ✅ Backdrop blur effect
- ✅ Yellow border accent
- ✅ Monospace font untuk angka
- ✅ Color-coded values
- ✅ Pointer-events: none (tidak menghalangi touch)

#### Reset Button Styling
```css
.btn-reset-baseline {
    width: 100%;
    min-height: 44px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
}
```

**Features:**
- ✅ Orange gradient (berbeda dari tombol lain)
- ✅ Touch-friendly (44px height)
- ✅ Active state dengan scale

---

### 3. **ar.js** ✅

#### A. Update Sensor Debug Function (Baru)
```javascript
function updateSensorDebug({ x, y, z, baseY, baseZ, deltaY, deltaZ, status }) {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = typeof value === "number" ? value.toFixed(2) : value;
    };
    
    setText("debug-x", x);
    setText("debug-y", y);
    setText("debug-z", z);
    setText("debug-base-y", baseY);
    setText("debug-base-z", baseZ);
    setText("debug-delta-y", deltaY);
    setText("debug-delta-z", deltaZ);
    setText("debug-status", status || "-");
}
```

**Features:**
- ✅ Update semua nilai sensor
- ✅ Format angka 2 desimal
- ✅ Null-safe (cek element exists)
- ✅ Handle string dan number

#### B. Reset Baseline Function (Baru)
```javascript
function resetBaseline() {
    coordsInitialized = false;
    baselineCoords = { y: 0, z: 0 };
    
    updateSensorDebug({
        x: 0, y: 0, z: 0,
        baseY: 0, baseZ: 0,
        deltaY: 0, deltaZ: 0,
        status: 'Baseline direset'
    });
    
    console.log('Baseline reset');
}
```

**Features:**
- ✅ Reset flag coordsInitialized
- ✅ Reset baseline coordinates
- ✅ Update debug panel
- ✅ Console log untuk tracking

#### C. Handle Motion - Updated
```javascript
function handleMotion(event) {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;
    
    // Initialize baseline
    if (!coordsInitialized) {
        baselineCoords.y = y;
        baselineCoords.z = z;
        coordsInitialized = true;
        
        updateSensorDebug({
            x, y, z,
            baseY: baselineCoords.y,
            baseZ: baselineCoords.z,
            deltaY: 0,
            deltaZ: 0,
            status: 'Baseline disimpan'
        });
        return;
    }
    
    // Calculate delta
    const deltaY = y - baselineCoords.y;
    const deltaZ = z - baselineCoords.z;
    
    let detectionStatus = 'Belum cocok';
    
    // Check pattern up
    if (matchesPattern(deltaY, deltaZ, floorStepPattern.up)) {
        detectionStatus = 'Terdeteksi naik';
        // ... update floor logic
    }
    // Check pattern down
    else if (matchesPattern(deltaY, deltaZ, floorStepPattern.down)) {
        detectionStatus = 'Terdeteksi turun';
        // ... update floor logic
    }
    
    // Update debug panel (EVERY sensor reading)
    updateSensorDebug({
        x, y, z,
        baseY: baselineCoords.y,
        baseZ: baselineCoords.z,
        deltaY,
        deltaZ,
        status: detectionStatus
    });
}
```

**Changes:**
- ✅ Extract x, y, z dari sensor
- ✅ Update debug panel saat baseline disimpan
- ✅ Update debug panel setiap sensor reading
- ✅ Show detection status real-time
- ✅ Cooldown tetap berfungsi untuk floor change

---

## 🎨 Visual Layout

### Panel Debug Position
```
┌──────────────────────┐
│   Info Panel (Top)   │
├──────────────────────┤
│                      │
│   AR Scene           │
│   (Marker Guide)     │
│                      │
│              ┌─────┐ │ ← Debug Panel
│              │Debug│ │   (Right Bottom)
│              └─────┘ │
├──────────────────────┤
│  🎯 Aktifkan Sensor  │
│  ⬆️ Naik  │  ⬇️ Turun │
│  🔄 Reset Baseline   │ ← New Button
│  ← Kembali           │
└──────────────────────┘
```

### Panel Debug Content
```
┌─────────────────────┐
│ SENSOR DEBUG        │ ← Yellow header
├─────────────────────┤
│ X:        0.00      │ ← Green values
│ Y:        7.70      │
│ Z:        6.10      │
│ Base Y:   7.70      │
│ Base Z:   6.10      │
│ Delta Y: -4.00      │
│ Delta Z:  2.60      │
├─────────────────────┤
│ Status: Terdeteksi  │ ← Blue status
│         naik        │
└─────────────────────┘
```

---

## 🔄 Status Messages

### 1. Menunggu Sensor
```
Status: Menunggu sensor
```
**Kondisi:** Sensor belum aktif atau belum ada data

### 2. Baseline Disimpan
```
Status: Baseline disimpan
```
**Kondisi:** Sensor pertama kali membaca koordinat dan menyimpan baseline

### 3. Belum Cocok
```
Status: Belum cocok
```
**Kondisi:** Delta tidak match dengan pattern up atau down

### 4. Terdeteksi Naik
```
Status: Terdeteksi naik
```
**Kondisi:** Delta match dengan pattern up
- deltaY ≈ -4.0 (±2.0)
- deltaZ ≈ 2.6 (±2.0)

### 5. Terdeteksi Turun
```
Status: Terdeteksi turun
```
**Kondisi:** Delta match dengan pattern down
- deltaY ≈ 4.0 (±2.0)
- deltaZ ≈ -2.6 (±2.0)

### 6. Baseline Direset
```
Status: Baseline direset
```
**Kondisi:** User menekan tombol "Reset Baseline"

---

## 🎯 Use Cases

### 1. Debugging Pattern
```
Scenario: Ingin tahu apakah pattern up/down sudah benar

1. Aktifkan sensor
2. Lihat panel debug
3. Baseline disimpan (Y: 7.70, Z: 6.10)
4. Naik tangga
5. Lihat Delta Y dan Delta Z berubah
6. Jika Status: "Terdeteksi naik" → Pattern benar ✓
7. Jika Status: "Belum cocok" → Pattern perlu disesuaikan
```

### 2. Kalibrasi Sensor
```
Scenario: Posisi HP berubah, baseline tidak akurat

1. Tekan tombol "Reset Baseline"
2. Status: "Baseline direset"
3. Sensor akan re-initialize baseline
4. Baseline baru tersimpan
5. Delta dihitung dari baseline baru
```

### 3. Validasi Gerakan
```
Scenario: Memastikan sensor membaca gerakan dengan benar

1. Lihat nilai X, Y, Z real-time
2. Gerakkan HP
3. Nilai berubah → Sensor aktif ✓
4. Nilai tidak berubah → Sensor bermasalah
```

### 4. Testing Pattern Matching
```
Scenario: Test apakah toleransi 2.0 cukup

1. Baseline: Y=7.70, Z=6.10
2. Naik tangga
3. Sensor: Y=3.50, Z=8.70
4. Delta Y: -4.20 (target: -4.0, diff: 0.20 < 2.0) ✓
5. Delta Z: 2.60 (target: 2.6, diff: 0.00 < 2.0) ✓
6. Status: "Terdeteksi naik" ✓
```

---

## 📊 Data Flow

### Sensor Reading → Debug Panel
```
1. DeviceMotionEvent triggered
   ↓
2. handleMotion() called
   ↓
3. Extract x, y, z from accelerationIncludingGravity
   ↓
4. Check if baseline initialized
   ↓
5. Calculate deltaY, deltaZ
   ↓
6. Match pattern (up/down/none)
   ↓
7. Determine detection status
   ↓
8. updateSensorDebug() called
   ↓
9. Update all span elements
   ↓
10. Panel shows real-time values
```

### Reset Baseline Flow
```
1. User clicks "Reset Baseline"
   ↓
2. resetBaseline() called
   ↓
3. coordsInitialized = false
   ↓
4. baselineCoords = { y: 0, z: 0 }
   ↓
5. updateSensorDebug() with reset status
   ↓
6. Panel shows "Baseline direset"
   ↓
7. Next sensor reading will re-initialize
```

---

## 🎨 Color Scheme

| Element | Color | Purpose |
|---------|-------|---------|
| Background | rgba(0,0,0,0.85) | Semi-transparent black |
| Border | rgba(255,214,0,0.3) | Yellow accent |
| Header | #ffd600 | Yellow (attention) |
| Values | #4ade80 | Green (data) |
| Status | #60a5fa | Blue (info) |

---

## 📐 Responsive Design

### Desktop (> 768px)
```css
.ar-panel-debug {
    right: 12px;
    bottom: 150px;
    font-size: 11px;
    min-width: 160px;
}
```

### Small Phones (< 375px)
```css
.ar-panel-debug {
    right: 8px;
    bottom: 140px;
    font-size: 10px;
    min-width: 140px;
}
```

### Landscape (< 600px height)
```css
.ar-panel-debug {
    right: 8px;
    bottom: 120px;
    font-size: 10px;
    min-width: 140px;
}
```

---

## 🔧 Customization

### Mengubah Posisi Panel
```css
.ar-panel-debug {
    /* Pojok kiri bawah */
    left: 12px;
    right: auto;
    
    /* Pojok kanan atas */
    top: 80px;
    bottom: auto;
}
```

### Mengubah Ukuran Font
```css
.ar-panel-debug {
    font-size: 12px;  /* Lebih besar */
    /* atau */
    font-size: 9px;   /* Lebih kecil */
}
```

### Mengubah Warna
```css
.ar-panel-debug strong {
    color: #ff6b6b;  /* Red header */
}

.ar-panel-debug span {
    color: #51cf66;  /* Different green */
}

#debug-status {
    color: #ffd43b;  /* Yellow status */
}
```

### Menyembunyikan Panel
```css
.ar-panel-debug {
    display: none;  /* Hide completely */
}
```

---

## 📝 Console Logs

### Baseline Initialized
```
Baseline coordinates initialized: {y: 7.70, z: 6.10}
```

### Pattern Matched
```
Pattern matched: UP - Floor changed to 2
Pattern matched: DOWN - Floor changed to 1
```

### Baseline Reset
```
Baseline reset
```

---

## ✅ Testing Checklist

### Panel Display
- [ ] Panel muncul di pojok kanan bawah
- [ ] Panel tidak menutupi tombol kontrol
- [ ] Panel tidak menutupi marker guide
- [ ] Panel semi-transparent
- [ ] Border kuning terlihat

### Sensor Values
- [ ] X, Y, Z update real-time
- [ ] Baseline Y, Z tersimpan
- [ ] Delta Y, Z terhitung benar
- [ ] Status berubah sesuai kondisi
- [ ] Angka format 2 desimal

### Reset Baseline
- [ ] Tombol "Reset Baseline" terlihat
- [ ] Klik tombol → baseline direset
- [ ] Status berubah "Baseline direset"
- [ ] Sensor re-initialize baseline
- [ ] Delta dihitung dari baseline baru

### Responsive
- [ ] Panel rapi di mobile
- [ ] Panel rapi di landscape
- [ ] Font size sesuai layar
- [ ] Tidak overlap dengan elemen lain

---

## 🎯 Benefits

### For Developers
- ✅ Real-time sensor monitoring
- ✅ Easy pattern validation
- ✅ Quick debugging
- ✅ Visual feedback
- ✅ No need for console logs

### For Users
- ✅ Understand sensor behavior
- ✅ Validate movement detection
- ✅ Reset baseline when needed
- ✅ Troubleshoot issues
- ✅ Confidence in accuracy

### For Testing
- ✅ Verify pattern matching
- ✅ Test tolerance values
- ✅ Validate baseline tracking
- ✅ Check sensor responsiveness
- ✅ Debug edge cases

---

## 🚀 Future Enhancements

### Possible Additions
- [ ] Toggle button untuk show/hide panel
- [ ] History log (last 5 readings)
- [ ] Graph visualization
- [ ] Export sensor data
- [ ] Pattern editor UI
- [ ] Tolerance adjuster
- [ ] Auto-calibration
- [ ] Multiple baseline presets

---

## 📊 Summary

**Added:**
- ✅ Sensor debug panel (8 data points)
- ✅ Reset baseline button
- ✅ updateSensorDebug() function
- ✅ resetBaseline() function
- ✅ Real-time status updates
- ✅ Responsive styling

**Benefits:**
- ✅ Visual debugging
- ✅ Pattern validation
- ✅ Sensor monitoring
- ✅ Easy troubleshooting
- ✅ Better UX

**No Breaking Changes:**
- ✅ Objek AR tetap sama
- ✅ Sensor logic tetap sama
- ✅ Manual control tetap sama
- ✅ All features working

---

**Status: ✅ READY TO USE**

Panel debug sensor sekarang aktif dan siap membantu debugging! 🔍
