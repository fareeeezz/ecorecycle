// ====================================
//  KONFIG / DATA SISTEM
// ====================================

// Material list + kadar semasa
const MATERIALS = [
  { key: "Plastik",          rate: 0.30, points: 10 },
  { key: "Kertas",           rate: 0.20, points: 8  },
  { key: "Tin/Aluminium",    rate: 0.80, points: 15 },
  { key: "Kaca",             rate: 0.10, points: 5  },
  { key: "E-waste",          rate: 1.50, points: 20 },
  { key: "Minyak Terpakai",  rate: 2.00, points: 25 },
];

const MAX_ITEMS = 5;

// DEMO LOGIN (credential tetap)
const DEMO_USERNAME = "upnm";
const DEMO_PHONE    = "60123456789"; // digits sahaja
const DEMO_PASSWORD = "1234";

// Admin WhatsApp (digits sahaja)
const ADMIN_WA_NUMBER = "601111473069"; // tukar ikut owner

// Storage: session-only (tak “remember me” bila back)
const S_USER    = "eco_user_session";
const S_LOGGED  = "eco_logged_in";
const S_REQUEST = "eco_request_session";


// ====================================
//  OOP CLASSES
// ====================================

class User {
  constructor(username, phone, password) {
    this.username = username;
    this.phone = phone;
    this.password = password; // demo sahaja
  }
}

class PickupItem {
  constructor(material, weightKg) {
    this.material = material;
    this.weightKg = weightKg;
  }
}

class PickupRequest {
  constructor(user, items, location) {
    this.user = user;           // User object
    this.items = items || [];   // array of PickupItem
    this.location = location || null; // {lat,lng}
  }
}

class IncentiveCalculator {
  static calcItem(materialKey, weightKg) {
    const m = MATERIALS.find(x => x.key === materialKey);
    const rate = m ? m.rate : 0;
    const pointsPerKg = m ? m.points : 0;
    const totalIncentive = weightKg * rate;
    const totalPoints = weightKg * pointsPerKg;
    return { rate, pointsPerKg, totalIncentive, totalPoints };
  }

  static calcRequest(items) {
    let totalRM = 0;
    let totalPoints = 0;

    const breakdown = items.map(it => {
      const r = IncentiveCalculator.calcItem(it.material, it.weightKg);
      totalRM += r.totalIncentive;
      totalPoints += r.totalPoints;
      return {
        material: it.material,
        weightKg: it.weightKg,
        rate: r.rate,
        pointsPerKg: r.pointsPerKg,
        itemRM: r.totalIncentive,
        itemPoints: r.totalPoints,
      };
    });

    return { breakdown, totalRM, totalPoints };
  }
}


// ====================================
//  SESSION STORAGE HELPERS
// ====================================

function saveUser(user) {
  sessionStorage.setItem(S_USER, JSON.stringify(user));
  sessionStorage.setItem(S_LOGGED, "1");
}

function getUser() {
  const d = sessionStorage.getItem(S_USER);
  return d ? JSON.parse(d) : null;
}

function isLoggedIn() {
  return sessionStorage.getItem(S_LOGGED) === "1" && !!getUser();
}

function logoutAndClear() {
  sessionStorage.removeItem(S_USER);
  sessionStorage.removeItem(S_LOGGED);
  sessionStorage.removeItem(S_REQUEST);
}

function saveRequest(reqObj) {
  sessionStorage.setItem(S_REQUEST, JSON.stringify(reqObj));
}

function getRequest() {
  const d = sessionStorage.getItem(S_REQUEST);
  return d ? JSON.parse(d) : null;
}

function getDisplayName(user) {
  if (!user) return "pengguna";
  return user.username || "pengguna";
}


// ====================================
//  LOGIN HANDLER
// ====================================

