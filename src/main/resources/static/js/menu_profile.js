(function () {
  const q = (id) => document.getElementById(id);
  const el = {
    username: q("username"),
    email: q("email"),
    role: q("role"),
    btnBack: q("btnBack"),
    btnEdit: q("btnEdit"),
    btnLogout: q("btnLogout"),
  };

  function safeText(v) {
    return v === undefined || v === null || v === "" ? "—" : String(v);
  }

  function render(user) {
    if (el.username) el.username.textContent = safeText(user.username);
    if (el.email) el.email.textContent = safeText(user.email);
    if (el.role) el.role.textContent = safeText(user.role);
  }

  function loadUser() {
    let user = null;
    try {
      const ls = localStorage.getItem("currentUser");
      if (ls) user = JSON.parse(ls);
    } catch (e) {
      user = null;
    }
    if (!user && window.currentUser) user = window.currentUser;
    if (!user) user = { username: "pengguna_demo", email: "demo@contoh.local", role: "kasir" };
    render(user);
  }

  function goBack() {
    try {
      window.history.back();
    } catch (e) {}
  }
  function editProfile() {
    try {
      window.location.href = "profile_edit.html";
    } catch (e) {}
  }
  function logout() {
    try {
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadUser);
  } else {
    loadUser();
  }

  if (el.btnBack) el.btnBack.addEventListener("click", goBack);
  if (el.btnEdit) el.btnEdit.addEventListener("click", editProfile);
  if (el.btnLogout) el.btnLogout.addEventListener("click", logout);

  window.ProfileMenu = {
    setUser(u) {
      try {
        if (u && typeof u === "object") {
          localStorage.setItem("currentUser", JSON.stringify(u));
          render(u);
        }
      } catch (e) {}
    },
    clear() {
      localStorage.removeItem("currentUser");
      loadUser();
    },
  };
})();
