document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById("sidebar");
  const closeBtn = document.getElementById("sidebar-close");
  const toggleBtn = document.getElementById("sidebar-toggle");
  const menuButtons = document.querySelectorAll(".menu-item.pill");

  if (!sidebar) return;
  sidebar.classList.remove("closed");
  sidebar.setAttribute("aria-hidden", "false");

  // close X -> collapse
  closeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.add("closed");
    sidebar.setAttribute("aria-hidden", "true");
  });

  // hamburger -> toggle
  toggleBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const closed = sidebar.classList.toggle("closed");
    sidebar.setAttribute("aria-hidden", closed ? "true" : "false");
    if (!closed) {
      document.querySelector(".menu-item.pill")?.focus();
    }
  });

  toggleBtn?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleBtn.click();
    }
  });

  // menu activation + navigation
  menuButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      menuButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.getAttribute("data-tab");
      if (target === "dashboard") {
        window.location.href = "berandakasir.html";
      } else if (target === "keuangan") {
        window.location.href = "keuangankasir.html";
      }
      // Jika transaksi, tetap di halaman ini
    });
  });

  // set initial active (transaksi)
  document.querySelector('.menu-item.pill[data-tab="transaksi"]')?.classList.add("active");
});
