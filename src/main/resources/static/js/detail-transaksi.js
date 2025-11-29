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
      } else if (target === "transaksi") {
        window.location.href = "transaksikasir.html";
      } else if (target === "keuangan") {
        window.location.href = "keuangankasir.html";
      }
    });
  });

  // Handle action buttons
  const btnCancel = document.querySelector(".btn-cancel");
  const btnProcess = document.querySelector(".btn-process");

  btnCancel?.addEventListener("click", function () {
    if (confirm("Apakah Anda yakin ingin membatalkan transaksi ini?")) {
      window.location.href = "transaksikasir.html";
    }
  });

  btnProcess?.addEventListener("click", function () {
    alert("Memproses pembayaran...");
    // Logic untuk proses pembayaran
  });
});
