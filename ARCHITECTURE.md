# 🏗️ Arsitektur Aplikasi AR Penunjuk Arah Ruangan

## 📊 Diagram Alur Aplikasi

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      INDEX.HTML                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • Dropdown Ruang Tujuan                           │    │
│  │  • Dropdown Lantai Awal                            │    │
│  │  • Preview Informasi                               │    │
│  │  • Tombol "Mulai AR"                               │    │
│  └────────────────────────────────────────────────────┘    │
│                         ▲                                    │
│                         │                                    │
│                    ┌────┴────┐                              │
│                    │ app.js  │                              │
│                    └─────────┘                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LOCALSTORAGE                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • selectedRoomId: "201"                           │    │
│  │  • targetRoomName: "Ruang 201"                     │    │
│  │  • targetFloor: 2                                  │    │
│  │  • startFloor: 1                                   │    │
│  │  • currentFloor: 1                                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       AR.HTML                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │  A-FRAME SCENE                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  MARKER HIRO                             │     │    │
│  │  │  ┌────────────────────────────────┐     │     │    │
│  │  │  │  OBJEK AR 3D                   │     │     │    │
│  │  │  │  • Panel Background            │     │     │    │
│  │  │  │  • Teks Lantai                 │     │     │    │
│  │  │  │  • Teks Instruksi              │     │     │    │
│  │  │  │  • Teks Tujuan                 │     │     │    │
│  │  │  │  • Teks Daftar Ruangan         │     │     │    │
│  │  │  │  • Panah 3D                    │     │     │    │
│  │  │  └────────────────────────────────┘     │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                    │    │
│  │  OVERLAY UI                                       │    │
│  │  • Panel Info Atas                                │    │
│  │  • Panduan Marker                                 │    │
│  │  • Panel Kontrol Bawah                            │    │
│  └────────────────────────────────────────────────────┘    │
│                         ▲                                    │
│                         │                                    │
│                    ┌────┴────┐                              │
│                    │  ar.js  │                              │
│                    └─────────┘                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    WEB APIs                                  │
│  • DeviceMotionEvent (Sensor Gerak)                         │
│  • SpeechSynthesis (Notifikasi Suara)                       │
│  • Vibration API (Notifikasi Getar)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flow Data

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  Index   │────▶│ Storage  │────▶│    AR    │
│  Input   │     │   Page   │     │  (Local) │     │   Page   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                                   │
                      │                                   │
                      ▼                                   ▼
                 ┌─────────┐                        ┌─────────┐
                 │ app.js  │                        │  ar.js  │
                 └─────────┘                        └─────────┘
                      │                                   │
                      │                                   │
                      ▼                                   ▼
                 ┌─────────┐                        ┌─────────┐
                 │  Data   │                        │ A-Frame │
                 │  Valid  │                        │  Scene  │
                 └─────────┘                        └─────────┘
                      │                                   │
                      │                                   │
                      ▼                                   ▼
                 ┌─────────┐                        ┌─────────┐
                 │  Save   │                        │ Marker  │
                 │  Local  │                        │ Detect  │
                 └─────────┘                        └─────────┘
                      │                                   │
                      │                                   │
                      ▼                                   ▼
                 ┌─────────┐                        ┌─────────┐
                 │Redirect │                        │ Render  │
                 │ to AR   │                        │ AR Obj  │
                 └─────────┘                        └─────────┘
```

---

## 🎯 Komponen AR

```
┌─────────────────────────────────────────────────────────────┐
│                    KONSEP AR                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. DIGITAL OBJECT (3D Models)                              │
│     ┌──────────────────────────────────────────┐           │
│     │  • a-box (Panel Background)              │           │
│     │  • a-text (Informasi Teks)               │           │
│     │  • a-cylinder (Batang Panah)             │           │
│     │  • a-cone (Kepala Panah)                 │           │
│     └──────────────────────────────────────────┘           │
│                                                              │
│  2. AR SDK/LIBRARY                                          │
│     ┌──────────────────────────────────────────┐           │
│     │  • A-Frame 1.4.0                         │           │
│     │  • AR.js 3.4.5                           │           │
│     └──────────────────────────────────────────┘           │
│                                                              │
│  3. TRACKING                                                │
│     ┌──────────────────────────────────────────┐           │
│     │  • Marker HIRO                           │           │
│     │  • markerFound Event                     │           │
│     │  • markerLost Event                      │           │
│     └──────────────────────────────────────────┘           │
│                                                              │
│  4. RENDERING                                               │
│     ┌──────────────────────────────────────────┐           │
│     │  • A-Frame Renderer                      │           │
│     │  • Alpha Channel (Transparent)           │           │
│     │  • Antialiasing (Smooth)                 │           │
│     └──────────────────────────────────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Struktur File

