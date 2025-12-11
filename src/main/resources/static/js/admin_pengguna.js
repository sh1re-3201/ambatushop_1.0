// admin_pengguna.js - FIXED VERSION dengan Real-time User Tracking
// Kontrol sidebar dan authentication
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const auth = AuthHelper.checkAuth();
    if (!auth) return;

    // Only allow ADMIN access
    if (auth.userRole !== 'ADMIN') {
        alert('Hanya ADMIN yang dapat mengakses halaman ini');
        window.location.href = '/beranda_admin.html';
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

    // ========== REAL-TIME USER TRACKING INITIALIZATION ==========

    // Add connection status indicator
    addConnectionStatusIndicator();

    // Start real-time data updates
    startRealTimeUpdates();

    // Send initial activity ping
    sendActivityPing();

    // Load users data
    await loadRealTimeData();

    // Add event listener for "Tambah Pengguna" button
    const addUserBtn = document.querySelector('button[style*="background:#2b7cff"]');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', showAddUserModal);
    }
});

// ========== REAL-TIME USER TRACKING ==========

let activityInterval;
let dataUpdateInterval;
let userStats = {
    totalUsers: 0,
    onlineUsers: 0,
    offlineUsers: 0,
    adminCount: 0,
    managerCount: 0,
    kasirCount: 0,
    activeAdmin: 0,
    activeManager: 0,
    activeKasir: 0
};

function addConnectionStatusIndicator() {
    // Create connection status indicator if not exists
    if (!document.getElementById('connectionStatus')) {
        const statusHtml = `
            <div class="connection-status" id="connectionStatus" style="display: none;">
                <span class="connection-dot"></span>
                <span class="connection-text">Menyambungkan...</span>
            </div>
        `;

        const contentMain = document.querySelector('.content-main');
        if (contentMain) {
            contentMain.insertAdjacentHTML('afterbegin', statusHtml);
        }
    }
}

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    if (!statusEl) return;

    statusEl.style.display = 'flex';

    if (connected) {
        statusEl.className = 'connection-status connected';
        statusEl.innerHTML = `
            <span class="connection-dot connected"></span>
            <span class="connection-text">Terhubung ke server</span>
        `;

        // Hide after 3 seconds
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    } else {
        statusEl.className = 'connection-status disconnected';
        statusEl.innerHTML = `
            <span class="connection-dot disconnected"></span>
            <span class="connection-text">Terputus dari server. Menampilkan data terakhir...</span>
        `;
    }
}

// ========== LOAD REAL DATA ==========

async function loadRealTimeData() {
    try {
        console.log('🔄 Loading real-time user data...');
        updateConnectionStatus(true);

        // Load user stats from new endpoint
        const statsResponse = await fetch('http://localhost:8080/api/admin/users/stats', {
            headers: AuthHelper.getAuthHeaders()
        });

        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('📊 User stats:', stats);

            // Convert counts from backend to numbers
            userStats = {
                totalUsers: Number(stats.totalUsers) || 0,
                onlineUsers: Number(stats.onlineUsers) || 0,
                offlineUsers: Number(stats.offlineUsers) || 0,
                adminCount: Number(stats.adminCount) || 0,
                managerCount: Number(stats.managerCount) || 0,
                kasirCount: Number(stats.kasirCount) || 0,
                activeAdmin: Number(stats.activeAdmins) || 0,
                activeManager: Number(stats.activeManagers) || 0,
                activeKasir: Number(stats.activeKasirs) || 0
            };

            console.log('📈 Processed stats:', userStats);
            updateStatsCardsReal(userStats);
        } else {
            console.warn('⚠️ Stats endpoint failed, falling back to old endpoint');
            // Fallback to old endpoint
            await loadUsersDataFallback();
        }

        // Load users with status
        const usersResponse = await fetch('http://localhost:8080/api/admin/users/all-with-status', {
            headers: AuthHelper.getAuthHeaders()
        });

        if (usersResponse.ok) {
            const users = await usersResponse.json();
            console.log('👥 Users with status:', users);
            updateUsersTableReal(users);
        } else {
            console.warn('⚠️ Users endpoint failed, falling back');
            // Fallback to old endpoint
            await loadUsersDataFallback();
        }

    } catch (error) {
        console.error('❌ Error loading real-time data:', error);
        updateConnectionStatus(false);
        // Fallback to mock data if API fails
        loadMockData();
    }
}

