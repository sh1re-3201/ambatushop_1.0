// Kontrol sidebar (toggle open/close) — memperbaiki referensi elemen dan mencegah error jika elemen tidak ada.
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('sidebar-close');     // tombol "×"
    const toggleBtn = document.getElementById('sidebar-toggle');   // hamburger (garis 3) di dalam sidebar
    const menuButtons = document.querySelectorAll('.menu-item.pill');

    if (!sidebar) return; // tidak ada sidebar -> hentikan

    // pastikan state awal
    sidebar.classList.remove('closed');
    sidebar.setAttribute('aria-hidden', 'false');

    // close (×) -> collapse ke icon-only
    closeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.add('closed');
        sidebar.setAttribute('aria-hidden', 'true');
    });

    // hamburger toggle -> buka/close
    toggleBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const closed = sidebar.classList.toggle('closed');
        sidebar.setAttribute('aria-hidden', closed ? 'true' : 'false');

        // jika dibuka fokus ke menu pertama (aksesibilitas)
        if (!closed) {
            const first = document.querySelector('.menu-item.pill');
            first?.focus();
        }
    });

    // keyboard support untuk toggle (Enter / Space)
    toggleBtn?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleBtn.click();
        }
    });

    // BUTTON LOGOUT
    // document.getElementById('logoutBtn').addEventListener('click', function () {
    //     const tokenMeta = document.querySelector('meta[name="_csrf"]');
    //     const csrf = tokenMeta ? tokenMeta.content : null;
        // fetch('/logout', {
        //     method: 'POST',
        //     credentials: 'same-origin',
        //     headers: csrf ? {'X-CSRF-TOKEN': csrf} : {}
        // }).then(() => {
        //     window.location = '/login';
        // });
    // });
  document.getElementById('logoutBtn').addEventListener('click', function () {
    window.location.href = '/logout';
  });


    // visual: aktivasi menu (highlight kartu yang ada)
    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            menuButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // reset style semua card
            document.querySelectorAll('.card.feature').forEach(c => {
                c.style.opacity = '1';
                c.style.transform = 'none';
                c.style.boxShadow = '0 12px 30px rgba(27,31,35,0.04)';
            });

            const target = btn.getAttribute('data-tab');
            const cardMap = {
                'keuangan': '#card-keuangan',
                'stok': '#card-stok',
                'pengguna': '#card-pengguna',
                'dashboard': null
            };
            const selector = cardMap[target];
            if (selector) {
                const el = document.querySelector(selector);
                if (el) {
                    el.style.transform = 'translateY(-6px)';
                    el.style.boxShadow = '0 18px 40px rgba(27,31,35,0.08)';
                }
            }
        });
    });

    // (opsional) jangan crash bila user klik di luar; tidak auto-close supaya UX stabil
});