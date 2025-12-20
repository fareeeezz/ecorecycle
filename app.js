// ====================================
//  KONSTANT SISTEM
// ====================================
const RATE_PER_KG = 0.30;      // fallback RM per kg
const POINTS_PER_KG = 10;      // fallback points per kg

// KADAR MENGIKUT MATERIAL
const MATERIAL_RATES = {
  "Plastik": {
    rate: 0.30,
    pointsPerKg: 10
  },
  "Kertas": {
    rate: 0.20,
    pointsPerKg: 8
  },
  "Tin": {
    rate: 0.80,
    pointsPerKg: 15
  },
  "Kaca": {
    rate: 0.10,
    pointsPerKg: 5
  },
  "Elektronik": {
    rate: 1.50,
    pointsPerKg: 20
  },
  "Minyak Masak Terpakai": {
    rate: 2.00,
    pointsPerKg: 25
  }
};

function calculateMultipleItems(items) {
  let totalRM = 0;
  let totalPoints = 0;

  const breakdown = (items || []).map(i => {
    const info = MATERIAL_RATES[i.material] || { rate: RATE_PER_KG, pointsPerKg: POINTS_PER_KG };
    const rm = i.weightKg * info.rate;
    const pts = i.weightKg * info.pointsPerKg;
    totalRM += rm;
    totalPoints += pts;
    return { ...i, rate: info.rate, pointsPerKg: info.pointsPerKg, rm, pts };
  });

  return { breakdown, totalRM, totalPoints };
}


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
    // this.location akan ditambah kemudian jika ada
  }
}

