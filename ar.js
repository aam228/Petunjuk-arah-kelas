// ============================================================
// DATA RUANGAN
// ============================================================
const rooms = [
    { id: "101", name: "Ruang 101", floor: 1 },
    { id: "102", name: "Ruang 102", floor: 1 },
    { id: "103", name: "Ruang 103", floor: 1 },
    { id: "201", name: "Ruang 201", floor: 2 },
    { id: "202", name: "Ruang 202", floor: 2 },
    { id: "203", name: "Ruang 203", floor: 2 },
    { id: "301", name: "Ruang 301", floor: 3 },
    { id: "302", name: "Ruang 302", floor: 3 },
    { id: "303", name: "Ruang 303", floor: 3 }
];

// ============================================================
// GLOBAL STATE
// ============================================================
let currentFloor = 0;       // 0 = belum diketahui, ditentukan oleh marker
let targetFloor = 1;
let targetRoomName = '';
let hasArrivedNotified = false;
let sensorActive = false;

// ============================================================
// SENSOR STATE MACHINE
// ============================================================

// State definitions
const motionState = {
    IDLE:           "idle",
    MOVING:         "moving",
    SHORT_PAUSE:    "short_pause",
    ARRIVED_STABLE: "arrived_stable"
};

let currentMotionState = motionState.IDLE;

// Timestamps
let movementStartTime  = null;  // kapan mulai bergerak
let stableStartTime    = null;  // kapan mulai diam (setelah bergerak)
let lastMovementTime   = null;  // terakhir kali terdeteksi bergerak
let lastFloorChangeTime = 0;    // terakhir kali lantai berubah

// Counter untuk filter noise
let movingSampleCount = 0;

// ============================================================
// PARAMETER SENSOR
// ============================================================

// Magnitude dianggap "diam" jika dalam rentang ini
// (gravitasi bumi ≈ 9.8 m/s², saat HP diam magnitude ≈ 9.8)
const STABLE_MIN = 7.0;
const STABLE_MAX = 13.0;

// Magnitude di atas ini dianggap "bergerak aktif"
const MOVING_THRESHOLD = 14.0;

// Durasi minimum bergerak agar dihitung sebagai sesi naik/turun tangga
const MIN_MOVING_DURATION = 2500;   // ms

// Jeda di bordes/sudut tangga: jika diam < nilai ini, belum dihitung sampai
const SHORT_PAUSE_MAX = 2500;       // ms

// Diam setelah bergerak selama ini → dianggap sudah sampai lantai baru
const ARRIVAL_STABLE_DURATION = 4500; // ms

// Cooldown antar perubahan lantai (hindari double-trigger)
const FLOOR_CHANGE_COOLDOWN = 5000; // ms

// Jumlah sample bergerak berturut-turut sebelum masuk state MOVING
const REQUIRED_MOVING_SAMPLES = 5;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function isStableMagnitude(magnitude) {
    return magnitude >= STABLE_MIN && magnitude <= STABLE_MAX;
}

function isMovingMagnitude(magnitude) {
    return magnitude > MOVING_THRESHOLD;
}

// Hitung durasi dalam detik, return string "x.xs"
function durationSec(startTime, now) {
    if (!startTime) return '-';
    return ((now - startTime) / 1000).toFixed(1) + 's';
}

// ============================================================
// DATA LOADING
// ============================================================
function checkData() {
    const selectedRoomId      = localStorage.getItem('selectedRoomId');
    const targetRoomNameStored = localStorage.getItem('targetRoomName');
    const targetFloorStored   = localStorage.getItem('targetFloor');
    const startFloorStored    = localStorage.getItem('startFloor');
    const currentFloorStored  = localStorage.getItem('currentFloor');

    if (!selectedRoomId || !targetRoomNameStored || !targetFloorStored || !startFloorStored) {
        console.log('Data tidak lengkap, redirect ke index.html');
        window.location.href = 'index.html';
        return false;
    }

    targetRoomName = targetRoomNameStored;
    targetFloor    = parseInt(targetFloorStored);
    currentFloor   = parseInt(currentFloorStored);

    console.log('Data loaded:', { selectedRoomId, targetRoomName, targetFloor, currentFloor });
    return true;
}

