// ===============================
// Rider Dashboard (localStorage)
// ===============================

const ORDERS_KEY = "eco_orders";

// Kadar sama macam app.js (untuk kira total)
const MATERIAL_RATES = {
  "Plastik": { rate: 0.30, pointsPerKg: 10 },
  "Kertas": { rate: 0.20, pointsPerKg: 8 },
  "Tin": { rate: 0.80, pointsPerKg: 15 },
  "Kaca": { rate: 0.10, pointsPerKg: 5 },
  "Elektronik": { rate: 1.50, pointsPerKg: 20 },
  "Minyak Masak Terpakai": { rate: 2.00, pointsPerKg: 25 }
};

function getOrders() {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveOrders(list) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ms-MY");
  } catch {
    return iso || "-";
  }
}

function computeTotals(order) {
  const items = Array.isArray(order.items) && order.items.length
    ? order.items
    : (order.material && order.weightKg ? [{ material: order.material, weightKg: order.weightKg }] : []);

  let totalRM = 0;
  let totalPoints = 0;

  items.forEach(it => {
    const info = MATERIAL_RATES[it.material] || { rate: 0.30, pointsPerKg: 10 };
    const w = parseFloat(it.weightKg) || 0;
    totalRM += w * info.rate;
    totalPoints += w * info.pointsPerKg;
  });

  return { items, totalRM, totalPoints };
}

// ===============================
// Leaflet Map (single map instance)
// ===============================
let map, marker;

