function handleRequestSubmit(event) {
  if (event) event.preventDefault();

  if (!isLoggedIn()) {
    alert("Anda perlu log masuk dahulu.");
    window.location.href = "index.html";
    return false;
  }

  const user = getUser();
  if (!user) {
    alert("Sesi tamat atau belum log masuk. Sila log masuk semula.");
    window.location.href = "index.html";
    return false;
  }

  // ===============================
  // MULTIPLE ITEMS (BARU)
  // Cari semua row yang awak buat bila tekan "Tambah Jenis Barang"
  // ===============================
  const itemRows = document.querySelectorAll(".multi-item-row");
  const items = [];

  if (itemRows && itemRows.length > 0) {
    itemRows.forEach(r => {
      const m = r.querySelector(".material-item")?.value;
      const wRaw = r.querySelector(".weight-item")?.value;
      const w = parseFloat(wRaw);
      if (m && !isNaN(w) && w > 0) items.push({ material: m, weightKg: w });
    });
  }

  // ===============================
  // FALLBACK (LAMA) - kalau page masih pakai id material/weight
  // ===============================
  let material = null;
  let weight = null;

  if (items.length === 0) {
    const materialEl = document.getElementById("material");
    const weightEl   = document.getElementById("weight");

    if (!materialEl || !weightEl) {
      alert("Ralat pada borang request. Sila refresh halaman.");
      return false;
    }

    material = materialEl.value;
    weight   = parseFloat(weightEl.value);

    if (!material) {
      alert("Sila pilih jenis barangan kitar semula.");
      return false;
    }
    if (isNaN(weight) || weight <= 0) {
      alert("Sila masukkan anggaran berat yang sah (lebih daripada 0).");
      return false;
    }
  } else {
    // Validasi: maksimum 5 item
    if (items.length > 5) {
      alert("Maksimum 5 jenis barang sahaja.");
      return false;
    }

    // Validasi: tak boleh sama jenis berulang
    const set = new Set(items.map(x => x.material));
    if (set.size !== items.length) {
      alert("Sila pilih jenis barang yang lain (tidak boleh sama).");
      return false;
    }
  }

  // ===============================
  // Build request object
  // ===============================
  let request;
  if (items.length > 0) {
    request = new PickupRequest(user, null, null);
    request.items = items;
  } else {
    request = new PickupRequest(user, material, weight);
  }

  // ===============================
  // Lokasi (kekal)
  // ===============================
  const latInput   = document.getElementById("locationLat");
  const lngInput   = document.getElementById("locationLng");

  let location = null;
  if (latInput && lngInput && latInput.value && lngInput.value) {
    location = { lat: parseFloat(latInput.value), lng: parseFloat(lngInput.value) };
  }
  if (location) request.location = location;

  saveRequest(request);
  window.location.href = "calculate.html";
  return false;
}
