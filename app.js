function updateUserPassword(username, phone, newPassword) {
  const users = getRegisteredUsers();
  const unameNorm = (username || "").trim().toLowerCase();
  const phoneNorm = (phone || "").replace(/\D/g, "");

  const idx = users.findIndex(u =>
    (u.username || "").trim().toLowerCase() === unameNorm &&
    (u.phone || "").replace(/\D/g, "") === phoneNorm
  );

  if (idx === -1) return false;

  users[idx].password = newPassword;
  saveRegisteredUsers(users);
  return true;
}

function handleForgotPassword(event) {
  event.preventDefault();

  const uEl = document.getElementById("forgotUsername");
  const pEl = document.getElementById("forgotPhone");
  const nEl = document.getElementById("forgotNewPassword");
  const cEl = document.getElementById("forgotConfirmPassword");

  if (!uEl || !pEl || !nEl || !cEl) {
    alert("Ralat: borang forgot password tidak lengkap.");
    return false;
  }

  const username = uEl.value.trim();
  const phone = pEl.value.trim();
  const newPass = nEl.value.trim();
  const confirm = cEl.value.trim();

  if (!username || !phone || !newPass || !confirm) {
    alert("Sila isi semua ruangan.");
    return false;
  }

  if (newPass.length < 4) {
    alert("Kata laluan terlalu pendek. Masukkan sekurang-kurangnya 4 aksara.");
    return false;
  }

  if (newPass !== confirm) {
    alert("Confirm password tidak sama.");
    return false;
  }

  const ok = updateUserPassword(username, phone, newPass);
  if (!ok) {
    alert("Akaun tidak dijumpai. Pastikan Username & No Telefon sama seperti semasa Sign Up.");
    return false;
  }

  alert("Reset berjaya! Sila log masuk menggunakan kata laluan baru.");

  // Tutup modal kalau ada bootstrap
  try {
    const modalEl = document.getElementById("forgotModal");
    if (modalEl && window.bootstrap) {
      const m = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
      m.hide();
    }
  } catch (e) {}

  // clear input
  uEl.value = "";
  pEl.value = "";
  nEl.value = "";
  cEl.value = "";

  return false;
}