// ============================================================
// AR CONTENT UPDATE
// ============================================================

// Update angka lantai di objek AR (jangan ubah nama fungsi ini)
// Dengan barcode marker, teks AR sudah hardcoded per marker di HTML.
// Fungsi ini tetap ada untuk kompatibilitas dengan tombol manual —
// saat manual dipakai, kita update overlay saja karena AR object
// sudah menampilkan angka sesuai marker yang terdeteksi.
function updateARFloorNumber() {
    // Overlay tetap diupdate
    updateOverlayInfo();
    console.log('AR floor number (overlay) updated to:', currentFloor);
}

// Update semua konten AR + overlay
function updateARContent() {
    updateARFloorNumber();
    updateOverlayInfo();
    localStorage.setItem('currentFloor', currentFloor);
    checkArrival();
    console.log('AR Content updated:', { currentFloor, targetFloor });
}

// Update overlay status panel
function updateOverlayInfo() {
    const floorEl = document.getElementById('currentFloorDisplay');
    if (floorEl) {
        floorEl.textContent = currentFloor > 0 ? currentFloor : '-';
    }
    const roomEl = document.getElementById('targetRoomDisplay');
    if (roomEl) {
        roomEl.textContent = targetRoomName || '-';
    }
}

// ============================================================
// ARRIVAL NOTIFICATION
// ============================================================
function checkArrival() {
    if (currentFloor === targetFloor && !hasArrivedNotified) {
        speakNotification();
        if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
        hasArrivedNotified = true;
        console.log('Arrival notification triggered');
    } else if (currentFloor !== targetFloor) {
        hasArrivedNotified = false;
    }
}

function speakNotification() {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Anda diperkirakan sudah sampai di lantai tujuan');
        utterance.lang = 'id-ID';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// ============================================================
// MANUAL FLOOR CONTROL
// ============================================================
function floorUp() {
    if (currentFloor < 3) {
        currentFloor++;
        updateARContent();
        console.log('Manual floor up:', currentFloor);
    }
}

function floorDown() {
    if (currentFloor > 1) {
        currentFloor--;
        updateARContent();
        console.log('Manual floor down:', currentFloor);
    }
}

// ============================================================
// MARKER EVENTS — barcode marker menentukan currentFloor
// ============================================================

// Daftar marker per lantai
// value di sini harus cocok dengan value di a-marker di ar.html
// Pakai 3x3_HAMMING63: value 0,1,2 → lantai 1,2,3
const floorMarkers = [
    { id: "marker-floor-1", floor: 1, value: 0 },
    { id: "marker-floor-2", floor: 2, value: 1 },
    { id: "marker-floor-3", floor: 3, value: 2 }
];

// Berapa marker yang sedang aktif terdeteksi
let activeMarkerCount = 0;

function setupMarkerEvents() {
    const markerGuide = document.getElementById('markerGuide');

    floorMarkers.forEach((item) => {
        const marker = document.getElementById(item.id);
        if (!marker) return;

        marker.addEventListener('markerFound', () => {
            activeMarkerCount++;

            // Marker menentukan lantai — ini sumber utama
            currentFloor = item.floor;
            hasArrivedNotified = false; // reset agar notifikasi bisa jalan ulang

            // Update overlay
            document.getElementById('markerStatusText').textContent = 'Terdeteksi';
            updateOverlayInfo();
            checkArrival();

            // Sembunyikan guide saat marker terdeteksi
            if (markerGuide) markerGuide.style.display = 'none';

            console.log(`Marker lantai ${item.floor} terdeteksi → currentFloor = ${currentFloor}`);
        });

        marker.addEventListener('markerLost', () => {
            activeMarkerCount = Math.max(0, activeMarkerCount - 1);

            if (activeMarkerCount === 0) {
                document.getElementById('markerStatusText').textContent = 'Belum Terdeteksi';
                if (markerGuide) markerGuide.style.display = 'flex';
            }

            console.log(`Marker lantai ${item.floor} hilang`);
        });
    });
}

// ============================================================
// MOTION SENSOR SETUP
// ============================================================
function setupMotionSensor() {
    if (!window.DeviceMotionEvent) {
        document.getElementById('sensorStatus').textContent = 'Tidak Tersedia';
        console.log('DeviceMotionEvent not supported');
        return;
    }

    // iOS 13+ butuh permission eksplisit
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const requestBtn = document.getElementById('requestSensorBtn');
        requestBtn.style.display = 'block';

        requestBtn.addEventListener('click', function() {
            DeviceMotionEvent.requestPermission()
                .then(state => {
                    if (state === 'granted') {
                        activateMotionSensor();
                        requestBtn.style.display = 'none';
                    } else {
                        document.getElementById('sensorStatus').textContent = 'Ditolak';
                    }
                })
                .catch(console.error);
        });
    } else {
        activateMotionSensor();
    }
}

