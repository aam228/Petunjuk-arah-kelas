// Data Ruangan
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

// Global Variables
let currentFloor = 1;
let targetFloor = 1;
let targetRoomName = '';
let markerDetected = false;
let hasArrivedNotified = false;
let sensorActive = false;
let lastMotionTime = 0;
const motionCooldown = 3000; // 3 seconds

// Sensor mapping untuk deteksi naik/turun lantai
const floorStepPattern = {
    up: { deltaY: -4.0, deltaZ: 2.6 },
    down: { deltaY: 4.0, deltaZ: -2.6 }
};
const sensorTolerance = 2.0; // Toleransi untuk matching pattern

// Baseline coordinates (titik awal)
let baselineCoords = { y: 0, z: 0 };
let coordsInitialized = false;

// Check localStorage and redirect if empty
function checkData() {
    const selectedRoomId = localStorage.getItem('selectedRoomId');
    const targetRoomNameStored = localStorage.getItem('targetRoomName');
    const targetFloorStored = localStorage.getItem('targetFloor');
    const startFloorStored = localStorage.getItem('startFloor');
    const currentFloorStored = localStorage.getItem('currentFloor');
    
    if (!selectedRoomId || !targetRoomNameStored || !targetFloorStored || !startFloorStored) {
        console.log('Data tidak lengkap, redirect ke index.html');
        window.location.href = 'index.html';
        return false;
    }
    
    // Load data
    targetRoomName = targetRoomNameStored;
    targetFloor = parseInt(targetFloorStored);
    currentFloor = parseInt(currentFloorStored);
    
    console.log('Data loaded from localStorage:', {
        selectedRoomId,
        targetRoomName,
        targetFloor,
        currentFloor
    });
    
    return true;
}

// Get rooms on specific floor
function getRoomsOnFloor(floor) {
    return rooms.filter(r => r.floor === floor);
}

// Get instruction text
function getInstruction(current, target) {
    const diff = target - current;
    if (diff > 0) {
        return `NAIK ${diff} LANTAI`;
    } else if (diff < 0) {
        return `TURUN ${Math.abs(diff)} LANTAI`;
    } else {
        return `SAMPAI`;
    }
}

// Update AR Floor Number (Main function for AR object)
function updateARFloorNumber() {
    const floorNumberText = document.getElementById('ar-floor-number');
    if (floorNumberText) {
        floorNumberText.setAttribute('value', String(currentFloor));
        console.log('AR floor number updated to:', currentFloor);
    }
}

// Update AR Content (includes overlay UI and AR object)
function updateARContent() {
    const instruction = getInstruction(currentFloor, targetFloor);
    const roomsOnFloor = getRoomsOnFloor(currentFloor);
    const roomListText = roomsOnFloor.map(r => r.name).join(', ');
    
    // Update AR Floor Number Object
    updateARFloorNumber();
    
    // Update Overlay UI
    document.getElementById('currentFloorDisplay').textContent = `Lantai ${currentFloor}`;
    document.getElementById('targetRoomDisplay').textContent = targetRoomName;
    document.getElementById('instructionDisplay').textContent = instruction;
    
    // Save current floor to localStorage
    localStorage.setItem('currentFloor', currentFloor);
    
    // Check if arrived
    checkArrival();
    
    console.log('AR Content updated:', {
        currentFloor,
        targetFloor,
        instruction,
        roomsOnFloor: roomListText
    });
}

// Check Arrival and Notify
function checkArrival() {
    if (currentFloor === targetFloor && !hasArrivedNotified) {
        // Speak notification
        speakNotification();
        
        // Vibrate
        if (navigator.vibrate) {
            navigator.vibrate([300, 150, 300]);
            console.log('Vibration triggered');
        }
        
        hasArrivedNotified = true;
        console.log('Arrival notification triggered');
    } else if (currentFloor !== targetFloor && hasArrivedNotified) {
        // Reset notification flag if moved away
        hasArrivedNotified = false;
    }
}

// Speech Notification
function speakNotification() {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Anda diperkirakan sudah sampai di lantai tujuan');
        utterance.lang = 'id-ID';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
        console.log('Speech notification played');
    }
}

// Manual Floor Control
function floorUp() {
    if (currentFloor < 3) {
        currentFloor++;
        updateARContent();
        console.log('Floor up:', currentFloor);
    }
}

function floorDown() {
    if (currentFloor > 1) {
        currentFloor--;
        updateARContent();
        console.log('Floor down:', currentFloor);
    }
}

// Marker Events (Marker hanya untuk tempat munculnya objek AR, tidak mengubah lantai)
function setupMarkerEvents() {
    const marker = document.getElementById('hiroMarker');
    
    if (marker) {
        marker.addEventListener('markerFound', function() {
            markerDetected = true;
            document.getElementById('statusDot').classList.add('active');
            document.getElementById('markerStatusText').textContent = 'Marker terdeteksi';
            
            // Update AR floor number when marker is found
            updateARFloorNumber();
            
            console.log('Marker found - AR object visible');
        });
        
        marker.addEventListener('markerLost', function() {
            markerDetected = false;
            document.getElementById('statusDot').classList.remove('active');
            document.getElementById('markerStatusText').textContent = 'Marker belum terdeteksi';
            console.log('Marker lost - AR object hidden');
        });
    }
}

