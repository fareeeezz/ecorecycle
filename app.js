// ===== USERS =====
function getUsers() {
  return JSON.parse(localStorage.getItem("eco_users") || "[]");
}
function saveUser(u) {
  const users = getUsers();
  users.push(u);
  localStorage.setItem("eco_users", JSON.stringify(users));
}
function findUser(u, p, pw) {
  return getUsers().find(x =>
    x.username === u && x.phone === p && x.password === pw
  );
}

// ===== SESSION =====
function setLoggedIn(user) {
  sessionStorage.setItem("eco_user", JSON.stringify(user));
}
function getUser() {
  return JSON.parse(sessionStorage.getItem("eco_user"));
}
function handleLogout() {
  sessionStorage.clear();
  window.location.href = "index.html";
}

// ===== SIGNUP =====
document.getElementById("signupForm")?.addEventListener("submit", e => {
  e.preventDefault();
  saveUser({
    username: signupUsername.value,
    phone: signupPhone.value,
    password: signupPassword.value
  });
  alert("Signup berjaya");
  location.href = "index.html";
});

// ===== LOGIN =====
document.getElementById("loginForm")?.addEventListener("submit", e => {
  e.preventDefault();
  const role = loginRole.value;
  const u = findUser(username.value, phone.value, password.value);
  if (!u) return alert("Login gagal");

  setLoggedIn(u);
  location.href = role === "rider" ? "rider.html" : "request.html";
});

// ===== MAP =====
function initMapPicker() {
  if (!map) return;
  const m = L.map("map").setView([3.14, 101.69], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(m);
  let marker;
  m.on("click", e => {
    if (marker) marker.setLatLng(e.latlng);
    else marker = L.marker(e.latlng).addTo(m);
    locationLat.value = e.latlng.lat;
    locationLng.value = e.latlng.lng;
    locationDisplay.value = `${e.latlng.lat}, ${e.latlng.lng}`;
  });
}
initMapPicker();

// ===== REQUEST =====
document.getElementById("requestForm")?.addEventListener("submit", e => {
  e.preventDefault();
  const order = {
    id: Date.now(),
    user: getUser(),
    items: [{
      material: document.querySelector(".material-item").value,
      weightKg: document.querySelector(".weight-item").value
    }],
    location: {
      lat: locationLat.value,
      lng: locationLng.value
    },
    status: "Pending"
  };
  const orders = JSON.parse(localStorage.getItem("eco_orders") || "[]");
  orders.push(order);
  localStorage.setItem("eco_orders", JSON.stringify(orders));
  location.href = "calculate.html";
});