function activateMotionSensor() {
    window.addEventListener('devicemotion', handleMotion);
    sensorActive = true;
    document.getElementById('sensorStatus').textContent = 'Aktif';
    console.log('Motion sensor activated');
}

// ============================================================
// HANDLE MOTION — STATE MACHINE UTAMA
// ============================================================
function handleMotion(event) {
    if (!sensorActive) return;

    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;

    // Magnitude total vektor akselerasi
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    const now = Date.now();

    // --- Tentukan kondisi saat ini ---
    const stable = isStableMagnitude(magnitude);
    const moving = isMovingMagnitude(magnitude);

    // --- State Machine ---
    switch (currentMotionState) {

        // ── IDLE: user diam, menunggu gerakan ──────────────────
        case motionState.IDLE:
            if (moving) {
                movingSampleCount++;
                if (movingSampleCount >= REQUIRED_MOVING_SAMPLES) {
                    // Cukup sample bergerak → masuk MOVING
                    currentMotionState = motionState.MOVING;
                    movementStartTime  = now;
                    lastMovementTime   = now;
                    movingSampleCount  = 0;
                    console.log('State: IDLE → MOVING');
                }
            } else {
                // Reset counter jika tidak bergerak
                movingSampleCount = 0;
            }
            break;

        // ── MOVING: user sedang naik/turun tangga ──────────────
        case motionState.MOVING:
            if (moving) {
                lastMovementTime = now;
                movingSampleCount++;
            } else if (stable) {
                // Mulai diam → masuk SHORT_PAUSE (mungkin bordes)
                currentMotionState = motionState.SHORT_PAUSE;
                stableStartTime    = now;
                console.log('State: MOVING → SHORT_PAUSE');
            }
            break;

        // ── SHORT_PAUSE: jeda di bordes/sudut tangga ───────────
        case motionState.SHORT_PAUSE:
            if (moving) {
                // Bergerak lagi sebelum timeout → kembali ke MOVING
                currentMotionState = motionState.MOVING;
                lastMovementTime   = now;
                stableStartTime    = null;
                console.log('State: SHORT_PAUSE → MOVING (bordes terlewati)');
            } else if (stable) {
                const stableDuration = now - stableStartTime;

                if (stableDuration >= ARRIVAL_STABLE_DURATION) {
                    // Diam cukup lama → cek apakah sesi bergerak valid
                    const movingDuration = (lastMovementTime || now) - movementStartTime;

                    if (movingDuration >= MIN_MOVING_DURATION) {
                        // Sesi perpindahan lantai valid → update lantai
                        tryChangeFloor(now);
                    } else {
                        console.log('Gerakan terlalu singkat, diabaikan:', movingDuration + 'ms');
                    }

                    // Reset ke IDLE apapun hasilnya
                    resetMotionState();
                }
                // Jika stableDuration < SHORT_PAUSE_MAX → masih tunggu
                // Jika SHORT_PAUSE_MAX < stableDuration < ARRIVAL_STABLE_DURATION → masih tunggu
            }
            break;
    }

    // Update debug panel setiap frame
    updateSensorDebug({
        x, y, z, magnitude,
        state: currentMotionState,
        stableDuration: stableStartTime ? now - stableStartTime : 0,
        movingDuration: movementStartTime ? (lastMovementTime || now) - movementStartTime : 0
    });
}

