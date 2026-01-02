// ===============================
// LOGIN
// ===============================
function handleLogin() {
  const role = document.getElementById("loginRole").value;
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Sila isi username dan kata laluan.");
    return;
  }

  // Rider login (simple demo)
  if (role === "rider") {
    if (username === "rider" && password === "rider123") {
      sessionStorage.setItem("eco_role", "rider");
      window.location.href = "rider.html";
      return;
    } else {
      alert("Akaun rider tidak sah.");
      return;
    }
  }

  // Customer login (guna localStorage)
  const users = JSON.parse(localStorage.getItem("eco_users")) || [];
  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    alert("Username atau kata laluan salah.");
    return;
  }

  sessionStorage.setItem("eco_role", "customer");
  sessionStorage.setItem("eco_user", JSON.stringify(user));
  window.location.href = "request.html";
}

// ===============================
// FORGOT PASSWORD (DEMO)
// ===============================
function forgotPassword() {
  const username = prompt("Masukkan username anda:");

  if (!username) return;

  const users = JSON.parse(localStorage.getItem("eco_users")) || [];
  const user = users.find(u => u.username === username);

  if (!user) {
    alert("Akaun tidak dijumpai.");
    return;
  }

  alert(
    `DEMO SAHAJA\n\nKata laluan anda ialah:\n${user.password}\n\n(Sistem sebenar guna OTP / email)`
  );
}

// ===============================
// LOGOUT (DIGUNAKAN DI CUSTOMER & RIDER)
// ===============================
function logout() {
  sessionStorage.clear();
  window.location.href = "index.html";
}