async function loadUsersDataFallback() {
    try {
        const response = await fetch('http://localhost:8080/api/admin/akun', {
            headers: AuthHelper.getAuthHeaders()
        });

        if (response.ok) {
            const users = await response.json();

            // Calculate stats manually
            const totalUsers = users.length;
            const onlineUsers = users.filter(u => u.isOnline).length;
            const offlineUsers = totalUsers - onlineUsers;

            const adminCount = users.filter(u => u.role === 'ADMIN').length;
            const managerCount = users.filter(u => u.role === 'MANAJER').length;
            const kasirCount = users.filter(u => u.role === 'KASIR').length;

            const activeAdmin = users.filter(u => u.role === 'ADMIN' && u.isOnline).length;
            const activeManager = users.filter(u => u.role === 'MANAJER' && u.isOnline).length;
            const activeKasir = users.filter(u => u.role === 'KASIR' && u.isOnline).length;

            userStats = {
                totalUsers,
                onlineUsers,
                offlineUsers,
                adminCount,
                managerCount,
                kasirCount,
                activeAdmin,
                activeManager,
                activeKasir
            };

            updateStatsCardsReal(userStats);
            updateUsersTable(users);
        }
    } catch (error) {
        console.error('Fallback also failed:', error);
    }
}

// Fungsi baru untuk update semua card dengan satu panggilan
function updateAllUserCards(stats) {
    // Pastikan stats ada
    if (!stats) {
        console.error('No stats provided');
        return;
    }

    console.log('🔄 Updating all user cards with:', stats);

    // Mapping untuk setiap card
    const cardUpdates = [
        { selector: '.card.feature:nth-child(1) .value', value: `${stats.totalUsers} Pengguna` },
        { selector: '.card.feature:nth-child(2) .value', value: `${stats.adminCount} Admin` },
        { selector: '.card.feature:nth-child(3) .value', value: `${stats.managerCount} Manajer` },
        { selector: '.card.feature:nth-child(4) .value', value: `${stats.kasirCount} Kasir` },
        { selector: '#onlineUsersCount', value: `${stats.onlineUsers} Online` },
        { selector: '#offlineUsersCount', value: `${stats.offlineUsers} Offline` }
    ];

    cardUpdates.forEach(card => {
        let element;

        // Jika selector adalah ID
        if (card.selector.startsWith('#')) {
            element = document.getElementById(card.selector.substring(1));
        } else {
            // Jika selector CSS biasa
            element = document.querySelector(card.selector);
        }

        if (element) {
            element.textContent = card.value;
            console.log(`✅ Updated ${card.selector}: ${card.value}`);
        } else {
            console.warn(`⚠️ Element not found: ${card.selector}`);
        }
    });
}

