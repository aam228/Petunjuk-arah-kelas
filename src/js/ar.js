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
let accelerationSourceLogged = false;

// ============================================================
// SENSOR STATE MACHINE (Y-AXIS BASED)
// ============================================================

// State definitions
const motionState = {
    IDLE:            "idle",
    Y_MOVING:        "y_moving",
    STABILIZING:     "stabilizing",
    ARRIVED_STABLE:  "arrived_stable"
};

let currentMotionState = motionState.IDLE;

// Y-axis samples window untuk deteksi gerakan tangga
let ySamples = [];

// Timestamps
let movementStartTime  = null;  // kapan user mulai gerak Y signifikan
let stableStartTime    = null;  // kapan user mulai stabil setelah gerak
let lastFloorChangeTime = 0;    // terakhir kali lantai berubah

// Marker lock: cegah sensor ubah lantai saat marker aktif
let markerLockedFloor = null;

// ============================================================
// PARAMETER SENSOR (Y-AXIS BASED)
// ============================================================

// Y-axis window dan threshold
const Y_WINDOW_SIZE = 20;              // sampel Y yang disimpan
const Y_MOVEMENT_THRESHOLD = 2.5;      // yRange >= ini = user bergerak tangga
const Y_STABLE_THRESHOLD = 1.2;        // yRange <= ini = user stabil
const MIN_Y_MOVING_DURATION = 2500;    // durasi minimum gerakan Y sebelum valid
const ARRIVAL_STABLE_DURATION = 1500;  // durasi diam sebelum perubahan lantai
const FLOOR_CHANGE_COOLDOWN = 3000;    // cooldown antar perubahan lantai

// ============================================================
// HELPER FUNCTIONS (Y-AXIS BASED)
// ============================================================

// Tambah Y sample ke window
function addYSample(y) {
    ySamples.push(y);
    if (ySamples.length > Y_WINDOW_SIZE) {
        ySamples.shift();
    }
}

// Hitung range Y dalam window (max - min)
function getYRange() {
    if (ySamples.length === 0) return 0;
    const minY = Math.min(...ySamples);
    const maxY = Math.max(...ySamples);
    return maxY - minY;
}

// Apakah ada gerakan Y signifikan?
function isYMoving() {
    return getYRange() >= Y_MOVEMENT_THRESHOLD;
}

// Apakah Y sudah stabil?
function isYStable() {
    return getYRange() <= Y_STABLE_THRESHOLD;
}

