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
  // ✅ alias kalau ada yang guna value "Tin / Aluminium"
  "Tin / Aluminium": {
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
//  MULTI ITEM HELPERS
// ====================================

function _normMaterialKey(m) {
  return (m || "").trim().toLowerCase();
}

function _collectAllMaterialSelects() {
  const selects = [];
  const main = document.getElementById("material");
  if (main) selects.push(main);

  const multiContainer = document.getElementById("multiItemContainer");
  if (multiContainer) {
    const extras = multiContainer.querySelectorAll(".material-item");
    extras.forEach(s => selects.push(s));
  }

  return selects;
}

function _hasDuplicateMaterial() {
  const selects = _collectAllMaterialSelects();
  const seen = new Set();

  for (const sel of selects) {
    if (!sel) continue;
    const v = (sel.value || "").trim();
    if (!v) continue;

    const key = _normMaterialKey(v);
    if (seen.has(key)) {
      return true;
    }
    seen.add(key);
  }

  return false;
}

function _setupNoDuplicateMaterialOnChange() {
  const main = document.getElementById("material");
  const multiContainer = document.getElementById("multiItemContainer");

  if (!main && !multiContainer) return;

  function onAnyMaterialChanged(e) {
    const target = e && e.target ? e.target : null;
    if (!target) return;

    const isMain = (main && target === main);
    const isExtra = (target.classList && target.classList.contains("material-item"));

    if (!isMain && !isExtra) return;

    if (_hasDuplicateMaterial()) {
      target.value = "";
      alert("Sila pilih jenis barang yang lain.");
    }
  }

  if (main) {
    main.addEventListener("change", onAnyMaterialChanged);
  }

  if (multiContainer) {
    multiContainer.addEventListener("change", onAnyMaterialChanged);
  }
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

  // ====================================
  //  MULTI ITEM COLLECT + VALIDATION (FIXED)
  //  ✅ FIX: scan EXTRA hanya dalam #multiItemContainer
  // ====================================

  const items = [];
  const seen = new Set();

  // item utama (wajib)
  items.push({ material: material, weightKg: weight });
  seen.add(_normMaterialKey(material));

  // item tambahan (optional) - scoped
  const multiContainer = document.getElementById("multiItemContainer");
  const extraMaterialEls = multiContainer ? multiContainer.querySelectorAll(".material-item") : [];
  const extraWeightEls   = multiContainer ? multiContainer.querySelectorAll(".weight-item") : [];

  for (let i = 0; i < extraMaterialEls.length; i++) {
    const mEl = extraMaterialEls[i];
    const wEl = extraWeightEls[i];

    const mVal = mEl ? (mEl.value || "").trim() : "";
    const wRaw = wEl ? (wEl.value || "").trim() : "";

    // kalau row kosong (dua-dua kosong) → skip
    if (!mVal && !wRaw) continue;

    const wVal = parseFloat(wRaw);

    if (!mVal) {
      alert("Sila pilih jenis barang yang sah untuk item tambahan.");
      return false;
    }
    if (isNaN(wVal) || wVal <= 0) {
      alert("Sila masukkan berat yang sah untuk item tambahan (lebih daripada 0).");
      return false;
    }

    const key = _normMaterialKey(mVal);
    if (seen.has(key)) {
      alert("Sila pilih jenis barang yang lain.");
      return false;
    }
    seen.add(key);

    items.push({ material: mVal, weightKg: wVal });
  }

  // max 6 item total
  if (items.length > 6) {
    alert("Maksimum 6 jenis barang dalam satu order.");
    return false;
  }

  const request = new PickupRequest(user, material, weight);

  // simpan list item dalam request
  request.items = items;

  // baca lokasi dari pin map jika ada
  let location = null;
  if (latInput && lngInput && latInput.value && lngInput.value) {
    location = {
      lat: parseFloat(latInput.value),
      lng: parseFloat(lngInput.value)
    };
  }
  if (location) {
    request.location = location;
  }

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

  // request object untuk rider map (kekal guna location)
  const request = new PickupRequest(
    user,
    reqData.material,
    reqData.weightKg
  );
  request.location = reqData.location || null;

  // MULTI ITEM: ambil items
  let items = [];

  if (Array.isArray(reqData.items) && reqData.items.length > 0) {
    items = reqData.items.map(it => ({
      material: (it.material || "").trim(),
      weightKg: parseFloat(it.weightKg)
    })).filter(it => it.material && !isNaN(it.weightKg) && it.weightKg > 0);
  } else {
    items = [{
      material: reqData.material,
      weightKg: parseFloat(reqData.weightKg)
    }];
  }

  // kira per item + total
  let totalIncentiveAll = 0;
  let totalPointsAll = 0;

  let itemsTableRowsHtml = "";
  let receiptItemsBlockText = "";
  let waItemsBlockText = "";

  items.forEach((item, index) => {
    const tempReq = new PickupRequest(user, item.material, item.weightKg);
    const res = IncentiveCalculator.calculate(tempReq);

    const ratePerKg = res.ratePerKg;
    const pointsPerKg = res.pointsPerKg;
    const itemRM = res.totalIncentive;
    const itemPoints = res.points;

    totalIncentiveAll += itemRM;
    totalPointsAll += itemPoints;

    itemsTableRowsHtml += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.material}</td>
        <td>${item.weightKg} kg</td>
        <td>RM ${ratePerKg.toFixed(2)} / kg</td>
        <td>RM ${itemRM.toFixed(2)}</td>
        <td>${itemPoints.toFixed(0)}</td>
      </tr>
    `;

    receiptItemsBlockText +=
`Item ${index + 1}
Jenis        : ${item.material}
Berat        : ${item.weightKg} kg
Kadar        : RM ${ratePerKg.toFixed(2)} / kg, ${pointsPerKg.toFixed(0)} mata / kg
Insentif     : RM ${itemRM.toFixed(2)}
Mata Ganjaran: ${itemPoints.toFixed(0)}
`;

    waItemsBlockText +=
`Item ${index + 1}: ${item.material} | ${item.weightKg} kg | RM ${itemRM.toFixed(2)} | ${itemPoints.toFixed(0)} mata
`;
  });

  const totalRMText = totalIncentiveAll.toFixed(2);
  const totalPointsText = totalPointsAll.toFixed(0);

  // Lokasi
  let locationLineText = "Lokasi pickup: (tiada GPS – pengguna tidak pin lokasi)";
  let locationWaLine   = "Lokasi: (tiada GPS – pengguna tidak pin lokasi)";
  let locationHtml     = `<p><strong>Lokasi pickup:</strong> Tiada (GPS tidak ditetapkan)</p>`;
  let mapsUrl          = "";

  if (request.location && request.location.lat && request.location.lng) {
    const lat = request.location.lat;
    const lng = request.location.lng;
    mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    locationLineText = `Lokasi pickup (GPS): ${lat}, ${lng}`;
    locationWaLine   = `Lokasi (Google Maps): ${mapsUrl}`;
    locationHtml     = `
      <p><strong>Lokasi pickup (GPS):</strong> ${lat}, ${lng}</p>
      <p><a href="${mapsUrl}" target="_blank">Buka di Google Maps</a></p>
    `;
  }

  const receiptText = `
ORDER PICKUP ECORCYCLE

Username      : ${displayName}
Telefon       : ${user.phone || "-"}
Jumlah Item   : ${items.length}

${receiptItemsBlockText}
JUMLAH INSENTIF : RM ${totalRMText}
JUMLAH MATA     : ${totalPointsText}
${locationLineText}

Terima kasih kerana menyokong kitar semula.
  `.trim();

  const waMessage = `
EcoRecycle Pickup Order

Username: ${displayName}
Telefon: ${user.phone || "-"}
Jumlah item: ${items.length}

${waItemsBlockText}
Jumlah insentif: RM ${totalRMText}
Jumlah mata: ${totalPointsText}
${locationWaLine}
  `.trim();

  const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  container.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-md-8">
        <h2 class="mb-4 text-center">Maklumat Order & Rider</h2>

        <div class="card shadow-sm mb-4" id="receiptCard">
          <div class="card-body">
            <h5 class="card-title">Order Pickup</h5>
            <p><strong>Username:</strong> ${displayName}</p>
            <p><strong>Telefon:</strong> ${user.phone || "-"}</p>

            <p class="mb-2"><strong>Jumlah item:</strong> ${items.length}</p>

            <div class="table-responsive">
              <table class="table table-bordered mt-2">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Jenis Barang</th>
                    <th>Berat</th>
                    <th>Kadar</th>
                    <th>Insentif (RM)</th>
                    <th>Mata</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsTableRowsHtml}
                </tbody>
              </table>
            </div>

            ${locationHtml}

            <hr>
            <p class="fs-5"><strong>Insentif (Total):</strong> RM ${totalRMText}</p>
            <p class="fs-5"><strong>Mata Ganjaran (Total):</strong> ${totalPointsText} points</p>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Teks Order (copy / simpan)</label>
          <textarea class="form-control" rows="12" readonly>${receiptText}</textarea>
        </div>

        <h4 class="mb-3">Mesej WhatsApp ke Owner</h4>
        <div class="mb-3">
          <label class="form-label">Preview mesej WhatsApp</label>
          <textarea class="form-control" rows="12" readonly>${waMessage}</textarea>
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

  initRiderMap(request);
}

function initRiderMap(request) {
  const mapDiv = document.getElementById("riderMap");
  const infoP  = document.getElementById("riderInfo");
  if (!mapDiv) return;

  if (typeof L === "undefined") {
    if (infoP) infoP.textContent = "Ralat: peta rider tidak dapat dimuatkan.";
    return;
  }

  if (!request.location || !request.location.lat || !request.location.lng) {
    if (infoP) {
      infoP.textContent =
        "Lokasi pelanggan tiada (GPS tidak dipin di halaman Request). Peta rider tidak dapat dipaparkan.";
    }
    return;
  }

  const custLat = request.location.lat;
  const custLng = request.location.lng;

  const map = L.map("riderMap").setView([custLat, custLng], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  const customerMarker = L.marker([custLat, custLng]).addTo(map)
    .bindPopup("Lokasi Pelanggan").openPopup();

  const riderStart = [custLat + 0.01, custLng - 0.01];
  const riderMarker = L.marker(riderStart).addTo(map)
    .bindPopup("Rider EcoRecycle");

  let step = 0;
  const totalSteps = 40;
  const intervalMs = 500;

  if (infoP) {
    infoP.textContent =
      "Rider EcoRecycle sedang bergerak dari pusat pengumpulan ke lokasi anda. (Simulasi pergerakan pada peta)";
  }

  const interval = setInterval(() => {
    step++;
    const t = step / totalSteps;
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
    items = reqData.items.map(it => ({
      material: (it.material || "").trim(),
      weightKg: parseFloat(it.weightKg)
    })).filter(it => it.material && !isNaN(it.weightKg) && it.weightKg > 0);
  } else {
    items = [{
      material: reqData.material,
      weightKg: parseFloat(reqData.weightKg)
    }];
  }

  const request = new PickupRequest(user, reqData.material, reqData.weightKg);
  request.location = reqData.location || null;

  let locationPdfLine = "Lokasi: (tiada GPS)";
  if (request.location && request.location.lat && request.location.lng) {
    locationPdfLine = `Lokasi (GPS): ${request.location.lat}, ${request.location.lng}`;
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

  const baseBoxHeight = 115;
  const extraPerItem = 10;
  const boxHeight = baseBoxHeight + Math.max(0, items.length - 1) * extraPerItem;

  const boxTop = y;
  const boxWidth = pageWidth - 2 * margin;

  doc.roundedRect(margin, boxTop, boxWidth, boxHeight, 3, 3);

  let textY = boxTop + 12;
  const textX = margin + 7;

  doc.setFont("helvetica", "bold");
  doc.text("Maklumat Pengguna", textX, textY);
  textY += 8;

  doc.setFont("helvetica", "normal");
  doc.text(`Username   : ${displayName}`, textX, textY);      textY += 7;
  doc.text(`Telefon    : ${user.phone || "-"}`, textX, textY); textY += 7;

  textY += 3;
  doc.setFont("helvetica", "bold");
  doc.text("Maklumat Pickup", textX, textY);
  textY += 8;

  doc.setFont("helvetica", "normal");
  doc.text(`Jumlah item : ${items.length}`, textX, textY); textY += 7;
  doc.text(locationPdfLine, textX, textY); textY += 7;

  textY += 2;
  doc.setFont("helvetica", "bold");
  doc.text("Senarai Barangan", textX, textY);
  textY += 8;

  doc.setFont("helvetica", "normal");

  let totalRMAll = 0;
  let totalPointsAll = 0;

  items.forEach((item, idx) => {
    const tempReq = new PickupRequest(user, item.material, item.weightKg);
    const res = IncentiveCalculator.calculate(tempReq);

    totalRMAll += res.totalIncentive;
    totalPointsAll += res.points;

    const line = `Item ${idx + 1}: ${item.material} | ${item.weightKg} kg | RM ${res.totalIncentive.toFixed(2)} | ${res.points.toFixed(0)} mata`;
    doc.text(line, textX, textY);
    textY += 7;
  });

  textY += 3;
  doc.setFont("helvetica", "bold");
  doc.text("Jumlah", textX, textY);
  textY += 8;

  doc.setFont("helvetica", "normal");
  doc.text(`Jumlah insentif  : RM ${totalRMAll.toFixed(2)}`, textX, textY); textY += 7;
  doc.text(`Jumlah mata      : ${totalPointsAll.toFixed(0)} points`, textX, textY);

  y = boxTop + boxHeight + 15;
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

    // ✅ elak pilih jenis barang sama (real-time)
    _setupNoDuplicateMaterialOnChange();

    requestForm.addEventListener("submit", handleRequestSubmit);
  }

  // RESIT PAGE
  if (isResitPage && calcContainer) {
    displayCalculation();
  }
});