```
project-root/
│
├── index.html              # Halaman setting
├── ar.html                 # Halaman AR
├── style.css               # Styling global
├── app.js                  # Logic index.html
├── ar.js                   # Logic ar.html
│
├── marker-hiro.html        # Halaman marker
│
├── README.md               # Dokumentasi utama
├── QUICKSTART.md           # Panduan cepat
├── TECHNICAL.md            # Dokumentasi teknis
├── CHECKLIST.md            # Checklist verifikasi
├── SUMMARY.md              # Ringkasan project
├── ARCHITECTURE.md         # Diagram arsitektur (ini)
│
└── .gitignore              # Git ignore
```

---

## 🎨 Hierarki DOM (ar.html)

```
<body class="ar-body">
│
├── <a-scene id="arScene">
│   │
│   ├── <a-marker id="hiroMarker" preset="hiro">
│   │   │
│   │   ├── <a-box id="panelBg">                    [Panel Background]
│   │   │
│   │   ├── <a-text id="floorText">                 [Teks Lantai]
│   │   │
│   │   ├── <a-text id="instructionText">           [Teks Instruksi]
│   │   │
│   │   ├── <a-text id="targetText">                [Teks Tujuan]
│   │   │
│   │   ├── <a-text id="roomListText">              [Teks Ruangan]
│   │   │
│   │   └── <a-entity id="arrowEntity">             [Panah 3D]
│   │       │
│   │       ├── <a-cylinder id="arrowShaft">        [Batang]
│   │       │
│   │       └── <a-cone id="arrowHead">             [Kepala]
│   │
│   └── <a-entity camera>                           [Kamera]
│
└── <div class="ar-overlay">
    │
    ├── <div class="ar-info-panel">                 [Panel Info Atas]
    │   │
    │   ├── <div class="marker-status">             [Status Marker]
    │   │
    │   └── <div class="ar-info-grid">              [Grid Info]
    │
    ├── <div class="marker-guide">                  [Panduan Marker]
    │   │
    │   └── <img class="marker-image">              [Gambar Marker]
    │
    └── <div class="ar-control-panel">              [Panel Kontrol]
        │
        ├── <button id="requestSensorBtn">          [Tombol Sensor]
        │
        ├── <div class="control-buttons">           [Tombol Lantai]
        │   │
        │   ├── <button id="floorUpBtn">            [Naik]
        │   │
        │   └── <button id="floorDownBtn">          [Turun]
        │
        └── <button id="backBtn">                   [Kembali]
```

---

## 🔄 State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE VARIABLES                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PERSISTENT (localStorage)                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • selectedRoomId      : string                    │    │
│  │  • targetRoomName      : string                    │    │
│  │  • targetFloor         : number                    │    │
│  │  • startFloor          : number                    │    │
│  │  • currentFloor        : number (mutable)          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  RUNTIME (ar.js variables)                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • markerDetected      : boolean                   │    │
│  │  • hasArrivedNotified  : boolean                   │    │
│  │  • sensorActive        : boolean                   │    │
│  │  • lastMotionTime      : number (timestamp)        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎮 Event Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    EVENT LISTENERS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INDEX.HTML (app.js)                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  roomSelect.change      → updatePreview()         │    │
│  │  startFloorSelect.change → updatePreview()        │    │
│  │  startARBtn.click       → startAR()               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  AR.HTML (ar.js)                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  DOMContentLoaded       → checkData() → init()    │    │
│  │  scene.loaded           → init()                  │    │
│  │  marker.markerFound     → markerDetected = true   │    │
│  │  marker.markerLost      → markerDetected = false  │    │
│  │  floorUpBtn.click       → floorUp()               │    │
│  │  floorDownBtn.click     → floorDown()             │    │
│  │  backBtn.click          → goBack()                │    │
│  │  requestSensorBtn.click → requestPermission()     │    │
│  │  window.devicemotion    → handleMotion()          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧮 Algoritma Navigasi

