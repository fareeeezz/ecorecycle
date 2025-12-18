// ====================================
//  KONSTANT SISTEM
// ====================================
const RATE_PER_KG = 0.30;      // fallback RM per kg
const POINTS_PER_KG = 10;      // fallback points per kg

// KADAR MENGIKUT MATERIAL
const MATERIAL_RATES = {
  "Plastik": { rate: 0.30, pointsPerKg: 10 },
  "Kertas": { rate: 0.20, pointsPerKg: 8 },
  "Tin": { rate: 0.80, pointsPerKg: 15 },
  "Kaca": { rate: 0.10, pointsPerKg: 5 },
  "Elektronik": { rate: 1.50, pointsPerKg: 20 },
  "Minyak Masak Terpakai": { rate: 2.00, pointsPerKg: 25 }
};

// Nombor WhatsApp owner EcoRecycle (60 + nombor, tanpa + dan tanpa 0 depan)
const ADMIN_WA_NUMBER = "601111473069"; // tukar kalau perlu


// ====================================
//  KELAS OOP
// ====================================

class User {
  constructor(username, phone, password) {
    this.username = username;
    this.phone = phone;
    this.password = password; // untuk demo sahaja
  }
}

class PickupRequest {
  constructor(user, material, weightKg) {
    this.user = user;
    this.material = material;
    this.weightKg = weightKg;
  }
}

class IncentiveCalculator {
  static calculate(request) {
    const info = MATERIAL_RATES[request.material] || { rate: RATE_PER_KG, pointsPerKg: POINTS_PER_KG };
    const totalIncentive = request.weightKg * info.rate;
    const points = request.weightKg * info.pointsPerKg;
    return { totalIncentive, points, ratePerKg: info.rate, pointsPerKg: info.pointsPerKg };
  }
}


// ====================================
//  REGISTERED USERS (localStorage)
// ====================================

function getRegisteredUsers() {
  try {
    const data = localStorage.getItem("eco_users");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveRegisteredUsers(users) {
  localStorage.setItem("eco_users", JSON.stringify(users));
}

function addRegisteredUser(user) {
  const users = getRegisteredUsers();
  users.push(user);
  saveRegisteredUsers(users);
}

function findUserByCredentials(username, phone, password) {
  const users = getRegisteredUsers();
  const unameNorm = (username || "").trim().toLowerCase();
  const phoneNorm = (phone || "").replace(/\D/g, "");
  return (
    users.find(u =>
      (u.username || "").trim().toLowerCase() === unameNorm &&
      (u.phone || "").replace(/\D/g, "") === phoneNorm &&
      u.password === password
    ) || null
  );
}


// ====================================
//  SESSION LOGIN (sessionStorage)
// ====================================

function setLoggedIn(user) {
  sessionStorage.setItem("eco_logged_in", "1");
  sessionStorage.setItem("eco_user", JSON.stringify(user));
}

function isLoggedIn() {
  return sessionStorage.getItem("eco_logged_in") === "1";
}

function getUser() {
  const data = sessionStorage.getItem("eco_user");
  return data ? JSON.parse(data) : null;
}

function clearLoginSession() {
  sessionStorage.removeItem("eco_logged_in");
  sessionStorage.removeItem("eco_user");
  sessionStorage.removeItem("eco_request");
}

// REQUEST INFO (session)
function saveRequest(request) {
  sessionStorage.setItem("eco_request", JSON.stringify(request));
}

function getRequest() {
  const data = sessionStorage.getItem("eco_request");
  return data ? JSON.parse(data) : null;
}

function clearRequest() {
  sessionStorage.removeItem("eco_request");
}

// Nama paparan
function getDisplayName(user) {
  if (!user) return "pengguna";
  return user.username || user.name || user.email || "pengguna";
}


// ====================================
//  HANDLER: SIGN UP
// ====================================

function handleSignup(event) {
  event.preventDefault();
  const usernameInput = document.getElementById("signupUsername");
  const phoneInput    = document.getElementById("signupPhone");
  const passwordInput = document.getElementById("signupPassword");
  if (!usernameInput || !phoneInput || !passwordInput) {
    alert("Ralat: ID input sign up tak jumpa. Semak signup.html.");
    return false;
  }
  const username = usernameInput.value.trim();
  const phone    = phoneInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !phone || !password) {
    alert("Sila isi semua ruangan (username, nombor telefon, kata laluan).");
    return false;
  }
  const unameNorm = username.toLowerCase();
  const phoneNorm = phone.replace(/\D/g, "");
  const users = getRegisteredUsers();
  const duplicate = users.find(u =>
    (u.username || "").trim().toLowerCase() === unameNorm ||
    (u.phone || "").replace(/\D/g, "") === phoneNorm
  );
  if (duplicate) {
    alert("Username atau nombor telefon sudah digunakan. Sila pilih yang lain.");
    return false;
  }
  const newUser = { username, phone, password };
  addRegisteredUser(newUser);
  alert("Pendaftaran berjaya! Sila log masuk menggunakan akaun yang baru.");
  window.location.href = "index.html";
  return false;
}


// ====================================
//  HANDLER: LOGIN
// ====================================

function handleLogin(event) {
  if (event) event.preventDefault();
  const usernameInput = document.getElementById("username");
  const phoneInput    = document.getElementById("phone");
  const passwordInput = document.getElementById("password");
  if (!usernameInput || !phoneInput || !passwordInput) {
    alert("Ralat: ID input login tak jumpa. Semak index.html.");
    return false;
  }
  const username = usernameInput.value.trim();
  const phone    = phoneInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !phone || !password) {
    alert("Sila isi Username, Nombor Telefon dan Kata Laluan.");
    return false;
  }
  const user = findUserByCredentials(username, phone, password);
  if (!user) {
    alert("Akaun tidak dijumpai atau kata laluan salah.\nSila pastikan anda sudah Sign Up.");
    return false;
  }
  setLoggedIn(user);
  window.location.href = "request.html";
  return false;
}


