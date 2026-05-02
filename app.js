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
const SENSOR_SAMPLE_COUNT = 8;
const SENSOR_TOLERANCE = { y: 1.2, z: 1.2 };

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
const startArBtn = document.getElementById("startArBtn");

// AR elements
const arRoot = document.getElementById("arRoot");
const arVideo = document.getElementById("arVideo");
const arOverlay = document.getElementById("arOverlay");
const arObjectEl = document.getElementById("arObject");
const arFloorNumber = document.getElementById("arFloorNumber");
const arDirection = document.getElementById("arDirection");
const arRoomList = document.getElementById("arRoomList");
const startWebXRBtn = document.getElementById("startWebXRBtn");

let currentFloor = null;
let targetFloor = null;
let targetRoom = "";
let navigating = false;
let lastMotionAt = 0;
let arrivedAnnounced = false;
let navigatingAR = false;

// floor coordinates for validation (calibration data)
const floorCoordinates = {
  1: { y: 7.7, z: 6.1 },
  2: { y: 3.7, z: 8.7 },
};

// sensor sampling buffers
const samplesY = [];
const samplesZ = [];

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

  // collect Y and Z samples for floor validation
  const yRaw = event.accelerationIncludingGravity?.y ?? 0;
  const zRaw = event.accelerationIncludingGravity?.z ?? 0;
  samplesY.push(yRaw);
  samplesZ.push(zRaw);
  if (samplesY.length > SENSOR_SAMPLE_COUNT) samplesY.shift();
  if (samplesZ.length > SENSOR_SAMPLE_COUNT) samplesZ.shift();

  if (samplesY.length >= SENSOR_SAMPLE_COUNT && samplesZ.length >= SENSOR_SAMPLE_COUNT) {
    tryValidateFloorFromSamples();
  }
}