```
┌─────────────────────────────────────────────────────────────┐
│              ALGORITMA PERHITUNGAN INSTRUKSI                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INPUT:                                                     │
│    • currentFloor  : number (1-3)                           │
│    • targetFloor   : number (1-3)                           │
│                                                              │
│  PROCESS:                                                   │
│    diff = targetFloor - currentFloor                        │
│                                                              │
│    IF diff > 0:                                             │
│      instruction = "NAIK {diff} LANTAI"                     │
│      arrowColor = RED (#FF5252)                             │
│      arrowRotation = "0 0 0" (UP)                           │
│      panelColor = BLUE (#1a237e)                            │
│                                                              │
│    ELSE IF diff < 0:                                        │
│      instruction = "TURUN {abs(diff)} LANTAI"               │
│      arrowColor = RED (#FF5252)                             │
│      arrowRotation = "0 0 180" (DOWN)                       │
│      panelColor = BLUE (#1a237e)                            │
│                                                              │
│    ELSE:                                                    │
│      instruction = "SAMPAI"                                 │
│      arrowColor = GREEN (#4CAF50)                           │
│      arrowRotation = "0 0 0" (NEUTRAL)                      │
│      panelColor = GREEN (#1B5E20)                           │
│      TRIGGER: speakNotification()                           │
│      TRIGGER: vibrate([300, 150, 300])                      │
│                                                              │
│  OUTPUT:                                                    │
│    • instruction   : string                                 │
│    • arrowColor    : string (hex)                           │
│    • arrowRotation : string                                 │
│    • panelColor    : string (hex)                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📡 Sensor Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  MOTION SENSOR FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CHECK SUPPORT                                           │
│     ┌────────────────────────────────────────────────┐     │
│     │  IF DeviceMotionEvent exists                   │     │
│     │    → Continue                                  │     │
│     │  ELSE                                          │     │
│     │    → Show "Tidak Tersedia"                     │     │
│     └────────────────────────────────────────────────┘     │
│                                                              │
│  2. CHECK PERMISSION (iOS)                                  │
│     ┌────────────────────────────────────────────────┐     │
│     │  IF requestPermission exists                   │     │
│     │    → Show "Aktifkan Sensor" button            │     │
│     │    → Wait for user click                      │     │
│     │    → Request permission                       │     │
│     │  ELSE                                          │     │
│     │    → Activate directly                        │     │
│     └────────────────────────────────────────────────┘     │
│                                                              │
│  3. LISTEN TO MOTION                                        │
│     ┌────────────────────────────────────────────────┐     │
│     │  ON devicemotion event:                        │     │
│     │    1. Check cooldown (3000ms)                  │     │
│     │    2. Read accelerationIncludingGravity.y      │     │
│     │    3. Calculate abs(y)                         │     │
│     │    4. IF abs(y) > threshold (5):               │     │
│     │         IF currentFloor < targetFloor:         │     │
│     │           currentFloor++                       │     │
│     │         ELSE IF currentFloor > targetFloor:    │     │
│     │           currentFloor--                       │     │
│     │         updateARContent()                      │     │
│     │         lastMotionTime = now                   │     │
│     └────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Rendering Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                  RENDERING PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CAMERA INPUT                                            │
│     ┌────────────────────────────────────────────────┐     │
│     │  Webcam → Video Stream → AR.js                 │     │
│     └────────────────────────────────────────────────┘     │
│                          ▼                                   │
│  2. MARKER DETECTION                                        │
│     ┌────────────────────────────────────────────────┐     │
│     │  AR.js → Detect HIRO Pattern                   │     │
│     │       → Calculate Position & Rotation          │     │
│     └────────────────────────────────────────────────┘     │
│                          ▼                                   │
│  3. SCENE SETUP                                             │
│     ┌────────────────────────────────────────────────┐     │
│     │  A-Frame → Create 3D Scene                     │     │
│     │         → Position Objects on Marker           │     │
│     └────────────────────────────────────────────────┘     │
│                          ▼                                   │
│  4. OBJECT RENDERING                                        │
│     ┌────────────────────────────────────────────────┐     │
│     │  WebGL → Render 3D Objects                     │     │
│     │       → Apply Textures & Colors                │     │
│     │       → Apply Transformations                  │     │
│     └────────────────────────────────────────────────┘     │
│                          ▼                                   │
│  5. COMPOSITING                                             │
│     ┌────────────────────────────────────────────────┐     │
│     │  Combine Video + 3D Objects                    │     │
│     │  → Alpha Blending                              │     │
│     │  → Antialiasing                                │     │
│     └────────────────────────────────────────────────┘     │
│                          ▼                                   │
│  6. DISPLAY                                                 │
│     ┌────────────────────────────────────────────────┐     │
│     │  Canvas → Screen                               │     │
│     └────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security & Validation

```
┌─────────────────────────────────────────────────────────────┐
│              VALIDATION & ERROR HANDLING                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INPUT VALIDATION (app.js)                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • Check selectedRoomId not empty                  │    │
│  │  • Disable button if invalid                       │    │
│  │  • Alert user if trying to proceed without data    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  DATA VALIDATION (ar.js)                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • Check all localStorage keys exist               │    │
│  │  • Redirect to index.html if missing               │    │
│  │  • Parse numbers safely                            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  BOUNDARY CHECKS                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • currentFloor: min=1, max=3                      │    │
│  │  • Prevent overflow/underflow                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  NULL CHECKS                                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │  • Check DOM elements exist before use             │    │
│  │  • Check sensor data not null                      │    │
│  │  • Fallback for unsupported features               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Performance Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                  PERFORMANCE OPTIMIZATIONS                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. LAZY LOADING                                            │
│     • A-Frame & AR.js only loaded in ar.html               │
│     • index.html stays lightweight                          │
│                                                              │
│  2. EVENT THROTTLING                                        │
│     • Motion sensor cooldown: 3000ms                        │
│     • Prevents excessive updates                            │
│                                                              │
│  3. CONDITIONAL RENDERING                                   │
│     • Update AR objects only when needed                    │
│     • Check marker detected before updates                  │
│                                                              │
│  4. EFFICIENT DOM QUERIES                                   │
│     • Cache DOM elements in variables                       │
│     • Minimize repeated querySelector calls                 │
│                                                              │
│  5. MINIMAL DEPENDENCIES                                    │
│     • No npm packages                                       │
│     • No build process                                      │
│     • Direct CDN loading                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Diagram ini membantu memahami arsitektur dan alur kerja aplikasi secara visual.**
