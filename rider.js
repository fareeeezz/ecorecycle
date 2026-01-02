// ===============================
//  SESSION CHECK (RIDER)
// ===============================
function getLoggedUser() {
  try {
    return JSON.parse(sessionStorage.getItem("eco_user"));
  } catch {
    return null;
  }
}

// 🚨 GUARD: kalau rider tak login → balik login page
const riderUser = getLoggedUser();
if (!riderUser) {
  alert("Sila log masuk sebagai rider dahulu.");
  window.location.href = "index.html";
}

// ===============================
//  LOGOUT RIDER
// ===============================
const logoutBtn = document.getElementById("riderLogoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = "index.html";
  });
}

// ===============================
//  ORDER DATA
// ===============================
function getOrders() {
  return JSON.parse(localStorage.getItem("eco_orders") || "[]");
}

function saveOrders(orders) {
  localStorage.setItem("eco_orders", JSON.stringify(orders));
}

// ===============================
//  RENDER ORDER LIST
// ===============================
function renderRiderOrders() {
  const container = document.getElementById("riderOrders");
  const orders = getOrders();

  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML =
      `<div class="alert alert-info text-center">
        Tiada order buat masa ini.
      </div>`;
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="card shadow-sm mb-3">
      <div class="card-body">
        <h6 class="mb-1"><strong>Customer:</strong> ${order.user.username}</h6>

        <div class="small mb-2">
          ${order.items.map(i =>
            `• ${i.material} (${i.weightKg} kg)`
          ).join("<br>")}
        </div>

        <p class="mb-2">
          <strong>Status:</strong> ${order.status}
        </p>

        ${order.status === "Pending" ? `
          <button class="btn btn-warning btn-sm"
            onclick="updateStatus(${order.id}, 'On The Way')">
            Terima Order
          </button>
        ` : order.status === "On The Way" ? `
          <button class="btn btn-success btn-sm"
            onclick="updateStatus(${order.id}, 'Completed')">
            Selesai
          </button>
        ` : `
          <span class="badge bg-success">Selesai</span>
        `}
      </div>
    </div>
  `).join("");
}

// ===============================
//  UPDATE STATUS
// ===============================
function updateStatus(orderId, newStatus) {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) return;

  orders[index].status = newStatus;
  saveOrders(orders);
  renderRiderOrders();
}

// ===============================
//  INIT
// ===============================
renderRiderOrders();