function handleLogin(event) {
  if (event) event.preventDefault();

  const usernameInput = document.getElementById("username");
  const phoneInput    = document.getElementById("phone");
  const passwordInput = document.getElementById("password");

  if (!usernameInput || !phoneInput || !passwordInput) {
    alert("Ralat: input login tidak dijumpai. Semak index.html.");
    return false;
  }

  const username = usernameInput.value.trim();
  const phoneRaw = phoneInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !phoneRaw || !password) {
    alert("Sila isi Username, Nombor Telefon dan Kata Laluan.");
    return false;
  }

  const usernameNorm = username.toLowerCase();
  const phoneNorm = phoneRaw.replace(/\D/g, ""); // buang +,space

  if (
    usernameNorm !== DEMO_USERNAME.toLowerCase() ||
    phoneNorm !== DEMO_PHONE ||
    password !== DEMO_PASSWORD
  ) {
    alert(
      "Username / nombor telefon / kata laluan tidak sah.\n\n" +
      "Demo login:\n" +
      `Username: ${DEMO_USERNAME}\n` +
      `Telefon : ${DEMO_PHONE}\n` +
      `Password: ${DEMO_PASSWORD}`
    );
    return false;
  }

  // ✅ penting: bila login baru, clear request lama
  sessionStorage.removeItem(S_REQUEST);

  const user = new User(username, phoneNorm, password);
  saveUser(user);

  window.location.href = "request.html";
  return false;
}


// ====================================
//  REQUEST PAGE: MULTI-ITEM UI
// ====================================

let selectedLocation = null;
let mapInstance = null;
let locMarker = null;

function renderRateList() {
  const box = document.getElementById("rateList");
  if (!box) return;

  box.innerHTML = MATERIALS.map(m =>
    `<div>${m.key}: RM ${m.rate.toFixed(2)} / kg, ${m.points} mata / kg</div>`
  ).join("");
}

function buildMaterialOptions(disabledSet, selectedValue) {
  return MATERIALS.map(m => {
    const disabled = disabledSet.has(m.key) && m.key !== selectedValue ? "disabled" : "";
    const sel = (m.key === selectedValue) ? "selected" : "";
    return `<option value="${m.key}" ${sel} ${disabled}>${m.key}</option>`;
  }).join("");
}

function getChosenMaterials() {
  const selects = document.querySelectorAll(".item-material");
  const chosen = new Set();
  selects.forEach(s => {
    const v = (s.value || "").trim();
    if (v) chosen.add(v);
  });
  return chosen;
}

function addItemRow(prefillMaterial = "", prefillWeight = "") {
  const container = document.getElementById("itemsContainer");
  if (!container) return;

  const rows = container.querySelectorAll(".item-row");
  if (rows.length >= MAX_ITEMS) {
    alert(`Maksimum ${MAX_ITEMS} jenis sahaja dibenarkan.`);
    return;
  }

  const disabledSet = getChosenMaterials();

  const row = document.createElement("div");
  row.className = "item-row border rounded-3 p-3 mb-2 bg-white bg-opacity-75";
  row.innerHTML = `
    <div class="row g-2 align-items-end">
      <div class="col-md-7">
        <label class="form-label mb-1">Jenis Barang</label>
        <select class="form-select item-material" required>
          <option value="">Pilih...</option>
          ${buildMaterialOptions(disabledSet, prefillMaterial)}
        </select>
      </div>

      <div class="col-md-4">
        <label class="form-label mb-1">Berat (kg)</label>
        <input type="number" step="0.1" min="0.1"
               class="form-control item-weight"
               placeholder="Contoh: 2.5"
               value="${prefillWeight}"
               required>
      </div>

      <div class="col-md-1 d-grid">
        <button type="button" class="btn btn-outline-danger btn-sm item-remove" title="Buang item">×</button>
      </div>
    </div>

    <div class="small text-muted mt-2 item-hint"></div>
  `;

  container.appendChild(row);

  // events
  const sel = row.querySelector(".item-material");
  const wt  = row.querySelector(".item-weight");
  const rm  = row.querySelector(".item-remove");
  const hint = row.querySelector(".item-hint");

  sel.addEventListener("change", () => {
    refreshAllMaterialOptions();
    updateHintForRow(row);
  });

  wt.addEventListener("input", () => updateHintForRow(row));

  rm.addEventListener("click", () => {
    row.remove();
    refreshAllMaterialOptions();
  });

  // prefill
  if (prefillMaterial) sel.value = prefillMaterial;
  updateHintForRow(row);
  refreshAllMaterialOptions();
}

