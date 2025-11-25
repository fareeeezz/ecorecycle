// --- Constants (can be shown in report) ---
const RATE_PER_KG = 0.30;   // RM per kg
const POINTS_PER_KG = 10;   // points per kg

// --- OOP CLASSES ---

class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
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

  const user = new User(name, email);
  saveUser(user);

  // go to next page
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

function displayCalculation() {
  const container = document.getElementById('calcContainer');
  const reqData = getRequest();

  if (!reqData || !container) {
    container.innerHTML = '<p class="text-center">Tiada data. Sila buat request semula.</p>';
    return;
  }

  const user = reqData.user;
  const request = new PickupRequest(user, reqData.material, reqData.weightKg);
  const result = IncentiveCalculator.calculate(request);

  const totalRM = result.totalIncentive.toFixed(2);
  const totalPoints = result.points.toFixed(0);

  const emailMsg = `
Kepada ${user.name} (${user.email}),
Terima kasih kerana menghantar ${request.material} seberat ${request.weightKg} kg.
Anda menerima insentif sebanyak RM ${totalRM} dan ${totalPoints} mata ganjaran.
  `.trim();

  const whatsappMsg = `
EcoRecycle: Terima kasih ${user.name}! Pickup untuk ${request.material} (${request.weightKg} kg) diterima.
Insentif: RM ${totalRM}. Mata: ${totalPoints}.
  `.trim();

  container.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-md-8">
        <h2 class="mb-4 text-center">Hasil Kiraan Insentif</h2>
        <div class="card shadow-sm mb-4">
          <div class="card-body">
            <p><strong>Nama:</strong> ${user.name}</p>
            <p><strong>Jenis Barang:</strong> ${request.material}</p>
            <p><strong>Berat:</strong> ${request.weightKg} kg</p>
            <hr>
            <p class="fs-5"><strong>Insentif:</strong> RM ${totalRM}</p>
            <p class="fs-5"><strong>Mata Ganjaran:</strong> ${totalPoints} points</p>
          </div>
        </div>

        <h4 class="mb-3">Notifikasi (Output Preview)</h4>
        <div class="mb-3">
          <label class="form-label">Emel kepada pengguna</label>
          <textarea class="form-control" rows="4" readonly>${emailMsg}</textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">WhatsApp kepada pengguna</label>
          <textarea class="form-control" rows="3" readonly>${whatsappMsg}</textarea>
        </div>

        <a href="request.html" class="btn btn-outline-success w-100 mt-3">Buat Request Baru</a>
      </div>
    </div>
  `;
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
