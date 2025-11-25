// --- Constants (can be shown in report) ---
const RATE_PER_KG = 0.30;   // RM per kg
const POINTS_PER_KG = 10;   // points per kg

// Nombor WhatsApp owner EcoRecycle (format: 60 + nombor, tanpa + dan tanpa 0 depan)
const ADMIN_WA_NUMBER = "60182177535"; // TUKAR IKUT OWNER SEBENAR

// --- OOP CLASSES ---

class User {
  constructor(name, email, phone) {
    this.name = name;
    this.email = email;
    this.phone = phone;
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

// --- Helper functions (Model / Controller style) ---

function saveUser(user) {
  localStorage.setItem('eco_user', JSON.stringify(user));
}

function getUser() {
  const data = localStorage.getItem('eco_user');
  return data ? JSON.parse(data) : null;
}

function saveRequest(request) {
  localStorage.setItem('eco_request', JSON.stringify(request));
}

function getRequest() {
  const data = localStorage.getItem('eco_request');
  return data ? JSON.parse(data) : null;
}

// --- Event handlers ---

function handleLogin(event) {
  event.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim(); // new

  const user = new User(name, email, phone);
  saveUser(user);

  window.location.href = 'request.html';
}

function handleRequestSubmit(event) {
  event.preventDefault();
  const user = getUser();
  if (!user) {
    alert('Sesi tamat. Sila log masuk semula.');
    window.location.href = 'index.html';
    return;
  }

  const material = document.getElementById('material').value;
  const weight = parseFloat(document.getElementById('weight').value);

  const request = new PickupRequest(user, material, weight);
  saveRequest(request);

  window.location.href = 'calculate.html';
}

// --- Papar resit + WhatsApp + PDF ---

function displayCalculation() {
  const container = document.getElementById('calcContainer');
  const reqData = getRequest();

  if (!reqData || !container) {
    container.innerHTML = '<p class="text-center">Tiada data. Sila buat request semula.</p>';
    return;
  }

  const user = reqData.user; // plain object dari localStorage
  const request = new PickupRequest(user, reqData.material, reqData.weightKg);
  const result = IncentiveCalculator.calculate(request);

  const totalRM = result.totalIncentive.toFixed(2);
  const totalPoints = result.points.toFixed(0);

  // --- Teks resit untuk preview / copy ---
  const receiptText = `
RESIT PICKUP ECORCYCLE

Nama          : ${user.name}
Emel          : ${user.email}
Telefon       : ${user.phone || '-'}
Jenis Barang  : ${request.material}
Berat         : ${request.weightKg} kg
Insentif      : RM ${totalRM}
Mata Ganjaran : ${totalPoints}

Terima kasih kerana menyokong kitar semula.
  `.trim();

  // --- Mesej WhatsApp ke OWNER (alamat sengaja kosong) ---
  const waMessage = `
EcoRecycle Pickup Request

Nama: ${user.name}
Emel: ${user.email}
Telefon: ${user.phone || '-'}
Jenis barang: ${request.material}
Berat: ${request.weightKg} kg
Insentif: RM ${totalRM}
Mata ganjaran: ${totalPoints}
Alamat: 
  `.trim(); // user akan isi alamat lepas "Alamat: "

  const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  container.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-md-8">
        <h2 class="mb-4 text-center">Resit & WhatsApp</h2>

        <!-- Resit -->
        <div class="card shadow-sm mb-4" id="receiptCard">
          <div class="card-body">
            <h5 class="card-title">Resit Pickup</h5>
            <p><strong>Nama:</strong> ${user.name}</p>
            <p><strong>Emel:</strong> ${user.email}</p>
            <p><strong>Telefon:</strong> ${user.phone || '-'}</p>
            <p><strong>Jenis Barang:</strong> ${request.material}</p>
            <p><strong>Berat:</strong> ${request.weightKg} kg</p>
            <hr>
            <p class="fs-5"><strong>Insentif:</strong> RM ${totalRM}</p>
            <p class="fs-5"><strong>Mata Ganjaran:</strong> ${totalPoints} points</p>
          </div>
        </div>

        <!-- Teks resit (boleh copy / simpan) -->
        <div class="mb-3">
          <label class="form-label">Teks Resit (copy / simpan)</label>
          <textarea class="form-control" rows="7" readonly>${receiptText}</textarea>
        </div>

        <!-- Notifikasi Preview / WhatsApp -->
        <h4 class="mb-3">Mesej WhatsApp ke Owner</h4>
        <div class="mb-3">
          <label class="form-label">Preview mesej WhatsApp</label>
          <textarea class="form-control" rows="7" readonly>${waMessage}</textarea>
        </div>

        <p class="text-muted">
          Bila tekan butang di bawah, WhatsApp akan terbuka dengan mesej di atas.
          Bahagian <strong>"Alamat:"</strong> dibiarkan kosong supaya pengguna boleh isi alamat
          lengkap sebelum tekan send.
        </p>

        <!-- Butang tindakan -->
        <a href="${waUrl}" target="_blank" class="btn btn-success w-100 mb-2">
          Buka WhatsApp &amp; Isi Alamat
        </a>

        <button class="btn btn-outline-secondary w-100 mb-2" onclick="downloadReceiptPdf()">
          Muat Turun Resit (PDF)
        </button>

        <a href="request.html" class="btn btn-outline-success w-100 mt-2">Buat Request Baru</a>
      </div>
    </div>
  `;
}

// --- Auto-generate & download PDF resit ---

function downloadReceiptPdf() {
  const reqData = getRequest();
  if (!reqData) {
    alert("Tiada data resit untuk dimuat turun.");
    return;
  }

  const user = reqData.user;
  const request = new PickupRequest(user, reqData.material, reqData.weightKg);
  const result = IncentiveCalculator.calculate(request);

  const totalRM = result.totalIncentive.toFixed(2);
  const totalPoints = result.points.toFixed(0);

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF library (jsPDF) tidak dimuatkan. Pastikan script jsPDF ada dalam HTML.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;
  doc.setFontSize(16);
  doc.text("Resit Pickup EcoRecycle", 10, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Nama: ${user.name}`, 10, y);               y += 7;
  doc.text(`Emel: ${user.email}`, 10, y);              y += 7;
  doc.text(`Telefon: ${user.phone || "-"}`, 10, y);    y += 7;
  doc.text(`Jenis barang: ${request.material}`, 10, y);y += 7;
  doc.text(`Berat: ${request.weightKg} kg`, 10, y);    y += 7;

  y += 3;
  doc.text(`Insentif: RM ${totalRM}`, 10, y);          y += 7;
  doc.text(`Mata ganjaran: ${totalPoints}`, 10, y);

  y += 10;
  doc.text("Terima kasih kerana menyokong kitar semula.", 10, y);

  doc.save("Resit_EcoRecycle.pdf");
}

// --- Attach events based on current page (very simple MVC-style Controller) ---

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const requestForm = document.getElementById('requestForm');
  if (requestForm) {
    const user = getUser();
    const welcomeText = document.getElementById('welcomeText');
    if (user && welcomeText) {
      welcomeText.textContent = `Hai, ${user.name}. Sila isi maklumat pickup.`;
    }
    requestForm.addEventListener('submit', handleRequestSubmit);
  }

  const calcContainer = document.getElementById('calcContainer');
  if (calcContainer) {
    displayCalculation();
  }
});