function tryValidateFloorFromSamples() {
  const avgY = samplesY.reduce((s, v) => s + v, 0) / samplesY.length;
  const avgZ = samplesZ.reduce((s, v) => s + v, 0) / samplesZ.length;

  for (const k of Object.keys(floorCoordinates)) {
    const f = Number(k);
    const coord = floorCoordinates[f];
    const dy = Math.abs(avgY - coord.y);
    const dz = Math.abs(avgZ - coord.z);
    if (dy <= SENSOR_TOLERANCE.y && dz <= SENSOR_TOLERANCE.z) {
      if (currentFloor !== f) {
        currentFloor = f;
        updateStatusUI();
        renderARObject(currentFloor);
        // if WebXR active, also place XR object
        if (typeof placeXRForFloor === 'function') placeXRForFloor(currentFloor);
      }
      return;
    }
  }

  if (navigatingAR) hideARObject("Mencari posisi lantai");
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

async function startARNavigation() {
  const ok = await ensureMotionPermissionIfNeeded();
  if (!ok) {
    permissionBtn.hidden = false;
    alert("Izin sensor gerak diperlukan untuk AR.");
    return;
  }

  if (!navigating) {
    startNavigation();
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Kamera tidak didukung di perangkat ini.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    arVideo.srcObject = stream;
    await arVideo.play();
    arRoot.hidden = false;
    navigatingAR = true;
    samplesY.length = 0;
    samplesZ.length = 0;
    hideARObject("Mencari posisi lantai");
  } catch (err) {
    console.error("getUserMedia gagal:", err);
    alert("Gagal mengaktifkan kamera: " + (err && err.message));
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
  startArBtn.addEventListener("click", startARNavigation);
  if (startWebXRBtn) startWebXRBtn.addEventListener('click', startWebXR);
  permissionBtn.addEventListener("click", requestMotionPermissionFromButton);

  upBtn.addEventListener("click", () => {
    adjustFloorManually(1);
    if (navigatingAR) renderARObject(currentFloor);
  });

  downBtn.addEventListener("click", () => {
    adjustFloorManually(-1);
    if (navigatingAR) renderARObject(currentFloor);
  });

  window.addEventListener("devicemotion", onMotion);
}

initFormOptions();
bindEvents();
updateStatusUI();
setupPWA();

/* --------- AR rendering + WebXR functions (three.js) ---------- */
let xrSession = null;
let renderer = null;
let scene = null;
let camera = null;
let xrHitTestSource = null;
let xrRefSpace = null;
let xrPlacedObject = null;

async function startWebXR() {
  if (!navigator.xr) {
    alert('WebXR not supported');
    return;
  }

  const ok = await ensureMotionPermissionIfNeeded();
  if (!ok) {
    alert('Sensor permission required for AR.');
    return;
  }

  try {
    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    if (!supported) {
      alert('WebXR immersive-ar not supported on this device/browser.');
      return;
    }
  } catch (e) {
    console.warn('isSessionSupported error', e);
  }

  try {
    xrSession = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test', 'local-floor'] });
  } catch (err) {
    console.error('requestSession failed', err);
    alert('Cannot start WebXR session: ' + (err && err.message));
    return;
  }

  // setup three
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.domElement.classList.add('webxr-canvas');
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const material = new THREE.MeshStandardMaterial({ color: 0x0f766e });
  xrPlacedObject = new THREE.Mesh(geometry, material);
  xrPlacedObject.visible = false;
  scene.add(xrPlacedObject);

  const gl = renderer.getContext();
  await gl.makeXRCompatible();
  xrSession.updateRenderState({ baseLayer: new XRWebGLLayer(xrSession, gl) });
  xrRefSpace = await xrSession.requestReferenceSpace('local-floor');

  try {
    const viewerSpace = await xrSession.requestReferenceSpace('viewer');
    xrHitTestSource = await xrSession.requestHitTestSource({ space: viewerSpace });
  } catch (e) {
    console.warn('No hit-test support', e);
  }

  renderer.xr.setSession(xrSession);
  xrSession.requestAnimationFrame(onXRFrame);

  xrSession.addEventListener('end', () => {
    if (renderer && renderer.domElement) renderer.domElement.remove();
    renderer = null;
    xrSession = null;
  });
}

function onXRFrame(time, frame) {
  if (!frame) return;
  const session = frame.session;
  session.requestAnimationFrame(onXRFrame);

  const pose = frame.getViewerPose(xrRefSpace);
  if (!pose) return;

  if (xrHitTestSource) {
    const hits = frame.getHitTestResults(xrHitTestSource);
    if (hits.length > 0) {
      const hit = hits[0];
      const hitPose = hit.getPose(xrRefSpace);
      if (hitPose) {
        xrPlacedObject.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z);
        xrPlacedObject.visible = true;
      }
    }
  } else {
    // fallback: place 2m in front of camera
    const view = pose.views[0];
    const mat = new THREE.Matrix4().fromArray(view.transform.matrix);
    const pos = new THREE.Vector3().setFromMatrixPosition(mat);
    const dir = new THREE.Vector3(0, 0, -1).applyMatrix4(new THREE.Matrix4().extractRotation(mat));
    const fallbackPos = pos.clone().add(dir.multiplyScalar(2));
    xrPlacedObject.position.copy(fallbackPos);
    xrPlacedObject.visible = true;
  }

  renderer.render(scene, camera);
}

function placeXRForFloor(floor) {
  if (!xrPlacedObject) return;
  const color = floor === targetFloor ? 0x0fbf6e : 0x0f766e;
  xrPlacedObject.material.color.setHex(color);
  xrPlacedObject.visible = true;
}

function endWebXR() {
  if (xrSession) xrSession.end();
}

function hideARObject(message) {
  if (!arObjectEl) return;
  arObjectEl.hidden = true;
  arDirection.textContent = message || "-";
  arFloorNumber.textContent = "-";
  arRoomList.innerHTML = "";
}

function renderARObject(floor) {
  if (!arObjectEl) return;
  // only show overlay when AR mode (camera) active
  if (!navigatingAR) return;

  arObjectEl.hidden = false;
  arFloorNumber.textContent = String(floor);

  if (targetFloor === null) {
    arDirection.textContent = "-";
  } else if (floor === targetFloor) {
    arDirection.textContent = "SAMPAI";
  } else if (floor < targetFloor) {
    arDirection.textContent = "NAIK";
  } else {
    arDirection.textContent = "TURUN";
  }

  const rooms = roomData.filter((r) => r.floor === floor).map((r) => r.name);
  arRoomList.innerHTML = rooms.map((n) => `<li>${n}</li>`).join("");

  // if WebXR active, update 3D object appearance
  if (xrSession) placeXRForFloor(floor);
}
