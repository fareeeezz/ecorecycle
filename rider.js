// ===============================
// Rider Portal (Demo) - rider.js
// Tidak kacau app.js (customer)
// ===============================

const RIDER_DEMO = {
  username: "rider",
  password: "1234"
};

function setRiderLoggedIn(username) {
  sessionStorage.setItem("eco_rider_logged_in", "1");
  sessionStorage.setItem("eco_rider_user", JSON.stringify({ username }));
}

function isRiderLoggedIn() {
  return sessionStorage.getItem("eco_rider_logged_in") === "1";
}

function getRiderUser() {
  const d = sessionStorage.getItem("eco_rider_user");
  return d ? JSON.parse(d) : null;
}

function riderLogout() {
  sessionStorage.removeItem("eco_rider_logged_in");
  sessionStorage.removeItem("eco_rider_user");
  window.location.href = "rider.html";
}

function showRiderPanel() {
  const form = document.getElementById("riderLoginForm");
  const panel = document.getElementById("riderPanel");
  const status = document.getElementById("riderStatusText");

  if (form) form.style.display = "none";
  if (panel) panel.style.display = "block";

  const rider = getRiderUser();
  if (status) status.textContent = `Berjaya log masuk sebagai: ${rider?.username || "rider"}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("riderLoginForm");
  const logoutBtn = document.getElementById("riderLogoutBtn");

  if (logoutBtn) logoutBtn.addEventListener("click", riderLogout);

  // Kalau dah login, terus tunjuk dashboard
  if (isRiderLoggedIn()) {
    showRiderPanel();
    return;
  }

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const u = document.getElementById("riderUsername")?.value?.trim() || "";
    const p = document.getElementById("riderPassword")?.value?.trim() || "";

    if (!u || !p) {
      alert("Sila isi Rider ID dan Kata Laluan.");
      return;
    }

    // Demo check
    if (u === RIDER_DEMO.username && p === RIDER_DEMO.password) {
      setRiderLoggedIn(u);
      showRiderPanel();
      return;
    }

    alert("Rider ID / kata laluan salah (demo: rider / 1234).");
  });
});
