// ====================================
//  RIDER QUEUE (localStorage) - BARU
// ====================================
function pushOrderToRiderQueue(request) {
  try {
    const listRaw = localStorage.getItem("eco_orders");
    const list = listRaw ? JSON.parse(listRaw) : [];

    const now = new Date();
    const orderId = "ECO-" + now.getTime(); // contoh: ECO-170xxxx

    // sanitize order (yang rider perlukan)
    const order = {
      orderId,
      createdAt: now.toISOString(),
      status: "NEW",
      user: {
        username: request?.user?.username || "pengguna",
        phone: request?.user?.phone || "-"
      },
      items: Array.isArray(request.items) ? request.items : null,
      material: request.material || null,
      weightKg: request.weightKg || null,
      location: request.location || null
    };

    list.push(order);
    localStorage.setItem("eco_orders", JSON.stringify(list));

    // optional: simpan orderId dalam request juga (senang untuk resit user)
    request.orderId = orderId;
  } catch (e) {
    // kalau fail, jangan kacau flow utama
    console.log("Rider queue save failed:", e);
  }
}
