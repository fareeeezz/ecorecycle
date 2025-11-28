// ====================================
//  KONSTANT SISTEM
// ====================================
const RATE_PER_KG = 0.30;      // RM per kg
const POINTS_PER_KG = 10;      // points per kg

// Nombor WhatsApp owner EcoRecycle (60 + nombor, tanpa + dan tanpa 0 depan)
const ADMIN_WA_NUMBER = "60123456789"; // TUKAR IKUT OWNER SEBENAR


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
    const totalIncentive = request.weightKg * RATE_PER_KG;
    const points = request.weightKg * POINTS_PER_KG;
    return { totalIncentive, points };
  }
}


// ====================================
//  HELPER – LOCALSTORAGE
// ====================================

function saveUser(user) {
  localStorage.setItem("eco_user", JSON.stringify(user));
}

function getUser() {
  const data = localStorage.getItem("eco_user");
  return data ? JSON.parse(data) : null;
}

function saveRequest(request) {
  localStorage.setItem("eco_request", JSON.stringify(request));
}

function getRequest() {
  const data = localStorage.getItem("eco_request");
  return data ? JSON.parse(data) : null;
}

// Nama paparan untuk elak undefined
function getDisplayName(user) {
  if (!user) return "pengguna";
  return user.username || user.name || user.email || "pengguna";
}


// ====================================
//  HANDLER: LOGIN
// ====================================

function handleLogin(event) {
  event.preventDefault();

  const usernameEl = document.getElementById("username");
  const phoneEl = document.getElementById("phone");
  const passwordEl = document.getElementById("password");

  if (!usernameEl || !phoneEl || !passwordEl) {
    alert("Ralat: medan login tidak dijumpai. Semak semula ID elemen dalam index.html.");
    return;
  }

  const username = usernameEl.value.trim();
  const phone = phoneEl.value.trim();
  const password = passwordEl.value.trim();

  if (!username || !phone || !password) {
    alert("Sila isi semua medan login.");
    return;
  }

  const user = new User(username, phone, password);
  saveUser(user);

  window.location.href = "request.html";
}


// ====================================
//  HANDLER: REQUEST PICKUP
// ====================================

function handleRequestSubmit(event) {
  event.preventDefault();

  const user = getUser();
  if (!user) {
    alert("Sesi tamat atau belum log masuk. Sila log masuk semula.");
    window.location.href = "index.html";
    return;
  }

  const materialEl = document.getElementById("material");
  const weightEl = document.getElementById("weight");

  if (!materialEl || !weightEl) {
    alert("Ralat pada borang request. Sila refresh halaman.");
    return;
  }

  const material = materialEl.value;
  const weight = parseFloat(weightEl.value);

  if (!material) {
    alert("Sila pilih jenis barangan kitar semula.");
    return;
  }
  if (isNaN(weight) || weight <= 0) {
    alert("Sila masukkan anggaran berat yang sah (lebih daripada 0).");
    return;
  }

  const request = new PickupRequest(user, material, weight);
  saveRequest(request);

  window.location.href = "calculate.html";
}


// ====================================
//  PAPAR RESIT & WHATSAPP
// ====================================

