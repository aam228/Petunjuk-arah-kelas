const roomData = [
  { name: "Ruang 101", floor: 1 },
  { name: "Ruang 201", floor: 2 },
  { name: "Ruang 301", floor: 3 },
  { name: "Ruang 401", floor: 4 },
];

const MAX_FLOOR = 12;
const MIN_FLOOR = 1;
const MOTION_THRESHOLD = 12;
const DETECTION_COOLDOWN_MS = 4000;

const roomSelect = document.getElementById("roomSelect");
const startFloorSelect = document.getElementById("startFloor");
const startBtn = document.getElementById("startBtn");
const permissionBtn = document.getElementById("permissionBtn");
const upBtn = document.getElementById("upBtn");
const downBtn = document.getElementById("downBtn");

const targetRoomEl = document.getElementById("targetRoom");
const targetFloorEl = document.getElementById("targetFloor");
const currentFloorEl = document.getElementById("currentFloor");
const statusTextEl = document.getElementById("statusText");
const hintTextEl = document.getElementById("hintText");

let currentFloor = null;
let targetFloor = null;
let targetRoom = "";
let navigating = false;
let lastMotionAt = 0;
let arrivedAnnounced = false;

function initFormOptions() {
  roomData.forEach((room) => {
    const option = document.createElement("option");
    option.value = room.name;
    option.textContent = `${room.name} (Lantai ${room.floor})`;
    roomSelect.appendChild(option);
  });

  for (let i = MIN_FLOOR; i <= MAX_FLOOR; i += 1) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `Lantai ${i}`;
    startFloorSelect.appendChild(option);
  }

  startFloorSelect.value = "1";
}

function clampFloor(floor) {
  return Math.min(MAX_FLOOR, Math.max(MIN_FLOOR, floor));
}

function findTargetFloorByRoom(roomName) {
  const room = roomData.find((item) => item.name === roomName);
  return room ? room.floor : null;
}

function updateStatusUI() {
  targetRoomEl.textContent = targetRoom || "-";
  targetFloorEl.textContent = targetFloor === null ? "-" : String(targetFloor);
  currentFloorEl.textContent = currentFloor === null ? "-" : String(currentFloor);

  if (!navigating || currentFloor === null || targetFloor === null) {
    statusTextEl.textContent = "Belum mulai";
    hintTextEl.textContent = "Pilih ruang dan lantai awal, lalu tekan Mulai Navigasi.";
    return;
  }

  if (currentFloor === targetFloor) {
    statusTextEl.textContent = "Sampai";
    hintTextEl.textContent = "Anda diperkirakan sudah sampai di lantai tujuan";

    if (!arrivedAnnounced) {
      announceArrival();
      arrivedAnnounced = true;
    }
    return;
  }

  arrivedAnnounced = false;
  const diff = Math.abs(targetFloor - currentFloor);
  const direction = currentFloor < targetFloor ? "Naik" : "Turun";
  statusTextEl.textContent = currentFloor < targetFloor ? "Naik" : "Turun";
  hintTextEl.textContent = `${direction} ${diff} lantai lagi`;
}

function announceArrival() {
  const message = "Anda diperkirakan sudah sampai di lantai tujuan";

  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "id-ID";
    utterance.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  if ("vibrate" in navigator) {
    navigator.vibrate([200, 120, 200]);
  }
}

function stepFloorEstimate(triggerType = "manual") {
  if (!navigating || currentFloor === null || targetFloor === null) {
    return;
  }

  if (currentFloor < targetFloor) {
    currentFloor = clampFloor(currentFloor + 1);
  } else if (currentFloor > targetFloor) {
    currentFloor = clampFloor(currentFloor - 1);
  }

  updateStatusUI();

  if (triggerType === "motion") {
    console.log(`Deteksi gerak: estimasi lantai sekarang ${currentFloor}`);
  }
}

function adjustFloorManually(delta) {
  if (!navigating || currentFloor === null) {
    return;
  }

  currentFloor = clampFloor(currentFloor + delta);
  updateStatusUI();
}

function onMotion(event) {
  if (!navigating || currentFloor === null || targetFloor === null) {
    return;
  }

  const now = Date.now();
  if (now - lastMotionAt < DETECTION_COOLDOWN_MS) {
    return;
  }

  const z = Math.abs(event.accelerationIncludingGravity?.z || 0);
  if (z < MOTION_THRESHOLD) {
    return;
  }

  lastMotionAt = now;
  stepFloorEstimate("motion");
}

async function ensureMotionPermissionIfNeeded() {
  const needsIOSPermission =
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function";

  if (!needsIOSPermission) {
    return true;
  }

  try {
    const result = await DeviceMotionEvent.requestPermission();
    return result === "granted";
  } catch (error) {
    console.error("Gagal meminta izin sensor:", error);
    return false;
  }
}

async function startNavigation() {
  targetRoom = roomSelect.value;
  targetFloor = findTargetFloorByRoom(targetRoom);
  currentFloor = clampFloor(Number(startFloorSelect.value));

  if (targetFloor === null) {
    alert("Ruang tujuan tidak ditemukan.");
    return;
  }

  const permissionGranted = await ensureMotionPermissionIfNeeded();
  if (!permissionGranted) {
    permissionBtn.hidden = false;
    alert("Izin sensor gerak diperlukan untuk deteksi otomatis.");
  } else {
    permissionBtn.hidden = true;
  }

  navigating = true;
  lastMotionAt = 0;
  arrivedAnnounced = false;
  updateStatusUI();
}

async function requestMotionPermissionFromButton() {
  const ok = await ensureMotionPermissionIfNeeded();
  if (ok) {
    permissionBtn.hidden = true;
    alert("Izin sensor berhasil diaktifkan.");
  } else {
    alert("Izin sensor belum diberikan.");
  }
}

function setupPWA() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => {
        console.error("Registrasi service worker gagal:", error);
      });
    });
  }
}

function bindEvents() {
  startBtn.addEventListener("click", startNavigation);
  permissionBtn.addEventListener("click", requestMotionPermissionFromButton);

  upBtn.addEventListener("click", () => {
    adjustFloorManually(1);
  });

  downBtn.addEventListener("click", () => {
    adjustFloorManually(-1);
  });

  window.addEventListener("devicemotion", onMotion);
}

initFormOptions();
bindEvents();
updateStatusUI();
setupPWA();