function refreshAllMaterialOptions() {
  const container = document.getElementById("itemsContainer");
  if (!container) return;

  const chosen = getChosenMaterials();
  const rows = container.querySelectorAll(".item-row");

  rows.forEach(row => {
    const sel = row.querySelector(".item-material");
    const current = sel.value;

    // rebuild options
    sel.innerHTML = `
      <option value="">Pilih...</option>
      ${buildMaterialOptions(chosen, current)}
    `;
    sel.value = current; // keep selection
  });
}

function updateHintForRow(row) {
  const sel = row.querySelector(".item-material");
  const wt  = row.querySelector(".item-weight");
  const hint = row.querySelector(".item-hint");
  if (!sel || !wt || !hint) return;

  const material = sel.value;
  const weightKg = parseFloat(wt.value);

  if (!material || isNaN(weightKg) || weightKg <= 0) {
    hint.textContent = "";
    return;
  }

  const r = IncentiveCalculator.calcItem(material, weightKg);
  hint.textContent =
    `Anggaran: RM ${r.totalIncentive.toFixed(2)} | ${Math.round(r.totalPoints)} mata ` +
    `(kadar RM ${r.rate.toFixed(2)}/kg, ${r.pointsPerKg} mata/kg)`;
}

function initMapPicker() {
  const mapDiv = document.getElementById("map");
  const locText = document.getElementById("locationText");
  if (!mapDiv || typeof L === "undefined") return;

  // jika map dah init sebelum ni, skip
  if (mapInstance) return;

  mapInstance = L.map("map").setView([3.1390, 101.6869], 12); // KL default

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(mapInstance);

  mapInstance.on("click", (e) => {
    selectedLocation = { lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) };

    if (locMarker) locMarker.remove();
    locMarker = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(mapInstance)
      .bindPopup("Lokasi Pickup Dipilih").openPopup();

    if (locText) {
      locText.value = `Lokasi dipilih: ${selectedLocation.lat}, ${selectedLocation.lng}`;
    }
  });
}


// ====================================
//  REQUEST SUBMIT (multi-item)
// ====================================

function handleRequestSubmit(event) {
  event.preventDefault();

  if (!isLoggedIn()) {
    alert("Anda perlu log masuk dahulu.");
    window.location.href = "index.html";
    return;
  }

  const container = document.getElementById("itemsContainer");
  if (!container) return;

  const rows = container.querySelectorAll(".item-row");
  if (!rows.length) {
    alert("Sila tambah sekurang-kurangnya 1 jenis barang.");
    return;
  }

  // collect items
  const items = [];
  const materialSet = new Set();

  for (const row of rows) {
    const sel = row.querySelector(".item-material");
    const wt  = row.querySelector(".item-weight");
    const material = (sel.value || "").trim();
    const weightKg = parseFloat(wt.value);

    if (!material) {
      alert("Sila pilih jenis barang untuk semua item.");
      return;
    }
    if (materialSet.has(material)) {
      alert("Jenis barang tidak boleh sama. Sila pilih jenis berbeza.");
      return;
    }
    if (isNaN(weightKg) || weightKg <= 0) {
      alert("Sila masukkan berat yang sah untuk semua item (lebih daripada 0).");
      return;
    }

    materialSet.add(material);
    items.push(new PickupItem(material, weightKg));
  }

  if (items.length > MAX_ITEMS) {
    alert(`Maksimum ${MAX_ITEMS} jenis sahaja.`);
    return;
  }

  const user = getUser();
  const req = new PickupRequest(user, items, selectedLocation);

  saveRequest(req);

  window.location.href = "calculate.html";
}


