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

// DOM Elements
const roomSelect = document.getElementById('roomSelect');
const startFloorSelect = document.getElementById('startFloorSelect');
const startARBtn = document.getElementById('startARBtn');
const previewRoom = document.getElementById('previewRoom');
const previewTargetFloor = document.getElementById('previewTargetFloor');
const previewStartFloor = document.getElementById('previewStartFloor');
const previewInstruction = document.getElementById('previewInstruction');

// Populate room dropdown
function populateRoomDropdown() {
    rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = `${room.name} (Lantai ${room.floor})`;
        roomSelect.appendChild(option);
    });
}

// Get instruction text
function getInstruction(startFloor, targetFloor) {
    const diff = targetFloor - startFloor;
    if (diff > 0) {
        return `NAIK ${diff} LANTAI`;
    } else if (diff < 0) {
        return `TURUN ${Math.abs(diff)} LANTAI`;
    } else {
        return `SAMPAI`;
    }
}

// Update preview
function updatePreview() {
    const selectedRoomId = roomSelect.value;
    const startFloor = parseInt(startFloorSelect.value);
    
    if (!selectedRoomId) {
        previewRoom.textContent = '-';
        previewTargetFloor.textContent = '-';
        previewStartFloor.textContent = '-';
        previewInstruction.textContent = '-';
        startARBtn.disabled = true;
        return;
    }
    
    const selectedRoom = rooms.find(r => r.id === selectedRoomId);
    if (!selectedRoom) return;
    
    const targetFloor = selectedRoom.floor;
    const instruction = getInstruction(startFloor, targetFloor);
    
    previewRoom.textContent = selectedRoom.name;
    previewTargetFloor.textContent = `Lantai ${targetFloor}`;
    previewStartFloor.textContent = `Lantai ${startFloor}`;
    previewInstruction.textContent = instruction;
    
    startARBtn.disabled = false;
}

// Start AR
function startAR() {
    const selectedRoomId = roomSelect.value;
    const startFloor = parseInt(startFloorSelect.value);
    
    if (!selectedRoomId) {
        alert('Silakan pilih ruang tujuan terlebih dahulu');
        return;
    }
    
    const selectedRoom = rooms.find(r => r.id === selectedRoomId);
    if (!selectedRoom) return;
    
    // Save to localStorage
    localStorage.setItem('selectedRoomId', selectedRoomId);
    localStorage.setItem('targetRoomName', selectedRoom.name);
    localStorage.setItem('targetFloor', selectedRoom.floor);
    localStorage.setItem('startFloor', startFloor);
    localStorage.setItem('currentFloor', startFloor);
    
    console.log('Data saved to localStorage:', {
        selectedRoomId,
        targetRoomName: selectedRoom.name,
        targetFloor: selectedRoom.floor,
        startFloor,
        currentFloor: startFloor
    });
    
    // Redirect to AR page
    window.location.href = 'src/pages/ar.html';
}

// Event Listeners
roomSelect.addEventListener('change', updatePreview);
startFloorSelect.addEventListener('change', updatePreview);
startARBtn.addEventListener('click', startAR);

// Initialize
populateRoomDropdown();
updatePreview();

console.log('app.js loaded - Index page ready');
