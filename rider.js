function getAllOrders() {
  try {
    const data = localStorage.getItem("eco_orders");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem("eco_orders", JSON.stringify(orders));
}

function updateOrderStatus(orderId, newStatus) {
  const orders = getAllOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return;

  orders[idx].status = newStatus;
  saveOrders(orders);
  renderRiderOrders();
}

function renderRiderOrders() {
  const container = document.getElementById("riderOrders");
  if (!container) return;

  const orders = getAllOrders();

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        Tiada order buat masa ini.
      </div>`;
    return;
  }

  let html = `
    <div class="table-responsive">
      <table class="table table-bordered align-middle">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Telefon</th>
            <th>Barang</th>
            <th>Lokasi</th>
            <th>Status</th>
            <th>Tindakan</th>
          </tr>
        </thead>
        <tbody>
  `;

  orders.forEach((o, i) => {
    const items = o.items.map(
      it => `${it.material} (${it.weightKg} kg)`
    ).join("<br>");

    const location = o.location
      ? `<a target="_blank" href="https://maps.google.com/?q=${o.location.lat},${o.location.lng}">
          Google Maps
        </a>`
      : "Tiada lokasi";

    let actionBtn = "-";

    if (o.status === "Pending") {
      actionBtn = `
        <button class="btn btn-sm btn-warning"
          onclick="updateOrderStatus(${o.id}, 'On The Way')">
          Terima Order
        </button>`;
    } else if (o.status === "On The Way") {
      actionBtn = `
        <button class="btn btn-sm btn-success"
          onclick="updateOrderStatus(${o.id}, 'Completed')">
          Selesai
        </button>`;
    }

    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${o.user.username}</td>
        <td>${o.user.phone}</td>
        <td>${items}</td>
        <td>${location}</td>
        <td>
          <span class="badge ${
            o.status === "Pending" ? "bg-secondary" :
            o.status === "On The Way" ? "bg-warning text-dark" :
            "bg-success"
          }">
            ${o.status}
          </span>
        </td>
        <td>${actionBtn}</td>
      </tr>`;
  });

  html += "</tbody></table></div>";
  container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", renderRiderOrders);