// ====================================
//  ORDER PAGE (calculate.html)
// ====================================

function displayCalculation() {
  const container = document.getElementById("calcContainer");
  if (!container) return;

  if (!isLoggedIn()) {
    container.innerHTML = '<p class="text-center">Anda perlu log masuk dahulu untuk melihat order.</p>';
    return;
  }

  const reqData = getRequest();
  if (!reqData || !reqData.items || !reqData.items.length) {
    container.innerHTML = '<p class="text-center">Tiada data order dijumpai. Sila buat request semula.</p>';
    return;
  }

  const user = reqData.user;
  const displayName = getDisplayName(user);
  const items = reqData.items;

  const calc = IncentiveCalculator.calcRequest(items);
  const totalRM = calc.totalRM.toFixed(2);
  const totalPoints = Math.round(calc.totalPoints).toString();

  // lokasi
  let mapsUrl = "";
  let locationHtml = `<p><strong>Lokasi pickup:</strong> Tiada (GPS tidak ditetapkan)</p>`;
  let locationWa = "Lokasi: (tiada GPS)";
  if (reqData.location && reqData.location.lat && reqData.location.lng) {
    const lat = reqData.location.lat;
    const lng = reqData.location.lng;
    mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    locationHtml = `
      <p><strong>Lokasi pickup (GPS):</strong> ${lat}, ${lng}</p>
      <p><a href="${mapsUrl}" target="_blank">Buka di Google Maps</a></p>
    `;
    locationWa = `Lokasi (Google Maps): ${mapsUrl}`;
  }

  const tableRows = calc.breakdown.map((b, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${b.material}</td>
      <td>${b.weightKg}</td>
      <td>RM ${b.rate.toFixed(2)}</td>
      <td>${b.pointsPerKg}</td>
      <td>RM ${b.itemRM.toFixed(2)}</td>
      <td>${Math.round(b.itemPoints)}</td>
    </tr>
  `).join("");

  const waLines = calc.breakdown.map(b =>
    `- ${b.material}: ${b.weightKg}kg (RM ${b.itemRM.toFixed(2)}, ${Math.round(b.itemPoints)} mata)`
  ).join("\n");

  const waMessage = `
EcoRecycle Pickup Order (Multi-Item)

Username: ${displayName}
Telefon: ${user.phone || "-"}
Item:
${waLines}

Jumlah Insentif: RM ${totalRM}
Jumlah Mata: ${totalPoints}
${locationWa}
  `.trim();

  const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  container.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-10">
        <h2 class="mb-4 text-center">Order (Multi-Item) & WhatsApp</h2>

        <div class="card shadow-sm mb-4">
          <div class="card-body">
            <h5 class="card-title">Maklumat Order</h5>
            <p><strong>Username:</strong> ${displayName}</p>
            <p><strong>Telefon:</strong> ${user.phone || "-"}</p>
            ${locationHtml}

            <div class="table-responsive mt-3">
              <table class="table table-sm table-bordered align-middle">
                <thead class="table-light">
                  <tr>
                    <th>#</th>
                    <th>Material</th>
                    <th>Berat (kg)</th>
                    <th>Rate (RM/kg)</th>
                    <th>Points/kg</th>
                    <th>RM</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
                <tfoot class="table-light">
                  <tr>
                    <th colspan="5" class="text-end">Jumlah</th>
                    <th>RM ${totalRM}</th>
                    <th>${totalPoints}</th>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div class="mt-3">
              <a href="${waUrl}" target="_blank" class="btn btn-success w-100 mb-2">
                Buka WhatsApp (Hantar order kepada Admin)
              </a>
              <button class="btn btn-outline-secondary w-100" onclick="downloadReceiptPdf()">
                Muat Turun Order (PDF)
              </button>
            </div>
          </div>
        </div>

        <a href="request.html" class="btn btn-outline-success w-100">
          Buat Request Baru
        </a>
      </div>
    </div>
  `;
}


// ====================================
//  PDF (A4) - Multi item
// ====================================

function downloadReceiptPdf() {
  const reqData = getRequest();
  if (!reqData || !reqData.items || !reqData.items.length) {
    alert("Tiada data order untuk PDF.");
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("jsPDF tak load. Pastikan calculate.html ada script jsPDF.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  const user = reqData.user;
  const displayName = getDisplayName(user);

  const calc = IncentiveCalculator.calcRequest(reqData.items);
  const totalRM = calc.totalRM.toFixed(2);
  const totalPoints = Math.round(calc.totalPoints).toString();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("EcoRecycle - Order Pickup (Multi-Item)", pageW / 2, y, { align: "center" });

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Tarikh: ${new Date().toLocaleString("ms-MY")}`, margin, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Maklumat Pengguna", margin, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`Username: ${displayName}`, margin, y); y += 5;
  doc.text(`Telefon : ${user.phone || "-"}`, margin, y); y += 6;

  // lokasi
  if (reqData.location && reqData.location.lat && reqData.location.lng) {
    doc.text(`Lokasi (GPS): ${reqData.location.lat}, ${reqData.location.lng}`, margin, y);
    y += 6;
    doc.text(`Google Maps: https://www.google.com/maps?q=${reqData.location.lat},${reqData.location.lng}`, margin, y);
    y += 6;
  } else {
    doc.text("Lokasi (GPS): Tiada", margin, y);
    y += 6;
  }

  // table header
  doc.setFont("helvetica", "bold");
  doc.text("Item", margin, y);
  doc.text("Berat(kg)", margin + 70, y);
  doc.text("RM", margin + 110, y);
  doc.text("Points", margin + 150, y);

  y += 4;
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  for (const b of calc.breakdown) {
    // auto next page
    if (y > pageH - 30) {
      doc.addPage();
      y = margin;
    }

    doc.text(`${b.material}`, margin, y);
    doc.text(`${b.weightKg}`, margin + 70, y);
    doc.text(`RM ${b.itemRM.toFixed(2)}`, margin + 110, y);
    doc.text(`${Math.round(b.itemPoints)}`, margin + 150, y);
    y += 6;
  }

  y += 2;
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text(`Jumlah Insentif: RM ${totalRM}`, margin, y); y += 6;
  doc.text(`Jumlah Mata: ${totalPoints}`, margin, y);

  y += 10;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text("Resit/order ini dijana secara automatik oleh sistem EcoRecycle.", margin, y);

  doc.save("Order_EcoRecycle_MultiItem.pdf");
}


// ====================================
//  INIT (ikut page)
// ====================================

document.addEventListener("DOMContentLoaded", () => {

  // 1) LOGIN PAGE
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    // bila buka login page, auto logout + clear session (tak remember)
    logoutAndClear();
    loginForm.addEventListener("submit", handleLogin);
  }

  // 2) REQUEST PAGE
  const requestForm = document.getElementById("requestForm");
  if (requestForm) {
    if (!isLoggedIn()) {
      alert("Anda perlu log masuk dahulu.");
      window.location.href = "index.html";
      return;
    }

    renderRateList();

    const user = getUser();
    const welcomeText = document.getElementById("welcomeText");
    if (welcomeText) {
      welcomeText.textContent = `Hai, ${getDisplayName(user)}. Sila isi maklumat pickup.`;
    }

    // default 1 row
    addItemRow();

    // add row button
    const addBtn = document.getElementById("addItemBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => addItemRow());
    }

    // map picker
    initMapPicker();

    requestForm.addEventListener("submit", handleRequestSubmit);
  }

  // 3) ORDER PAGE
  const calcContainer = document.getElementById("calcContainer");
  if (calcContainer) {
    displayCalculation();
  }
});