// ============================================================
// FLOOR CHANGE LOGIC (sensor sebagai pendukung)
// ============================================================
function tryChangeFloor(now) {
    // Sensor hanya bekerja jika lantai sudah diketahui dari marker
    if (currentFloor === 0) {
        console.log('Lantai belum diketahui, scan marker dulu');
        return;
    }

    const cooldownOk = (now - lastFloorChangeTime) >= FLOOR_CHANGE_COOLDOWN;
    if (!cooldownOk) {
        console.log('Cooldown aktif, lantai tidak berubah');
        return;
    }

    if (targetFloor > currentFloor && currentFloor < 3) {
        currentFloor++;
        lastFloorChangeTime = now;
        updateARContent();
        console.log('Sensor: lantai naik ke', currentFloor);
    } else if (targetFloor < currentFloor && currentFloor > 1) {
        currentFloor--;
        lastFloorChangeTime = now;
        updateARContent();
        console.log('Sensor: lantai turun ke', currentFloor);
    } else {
        console.log('Sudah di lantai tujuan atau batas lantai');
    }
}

// Reset semua variabel state machine ke kondisi awal
function resetMotionState() {
    currentMotionState = motionState.IDLE;
    movementStartTime  = null;
    stableStartTime    = null;
    lastMovementTime   = null;
    movingSampleCount  = 0;
    console.log('Motion state reset ke IDLE');
}

// ============================================================
// RESET / KALIBRASI
// ============================================================
function resetBaseline() {
    resetMotionState();
    lastFloorChangeTime = 0;

    updateSensorDebug({
        x: 0, y: 0, z: 0,
        magnitude: 0,
        state: motionState.IDLE,
        stableDuration: 0,
        movingDuration: 0
    });

    console.log('Sensor dikalibrasi ulang');
}

// ============================================================
// DEBUG PANEL UPDATE
// ============================================================
function updateSensorDebug({ x, y, z, magnitude, state, stableDuration, movingDuration }) {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = typeof value === 'number' ? value.toFixed(2) : (value || '-');
    };

    setText('debug-x', x);
    setText('debug-y', y);
    setText('debug-z', z);
    setText('debug-magnitude', magnitude);

    // Label state yang lebih ramah
    const stateLabel = {
        [motionState.IDLE]:           'Diam',
        [motionState.MOVING]:         'Bergerak',
        [motionState.SHORT_PAUSE]:    'Bordes',
        [motionState.ARRIVED_STABLE]: 'Sampai'
    };
    const el = document.getElementById('debug-motion-state');
    if (el) el.textContent = stateLabel[state] || state;

    // Durasi dalam detik
    const setDuration = (id, ms) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = ms > 0 ? (ms / 1000).toFixed(1) + 's' : '-';
    };
    setDuration('debug-stable-dur', stableDuration);
    setDuration('debug-moving-dur', movingDuration);
}

// ============================================================
// NAVIGATION
// ============================================================
function goBack() {
    window.location.href = 'index.html';
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', function() {
    console.log('ar.js loaded');
    if (!checkData()) return;

    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        init();
    } else {
        scene.addEventListener('loaded', init);
    }
});

function init() {
    console.log('A-Frame scene loaded, initializing...');

    setupMarkerEvents();
    updateARContent();
    setupMotionSensor();

    document.getElementById('floorUpBtn').addEventListener('click', floorUp);
    document.getElementById('floorDownBtn').addEventListener('click', floorDown);
    document.getElementById('resetBaselineBtn').addEventListener('click', resetBaseline);
    document.getElementById('backBtn').addEventListener('click', goBack);

    console.log('AR page initialized');
}
