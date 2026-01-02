if (!sessionStorage.getItem("login") || sessionStorage.getItem("role") !== "rider") {
  alert("Sila log masuk sebagai rider");
  location.href = "index.html";
}

document.getElementById("riderLogout").onclick = () => {
  sessionStorage.clear();
  location.href = "index.html";
};

const orders = JSON.parse(localStorage.getItem("eco_orders") || "[]");
const container = document.getElementById("riderOrders");

container.innerHTML = orders.length === 0
  ? "<div class='alert alert-info'>Tiada order</div>"
  : orders.map(o => `
    <div class="card mb-2">
      <div class="card-body">
        <strong>${o.material}</strong><br>
        Berat: ${o.weight} kg<br>
        Status: ${o.status}
      </div>
    </div>
  `).join("");
