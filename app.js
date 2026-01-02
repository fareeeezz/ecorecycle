// ===== USER STORAGE =====
function users() {
  return JSON.parse(localStorage.getItem("eco_users") || "[]");
}

function saveUsers(u) {
  localStorage.setItem("eco_users", JSON.stringify(u));
}

// ===== LOGIN =====
document.getElementById("loginCustomer")?.onclick = () => {
  document.getElementById("loginRole").value = "customer";
};

document.getElementById("loginRider")?.onclick = () => {
  document.getElementById("loginRole").value = "rider";
};

document.getElementById("loginForm")?.addEventListener("submit", e => {
  e.preventDefault();

  const role = loginRole.value;
  sessionStorage.setItem("role", role);
  sessionStorage.setItem("login", "1");

  if (role === "rider") location.href = "rider.html";
  else location.href = "request.html";
});

// ===== SIGNUP =====
document.getElementById("signupForm")?.addEventListener("submit", e => {
  e.preventDefault();
  const u = users();
  u.push({
    username: signupUsername.value,
    phone: signupPhone.value,
    password: signupPassword.value
  });
  saveUsers(u);
  alert("Daftar berjaya");
  location.href = "index.html";
});

// ===== MAP =====
if (document.getElementById("map")) {
  const map = L.map("map").setView([3.14, 101.68], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  map.on("click", e => {
    locationLat.value = e.latlng.lat;
    locationLng.value = e.latlng.lng;
    L.marker(e.latlng).addTo(map);
  });
}

// ===== REQUEST =====
document.getElementById("requestForm")?.addEventListener("submit", e => {
  e.preventDefault();
  const orders = JSON.parse(localStorage.getItem("eco_orders") || "[]");

  orders.push({
    id: Date.now(),
    material: document.querySelector(".material-item").value,
    weight: document.querySelector(".weight-item").value,
    lat: locationLat.value,
    lng: locationLng.value,
    status: "Pending"
  });

  localStorage.setItem("eco_orders", JSON.stringify(orders));
  location.href = "calculate.html";
});

function logout() {
  sessionStorage.clear();
  location.href = "index.html";
}
