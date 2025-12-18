// ====================================
//  KONSTANT SISTEM
// ====================================
const RATE_PER_KG = 0.30;
const POINTS_PER_KG = 10;

const MATERIAL_RATES = {
  "Plastik": { rate: 0.30, pointsPerKg: 10 },
  "Kertas": { rate: 0.20, pointsPerKg: 8 },
  "Tin": { rate: 0.80, pointsPerKg: 15 },
  "Kaca": { rate: 0.10, pointsPerKg: 5 },
  "Elektronik": { rate: 1.50, pointsPerKg: 20 },
  "Minyak Masak Terpakai": { rate: 2.00, pointsPerKg: 25 }
};

const ADMIN_WA_NUMBER = "601111473069";

// ====================================
//  USER + REQUEST
// ====================================
class User {
  constructor(username, phone, password) {
    this.username = username;
    this.phone = phone;
    this.password = password;
  }
}

class PickupRequest {
  constructor(user, items) {
    this.user = user;
    this.items = items; // [{material, weightKg}]
  }
}

// ====================================
//  INCENTIVE
// ====================================
function calculateMultipleItems(items) {
  let totalRM = 0;
  let totalPoints = 0;

  const breakdown = items.map(i => {
    const rateInfo = MATERIAL_RATES[i.material];
    const itemRM = i.weightKg * rateInfo.rate;
    const itemPoints = i.weightKg * rateInfo.pointsPerKg;

    totalRM += itemRM;
    totalPoints += itemPoints;

    return {
      ...i,
      rate: rateInfo.rate,
      pointsPerKg: rateInfo.pointsPerKg,
      itemRM,
      itemPoints
    };
  });

  return { breakdown, totalRM, totalPoints };
}

// ====================================
//  STORAGE
// ====================================
function getUsers() {
  return JSON.parse(localStorage.getItem("eco_users") || "[]");
}
function saveUsers(users) {
  localStorage.setItem("eco_users", JSON.stringify(users));
}

function setLoggedIn(user) {
  sessionStorage.setItem("eco_logged_in", "1");
  sessionStorage.setItem("eco_user", JSON.stringify(user));
}
function isLoggedIn() {
  return sessionStorage.getItem("eco_logged_in") === "1";
}
function getUser() {
  return JSON.parse(sessionStorage.getItem("eco_user"));
}
function logout() {
  sessionStorage.clear();
}

function saveRequest(req) {
  sessionStorage.setItem("eco_request", JSON.stringify(req));
}
function getRequest() {
  return JSON.parse(sessionStorage.getItem("eco_request"));
}

// ====================================
//  LOGIN
// ====================================
function handleLogin(e) {
  e.preventDefault();

  const u = username.value.trim();
  const p = password.value.trim();
  const ph = phone.value.trim().replace(/\D/g, "");

  const user = getUsers().find(x =>
    x.username === u &&
    x.password === p &&
    x.phone.replace(/\D/g, "") === ph
  );

  if (!user) {
    alert("Login gagal. Akaun tidak dijumpai.");
    return;
  }

  setLoggedIn(user);
  location.href = "request.html";
}

// ====================================
//  SIGN UP
// ====================================
function handleSignup(e) {
  e.preventDefault();

  const u = signupUsername.value.trim();
  const p = signupPassword.value.trim();
  const ph = signupPhone.value.trim();

  const users = getUsers();
  if (users.find(x => x.username === u)) {
    alert("Username sudah digunakan.");
    return;
  }

  users.push(new User(u, ph, p));
  saveUsers(users);

  alert("Pendaftaran berjaya.");
  location.href = "index.html";
}

// ====================================
//  MAP
// ====================================
function initMapPicker() {
  if (!window.L) return;

  const map = L.map("map").setView([3.139, 101.6869], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  let marker;
  map.on("click", e => {
    if (marker) marker.remove();
    marker = L.marker(e.latlng).addTo(map);
    locationLat.value = e.latlng.lat;
    locationLng.value = e.latlng.lng;
    locationDisplay.value = `Lokasi: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
  });
}

// ====================================
//  REQUEST SUBMIT
// ====================================
function handleRequestSubmit(e) {
  e.preventDefault();

  const rows = document.querySelectorAll(".item-row");
  if (!rows.length) return alert("Tambah sekurang-kurangnya satu item.");

  const items = [];
  const used = new Set();

  for (const r of rows) {
    const m = r.querySelector(".material").value;
    const w = parseFloat(r.querySelector(".weight").value);

    if (!m || !w || w <= 0) return alert("Maklumat item tidak lengkap.");
    if (used.has(m)) return alert("Jenis barang tidak boleh sama.");

    used.add(m);
    items.push({ material: m, weightKg: w });
  }

  const req = new PickupRequest(getUser(), items);

  if (locationLat.value && locationLng.value) {
    req.location = {
      lat: parseFloat(locationLat.value),
      lng: parseFloat(locationLng.value)
    };
  }

  saveRequest(req);
  location.href = "calculate.html";
}

// ====================================
//  DISPLAY ORDER
// ====================================
function displayCalculation() {
  if (!isLoggedIn()) return;

  const req = getRequest();
  const calc = calculateMultipleItems(req.items);

  const itemsHtml = calc.breakdown.map(i => `
    <li>${i.material} – ${i.weightKg}kg → RM ${i.itemRM.toFixed(2)}</li>
  `).join("");

  const waText = encodeURIComponent(
`EcoRecycle Pickup Order
${itemsHtml.replace(/<[^>]+>/g, "")}
Jumlah: RM ${calc.totalRM.toFixed(2)}`
  );

  calcContainer.innerHTML = `
    <h2>Order Pickup</h2>
    <ul>${itemsHtml}</ul>
    <h4>Jumlah: RM ${calc.totalRM.toFixed(2)}</h4>
    <a class="btn btn-success" target="_blank"
      href="https://wa.me/${ADMIN_WA_NUMBER}?text=${waText}">
      Hantar WhatsApp
    </a>
  `;
}

// ====================================
//  INIT
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("loginForm")) {
    logout();
    loginForm.onsubmit = handleLogin;
  }

  if (document.getElementById("signupForm")) {
    signupForm.onsubmit = handleSignup;
  }

  if (document.getElementById("requestForm")) {
    if (!isLoggedIn()) return location.href = "index.html";
    initMapPicker();
    requestForm.onsubmit = handleRequestSubmit;
  }

  if (document.getElementById("calcContainer")) {
    displayCalculation();
  }
});
