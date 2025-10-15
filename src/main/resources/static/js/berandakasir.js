// ...existing code...
document.addEventListener("DOMContentLoaded", () => {
  console.log("AmbatuShop Dashboard loaded");

  // Menu active state (pills)
  const menuItems = document.querySelectorAll(".menu-item.pill");
  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      menuItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
    });
  });

  // Sidebar toggle (shrink / expand)
  const sidebar = document.querySelector(".sidebar");
  const content = document.querySelector(".content");
  const sidebarToggle = document.querySelector(".sidebar-toggle");

  function setSidebarCollapsed(collapsed) {
    if (collapsed) {
      sidebar.classList.add("collapsed");
      content.classList.add("sidebar-collapsed");
      // hide aria-hidden toggles
      content.setAttribute("data-sidebar", "collapsed");
    } else {
      sidebar.classList.remove("collapsed");
      content.classList.remove("sidebar-collapsed");
      content.removeAttribute("data-sidebar");
    }
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      const collapsed = sidebar.classList.contains("collapsed");
      setSidebarCollapsed(!collapsed);
    });
  }

  // Card selection: click to toggle 'selected' (enlarge slightly)
  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      // toggle selection on click
      const isSelected = card.classList.contains("selected");
      cards.forEach((c) => {
        c.classList.remove("selected");
        c.setAttribute("aria-pressed", "false");
      });
      if (!isSelected) {
        card.classList.add("selected");
        card.setAttribute("aria-pressed", "true");
      }
    });

    // keyboard accessibility (Enter / Space)
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.click();
      }
    });
  });

  // When sidebar is collapsed, allow icon buttons to "activate" corresponding card
  const iconButtons = document.querySelectorAll(".card-icons .icon-rep");
  iconButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      // expand content view to icon-mode (content already in sidebar-collapsed)
      // find corresponding card and briefly highlight (or select)
      const targetCard = document.querySelector(`.card[data-key="${target}"]`);
      if (targetCard) {
        // select the card (even if hidden) to indicate action; user can expand sidebar to see details
        cards.forEach((c) => c.classList.remove("selected"));
        targetCard.classList.add("selected");
        targetCard.setAttribute("aria-pressed", "true");
        // optional: briefly flash then remove selection after 1.5s
        setTimeout(() => {
          targetCard.classList.remove("selected");
          targetCard.setAttribute("aria-pressed", "false");
        }, 1500);
      }
    });
  });

  // Close mini-menu when clicking outside on small screens (keep behavior)
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !e.target.closest(".sidebar-toggle")) {
        // hide sidebar on small screens
        sidebar.classList.add("collapsed");
        content.classList.add("sidebar-collapsed");
      }
    }
  });
});
// ...existing code...
