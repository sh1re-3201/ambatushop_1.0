// Kontrol sidebar (toggle open/close) — memperbaiki referensi elemen dan mencegah error jika elemen tidak ada.
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication using AuthHelper
    const auth = AuthHelper.checkAuth();
    if (!auth) return;

    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('sidebar-close');
    const openBtn = document.getElementById('sidebar-open-btn');
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

    if (!sidebar) return;

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

    // Sidebar functionality (same as before)
    sidebar.classList.remove('closed');
    sidebar.setAttribute('aria-hidden', 'false');

    closeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.add('closed');
        sidebar.setAttribute('aria-hidden', 'true');
    });

    openBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.remove('closed');
        sidebar.setAttribute('aria-hidden', 'false');
        const first = document.querySelector('.menu-item.pill');
        first?.focus();
    });

    // Avatar Dropdown functionality
    avatarBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        avatarDropdown?.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (avatarDropdown && !avatarDropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
            avatarDropdown.classList.remove('show');
        }
    });

    // Avatar selection
    avatarOptions.forEach(option => {
        option.addEventListener('click', () => {
            const avatarSrc = option.src;
            currentAvatar.src = avatarSrc;
            currentAvatar.style.display = 'block';
            defaultAvatar.style.display = 'none';
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            localStorage.setItem('selectedAvatar', avatarSrc);
            avatarDropdown.classList.remove('show');
        });
    });

    // Load saved avatar
    const savedAvatar = localStorage.getItem('selectedAvatar');
    if (savedAvatar) {
        currentAvatar.src = savedAvatar;
        currentAvatar.style.display = 'block';
        defaultAvatar.style.display = 'none';
        avatarOptions.forEach(option => {
            if (option.src === savedAvatar) {
                option.classList.add('selected');
            }
        });
    }

    // Logout functionality using AuthHelper
    logoutBtn?.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin logout?')) {
            AuthHelper.logout();
        }
    });

    // Menu functionality
    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            menuButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

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

    // Load dashboard data
    loadDashboardData(auth.userRole);
});

async function loadDashboardData(role) {
    try {
        // Load financial data
        const financeResponse = await fetch('http://localhost:8080/api/keuangan/summary', {
            headers: AuthHelper.getAuthHeaders()
        });
        
        if (financeResponse.ok) {
            const financeData = await financeResponse.json();
            updateFinanceCard(financeData);
        }

        // Load user data for admin
        if (role === 'ADMIN') {
            const usersResponse = await fetch('http://localhost:8080/api/admin/akun', {
                headers: AuthHelper.getAuthHeaders()
            });
            
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                updateUsersCard(usersData);
            }
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateFinanceCard(data) {
    const pemasukanElement = document.querySelector('#card-keuangan .finance-row div:first-child .value');
    const pengeluaranElement = document.querySelector('#card-keuangan .finance-row div:last-child .value');
    
    if (pemasukanElement) {
        pemasukanElement.textContent = `Rp ${formatCurrency(data.pemasukan || 2865000)}`;
    }
    
    if (pengeluaranElement) {
        pengeluaranElement.textContent = `Rp ${formatCurrency(data.pengeluaran || 2130000)}`;
    }
}

function updateUsersCard(users) {
    const onlineElement = document.querySelector('#card-pengguna .users-row div:first-child .value');
    const offlineElement = document.querySelector('#card-pengguna .users-row div:last-child .value');
    
    if (onlineElement) onlineElement.textContent = users.length || 2;
    if (offlineElement) offlineElement.textContent = '0';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
}