function initMap() {
  const mapDiv = document.getElementById("riderMap");
  if (!mapDiv || typeof L === "undefined") return;

  map = L.map("riderMap").setView([3.1390, 101.6869], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  marker = null;
}

function showOnMap(lat, lng) {
  if (!map) return;

  if (!lat || !lng) {
    map.setView([3.1390, 101.6869], 12);
    if (marker) {
      map.removeLayer(marker);
      marker = null;
    }
    return;
  }

  const pos = [lat, lng];
  map.setView(pos, 15);

  if (marker) marker.setLatLng(pos);
  else marker = L.marker(pos).addTo(map);

  marker.bindPopup("Lokasi Pickup").openPopup();
}

// ===============================
// UI Render
// ===============================
function statusBadge(status) {
  const s = (status || "NEW").toUpperCase();
  const cls =
    s === "COMPLETED" ? "text-bg-secondary" :
    s === "ONTHEWAY" ? "text-bg-warning" :
    s === "ACCEPTED" ? "text-bg-info" :
    "text-bg-success";
  return `<span class="badge ${cls}">${s}</span>`;
}

function renderOrders() {
  const wrap = document.getElementById("ordersWrap");
  const countEl = document.getElementById("orderCount");
  const filterEl = document.getElementById("statusFilter");

  if (!wrap) return;

  const filter = (filterEl?.value || "ALL").toUpperCase();
  let orders = getOrders();

  // Sort terbaru atas
  orders.sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  // Filter
  if (filter !== "ALL") {
    orders = orders.filter(o => (o.status || "NEW").toUpperCase() === filter);
  }

  if (countEl) countEl.textContent = String(orders.length);

  if (orders.length === 0) {
    wrap.innerHTML = `
      <div class="alert alert-info small mb-0">
        Tiada order lagi. Bila user submit request, order akan muncul di sini.
      </div>
    `;
    return;
  }

  wrap.innerHTML = orders.map(o => {
    const { items, totalRM, totalPoints } = computeTotals(o);

    const userName = (o.user?.username || "pengguna");
    const userPhone = (o.user?.phone || "-");

    const hasGps = o.location && typeof o.location.lat === "number" && typeof o.location.lng === "number";
    const mapsUrl = hasGps ? `https://www.google.com/maps?q=${o.location.lat},${o.location.lng}` : "";

    const itemsLine = items.map((it, idx) => {
      const w = parseFloat(it.weightKg) || 0;
      return `${idx+1}. ${it.material} (${w}kg)`;
    }).join("<br>");

    return `
      <div class="border rounded-3 p-3 mb-3 bg-white">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div class="fw-bold">${o.orderId || "-"}</div>
            <div class="small text-muted">${formatTime(o.createdAt)}</div>
          </div>
          <div>${statusBadge(o.status)}</div>
        </div>

        <hr class="my-2"/>

        <div class="small">
          <div><strong>User:</strong> ${userName}</div>
          <div><strong>Phone:</strong> ${userPhone}</div>
          <div class="mt-2"><strong>Items:</strong><br>${itemsLine || "-"}</div>

          <div class="mt-2">
            <strong>Total:</strong>
            RM ${totalRM.toFixed(2)} | ${totalPoints.toFixed(0)} pts
          </div>

          <div class="mt-2">
            <strong>Location:</strong>
            ${hasGps ? `${o.location.lat.toFixed(6)}, ${o.location.lng.toFixed(6)}` : "No GPS"}
          </div>
        </div>

        <div class="d-flex flex-wrap gap-2 mt-3">
          <button class="btn btn-sm btn-eco-outline" data-action="view" data-id="${o.orderId}">View</button>

          ${hasGps ? `<a class="btn btn-sm btn-outline-primary" href="${mapsUrl}" target="_blank">Google Maps</a>` : ""}

          ${userPhone !== "-" ? `<a class="btn btn-sm btn-outline-success" href="https://wa.me/${String(userPhone).replace(/\D/g,'')}" target="_blank">WhatsApp User</a>` : ""}

          <select class="form-select form-select-sm" style="width: 180px;"
            data-action="status" data-id="${o.orderId}">
            <option value="NEW" ${String(o.status).toUpperCase()==="NEW"?"selected":""}>NEW</option>
            <option value="ACCEPTED" ${String(o.status).toUpperCase()==="ACCEPTED"?"selected":""}>ACCEPTED</option>
            <option value="ONTHEWAY" ${String(o.status).toUpperCase()==="ONTHEWAY"?"selected":""}>ON THE WAY</option>
            <option value="COMPLETED" ${String(o.status).toUpperCase()==="COMPLETED"?"selected":""}>COMPLETED</option>
          </select>

          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${o.orderId}">Delete</button>
        </div>
      </div>
    `;
  }).join("");

  // Attach actions
  wrap.querySelectorAll("[data-action]").forEach(el => {
    const action = el.getAttribute("data-action");
    const id = el.getAttribute("data-id");

    if (action === "view") {
      el.addEventListener("click", () => viewOrder(id));
    }

    if (action === "delete") {
      el.addEventListener("click", () => deleteOrder(id));
    }

    if (action === "status") {
      el.addEventListener("change", (e) => updateStatus(id, e.target.value));
    }
  });
}

function findOrderById(orderId) {
  const list = getOrders();
  return list.find(o => o.orderId === orderId) || null;
}

function viewOrder(orderId) {
  const info = document.getElementById("selectedInfo");
  const o = findOrderById(orderId);
  if (!o) return;

  const { items, totalRM, totalPoints } = computeTotals(o);
  const userName = (o.user?.username || "pengguna");
  const userPhone = (o.user?.phone || "-");

  const hasGps = o.location && typeof o.location.lat === "number" && typeof o.location.lng === "number";
  const mapsUrl = hasGps ? `https://www.google.com/maps?q=${o.location.lat},${o.location.lng}` : "";

  const itemsHtml = items.map((it, idx) => {
    const w = parseFloat(it.weightKg) || 0;
    return `<div>${idx+1}. ${it.material} — <strong>${w} kg</strong></div>`;
  }).join("");

  if (info) {
    info.innerHTML = `
      <div class="fw-bold mb-1">${o.orderId}</div>
      <div class="small text-muted mb-2">${formatTime(o.createdAt)} • ${statusBadge(o.status)}</div>

      <div class="small">
        <div><strong>User:</strong> ${userName}</div>
        <div><strong>Phone:</strong> ${userPhone}</div>

        <div class="mt-2"><strong>Items:</strong>${itemsHtml || "-"}</div>

        <div class="mt-2"><strong>Total:</strong> RM ${totalRM.toFixed(2)} | ${totalPoints.toFixed(0)} pts</div>

        <div class="mt-2"><strong>GPS:</strong> ${hasGps ? `${o.location.lat.toFixed(6)}, ${o.location.lng.toFixed(6)}` : "No GPS"}</div>

        ${hasGps ? `<div class="mt-2"><a href="${mapsUrl}" target="_blank">Open Google Maps</a></div>` : ""}
      </div>
    `;
  }

  if (hasGps) showOnMap(o.location.lat, o.location.lng);
  else showOnMap(null, null);
}

function updateStatus(orderId, status) {
  const list = getOrders();
  const idx = list.findIndex(o => o.orderId === orderId);
  if (idx === -1) return;

  list[idx].status = String(status || "NEW").toUpperCase();
  list[idx].updatedAt = new Date().toISOString();
  saveOrders(list);

  renderOrders();
}

function deleteOrder(orderId) {
  const ok = confirm("Delete order ini?");
  if (!ok) return;

  let list = getOrders();
  list = list.filter(o => o.orderId !== orderId);
  saveOrders(list);

  // clear selected if deleted
  const info = document.getElementById("selectedInfo");
  if (info) info.textContent = "Order deleted. Klik 'View' untuk pilih order lain.";

  renderOrders();
}

function clearCompleted() {
  const ok = confirm("Padam semua order status COMPLETED?");
  if (!ok) return;

  let list = getOrders();
  list = list.filter(o => String(o.status).toUpperCase() !== "COMPLETED");
  saveOrders(list);

  renderOrders();
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  initMap();

  const refreshBtn = document.getElementById("refreshBtn");
  const filterEl = document.getElementById("statusFilter");
  const clearBtn = document.getElementById("clearCompletedBtn");

  if (refreshBtn) refreshBtn.addEventListener("click", renderOrders);
  if (filterEl) filterEl.addEventListener("change", renderOrders);
  if (clearBtn) clearBtn.addEventListener("click", clearCompleted);

  renderOrders();
});