// ====================================
//  MAP PICKER (Leaflet) – PIN LOKASI
// ====================================

function initMapPicker() {
  const mapDiv    = document.getElementById("map");
  const display   = document.getElementById("locationDisplay");
  const latInput  = document.getElementById("locationLat");
  const lngInput  = document.getElementById("locationLng");
  if (!mapDiv || !display || !latInput || !lngInput) return;
  if (typeof L === "undefined") {
    display.value = "Ralat: peta tidak dapat dimuatkan.";
    return;
  }
  const map = L.map("map").setView([3.1390, 101.6869], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);
  let marker = null;
  map.on("click", function(e) {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);
    if (marker) marker.setLatLng(e.latlng);
    else marker = L.marker(e.latlng).addTo(map);
    latInput.value = lat;
    lngInput.value = lng;
    display.value = `Lokasi dipilih: ${lat}, ${lng}`;
  });
}


// ====================================
//  HANDLER: REQUEST PICKUP
// ====================================

function handleRequestSubmit(event) {
  if (event) event.preventDefault();
  if (!isLoggedIn()) {
    alert("Anda perlu log masuk dahulu.");
    window.location.href = "index.html";
    return false;
  }
  const user = getUser();
  if (!user) {
    alert("Sesi tamat atau belum log masuk. Sila log masuk semula.");
    window.location.href = "index.html";
    return false;
  }
  const materialEl = document.getElementById("material");
  const weightEl   = document.getElementById("weight");
  const latInput   = document.getElementById("locationLat");
  const lngInput   = document.getElementById("locationLng");
  if (!materialEl || !weightEl) {
    alert("Ralat pada borang request. Sila refresh halaman.");
    return false;
  }
  const material = materialEl.value;
  const weight   = parseFloat(weightEl.value);
  if (!material) {
    alert("Sila pilih jenis barangan kitar semula.");
    return false;
  }
  if (isNaN(weight) || weight <= 0) {
    alert("Sila masukkan anggaran berat yang sah (lebih daripada 0).");
    return false;
  }
  const request = new PickupRequest(user, material, weight);
  let location = null;
  if (latInput && lngInput && latInput.value && lngInput.value) {
    location = { lat: parseFloat(latInput.value), lng: parseFloat(lngInput.value) };
  }
  if (location) request.location = location;
  saveRequest(request);
  window.location.href = "calculate.html";
  return false;
}


// ====================================
//  PAPAR RESIT & WHATSAPP (FULL, TANPA PADAM)
//  TAMBAHAN: LIST SEMUA ITEM + JUMLAH
// ====================================

