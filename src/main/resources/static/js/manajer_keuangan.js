// Kontrol sidebar (toggle open/close) — memperbaiki referensi elemen dan mencegah error jika elemen tidak ada.
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('sidebar-close');     // tombol "×"
    const openBtn = document.getElementById('sidebar-open-btn');   // hamburger di content area
    const menuButtons = document.querySelectorAll('.menu-item.pill');

    // Avatar dropdown
    const avatarBtn = document.getElementById('avatar-btn');
    const avatarDropdown = document.getElementById('avatar-dropdown');
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const currentAvatar = document.getElementById('current-avatar');
    const defaultAvatar = document.getElementById('default-avatar');
    const logoutBtn = document.getElementById('logout-btn');

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    if (!sidebar) return; // tidak ada sidebar -> hentikan

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // Theme toggle functionality
    themeToggle?.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }

    // pastikan state awal
    sidebar.classList.remove('closed');
    sidebar.setAttribute('aria-hidden', 'false');

    // close (×) -> collapse ke icon-only
    closeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.add('closed');
        sidebar.setAttribute('aria-hidden', 'true');
    });

    // hamburger open button (di content area) -> buka sidebar
    openBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.remove('closed');
        sidebar.setAttribute('aria-hidden', 'false');

        // fokus ke menu pertama
        const first = document.querySelector('.menu-item.pill');
        first?.focus();
    });

    // Avatar Dropdown functionality
    avatarBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        avatarDropdown?.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (avatarDropdown && !avatarDropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
            avatarDropdown.classList.remove('show');
        }
    });

    // Avatar selection
    avatarOptions.forEach(option => {
        option.addEventListener('click', () => {
            const avatarSrc = option.src;

            // Update current avatar
            currentAvatar.src = avatarSrc;
            currentAvatar.style.display = 'block';
            defaultAvatar.style.display = 'none';

            // Update selected state
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            // Save to localStorage
            localStorage.setItem('selectedAvatar', avatarSrc);

            // Close dropdown
            avatarDropdown.classList.remove('show');
        });
    });

    // Load saved avatar on page load
    const savedAvatar = localStorage.getItem('selectedAvatar');
    if (savedAvatar) {
        currentAvatar.src = savedAvatar;
        currentAvatar.style.display = 'block';
        defaultAvatar.style.display = 'none';

        // Mark the selected avatar
        avatarOptions.forEach(option => {
            if (option.src === savedAvatar) {
                option.classList.add('selected');
            }
        });
    }

    // Logout functionality
    logoutBtn?.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin logout?')) {
            localStorage.removeItem('selectedAvatar');
            window.location.href = '/logout';
        }
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
    document.getElementById('download-btn')?.addEventListener('click', function (e) {
        e.preventDefault();

        const a = document.createElement('a');
        a.href = '/api/export/download'; // direct reference to the download endpoint
        a.download = 'laporan_keuangan.xlsx'; // suggested filename
        document.body.appendChild(a);
        a.click();
        a.remove();
    });


    // (opsional) jangan crash bila user klik di luar; tidak auto-close supaya UX stabil
});