class IncentiveCalculator {
  static calculate(request) {
    const info =
      MATERIAL_RATES[request.material] || {
        rate: RATE_PER_KG,
        pointsPerKg: POINTS_PER_KG
      };

    const totalIncentive = request.weightKg * info.rate;
    const points = request.weightKg * info.pointsPerKg;

    return {
      totalIncentive,
      points,
      ratePerKg: info.rate,
      pointsPerKg: info.pointsPerKg
    };
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
//  NAVBAR AUTO HIDE/SHOW + LOGOUT
// ====================================

function handleLogout(event) {
  if (event) event.preventDefault();
  clearLoginSession();
  window.location.href = "index.html";
  return false;
}

function updateEcoNavbar() {
  const navs = document.querySelectorAll(".eco-nav");
  if (!navs || navs.length === 0) return;

  const loggedIn = isLoggedIn();

  const page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const isIndexPage  = (page === "" || page === "index.html");
  const isSignupPage = (page === "signup.html");

  navs.forEach(nav => {
    const loginLink   = nav.querySelector('a[href="index.html"]');
    const signupLink  = nav.querySelector('a[href="signup.html"]');
    const requestLink = nav.querySelector('a[href="request.html"]');
    const orderLink   = nav.querySelector('a[href="calculate.html"]');

    let logoutLink = nav.querySelector('a[data-eco="logout"]');

    if (loggedIn) {
      // ✅ Logged in: show Request + Order + Logout
      if (loginLink)  loginLink.style.display = "none";
      if (signupLink) signupLink.style.display = "none";

      if (requestLink) requestLink.style.display = "";
      if (orderLink)   orderLink.style.display = "";

      if (!logoutLink) {
        logoutLink = document.createElement("a");
        logoutLink.href = "#";
        logoutLink.textContent = "Logout";
        logoutLink.className = "eco-nav-link";
        logoutLink.setAttribute("data-eco", "logout");
        logoutLink.addEventListener("click", handleLogout);
        nav.appendChild(logoutLink);
      } else {
        logoutLink.style.display = "";
      }

    } else {
      // ✅ Not logged in: hide Request + Order, remove Logout
      if (logoutLink) logoutLink.remove();

      if (requestLink) requestLink.style.display = "none";
      if (orderLink)   orderLink.style.display = "none";

      // 🔥 Rules ikut permintaan:
      // index.html -> tinggal Sign Up sahaja
      // signup.html -> tinggal Login sahaja
      if (isIndexPage) {
        if (loginLink)  loginLink.style.display = "none";
        if (signupLink) signupLink.style.display = "";
      } else if (isSignupPage) {
        if (signupLink) signupLink.style.display = "none";
        if (loginLink)  loginLink.style.display = "";
      } else {
        if (loginLink)  loginLink.style.display = "";
        if (signupLink) signupLink.style.display = "";
      }
    }
  });
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

  // Default center: Kuala Lumpur
  const map = L.map("map").setView([3.1390, 101.6869], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  let marker = null;

  map.on("click", function(e) {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);

    if (marker) {
      marker.setLatLng(e.latlng);
    } else {
      marker = L.marker(e.latlng).addTo(map);
    }

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

  // ===============================
  // MULTIPLE ITEMS (BARU)
  // Cari semua row yang awak buat bila tekan "Tambah Jenis Barang"
  // ===============================
  const itemRows = document.querySelectorAll(".multi-item-row");
  const items = [];

  if (itemRows && itemRows.length > 0) {
    itemRows.forEach(r => {
      const m = r.querySelector(".material-item")?.value;
      const wRaw = r.querySelector(".weight-item")?.value;
      const w = parseFloat(wRaw);
      if (m && !isNaN(w) && w > 0) items.push({ material: m, weightKg: w });
    });
  }

  // ===============================
  // FALLBACK (LAMA) - kalau page masih pakai id material/weight
  // ===============================
  let material = null;
  let weight = null;

  if (items.length === 0) {
    const materialEl = document.getElementById("material");
    const weightEl   = document.getElementById("weight");

    if (!materialEl || !weightEl) {
      alert("Ralat pada borang request. Sila refresh halaman.");
      return false;
    }

    material = materialEl.value;
    weight   = parseFloat(weightEl.value);

    if (!material) {
      alert("Sila pilih jenis barangan kitar semula.");
      return false;
    }
    if (isNaN(weight) || weight <= 0) {
      alert("Sila masukkan anggaran berat yang sah (lebih daripada 0).");
      return false;
    }
  } else {
    // Validasi: maksimum 5 item
    if (items.length > 5) {
      alert("Maksimum 5 jenis barang sahaja.");
      return false;
    }

    // Validasi: tak boleh sama jenis berulang
    const set = new Set(items.map(x => x.material));
    if (set.size !== items.length) {
      alert("Sila pilih jenis barang yang lain (tidak boleh sama).");
      return false;
    }
  }

  // ===============================
  // Build request object
  // ===============================
  let request;
  if (items.length > 0) {
    request = new PickupRequest(user, null, null);
    request.items = items;
  } else {
    request = new PickupRequest(user, material, weight);
  }

  // ===============================
  // Lokasi (kekal)
  // ===============================
  const latInput   = document.getElementById("locationLat");
  const lngInput   = document.getElementById("locationLng");

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
//  PAPAR RESIT & WHATSAPP
// ====================================

function displayCalculation() {
  const container = document.getElementById("calcContainer");
  if (!container) return;

  if (!isLoggedIn()) {
    container.innerHTML =
      '<p class="text-center">Anda perlu log masuk dahulu untuk melihat order.</p>';
    return;
  }

  const reqData = getRequest();
  if (!reqData) {
    container.innerHTML =
      '<p class="text-center">Tiada data order dijumpai. Sila buat request semula.</p>';
    return;
  }

  const user = reqData.user;
  const displayName = getDisplayName(user);

  // ================================
  // Items: single vs multi
  // ================================
  let items = [];

  if (Array.isArray(reqData.items) && reqData.items.length > 0) {
    items = reqData.items;
  } else {
    items = [{
      material: reqData.material,
      weightKg: reqData.weightKg
    }];
  }

  // Lokasi
  let locationLineText = "Lokasi pickup: (tiada GPS – pengguna tidak pin lokasi)";
  let locationWaLine   = "Lokasi: (tiada GPS – pengguna tidak pin lokasi)";
  let locationHtml     = `<p><strong>Lokasi pickup:</strong> Tiada (GPS tidak ditetapkan)</p>`;
  let mapsUrl          = "";

  if (reqData.location && reqData.location.lat && reqData.location.lng) {
    const lat = reqData.location.lat;
    const lng = reqData.location.lng;
    mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    locationLineText = `Lokasi pickup (GPS): ${lat}, ${lng}`;
    locationWaLine   = `Lokasi (Google Maps): ${mapsUrl}`;
    locationHtml     = `
      <p><strong>Lokasi pickup (GPS):</strong> ${lat}, ${lng}</p>
      <p><a href="${mapsUrl}" target="_blank">Buka di Google Maps</a></p>
    `;
  }

  // ================================
  // Kiraan: per item + total
  // ================================
  let totalRM = 0;
  let totalPoints = 0;

  let itemsHtml = "";
  let receiptItemsText = "";
  let waItemsText = "";

  items.forEach((item, idx) => {
    const mat = item.material;
    const wKg = parseFloat(item.weightKg);

    const tempReq = new PickupRequest(user, mat, wKg);
    const res = IncentiveCalculator.calculate(tempReq);

    const itemRM = res.totalIncentive;
    const itemPoints = res.points;
    const ratePerKg = res.ratePerKg;
    const pointsPerKg = res.pointsPerKg;

    totalRM += itemRM;
    totalPoints += itemPoints;

    itemsHtml += `
      <tr>
        <td>${idx + 1}</td>
        <td>${mat}</td>
        <td>${wKg} kg</td>
        <td>RM ${ratePerKg.toFixed(2)} / kg</td>
        <td>RM ${itemRM.toFixed(2)}</td>
        <td>${itemPoints.toFixed(0)}</td>
      </tr>
    `;

    receiptItemsText += `Item ${idx + 1}: ${mat} | ${wKg} kg | RM ${ratePerKg.toFixed(2)} / kg | RM ${itemRM.toFixed(2)} | ${itemPoints.toFixed(0)} mata\n`;
    waItemsText += `Item ${idx + 1}: ${mat}, ${wKg}kg, RM${itemRM.toFixed(2)}, ${itemPoints.toFixed(0)} mata\n`;
  });

  const totalRMText = totalRM.toFixed(2);
  const totalPointsText = totalPoints.toFixed(0);

  // ================================
  // Receipt text (copy/simpan)
  // ================================
  const receiptText = `
ORDER PICKUP ECORCYCLE

Username      : ${displayName}
Telefon       : ${user.phone || "-"}

SENARAI BARANGAN:
${receiptItemsText}
JUMLAH INSENTIF : RM ${totalRMText}
JUMLAH MATA     : ${totalPointsText}
${locationLineText}

Terima kasih kerana menyokong kitar semula.
  `.trim();

  // ================================
  // WhatsApp message
  // ================================
  const waMessage = `
EcoRecycle Pickup Order

Username: ${displayName}
Telefon: ${user.phone || "-"}

Senarai barangan:
${waItemsText}
Jumlah insentif: RM ${totalRMText}
Jumlah mata: ${totalPointsText}
${locationWaLine}
  `.trim();

  const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  // ================================
  // UI HTML (kekal semua feature)
  // ================================
  container.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-md-10">
        <h2 class="mb-4 text-center">Maklumat Order & Rider</h2>

        <div class="card shadow-sm mb-4" id="receiptCard">
          <div class="card-body">
            <h5 class="card-title">Order Pickup</h5>

            <p><strong>Username:</strong> ${displayName}</p>
            <p><strong>Telefon:</strong> ${user.phone || "-"}</p>

            ${locationHtml}

            <hr>

            <h6 class="mb-2"><strong>Senarai Barangan</strong></h6>

            <div class="table-responsive">
              <table class="table table-bordered align-middle">
                <thead>
                  <tr>
                    <th style="width:60px;">#</th>
                    <th>Jenis Barang</th>
                    <th style="width:120px;">Berat</th>
                    <th style="width:160px;">Kadar</th>
                    <th style="width:140px;">Harga</th>
                    <th style="width:120px;">Mata</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <hr>

            <p class="fs-5"><strong>Jumlah Insentif:</strong> RM ${totalRMText}</p>
            <p class="fs-5"><strong>Jumlah Mata Ganjaran:</strong> ${totalPointsText} points</p>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Teks Order (copy / simpan)</label>
          <textarea class="form-control" rows="10" readonly>${receiptText}</textarea>
        </div>

        <h4 class="mb-3">Mesej WhatsApp ke Owner</h4>
        <div class="mb-3">
          <label class="form-label">Preview mesej WhatsApp</label>
          <textarea class="form-control" rows="10" readonly>${waMessage}</textarea>
        </div>

        <p class="text-muted">
          Bila tekan butang di bawah, WhatsApp akan terbuka dengan mesej di atas.
          Collector boleh terus tekan link Google Maps jika lokasi dipin pada peta.
        </p>

        <a href="${waUrl}" target="_blank" class="btn btn-success w-100 mb-3">
          Buka WhatsApp &amp; Isi Maklumat Tambahan
        </a>

        <h4 class="mb-2">Kedudukan Rider (Simulasi)</h4>
        <p id="riderInfo" class="small text-muted mb-2">
          Memuatkan peta rider...
        </p>
        <div id="riderMap" class="mb-4"></div>

        <button class="btn btn-outline-secondary w-100 mb-2" onclick="downloadReceiptPdf()">
          Muat Turun Order (PDF)
        </button>

        <a href="request.html" class="btn btn-outline-success w-100 mt-2">
          Buat Order / Request Baru
        </a>
      </div>
    </div>
  `;

  // 🚚 lepas HTML dah render, baru init peta rider
  const reqForRider = { location: reqData.location || null };
  initRiderMap(reqForRider);
}

function initRiderMap(request) {
  const mapDiv = document.getElementById("riderMap");
  const infoP  = document.getElementById("riderInfo");
  if (!mapDiv) return;

  // Kalau Leaflet tak wujud
  if (typeof L === "undefined") {
    if (infoP) infoP.textContent = "Ralat: peta rider tidak dapat dimuatkan.";
    return;
  }

  // Kalau user tak pin lokasi masa Request
  if (!request.location || !request.location.lat || !request.location.lng) {
    if (infoP) {
      infoP.textContent =
        "Lokasi pelanggan tiada (GPS tidak dipin di halaman Request). Peta rider tidak dapat dipaparkan.";
    }
    return;
  }

  const custLat = request.location.lat;
  const custLng = request.location.lng;

  // Set view pada lokasi pelanggan
  const map = L.map("riderMap").setView([custLat, custLng], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // Marker pelanggan
  const customerMarker = L.marker([custLat, custLng]).addTo(map)
    .bindPopup("Lokasi Pelanggan").openPopup();

  // Rider mula +/- 1km dari pelanggan (simulasi)
  const riderStart = [custLat + 0.01, custLng - 0.01];
  const riderMarker = L.marker(riderStart).addTo(map)
    .bindPopup("Rider EcoRecycle");

  // Animasi rider bergerak ke pelanggan
  let step = 0;
  const totalSteps = 40;      // lagi besar, lagi perlahan
  const intervalMs = 500;     // 0.5s setiap langkah

  if (infoP) {
    infoP.textContent =
      "Rider EcoRecycle sedang bergerak dari pusat pengumpulan ke lokasi anda. (Simulasi pergerakan pada peta)";
  }

  const interval = setInterval(() => {
    step++;
    const t = step / totalSteps;  // 0 → 1
    const lat = riderStart[0] + (custLat - riderStart[0]) * t;
    const lng = riderStart[1] + (custLng - riderStart[1]) * t;
    riderMarker.setLatLng([lat, lng]);

    if (step >= totalSteps) {
      clearInterval(interval);
      riderMarker.bindPopup("Rider telah tiba!").openPopup();
      if (infoP) {
        infoP.textContent = "Rider EcoRecycle telah tiba di lokasi anda. (Simulasi)";
      }
    }
  }, intervalMs);
}



// ====================================
//  DOWNLOAD PDF RESIT (A4)
// ====================================

function downloadReceiptPdf() {
  const reqData = getRequest();
  if (!reqData) {
    alert("Tiada data resit untuk dimuat turun.");
    return;
  }

  const user = reqData.user;
  const displayName = getDisplayName(user);

  let items = [];
  if (Array.isArray(reqData.items) && reqData.items.length > 0) {
    items = reqData.items;
  } else {
    items = [{
      material: reqData.material,
      weightKg: reqData.weightKg
    }];
  }

  let locationPdfLine = "Lokasi: (tiada GPS)";
  if (reqData.location && reqData.location.lat && reqData.location.lng) {
    locationPdfLine = `Lokasi (GPS): ${reqData.location.lat}, ${reqData.location.lng}`;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF library (jsPDF) tidak dimuatkan. Pastikan script jsPDF ada dalam calculate.html.");
    return;
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Resit Pickup EcoRecycle", pageWidth / 2, y, { align: "center" });

  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const tarikh = new Date().toLocaleDateString("ms-MY");
  doc.text(`Tarikh: ${tarikh}`, margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Maklumat Pengguna", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.text(`Username   : ${displayName}`, margin, y); y += 6;
  doc.text(`Telefon    : ${user.phone || "-"}`, margin, y); y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Maklumat Pickup", margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.text(locationPdfLine, margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Senarai Barangan", margin, y);
  y += 7;

  let totalRM = 0;
  let totalPoints = 0;

  items.forEach((item, idx) => {
    const mat = item.material;
    const wKg = parseFloat(item.weightKg);

    const tempReq = new PickupRequest(user, mat, wKg);
    const res = IncentiveCalculator.calculate(tempReq);

    const itemRM = res.totalIncentive;
    const itemPoints = res.points;
    const ratePerKg = res.ratePerKg;

    totalRM += itemRM;
    totalPoints += itemPoints;

    const line = `${idx + 1}. ${mat} | ${wKg} kg | RM ${ratePerKg.toFixed(2)}/kg | RM ${itemRM.toFixed(2)} | ${itemPoints.toFixed(0)} mata`;

    // page break kalau hampir habis
    if (y > pageHeight - 30) {
      doc.addPage();
      y = margin;
    }

    doc.text(line, margin, y);
    y += 6;
  });

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`Jumlah Insentif : RM ${totalRM.toFixed(2)}`, margin, y); y += 7;
  doc.text(`Jumlah Mata     : ${totalPoints.toFixed(0)} points`, margin, y); y += 10;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text(
    "Terima kasih kerana menyokong aktiviti kitar semula bersama EcoRecycle.",
    margin,
    y
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Resit ini dijana secara automatik oleh sistem EcoRecycle.",
    margin,
    pageHeight - 15
  );

  doc.save("Resit_EcoRecycle.pdf");
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

  // setiap kali buka login → anggap logout
  if (isLoginPage) {
    clearLoginSession();
  }

  // ✅ NAVBAR RULES
  updateEcoNavbar();

  const loggedIn = isLoggedIn();
  const user = getUser();

  // guard: kalau di Request atau Resit tapi tak log in
  if (!loggedIn && (isRequestPage || isResitPage)) {
    alert("Anda perlu log masuk dahulu.");
    window.location.href = "index.html";
    return;
  }

  // SIGN UP PAGE
  if (isSignupPage && signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }

  // LOGIN PAGE
  if (isLoginPage && loginForm && !loginForm.hasAttribute("onsubmit")) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // REQUEST PAGE
  if (isRequestPage && requestForm) {
    const welcomeText = document.getElementById("welcomeText");
    if (welcomeText && user) {
      const displayName = getDisplayName(user);
      welcomeText.textContent = `Hai, ${displayName}. Sila isi maklumat pickup.`;
    }
    initMapPicker();
    requestForm.addEventListener("submit", handleRequestSubmit);
  }

  // RESIT PAGE
  if (isResitPage && calcContainer) {
    displayCalculation();
  }
});
