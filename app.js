// ====================================
//  KONSTANT SISTEM
// ====================================
const RATE_PER_KG = 0.30;      // RM per kg
const POINTS_PER_KG = 10;      // points per kg

// ===== LOGIN DEMO (CREDENTIAL TETAP) =====
const DEMO_USERNAME = "upnm";
const DEMO_PHONE    = "60123456789";  // tanpa +, tanpa space
const DEMO_PASSWORD = "1234";

// Nombor WhatsApp owner EcoRecycle (60 + nombor, tanpa + dan tanpa 0 depan)
const ADMIN_WA_NUMBER = "601111473069";


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
//  HELPER – SESSION STORAGE (bukan localStorage)
// ====================================

// flag login
function setLoggedIn() {
  sessionStorage.setItem("eco_logged_in", "1");
}

function isLoggedIn() {
  return sessionStorage.getItem("eco_logged_in") === "1";
}

function clearLogin() {
  sessionStorage.removeItem("eco_logged_in");
}

// user info
function saveUser(user) {
  sessionStorage.setItem("eco_user", JSON.stringify(user));
}

function getUser() {
  const data = sessionStorage.getItem("eco_user");
  return data ? JSON.parse(data) : null;
}

function clearUser() {
  sessionStorage.removeItem("eco_user");
}

// request info
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

// Nama paparan untuk elak undefined
function getDisplayName(user) {
  if (!user) return "pengguna";
  return user.username || user.name || user.email || "pengguna";
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

  // Normalise untuk check:
  const usernameNormalized = username.toLowerCase();
  const phoneNormalized    = phone.replace(/\D/g, ""); // buang +, space, dash

  // ✅ SEMAK DENGAN CREDENTIAL TETAP
  if (
    usernameNormalized !== DEMO_USERNAME.toLowerCase() ||
    phoneNormalized    !== DEMO_PHONE ||
    password           !== DEMO_PASSWORD
  ) {
    alert(
      "Username / nombor telefon / kata laluan tidak sah.\n\n" +
      "Contoh login yang betul:\n" +
      `Username: ${DEMO_USERNAME}\n` +
      `Telefon : ${DEMO_PHONE}\n` +
      `Kata laluan: ${DEMO_PASSWORD}`
    );
    return false;
  }

  // Kalau betul -> simpan user (SESSION) & tanda logged in
  const user = new User(username, phone, password);
  saveUser(user);
  setLoggedIn();

  window.location.href = "request.html";
  return false;
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
  const weightEl = document.getElementById("weight");

  if (!materialEl || !weightEl) {
    alert("Ralat pada borang request. Sila refresh halaman.");
    return false;
  }

  const material = materialEl.value;
  const weight = parseFloat(weightEl.value);

  if (!material) {
    alert("Sila pilih jenis barangan kitar semula.");
    return false;
  }
  if (isNaN(weight) || weight <= 0) {
    alert("Sila masukkan anggaran berat yang sah (lebih daripada 0).");
    return false;
  }

  const request = new PickupRequest(user, material, weight);
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
    // kalau tak log in, jangan tunjuk resit
    container.innerHTML =
      '<p class="text-center">Anda perlu log masuk dahulu untuk melihat resit.</p>';
    return;
  }

  const reqData = getRequest();
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

  // ✅ A4 portrait, unit mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  let y = margin;

  // Tajuk besar tengah
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Resit Pickup EcoRecycle", pageWidth / 2, y, { align: "center" });

  y += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const tarikh = new Date().toLocaleDateString("ms-MY");
  doc.text(`Tarikh: ${tarikh}`, margin, y);
  y += 10;

  // Kotak info utama
  const boxTop = y;
  const boxHeight = 90;
  const boxWidth = pageWidth - 2 * margin;

  doc.roundedRect(margin, boxTop, boxWidth, boxHeight, 3, 3);

  let textY = boxTop + 12;
  const textX = margin + 7;

  doc.setFont("helvetica", "bold");
  doc.text("Maklumat Pengguna", textX, textY);
  textY += 8;

  doc.setFont("helvetica", "normal");
  doc.text(`Username   : ${displayName}`, textX, textY);  textY += 7;
  doc.text(`Telefon    : ${user.phone || "-"}`, textX, textY); textY += 7;

  textY += 3;
  doc.setFont("helvetica", "bold");
  doc.text("Maklumat Pickup", textX, textY);
  textY += 8;

  doc.setFont("helvetica", "normal");
  doc.text(`Jenis barang : ${request.material}`, textX, textY);  textY += 7;
  doc.text(`Berat        : ${request.weightKg} kg`, textX, textY); textY += 7;

  textY += 3;
  doc.setFont("helvetica", "bold");
  doc.text("Kiraan Insentif", textX, textY);
  textY += 8;

  doc.setFont("helvetica", "normal");
  doc.text(`Insentif      : RM ${totalRM}`, textX, textY);   textY += 7;
  doc.text(`Mata ganjaran : ${totalPoints} points`, textX, textY);

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
  const requestForm   = document.getElementById("requestForm");
  const calcContainer = document.getElementById("calcContainer");

  const isLoginPage   = !!loginForm;
  const isRequestPage = !!requestForm;
  const isResitPage   = !!calcContainer;

  // ❗ SETIAP KALI MASUK LOGIN PAGE → ANGGAP LOGOUT
  if (isLoginPage) {
    clearLogin();
    clearUser();
    clearRequest();
  }

  const loggedIn = isLoggedIn();
  const user = getUser();

  // ❗ GUARD: kalau di Request atau Resit, tapi tak log in → block + redirect
  if (!loggedIn && (isRequestPage || isResitPage)) {
    alert("Anda perlu log masuk dahulu.");
    window.location.href = "index.html";
    return;
  }

  // LOGIN PAGE
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // REQUEST PAGE
  if (requestForm) {
    const welcomeText = document.getElementById("welcomeText");
    if (welcomeText && user) {
      const displayName = getDisplayName(user);
      welcomeText.textContent = `Hai, ${displayName}. Sila isi maklumat pickup.`;
    }
    requestForm.addEventListener("submit", handleRequestSubmit);
  }

  // RESIT PAGE
  if (calcContainer) {
    displayCalculation();
  }
});