function displayCalculation() {
  const container = document.getElementById("calcContainer");
  const reqData = getRequest();

  if (!container) return;

  if (!reqData) {
    container.innerHTML =
      '<p class="text-center">Tiada data request dijumpai. Sila buat request semula.</p>';
    return;
  }

  const user = reqData.user;
  const displayName = getDisplayName(user);
  const request = new PickupRequest(user, reqData.material, reqData.weightKg);
  const result = IncentiveCalculator.calculate(request);

  const totalRM = result.totalIncentive.toFixed(2);
  const totalPoints = result.points.toFixed(0);

  const receiptText = `
RESIT PICKUP ECORCYCLE

Username      : ${displayName}
Telefon       : ${user.phone || "-"}
Jenis Barang  : ${request.material}
Berat         : ${request.weightKg} kg
Insentif      : RM ${totalRM}
Mata Ganjaran : ${totalPoints}

Terima kasih kerana menyokong kitar semula.
  `.trim();

  const waMessage = `
EcoRecycle Pickup Request

Username: ${displayName}
Telefon: ${user.phone || "-"}
Jenis barang: ${request.material}
Berat: ${request.weightKg} kg
Insentif: RM ${totalRM}
Mata ganjaran: ${totalPoints}
Alamat: 
  `.trim();

  const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  container.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-md-8">
        <h2 class="mb-4 text-center">Resit & WhatsApp</h2>

        <div class="card shadow-sm mb-4" id="receiptCard">
          <div class="card-body">
            <h5 class="card-title">Resit Pickup</h5>
            <p><strong>Username:</strong> ${displayName}</p>
            <p><strong>Telefon:</strong> ${user.phone || "-"}</p>
            <p><strong>Jenis Barang:</strong> ${request.material}</p>
            <p><strong>Berat:</strong> ${request.weightKg} kg</p>
            <hr>
            <p class="fs-5"><strong>Insentif:</strong> RM ${totalRM}</p>
            <p class="fs-5"><strong>Mata Ganjaran:</strong> ${totalPoints} points</p>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label">Teks Resit (copy / simpan)</label>
          <textarea class="form-control" rows="7" readonly>${receiptText}</textarea>
        </div>

        <h4 class="mb-3">Mesej WhatsApp ke Owner</h4>
        <div class="mb-3">
          <label class="form-label">Preview mesej WhatsApp</label>
          <textarea class="form-control" rows="7" readonly>${waMessage}</textarea>
        </div>

        <p class="text-muted">
          Bila tekan butang di bawah, WhatsApp akan terbuka dengan mesej di atas.
          Bahagian <strong>"Alamat:"</strong> dibiarkan kosong supaya pengguna boleh isi alamat
          lengkap sebelum tekan <em>send</em>.
        </p>

        <a href="${waUrl}" target="_blank" class="btn btn-success w-100 mb-2">
          Buka WhatsApp &amp; Isi Alamat
        </a>

        <button class="btn btn-outline-secondary w-100 mb-2" onclick="downloadReceiptPdf()">
          Muat Turun Resit (PDF)
        </button>

        <a href="request.html" class="btn btn-outline-success w-100 mt-2">
          Buat Request Baru
        </a>
      </div>
    </div>
  `;
}


// ====================================
//  DOWNLOAD PDF RESIT
// ====================================

function downloadReceiptPdf() {
  const reqData = getRequest();
  if (!reqData) {
    alert("Tiada data resit untuk dimuat turun.");
    return;
  }

  const user = reqData.user;
  const displayName = getDisplayName(user);
  const request = new PickupRequest(user, reqData.material, reqData.weightKg);
  const result = IncentiveCalculator.calculate(request);

  const totalRM = result.totalIncentive.toFixed(2);
  const totalPoints = result.points.toFixed(0);

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF library (jsPDF) tidak dimuatkan. Pastikan script jsPDF ada dalam calculate.html.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;
  doc.setFontSize(16);
  doc.text("Resit Pickup EcoRecycle", 10, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Username: ${displayName}`, 10, y);    y += 7;
  doc.text(`Telefon: ${user.phone || "-"}`, 10, y);    y += 7;
  doc.text(`Jenis barang: ${request.material}`, 10, y); y += 7;
  doc.text(`Berat: ${request.weightKg} kg`, 10, y);     y += 7;

  y += 3;
  doc.text(`Insentif: RM ${totalRM}`, 10, y);           y += 7;
  doc.text(`Mata ganjaran: ${totalPoints}`, 10, y);

  y += 10;
  doc.text("Terima kasih kerana menyokong kitar semula.", 10, y);

  doc.save("Resit_EcoRecycle.pdf");
}


// ====================================
//  INIT – IKUT PAGE
// ====================================

document.addEventListener("DOMContentLoaded", function () {

  // LOGIN PAGE
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // REQUEST PAGE
  const requestForm = document.getElementById("requestForm");
  if (requestForm) {
    const user = getUser();
    const welcomeText = document.getElementById("welcomeText");
    if (welcomeText) {
      const displayName = getDisplayName(user);
      welcomeText.textContent = `Hai, ${displayName}. Sila isi maklumat pickup.`;
    }
    requestForm.addEventListener("submit", handleRequestSubmit);
  }

  // RESIT PAGE
  const calcContainer = document.getElementById("calcContainer");
  if (calcContainer) {
    displayCalculation();
  }
});