function updateStatsCardsReal(stats) {
    console.log('🎨 Updating cards with real stats:', stats);

    // Update ALL cards with real data
    const totalUsersElement = document.querySelector('.card.feature:nth-child(1) .value');
    const adminCountElement = document.querySelector('.card.feature:nth-child(2) .value');
    const managerCountElement = document.querySelector('.card.feature:nth-child(3) .value');
    const kasirCountElement = document.querySelector('.card.feature:nth-child(4) .value');
    const onlineUsersElement = document.getElementById('onlineUsersCount');
    const offlineUsersElement = document.getElementById('offlineUsersCount');

    // Card 1: Total Pengguna
    if (totalUsersElement) {
        totalUsersElement.textContent = `${stats.totalUsers} Pengguna`;
        console.log('Updated Total Users:', stats.totalUsers);
    }

    // Card 2: Admin
    if (adminCountElement) {
        adminCountElement.textContent = `${stats.adminCount} Admin`;
        console.log('Updated Admin:', stats.adminCount);
    }

    // Card 3: Manajer
    if (managerCountElement) {
        managerCountElement.textContent = `${stats.managerCount} Manajer`;
        console.log('Updated Manager:', stats.managerCount);
    }

    // Card 4: Kasir
    if (kasirCountElement) {
        kasirCountElement.textContent = `${stats.kasirCount} Kasir`;
        console.log('Updated Kasir:', stats.kasirCount);
    }

    // Card 5: Pengguna Online (ini yang penting!)
    if (onlineUsersElement) {
        onlineUsersElement.textContent = `${stats.onlineUsers} Online`;
        console.log('Updated Online Users:', stats.onlineUsers);
    } else {
        console.error('❌ Online users element not found!');
        // Fallback: coba dengan selector lain
        const fallbackElement = document.querySelector('.card.feature:nth-child(5) .value');
        if (fallbackElement) {
            fallbackElement.textContent = `${stats.onlineUsers} Online`;
        }
    }

    // Card 6: Pengguna Offline (ini juga penting!)
    if (offlineUsersElement) {
        offlineUsersElement.textContent = `${stats.offlineUsers} Offline`;
        console.log('Updated Offline Users:', stats.offlineUsers);
    } else {
        console.error('❌ Offline users element not found!');
        // Fallback: coba dengan selector lain
        const fallbackElement = document.querySelector('.card.feature:nth-child(6) .value');
        if (fallbackElement) {
            fallbackElement.textContent = `${stats.offlineUsers} Offline`;
        }
    }

    // Update subtitles with active counts
    const adminSubtitle = document.querySelector('.card.feature:nth-child(2) .subtitle');
    const managerSubtitle = document.querySelector('.card.feature:nth-child(3) .subtitle');
    const kasirSubtitle = document.querySelector('.card.feature:nth-child(4) .subtitle');

    if (adminSubtitle && stats.activeAdmin !== undefined) {
        adminSubtitle.textContent = `${stats.activeAdmin} aktif sekarang`;
    }

    if (managerSubtitle && stats.activeManager !== undefined) {
        managerSubtitle.textContent = `${stats.activeManager} aktif sekarang`;
    }

    if (kasirSubtitle && stats.activeKasir !== undefined) {
        kasirSubtitle.textContent = `${stats.activeKasir} aktif sekarang`;
    }
}


// Update subtitles with active counts
const adminSubtitle = document.querySelector('.card.feature:nth-child(2) .subtitle');
const managerSubtitle = document.querySelector('.card.feature:nth-child(3) .subtitle');
const kasirSubtitle = document.querySelector('.card.feature:nth-child(4) .subtitle');

if (adminSubtitle && stats.activeAdmin !== undefined) {
    adminSubtitle.textContent = `${stats.activeAdmin} aktif sekarang`;
}

if (managerSubtitle && stats.activeManager !== undefined) {
    managerSubtitle.textContent = `${stats.activeManager} aktif sekarang`;
}

if (kasirSubtitle && stats.activeKasir !== undefined) {
    kasirSubtitle.textContent = `${stats.activeKasir} aktif sekarang`;
}


function updateUsersTableReal(users) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) {
        console.error('❌ Table body not found');
        return;
    }

    tbody.innerHTML = '';
    console.log('📋 Updating table with', users.length, 'users');

    if (users.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" style="text-align:center;padding:20px;color:var(--text-secondary)">
                Tidak ada data pengguna
            </td>
        `;
        tbody.appendChild(row);
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid var(--border-color)';

        // Determine role color
        const roleStyles = {
            'ADMIN': { bg: '#fee2e2', color: '#991b1b' },
            'MANAJER': { bg: '#fef3c7', color: '#92400e' },
            'KASIR': { bg: '#d1fae5', color: '#065f46' }
        };

        const roleStyle = roleStyles[user.role] || roleStyles.KASIR;

        // Determine status - FIXED: Use isOnline from API response
        const isOnline = user.isOnline === true || user.isOnline === 'true' || user.online === true;
        console.log(`User ${user.username}: isOnline=${isOnline} (raw: ${user.isOnline})`);

        const statusStyle = isOnline ?
            { bg: '#d1fae5', color: '#065f46', text: '● Online' } :
            { bg: '#e5e7eb', color: '#374151', text: '○ Offline' };

        // Format last activity time
        const lastActivity = user.lastActivity ?
            formatTimeAgo(user.lastActivity) :
            (user.lastActivityAt ? formatTimeAgo(user.lastActivityAt) : 'Belum pernah aktif');

        row.innerHTML = `
            <td style="padding:12px 8px">
                <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:32px;height:32px;border-radius:50%;background:${getRoleColor(user.role)};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px">
                        ${user.initial || (user.username ? user.username.charAt(0).toUpperCase() : 'U')}
                    </div>
                    <div>
                        <div style="font-weight:500">${user.username || 'N/A'}</div>
                        <div style="font-size:12px;color:var(--text-secondary)">${lastActivity}</div>
                    </div>
                </div>
            </td>
            <td style="padding:12px 8px;color:var(--text-secondary)">${user.username || 'N/A'}</td>
            <td style="padding:12px 8px;text-align:center">
                <span style="background:${roleStyle.bg};color:${roleStyle.color};padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600">
                    ${user.role || 'N/A'}
                </span>
            </td>
            <td style="padding:12px 8px;text-align:center">
                <span style="background:${statusStyle.bg};color:${statusStyle.color};padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600">
                    ${statusStyle.text}
                </span>
            </td>
            <td style="padding:12px 8px;text-align:center">
                <button class="edit-btn" data-user-id="${user.id || user.idPegawai}" style="padding:4px 12px;background:#f3f4f6;border:0;border-radius:6px;cursor:pointer;margin:0 4px">Edit</button>
                <button class="delete-btn" data-user-id="${user.id || user.idPegawai}" data-username="${user.username}" style="padding:4px 12px;background:#fee2e2;color:#991b1b;border:0;border-radius:6px;cursor:pointer">Hapus</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    // Add event listeners
    addUserActionListeners();
}

