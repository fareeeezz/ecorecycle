function getAllOrders() {
  try {
    const data = localStorage.getItem("eco_orders");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function renderRiderOrders() {
  const container = document.getElementById("riderOrders");
  if (!container) return;

  const orders = getAllOrders();

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        Tiada order buat masa ini.
      </div>
    `;
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
          </tr>
        </thead>
        <tbody>
  `;

  orders.forEach((o, i) => {
    const items = (o.items || []).map(
      it => `${it.material} (${it.weightKg}kg)`
    ).join("<br>");

    const loc = o.location
      ? `<a target="_blank" href="https://maps.google.com/?q=${o.location.lat},${o.location.lng}">Buka Map</a>`
      : "Tiada lokasi";

    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${o.user.username}</td>
        <td>${o.user.phone}</td>
        <td>${items}</td>
        <td>${loc}</td>
        <td>${o.status}</td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", renderRiderOrders);
