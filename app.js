// ====================================
//  SYSTEM CONSTANTS
// ====================================

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
//  MODELS
// ====================================

class User {
  constructor(username, phone, password) {
    this.username = username;
    this.phone = phone;
    this.password = password;
  }
}

class PickupRequest {
  constructor(user, material, weightKg) {
    this.user = user;
    this.material = material;
    this.weightKg = weightKg;
  }
}

// ====================================
//  USER DATABASE (localStorage)
// ====================================

function getUsers() {
  return JSON.parse(localStorage.getItem("eco_users") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("eco_users", JSON.stringify(users));
}

function addUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

function findUser(username, phone, password) {
  const u = username.toLowerCase();
  const p = phone.replace(/\D/g, "");
  return getUsers().find(x =>
    x.username.toLowerCase() === u &&
    x.phone.replace(/\D/g, "") === p &&
    x.password === password
  );
}

// ====================================
//  SESSION (sessionStorage ONLY)
// ====================================

function loginUser(user) {
  sessionStorage.setItem("eco_logged_in", "1");
  sessionStorage.setItem("eco_user", JSON.stringify(user));
}

function logoutUser() {
  sessionStorage.clear();
}

function isLoggedIn() {
  return sessionStorage.getItem("eco_logged_in") === "1";
}

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("eco_user") || "null");
}

// ====================================
//  SIGN UP
// ====================================

function handleSignup(e) {
  e.preventDefault();

  const username = signupUsername.value.trim();
  const phone = signupPhone.value.trim();
  const password = signupPassword.value.trim();

  if (!username || !phone || !password) {
    alert("Sila isi semua maklumat.");
    return;
  }

  const users = getUsers();
  const exists = users.find(u =>
    u.username.toLowerCase() === username.toLowerCase() ||
    u.phone.replace(/\D/g, "") === phone.replace(/\D/g, "")
  );

  if (exists) {
    alert("Username atau nombor telefon sudah digunakan.");
    return;
  }

  addUser(new User(username, phone, password));
  alert("Sign up berjaya. Sila log masuk.");
  window.location.href = "index.html";
}

// ====================================
//  LOGIN
// ====================================

function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !phone || !password) {
    alert("Sila isi semua maklumat.");
    return;
  }

  const user = findUser(username, phone, password);
  if (!user) {
    alert("Login gagal. Akaun tidak dijumpai.");
    return;
  }

  loginUser(user);
  window.location.href = "request.html";
}

// ====================================
//  REQUEST
// ====================================

function handleRequestSubmit(e) {
  e.preventDefault();

  if (!isLoggedIn()) {
    alert("Anda perlu log masuk dahulu.");
    window.location.href = "index.html";
    return;
  }

  const material = material.value;
  const weight = parseFloat(weight.value);

  if (!material || weight <= 0) {
    alert("Sila isi maklumat request dengan betul.");
    return;
  }

  const request = new PickupRequest(getCurrentUser(), material, weight);
  sessionStorage.setItem("eco_request", JSON.stringify(request));

  window.location.href = "calculate.html";
}

// ====================================
//  RESIT
// ====================================

function displayReceipt() {
  if (!isLoggedIn()) {
    document.body.innerHTML = "<h3>Sila log masuk dahulu.</h3>";
    return;
  }

  const data = JSON.parse(sessionStorage.getItem("eco_request"));
  if (!data) {
    document.body.innerHTML = "<h3>Tiada order.</h3>";
    return;
  }

  const info = MATERIAL_RATES[data.material];
  const rm = (data.weightKg * info.rate).toFixed(2);
  const pts = data.weightKg * info.pointsPerKg;

  document.getElementById("calcContainer").innerHTML = `
    <h2>Order Pickup</h2>
    <p>User: ${data.user.username}</p>
    <p>Telefon: ${data.user.phone}</p>
    <p>Material: ${data.material}</p>
    <p>Berat: ${data.weightKg} kg</p>
    <p>Insentif: RM ${rm}</p>
    <p>Mata: ${pts}</p>
  `;
}

// ====================================
//  INIT
// ====================================

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const requestForm = document.getElementById("requestForm");
  const calcContainer = document.getElementById("calcContainer");

  // LOGIN PAGE → ALWAYS LOG OUT
  if (loginForm) {
    logoutUser();
    loginForm.addEventListener("submit", handleLogin);
  }

  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }

  if (requestForm) {
    if (!isLoggedIn()) {
      alert("Anda perlu log masuk dahulu.");
      window.location.href = "index.html";
      return;
    }
    requestForm.addEventListener("submit", handleRequestSubmit);
  }

  if (calcContainer) {
    displayReceipt();
  }
});
