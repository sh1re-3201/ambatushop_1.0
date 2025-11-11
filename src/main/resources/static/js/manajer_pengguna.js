// Kontrol sidebar dan authentication - READ ONLY VERSION
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const auth = AuthHelper.checkAuth();
    if (!auth) return;
    
    // Only allow MANAGER or ADMIN access
    if (auth.userRole !== 'MANAJER' && auth.userRole !== 'ADMIN') {
        alert('Hanya Manajer dan Admin yang dapat mengakses halaman ini');
        window.location.href = '/kasir/dashboard';
        return;
    }

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

    // Sidebar functionality
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
        });
    });

    // ========== USER MANAGEMENT FUNCTIONALITY - READ ONLY ==========
    
    // Load users data
    await loadUsersData();
});

// ========== API FUNCTIONS ==========

async function loadUsersData() {
    try {
        // Gunakan endpoint manajer langsung
        const response = await fetch('http://localhost:8080/api/manajer/akun', {
            headers: AuthHelper.getAuthHeaders()
        });

        if (response.ok) {
            const users = await response.json();
            updateUsersTable(users);
            updateUserStats(users);
        } else {
            const errorData = await response.json().catch(() => null);
            const errorMsg = errorData?.message || errorData?.details || `HTTP ${response.status}`;
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Gagal memuat data pengguna: ' + error.message);
        
        // Fallback: Show empty state
        showEmptyState();
    }
}

function showEmptyState() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="4" style="padding: 40px; text-align: center; color: var(--text-secondary)">
                <div style="font-size: 16px; margin-bottom: 8px;">Tidak dapat memuat data pengguna</div>
                <div style="font-size: 14px;">Silakan refresh halaman atau coba lagi nanti</div>
            </td>
        </tr>
    `;
}

// ========== UI UPDATE FUNCTIONS ==========

function updateUsersTable(users) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid var(--border-color)';
        
        // Get initial for avatar
        const initial = user.username ? user.username.charAt(0).toUpperCase() : 'U';
        
        // Determine role color
        const roleStyles = {
            'ADMIN': { bg: '#fee2e2', color: '#991b1b' },
            'MANAJER': { bg: '#fef3c7', color: '#92400e' },
            'KASIR': { bg: '#d1fae5', color: '#065f46' }
        };
        
        const roleStyle = roleStyles[user.role] || roleStyles.KASIR;
        
        // Determine status (mock data for now)
        const isOnline = Math.random() > 0.5; // Mock data - 50% chance online
        const statusStyle = isOnline ? 
            { bg: '#d1fae5', color: '#065f46', text: '● Online' } : 
            { bg: '#e5e7eb', color: '#374151', text: '○ Offline' };

        row.innerHTML = `
            <td style="padding:12px 8px">
                <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:32px;height:32px;border-radius:50%;background:${getRoleColor(user.role)};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px">${initial}</div>
                    <span style="color:var(--text-primary)">${formatDisplayName(user.username)}</span>
                </div>
            </td>
            <td style="padding:12px 8px;color:var(--text-secondary)">${user.username}</td>
            <td style="padding:12px 8px;text-align:center">
                <span style="background:${roleStyle.bg};color:${roleStyle.color};padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600">${user.role}</span>
            </td>
            <td style="padding:12px 8px;text-align:center">
                <span style="background:${statusStyle.bg};color:${statusStyle.color};padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600">${statusStyle.text}</span>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function updateUserStats(users) {
    // Update card statistics
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const managerCount = users.filter(u => u.role === 'MANAJER').length;
    const kasirCount = users.filter(u => u.role === 'KASIR').length;
    
    // Mock online users (since we don't have real tracking)
    const onlineCount = Math.floor(totalUsers * 0.3); // 30% online
    const offlineCount = totalUsers - onlineCount;

    // Update cards
    updateCardValue('.card.feature:nth-child(1) .value', `${totalUsers} Pengguna`);
    updateCardValue('.card.feature:nth-child(2) .value', `${adminCount} Admin`);
    updateCardValue('.card.feature:nth-child(3) .value', `${managerCount} Manajer`);
    updateCardValue('.card.feature:nth-child(4) .value', `${kasirCount} Kasir`);
    updateCardValue('.grid:nth-child(3) .card.feature:nth-child(1) .value', `${onlineCount} Online`);
    updateCardValue('.grid:nth-child(3) .card.feature:nth-child(2) .value', `${offlineCount} Offline`);
}

function updateCardValue(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = value;
    }
}

function getRoleColor(role) {
    const colors = {
        'ADMIN': '#ff5252',
        'MANAJER': '#f6b24a', 
        'KASIR': '#10b759'
    };
    return colors[role] || '#10b759';
}

function formatDisplayName(username) {
    if (!username) return 'N/A';
    
    // Remove domain/email parts if any
    let name = username.split('@')[0];
    
    // Replace dots and underscores with spaces
    name = name.replace(/[._]/g, ' ');
    
    // Convert to title case
    name = name.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    return name;
}
// ========== UTILITY FUNCTIONS ==========

function showError(message) {
    // Simple error display
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fee2e2;
        color: #991b1b;
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid #fecaca;
        z-index: 10000;
        max-width: 400px;
    `;
    errorDiv.textContent = 'Error: ' + message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    // Simple success display
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d1fae5;
        color: #065f46;
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid #a7f3d0;
        z-index: 10000;
        max-width: 400px;
    `;
    successDiv.textContent = 'Sukses: ' + message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Auto-refresh data every 30 seconds
setInterval(async () => {
    const auth = AuthHelper.checkAuth();
    if (auth && (auth.userRole === 'MANAJER' || auth.userRole === 'ADMIN')) {
        await loadUsersData();
    }
}, 30000);