function displayCalculation() {
  const container = document.getElementById("calcContainer");
  if (!container) return;

  if (!isLoggedIn()) {
    container.innerHTML = '<p class="text-center">Anda perlu log masuk dahulu untuk melihat order.</p>';
    return;
  }

  const reqData = getRequest();
  if (!reqData) {
    container.innerHTML = '<p class="text-center">Tiada data order dijumpai. Sila buat request semula.</p>';
    return;
  }

  const user = reqData.user;
  const displayName = getDisplayName(user);

  // ===== TAMBAHAN (TANPA BUANG LAMA): multi / single =====
  let items = [];
  if (Array.isArray(reqData.items)) items = reqData.items;
  else items = [{ material: reqData.material, weightKg: reqData.weightKg }];

  let totalRM = 0;
  let totalPoints = 0;
  let receiptItemsText = "";

  items.forEach((item, index) => {
    const tmpReq = new PickupRequest(user, item.material, item.weightKg);
    const tmpRes = IncentiveCalculator.calculate(tmpReq);
    totalRM += tmpRes.totalIncentive;
    totalPoints += tmpRes.points;
    receiptItemsText +=
`ITEM ${index + 1}
Jenis  : ${item.material}
Berat  : ${item.weightKg} kg
Harga  : RM ${tmpRes.totalIncentive.toFixed(2)}

`;
  });

  // ===== LOKASI ASAL (KEKAL) =====
  let locationHtml = `<p><strong>Lokasi pickup:</strong> Tiada (GPS tidak ditetapkan)</p>`;
  if (reqData.location && reqData.location.lat && reqData.location.lng) {
    const lat = reqData.location.lat;
    const lng = reqData.location.lng;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    locationHtml = `
      <p><strong>Lokasi pickup (GPS):</strong> ${lat}, ${lng}</p>
      <p><a href="${mapsUrl}" target="_blank">Buka di Google Maps</a></p>
    `;
  }

  // ===== PAPAR (KEKAL STRUKTUR) =====
  container.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-md-8">
        <h2 class="mb-4 text-center">Maklumat Order & Rider</h2>
        <div class="card shadow-sm mb-4" id="receiptCard">
          <div class="card-body">
            <h5 class="card-title">Order Pickup</h5>
            <p><strong>Username:</strong> ${displayName}</p>
            <p><strong>Telefon:</strong> ${user.phone || "-"}</p>
            ${locationHtml}
            <hr>
            <pre style="white-space:pre-wrap">${receiptItemsText}</pre>
            <hr>
            <p class="fs-5"><strong>Jumlah Insentif:</strong> RM ${totalRM.toFixed(2)}</p>
            <p class="fs-5"><strong>Mata Ganjaran:</strong> ${totalPoints} points</p>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Teks Order (copy / simpan)</label>
          <textarea class="form-control" rows="12" readonly>
ORDER PICKUP ECORCYCLE

Username : ${displayName}
Telefon  : ${user.phone || "-"}

${receiptItemsText}
JUMLAH INSENTIF : RM ${totalRM.toFixed(2)}
JUMLAH MATA     : ${totalPoints}
          </textarea>
        </div>
        <a href="request.html" class="btn btn-outline-success w-100 mt-2">Buat Order / Request Baru</a>
      </div>
    </div>
  `;
}


// ====================================
//  INIT – GUARD LOGIN + ATTACH EVENT
// ====================================

document.addEventListener("DOMContentLoaded", function () {
  const loginForm     = document.getElementById("loginForm");
  const signupForm    = document.getElementById("signupForm");
  const requestForm   = document.getElementById("requestForm");
  const calcContainer = document.getElementById("calcContainer");

  const isLoginPage   = !!loginForm;
  const isSignupPage  = !!signupForm;
  const isRequestPage = !!requestForm;
  const isResitPage   = !!calcContainer;

  if (isLoginPage) clearLoginSession();

  const loggedIn = isLoggedIn();
  const user = getUser();

  if (!loggedIn && (isRequestPage || isResitPage)) {
    alert("Anda perlu log masuk dahulu.");
    window.location.href = "index.html";
    return;
  }

  if (isSignupPage && signupForm) signupForm.addEventListener("submit", handleSignup);
  if (isLoginPage && loginForm && !loginForm.hasAttribute("onsubmit")) loginForm.addEventListener("submit", handleLogin);

  if (isRequestPage && requestForm) {
    const welcomeText = document.getElementById("welcomeText");
    if (welcomeText && user) welcomeText.textContent = `Hai, ${getDisplayName(user)}. Sila isi maklumat pickup.`;
    initMapPicker();
    requestForm.addEventListener("submit", handleRequestSubmit);
  }

  if (isResitPage && calcContainer) displayCalculation();
});