// ========== REAL-TIME UPDATES ==========

function startRealTimeUpdates() {
    console.log('⏰ Starting real-time updates...');

    // Load initial data
    loadRealTimeData();

    // Update every 30 seconds
    if (dataUpdateInterval) clearInterval(dataUpdateInterval);
    dataUpdateInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing user data...');
        loadRealTimeData();
    }, 30000);

    // Send activity ping every 2 minutes to keep session alive
    if (activityInterval) clearInterval(activityInterval);
    activityInterval = setInterval(sendActivityPing, 120000);
}

async function sendActivityPing() {
    try {
        console.log('📡 Sending activity ping...');
        const response = await fetch('http://localhost:8080/api/auth/activity', {
            method: 'POST',
            headers: AuthHelper.getAuthHeaders()
        });

        if (response.ok) {
            console.log('✅ Activity ping successful');
        } else {
            console.warn('⚠️ Activity ping failed with status:', response.status);
        }
    } catch (error) {
        console.error('❌ Activity ping failed:', error);
    }
}

// ========== UTILITY FUNCTIONS ==========

function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Tidak diketahui';

    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Format waktu salah';

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;

        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting time:', error);
        return 'Tidak diketahui';
    }
}

function addUserActionListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.target.getAttribute('data-user-id');
            showEditUserModal(userId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.target.getAttribute('data-user-id');
            const username = e.target.getAttribute('data-username');
            confirmDeleteUser(userId, username);
        });
    });
}

// ========== FALLBACK MOCK DATA ==========

