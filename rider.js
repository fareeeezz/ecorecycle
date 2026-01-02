function getOrders() {
  return JSON.parse(localStorage.getItem("eco_orders") || "[]");
}
function saveOrders(o) {
  localStorage.setItem("eco_orders", JSON.stringify(o));
}

function renderRiderOrders() {
  const div = document.getElementById("riderOrders");
  const orders = getOrders();

  if (orders.length === 0) {
    div.innerHTML = "<div class='alert alert-info'>Tiada order</div>";
    return;
  }

  div.innerHTML = orders.map(o => `
    <div class="card mb-3">
      <div class="card-body">
        <strong>${o.user.username}</strong><br>
        ${o.items.map(i => `${i.material} (${i.weightKg}kg)`).join("<br>")}
        <br>Status: ${o.status}
        <br>
        ${o.status === "Pending"
          ? `<button class="btn btn-warning btn-sm"
              onclick="update(${o.id}, 'On The Way')">Terima</button>`
          : o.status === "On The Way"
          ? `<button class="btn btn-success btn-sm"
              onclick="update(${o.id}, 'Completed')">Selesai</button>`
          : ""
        }
      </div>
    </div>
  `).join("");
}

function update(id, s) {
  const o = getOrders();
  const i = o.findIndex(x => x.id === id);
  o[i].status = s;
  saveOrders(o);
  renderRiderOrders();
}

renderRiderOrders();