// Motion Sensor Setup
function setupMotionSensor() {
    // Check if DeviceMotionEvent exists
    if (!window.DeviceMotionEvent) {
        console.log('DeviceMotionEvent not supported');
        document.getElementById('sensorStatus').textContent = 'N/A';
        return;
    }
    
    // Check if permission is needed (iOS 13+)
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        // Show button to request permission
        const requestBtn = document.getElementById('requestSensorBtn');
        requestBtn.style.display = 'block';
        
        requestBtn.addEventListener('click', function() {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        activateMotionSensor();
                        requestBtn.style.display = 'none';
                        console.log('Motion sensor permission granted');
                    } else {
                        console.log('Motion sensor permission denied');
                        document.getElementById('sensorStatus').textContent = 'Denied';
                    }
                })
                .catch(console.error);
        });
    } else {
        // No permission needed, activate directly
        activateMotionSensor();
    }
}

function activateMotionSensor() {
    window.addEventListener('devicemotion', handleMotion);
    sensorActive = true;
    document.getElementById('sensorStatus').textContent = 'On';
    console.log('Motion sensor activated');
}

// Check if coordinate delta matches floor step pattern
function matchesPattern(deltaY, deltaZ, pattern) {
    const yMatch = Math.abs(deltaY - pattern.deltaY) < sensorTolerance;
    const zMatch = Math.abs(deltaZ - pattern.deltaZ) < sensorTolerance;
    return yMatch && zMatch;
}

function handleMotion(event) {
    if (!sensorActive) return;
    
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;
    
    // Initialize baseline on first reading
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
        
        console.log('Baseline coordinates initialized:', baselineCoords);
        return;
    }
    
    // Calculate delta from baseline
    const deltaY = y - baselineCoords.y;
    const deltaZ = z - baselineCoords.z;
    
    let detectionStatus = 'Belum cocok';
    
    const now = Date.now();
    const canUpdate = now - lastMotionTime >= motionCooldown;
    
    // Check if delta matches "up" pattern
    if (matchesPattern(deltaY, deltaZ, floorStepPattern.up)) {
        detectionStatus = 'Terdeteksi naik';
        
        if (canUpdate && currentFloor < 3) { // Max floor limit
            currentFloor++;
            updateARContent();
            lastMotionTime = now;
            
            // Update baseline after successful detection
            baselineCoords.y = y;
            baselineCoords.z = z;
            
            console.log('Pattern matched: UP - Floor changed to', currentFloor);
        }
    }
    // Check if delta matches "down" pattern
    else if (matchesPattern(deltaY, deltaZ, floorStepPattern.down)) {
        detectionStatus = 'Terdeteksi turun';
        
        if (canUpdate && currentFloor > 1) { // Min floor limit
            currentFloor--;
            updateARContent();
            lastMotionTime = now;
            
            // Update baseline after successful detection
            baselineCoords.y = y;
            baselineCoords.z = z;
            
            console.log('Pattern matched: DOWN - Floor changed to', currentFloor);
        }
    }
    
    // Update debug panel
    updateSensorDebug({
        x, y, z,
        baseY: baselineCoords.y,
        baseZ: baselineCoords.z,
        deltaY,
        deltaZ,
        status: detectionStatus
    });
}

// Back Button
function goBack() {
    window.location.href = 'index.html';
}

// Reset Baseline
function resetBaseline() {
    coordsInitialized = false;
    baselineCoords = { y: 0, z: 0 };
    
    updateSensorDebug({
        x: 0,
        y: 0,
        z: 0,
        baseY: 0,
        baseZ: 0,
        deltaY: 0,
        deltaZ: 0,
        status: 'Baseline direset'
    });
    
    console.log('Baseline reset');
}

// Update Sensor Debug Panel
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

// Initialize
window.addEventListener('DOMContentLoaded', function() {
    console.log('ar.js loaded');
    
    // Check data
    if (!checkData()) {
        return;
    }
    
    // Wait for A-Frame to be ready
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        init();
    } else {
        scene.addEventListener('loaded', init);
    }
});

function init() {
    console.log('A-Frame scene loaded, initializing...');
    
    // Setup marker events
    setupMarkerEvents();
    
    // Update AR content
    updateARContent();
    
    // Setup motion sensor
    setupMotionSensor();
    
    // Setup button events
    document.getElementById('floorUpBtn').addEventListener('click', floorUp);
    document.getElementById('floorDownBtn').addEventListener('click', floorDown);
    document.getElementById('resetBaselineBtn').addEventListener('click', resetBaseline);
    document.getElementById('backBtn').addEventListener('click', goBack);
    
    console.log('AR page initialized successfully');
}