function loadMockData() {
    console.warn('⚠️ Using mock data - API connection failed');

    // Simulate some data
    userStats = {
        totalUsers: 3, // Default 3 user dari DataLoader
        onlineUsers: 1, // Hanya admin yang login
        offlineUsers: 2,
        adminCount: 1,
        managerCount: 1,
        kasirCount: 1,
        activeAdmin: 1,
        activeManager: 0,
        activeKasir: 0
    };

    updateStatsCardsReal(userStats);

    // Show warning to user
    if (!document.querySelector('.connection-status.disconnected')) {
        const warning = document.createElement('div');
        warning.className = 'connection-status disconnected';
        warning.innerHTML = `
            <span class="connection-dot disconnected"></span>
            <span class="connection-text">Terputus dari server. Menampilkan data simulasi.</span>
        `;

        const contentMain = document.querySelector('.content-main');
        if (contentMain) {
            contentMain.insertBefore(warning, contentMain.firstChild);
        }
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

// ========== EXISTING API FUNCTIONS (keep for compatibility) ==========

async function loadUsersData() {
    try {
        const response = await fetch('http://localhost:8080/api/admin/akun', {
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
    }
}

async function createUser(userData) {
    try {
        const response = await fetch('http://localhost:8080/api/admin/akun', {
            method: 'POST',
            headers: AuthHelper.getAuthHeaders(),
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.message || data.details || 'Gagal membuat pengguna' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateUser(userId, userData) {
    try {
        const response = await fetch(`http://localhost:8080/api/admin/akun/${userId}`, {
            method: 'PUT',
            headers: AuthHelper.getAuthHeaders(),
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.message || data.details || 'Gagal mengupdate pengguna' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function deleteUser(userId) {
    try {
        const response = await fetch(`http://localhost:8080/api/admin/akun/${userId}`, {
            method: 'DELETE',
            headers: AuthHelper.getAuthHeaders()
        });

        if (response.ok) {
            return { success: true };
        } else {
            const data = await response.json();
            return { success: false, error: data.message || data.details || 'Gagal menghapus pengguna' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ========== UI UPDATE FUNCTIONS (keep for compatibility) ==========

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

        // Determine status from real data
        const isOnline = user.isOnline === true;
        const statusStyle = isOnline ?
            { bg: '#d1fae5', color: '#065f46', text: '● Online' } :
            { bg: '#e5e7eb', color: '#374151', text: '○ Offline' };

        row.innerHTML = `
            <td style="padding:12px 8px">
                <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:32px;height:32px;border-radius:50%;background:${getRoleColor(user.role)};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px">${initial}</div>
                    <span>${user.username || 'N/A'}</span>
                </div>
            </td>
            <td style="padding:12px 8px;color:var(--text-secondary)">${user.username}</td>
            <td style="padding:12px 8px;text-align:center">
                <span style="background:${roleStyle.bg};color:${roleStyle.color};padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600">${user.role}</span>
            </td>
            <td style="padding:12px 8px;text-align:center">
                <span style="background:${statusStyle.bg};color:${statusStyle.color};padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600">${statusStyle.text}</span>
            </td>
            <td style="padding:12px 8px;text-align:center">
                <button class="edit-btn" data-user-id="${user.idPegawai}" style="padding:4px 12px;background:#f3f4f6;border:0;border-radius:6px;cursor:pointer;margin:0 4px">Edit</button>
                <button class="delete-btn" data-user-id="${user.idPegawai}" data-username="${user.username}" style="padding:4px 12px;background:#fee2e2;color:#991b1b;border:0;border-radius:6px;cursor:pointer">Hapus</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    // Add event listeners to buttons
    addUserActionListeners();
}

function updateUserStats(users) {
    console.log('📊 Calculating stats from users array:', users);

    // Update card statistics
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const managerCount = users.filter(u => u.role === 'MANAJER').length;
    const kasirCount = users.filter(u => u.role === 'KASIR').length;

    // Real online users
    const onlineUsers = users.filter(u => u.isOnline === true).length;
    const offlineUsers = totalUsers - onlineUsers;

    console.log('Calculated stats:', {
        totalUsers, onlineUsers, offlineUsers,
        adminCount, managerCount, kasirCount
    });

    // Update cards using ID jika ada, atau fallback ke selector
    updateCardValueWithId('onlineUsersCount', `${onlineUsers} Online`);
    updateCardValueWithId('offlineUsersCount', `${offlineUsers} Offline`);

    // Fallback untuk card lainnya
    updateCardValue('.card.feature:nth-child(1) .value', `${totalUsers} Pengguna`);
    updateCardValue('.card.feature:nth-child(2) .value', `${adminCount} Admin`);
    updateCardValue('.card.feature:nth-child(3) .value', `${managerCount} Manajer`);
    updateCardValue('.card.feature:nth-child(4) .value', `${kasirCount} Kasir`);
}

// Fungsi baru untuk update dengan ID
function updateCardValueWithId(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        console.log(`Updated ${elementId}:`, value);
    } else {
        console.error(`Element with ID "${elementId}" not found`);
    }
}

function updateCardValue(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = value;
    }
}

// ========== MODAL FUNCTIONS (keep existing) ==========

function showAddUserModal() {
    const modalHtml = `
        <div class="modal-overlay" id="userModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Tambah Pengguna Baru</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="userForm" class="modal-form">
                    <input type="hidden" id="userId">
                    <div class="form-group">
                        <label for="username">Username *</label>
                        <input type="text" id="username" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email *</label>
                        <input type="email" id="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password *</label>
                        <input type="password" id="password" required>
                        <small>Minimal 8 karakter, mengandung huruf besar, kecil, dan angka</small>
                    </div>
                    <div class="form-group">
                        <label for="role">Role *</label>
                        <select id="role" required>
                            <option value="">Pilih Role</option>
                            <option value="KASIR">Kasir</option>
                            <option value="MANAJER">Manajer</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-cancel">Batal</button>
                        <button type="submit" class="btn-submit">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    setupModalEvents();
}

async function showEditUserModal(userId) {
    try {
        const response = await fetch(`http://localhost:8080/api/admin/akun/${userId}`, {
            headers: AuthHelper.getAuthHeaders()
        });

        if (response.ok) {
            const user = await response.json();

            const modalHtml = `
                <div class="modal-overlay" id="userModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Edit Pengguna</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <form id="userForm" class="modal-form">
                            <input type="hidden" id="userId" value="${user.idPegawai}">
                            <div class="form-group">
                                <label for="username">Username *</label>
                                <input type="text" id="username" value="${user.username}" required>
                            </div>
                            <div class="form-group">
                                <label for="email">Email *</label>
                                <input type="email" id="email" value="${user.email}" required>
                            </div>
                            <div class="form-group">
                                <label for="password">Password</label>
                                <input type="password" id="password" placeholder="Kosongkan jika tidak ingin mengubah">
                                <small>Minimal 8 karakter, mengandung huruf besar, kecil, dan angka</small>
                            </div>
                            <div class="form-group">
                                <label for="role">Role *</label>
                                <select id="role" required>
                                    <option value="KASIR" ${user.role === 'KASIR' ? 'selected' : ''}>Kasir</option>
                                    <option value="MANAJER" ${user.role === 'MANAJER' ? 'selected' : ''}>Manajer</option>
                                    <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
                                </select>
                            </div>
                            <div class="modal-actions">
                                <button type="button" class="btn-cancel">Batal</button>
                                <button type="submit" class="btn-submit">Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            setupModalEvents();
        } else {
            throw new Error('Gagal memuat data pengguna');
        }
    } catch (error) {
        showError('Gagal memuat data pengguna: ' + error.message);
    }
}

function setupModalEvents() {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.btn-cancel');

    // Close modal events
    [closeBtn, cancelBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            modal.remove();
        });
    });

    // Form submit event
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleUserSubmit();
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

async function handleUserSubmit() {
    const form = document.getElementById('userForm');
    const userId = document.getElementById('userId').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    const userData = {
        username,
        email,
        role
    };

    // Only include password if provided (for update)
    if (password) {
        userData.password = password;
    }

    let result;
    if (userId) {
        // Update existing user
        result = await updateUser(userId, userData);
    } else {
        // Create new user - password is required
        if (!password) {
            showError('Password wajib diisi untuk pengguna baru');
            return;
        }
        userData.password = password;
        result = await createUser(userData);
    }

    if (result.success) {
        // Close modal and refresh data
        document.getElementById('userModal').remove();
        await loadRealTimeData();
        showSuccess(userId ? 'Pengguna berhasil diupdate' : 'Pengguna berhasil dibuat');
    } else {
        showError(result.error);
    }
}

async function confirmDeleteUser(userId, username) {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${username}"?`)) {
        const result = await deleteUser(userId);

        if (result.success) {
            await loadRealTimeData();
            showSuccess('Pengguna berhasil dihapus');
        } else {
            showError(result.error);
        }
    }
}

// ========== UTILITY FUNCTIONS ==========

function showError(message) {
    // Simple error display
    alert('❌ Error: ' + message);
}

function showSuccess(message) {
    // Simple success display
    alert('✅ ' + message);
}

// ========== INJECT CSS STYLES ==========

document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('#admin-pengguna-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'admin-pengguna-styles';
        styleEl.textContent = `
            /* Real-time status indicators */
            .connection-status {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 16px;
                font-size: 14px;
                font-weight: 500;
                animation: fadeIn 0.3s ease;
            }
            
            .connection-status.connected {
                background: #d1fae5;
                color: #065f46;
                border: 1px solid #a7f3d0;
            }
            
            .connection-status.disconnected {
                background: #fef3c7;
                color: #92400e;
                border: 1px solid #fde68a;
            }
            
            .connection-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }
            
            .connection-dot.connected {
                background: #10b759;
                animation: pulse 2s infinite;
            }
            
            .connection-dot.disconnected {
                background: #f59e0b;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* Loading animation */
            .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(0,0,0,0.1);
                border-top-color: #2b7cff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                vertical-align: middle;
                margin-right: 8px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            /* Card animation */
            .card.feature {
                transition: all 0.3s ease;
            }
            
            .card.feature:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }
            
            /* Responsive table */
            @media (max-width: 768px) {
                table {
                    display: block;
                    overflow-x: auto;
                    white-space: nowrap;
                }
            }
        `;
        document.head.appendChild(styleEl);
    }
});