// Ambil data akselerasi dari kedua sumber
function getMotionData(event) {
    const rawAcceleration = event.acceleration;
    const hasAcceleration = rawAcceleration && (
        (rawAcceleration.x || 0) !== 0 ||
        (rawAcceleration.y || 0) !== 0 ||
        (rawAcceleration.z || 0) !== 0
    );

    let x, y, z, source;
    if (hasAcceleration) {
        x = rawAcceleration.x || 0;
        y = rawAcceleration.y || 0;
        z = rawAcceleration.z || 0;
        source = "acceleration";
    } else {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return null;
        x = acc.x || 0;
        y = acc.y || 0;
        z = acc.z || 0;
        source = "accelerationIncludingGravity";
    }

    const rawMagnitude = Math.sqrt(x * x + y * y + z * z);
    return { x, y, z, source, rawMagnitude };
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
        window.location.href = '../../index.html';
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

// Marker aktif dilacak dengan Set agar status tetap akurat walau event berulang
const activeMarkers = new Set();

function setupMarkerEvents() {
    const markerGuide = document.getElementById('markerGuide');

    floorMarkers.forEach((item) => {
        const marker = document.getElementById(item.id);
        if (!marker) return;

        marker.addEventListener('markerFound', () => {
            activeMarkers.add(item.id);
            markerLockedFloor = item.floor;

            // Reset notifikasi hanya kalau lantai benar-benar berubah
            if (currentFloor !== item.floor) {
                hasArrivedNotified = false;
            }

            // Marker menentukan lantai — ini sumber utama
            currentFloor = item.floor;

            // Reset sensor saat marker dideteksi
            resetMotionState();

            // Update overlay
            document.getElementById('markerStatusText').textContent = 'Terdeteksi';
            updateOverlayInfo();
            checkArrival();

            // Sembunyikan guide saat marker terdeteksi
            if (markerGuide) markerGuide.style.display = 'none';

            console.log(`Marker lantai ${item.floor} terdeteksi → markerLockedFloor = ${markerLockedFloor}`);
        });

        marker.addEventListener('markerLost', () => {
            activeMarkers.delete(item.id);

            if (activeMarkers.size === 0) {
                markerLockedFloor = null;
                document.getElementById('markerStatusText').textContent = 'Belum Terdeteksi';
                if (markerGuide) markerGuide.style.display = 'flex';
                console.log('Semua marker hilang, sensor dapat diaktifkan kembali');
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
// HANDLE MOTION — STATE MACHINE (Y-AXIS BASED)
// ============================================================
function handleMotion(event) {
    if (!sensorActive) return;

    const motionData = getMotionData(event);
    if (!motionData) return;

    const { x, y, z, source, rawMagnitude } = motionData;
    const now = Date.now();

    // Tambah Y sample ke window
    addYSample(y);
    const yRange = getYRange();

    // --- State Machine (Y-based) ---
    switch (currentMotionState) {

        // ── IDLE: user diam, menunggu gerakan Y signifikan ──────
        case motionState.IDLE:
            if (isYMoving()) {
                // Deteksi gerakan Y signifikan, mulai track
                movementStartTime = now;
                currentMotionState = motionState.Y_MOVING;
                console.log('State: IDLE → Y_MOVING');
            }
            break;

        // ── Y_MOVING: user bergerak dengan Y signifikan ─────────
        case motionState.Y_MOVING:
            if (isYMoving()) {
                // Terus bergerak, maintain state
                // (terus update movementStartTime window)
            } else if (isYStable()) {
                // Y sudah stabil setelah bergerak
                currentMotionState = motionState.STABILIZING;
                stableStartTime = now;
                console.log('State: Y_MOVING → STABILIZING');
            }
            break;

        // ── STABILIZING: tunggu konfirmasi durasi stabil ────────
        case motionState.STABILIZING:
            if (isYMoving()) {
                // Y bergerak lagi, batal
                currentMotionState = motionState.Y_MOVING;
                stableStartTime = null;
                console.log('State: STABILIZING → Y_MOVING (bergerak lagi)');
            } else if (isYStable()) {
                const stableDuration = now - stableStartTime;

                // Durasi stable cukup lama? Cek durasi gerak minimum
                if (stableDuration >= ARRIVAL_STABLE_DURATION) {
                    const movingDuration = now - movementStartTime;
                    
                    if (movingDuration >= MIN_Y_MOVING_DURATION) {
                        // Valid transition ke ARRIVED_STABLE
                        currentMotionState = motionState.ARRIVED_STABLE;
                        console.log('State: STABILIZING → ARRIVED_STABLE (valid floor change)');
                    } else {
                        // Durasi gerak terlalu singkat
                        console.log('Gerakan Y terlalu singkat:', movingDuration + 'ms');
                        resetMotionState();
                    }
                }
            }
            break;

        // ── ARRIVED_STABLE: final state sebelum ubah lantai ─────
        case motionState.ARRIVED_STABLE:
            if (isYMoving()) {
                // User bergerak lagi, batal
                currentMotionState = motionState.Y_MOVING;
                console.log('State: ARRIVED_STABLE → Y_MOVING (gerak lagi)');
            } else if (isYStable()) {
                // Sudah stabil, ubah lantai sekarang
                tryChangeFloor(now);
                resetMotionState();
            }
            break;
    }

    // Update debug panel setiap frame
    updateSensorDebug({
        y,
        yRange,
        yStatus: isYMoving() ? 'Bergerak' : (isYStable() ? 'Stabil' : 'Transisi'),
        source,
        rawMagnitude,
        state: currentMotionState,
        movingDuration: movementStartTime ? now - movementStartTime : 0,
        stableDuration: stableStartTime ? now - stableStartTime : 0
    });
}

// ============================================================
// FLOOR CHANGE LOGIC (sensor sebagai pendukung)
// ============================================================
function tryChangeFloor(now) {
    // Guard: jangan ubah lantai saat marker masih aktif
    if (markerLockedFloor !== null || activeMarkers.size > 0) {
        console.log('Marker aktif, sensor dikunci - lantai tidak berubah');
        return;
    }

    // Sensor hanya bekerja jika lantai sudah diketahui dari marker sebelumnya
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
    ySamples = [];  // Clear Y window
    console.log('Motion state reset ke IDLE, Y window cleared');
}

// ============================================================
// RESET / KALIBRASI
// ============================================================
function resetBaseline() {
    resetMotionState();
    lastFloorChangeTime = 0;

    updateSensorDebug({
        y: 0,
        yRange: 0,
        yStatus: 'Stabil',
        source: '-',
        rawMagnitude: 0,
        state: motionState.IDLE,
        movingDuration: 0,
        stableDuration: 0
    });

    console.log('Sensor dikalibrasi ulang');
}

// ============================================================
// DEBUG PANEL UPDATE
// ============================================================
function updateSensorDebug({ y, yRange, yStatus, source, rawMagnitude, state, movingDuration, stableDuration }) {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = typeof value === 'number' ? value.toFixed(2) : (value || '-');
    };

    // Y-axis indikator utama
    setText('debug-y', y);
    setText('debug-y-range', yRange);
    
    // Status Y (Stabil / Bergerak / Transisi)
    const statusYEl = document.getElementById('debug-y-status');
    if (statusYEl) {
        statusYEl.textContent = yStatus || 'Transisi';
    }

    // Tampilkan magnitude untuk referensi (bukan keputusan)
    setText('debug-magnitude', rawMagnitude);
    
    // Tampilkan sumber akselerasi
    const sourceEl = document.getElementById('debug-source');
    if (sourceEl) {
        sourceEl.textContent = source === 'acceleration' ? 'accel' : (source === 'accelerationIncludingGravity' ? 'incG' : '-');
    }

    // Label state machine Y-based
    const stateLabel = {
        [motionState.IDLE]:           'Diam',
        [motionState.Y_MOVING]:       'Gerak Y signifikan',
        [motionState.STABILIZING]:    'Stabilisasi',
        [motionState.ARRIVED_STABLE]: 'Sampai lantai baru'
    };
    
    const statusEl = document.getElementById('debug-motion-state');
    if (statusEl) {
        if (markerLockedFloor !== null || activeMarkers.size > 0) {
            statusEl.textContent = 'Marker aktif, sensor dikunci';
        } else {
            statusEl.textContent = stateLabel[state] || 'Menunggu gerakan Y';
        }
    }

    // Durasi dalam detik
    const setDuration = (id, ms) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = ms > 0 ? (ms / 1000).toFixed(1) + 's' : '-';
    };
    setDuration('debug-moving-dur', movingDuration);
    setDuration('debug-stable-dur', stableDuration);
}

// ============================================================
// NAVIGATION
// ============================================================
function goBack() {
    window.location.href = '../../index.html';
}

// ============================================================
// INIT
// ============================================================
function init() {
    // Setup all components
    setupMarkerEvents();
    setupMotionSensor();
    setupButtonHandlers();
}

function setupButtonHandlers() {
    // Manual floor controls
    const floorUpBtn = document.getElementById('floorUpBtn');
    const floorDownBtn = document.getElementById('floorDownBtn');
    const resetBtn = document.getElementById('resetBaselineBtn');
    const backBtn = document.getElementById('backBtn');

    if (floorUpBtn) floorUpBtn.addEventListener('click', floorUp);
    if (floorDownBtn) floorDownBtn.addEventListener('click', floorDown);
    if (resetBtn) resetBtn.addEventListener('click', resetBaseline);
    if (backBtn) backBtn.addEventListener('click', goBack);
}

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
