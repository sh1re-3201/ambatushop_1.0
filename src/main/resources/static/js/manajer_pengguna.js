// manajer_pengguna.js - FIXED VERSION with Real-time Data
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const auth = AuthHelper.checkAuth();
    if (!auth) return;

    // Only allow MANAGER or ADMIN access
    if (auth.userRole !== 'MANAJER' && auth.userRole !== 'ADMIN') {
        alert('Hanya Manajer dan Admin yang dapat mengakses halaman ini');
        window.location.href = '/kasir_dashboard.html';
        return;
    }

    console.log('🚀 Manager User Page - Role:', auth.userRole);

    // Setup UI components
    await setupUI();
    
    // Load real-time data using CORRECT endpoints
    await loadManagerUserData();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Add connection status
    addConnectionStatusIndicator();
});

// ========== UI SETUP ==========
async function setupUI() {
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
    const sunIcon = themeToggle?.querySelector('.sun-icon');
    const moonIcon = themeToggle?.querySelector('.moon-icon');

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
        if (!sunIcon || !moonIcon) return;
        
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
        if (avatarDropdown && !avatarDropdown.contains(e.target) && !avatarBtn?.contains(e.target)) {
            avatarDropdown.classList.remove('show');
        }
    });

    // Avatar selection
    avatarOptions.forEach(option => {
        option.addEventListener('click', () => {
            const avatarSrc = option.src;
            if (currentAvatar) {
                currentAvatar.src = avatarSrc;
                currentAvatar.style.display = 'block';
            }
            if (defaultAvatar) defaultAvatar.style.display = 'none';
            
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            localStorage.setItem('selectedAvatar', avatarSrc);
            avatarDropdown.classList.remove('show');
        });
    });

    // Load saved avatar
    const savedAvatar = localStorage.getItem('selectedAvatar');
    if (savedAvatar && currentAvatar) {
        currentAvatar.src = savedAvatar;
        currentAvatar.style.display = 'block';
        if (defaultAvatar) defaultAvatar.style.display = 'none';
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
        btn.addEventListener('click', (e) => {
            // Only prevent default if it's not a link
            if (!btn.href) {
                e.preventDefault();
                menuButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });
}

// ========== DATA LOADING - CORRECT ENDPOINTS ==========
async function loadManagerUserData() {
    console.log('🔄 Loading manager user data...');
    
    try {
        // Show loading state
        showLoadingState(true);
        
        // CORRECT: Use manager endpoints that already exist in your backend
        const [dashboardResponse, usersResponse] = await Promise.all([
            fetch('http://localhost:8080/api/manajer/dashboard/combined', {
                headers: AuthHelper.getAuthHeaders()
            }).catch(() => null),
            
            fetch('http://localhost:8080/api/manajer/users/all-with-status', {
                headers: AuthHelper.getAuthHeaders()
            }).catch(() => null)
        ]);
        
        if (dashboardResponse?.ok && usersResponse?.ok) {
            const dashboardData = await dashboardResponse.json();
            const users = await usersResponse.json();
            
            console.log('✅ Dashboard data:', dashboardData);
            console.log('✅ Users data:', users);
            
            // Update with real data
            updateStatsFromDashboard(dashboardData);
            updateUsersTable(users);
            updateConnectionStatus(true);
            
            // Show success indicator
            showSuccessIndicator('Data diperbarui');
            
        } else {
            console.warn('⚠️ Manager endpoints failed, trying alternative...');
            await loadAlternativeData();
        }
        
    } catch (error) {
        console.error('❌ Error loading manager data:', error);
        updateConnectionStatus(false);
        loadFallbackData();
    } finally {
        showLoadingState(false);
    }
}

async function loadAlternativeData() {
    try {
        // Try admin endpoint as fallback (if manager has access)
        const [statsResponse, usersResponse] = await Promise.all([
            fetch('http://localhost:8080/api/manajer/users/stats', {
                headers: AuthHelper.getAuthHeaders()
            }),
            fetch('http://localhost:8080/api/manajer/users/list', {
                headers: AuthHelper.getAuthHeaders()
            })
        ]);
        
        if (statsResponse.ok && usersResponse.ok) {
            const stats = await statsResponse.json();
            const users = await usersResponse.json();
            
            console.log('📊 Alternative stats:', stats);
            console.log('👥 Alternative users:', users);
            
            updateStatsFromResponse(stats);
            updateUsersTable(users);
            updateConnectionStatus(true);
            
        } else {
            throw new Error('Alternative endpoints failed');
        }
        
    } catch (error) {
        console.error('❌ Alternative data failed:', error);
        await loadBasicUserData();
    }
}

async function loadBasicUserData() {
    try {
        // Last resort: basic users list
        const response = await fetch('http://localhost:8080/api/manajer/akun', {
            headers: AuthHelper.getAuthHeaders()
        });
        
        if (response.ok) {
            const users = await response.json();
            console.log('📋 Basic users data:', users);
            
            const stats = calculateStatsFromUsers(users);
            updateCardsWithStats(stats);
            updateUsersTable(users);
            updateConnectionStatus(true);
            
        } else {
            throw new Error('Basic endpoint failed');
        }
        
    } catch (error) {
        console.error('❌ All data sources failed:', error);
        loadFallbackData();
    }
}

// ========== UI UPDATE FUNCTIONS ==========
function updateStatsFromDashboard(dashboardData) {
    if (!dashboardData) return;
    
    const stats = dashboardData.stats || {};
    const users = dashboardData.users || [];
    
    console.log('🎨 Updating from dashboard:', stats);
    
    // Card 1: Total Users
    updateElement('#totalUsersValue', `${stats.totalUsers || 0} Pengguna`);
    
    // Card 2: Admin
    updateElement('#adminCountValue', `${stats.adminCount || 0} Admin`);
    updateElement('#adminSubtitle', `${stats.activeAdmins || 0} aktif sekarang`);
    
    // Card 3: Manager
    updateElement('#managerCountValue', `${stats.managerCount || 0} Manajer`);
    updateElement('#managerSubtitle', `${stats.activeManagers || 0} aktif sekarang`);
    
    // Card 4: Kasir
    updateElement('#kasirCountValue', `${stats.kasirCount || 0} Kasir`);
    updateElement('#kasirSubtitle', `${stats.activeKasirs || 0} aktif sekarang`);
    
    // Online/Offline cards
    updateElement('#onlineUsersCount', `${stats.onlineUsers || 0} Online`);
    updateElement('#offlineUsersCount', `${stats.offlineUsers || 0} Offline`);
    
    // Highlight updates
    highlightUpdatedCards();
}

function updateStatsFromResponse(stats) {
    console.log('📈 Updating from stats response:', stats);
    
    updateElement('#totalUsersValue', `${stats.totalUsers || 0} Pengguna`);
    updateElement('#adminCountValue', `${stats.adminCount || 0} Admin`);
    updateElement('#managerCountValue', `${stats.managerCount || 0} Manajer`);
    updateElement('#kasirCountValue', `${stats.kasirCount || 0} Kasir`);
    updateElement('#onlineUsersCount', `${stats.onlineUsers || 0} Online`);
    updateElement('#offlineUsersCount', `${stats.offlineUsers || 0} Offline`);
    
    // Update subtitles if available
    if (stats.activeAdmins !== undefined) {
        updateElement('#adminSubtitle', `${stats.activeAdmins} aktif sekarang`);
    }
    if (stats.activeManagers !== undefined) {
        updateElement('#managerSubtitle', `${stats.activeManagers} aktif sekarang`);
    }
    if (stats.activeKasirs !== undefined) {
        updateElement('#kasirSubtitle', `${stats.activeKasirs} aktif sekarang`);
    }
}

function updateUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) {
        console.error('❌ Table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:40px;color:var(--text-secondary)">
                    Tidak ada data pengguna
                </td>
            </tr>
        `;
        return;
    }
    
    console.log(`📋 Rendering ${users.length} users in table`);
    
    users.forEach(user => {
        const row = createUserTableRow(user);
        tbody.appendChild(row);
    });
}

function createUserTableRow(user) {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--border-color)';
    
    // Get user data with fallbacks
    const username = user.username || user.email || 'N/A';
    const email = user.email || '';
    const role = user.role || 'KASIR';
    const isOnline = user.isOnline === true || user.isCurrentlyActive === true;
    const lastActivity = user.lastActivity || user.lastActivityAt || '';
    const initial = user.initial || (username ? username.charAt(0).toUpperCase() : 'U');
    
    // Determine role color
    const roleStyles = {
        'ADMIN': { bg: '#fee2e2', color: '#991b1b' },
        'MANAJER': { bg: '#fef3c7', color: '#92400e' },
        'MANAGER': { bg: '#fef3c7', color: '#92400e' },
        'KASIR': { bg: '#d1fae5', color: '#065f46' }
    };
    
    const roleStyle = roleStyles[role.toUpperCase()] || roleStyles.KASIR;
    
    // Status styles
    const statusStyle = isOnline ?
        { bg: '#d1fae5', color: '#065f46', text: '● Online' } :
        { bg: '#e5e7eb', color: '#374151', text: '○ Offline' };
    
    // Format last activity time
    const lastActivityFormatted = lastActivity ? 
        formatTimeAgo(lastActivity) : 
        (isOnline ? 'Sedang aktif' : 'Belum pernah aktif');
    
    // Format display name
    const displayName = formatDisplayName(username);
    
    row.innerHTML = `
        <td style="padding:12px 8px">
            <div style="display:flex;align-items:center;gap:8px">
                <div style="width:32px;height:32px;border-radius:50%;background:${getRoleColor(role)};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px">
                    ${initial}
                </div>
                <div>
                    <div style="font-weight:500;color:var(--text-primary)">${displayName}</div>
                    <div style="font-size:12px;color:var(--text-secondary)">${email}</div>
                </div>
            </div>
        </td>
        <td style="padding:12px 8px;color:var(--text-secondary)">${username}</td>
        <td style="padding:12px 8px;text-align:center">
            <span style="background:${roleStyle.bg};color:${roleStyle.color};padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600">
                ${role}
            </span>
        </td>
        <td style="padding:12px 8px;text-align:center">
            <span style="background:${statusStyle.bg};color:${statusStyle.color};padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600">
                ${statusStyle.text}
            </span>
        </td>
        <td style="padding:12px 8px;text-align:center;color:var(--text-secondary);font-size:13px">
            ${lastActivityFormatted}
        </td>
    `;
    
    return row;
}

// ========== HELPER FUNCTIONS ==========
function updateElement(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = text;
    } else {
        console.warn(`⚠️ Element not found: ${selector}`);
    }
}

function getRoleColor(role) {
    const colors = {
        'ADMIN': '#ff5252',
        'MANAJER': '#f6b24a',
        'MANAGER': '#f6b24a',
        'KASIR': '#10b759'
    };
    return colors[role.toUpperCase()] || '#10b759';
}

function formatDisplayName(username) {
    if (!username) return 'N/A';
    
    // Remove email domain if present
    let name = username.split('@')[0];
    
    // Replace dots/underscores with spaces and capitalize
    name = name.replace(/[._]/g, ' ')
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    return name || username;
}

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
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Tidak diketahui';
    }
}

// ========== CONNECTION & STATUS ==========
function addConnectionStatusIndicator() {
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

function showLoadingState(show) {
    const cards = document.querySelectorAll('.card.feature');
    
    cards.forEach(card => {
        if (show) {
            card.classList.add('loading');
        } else {
            card.classList.remove('loading');
        }
    });
}

function highlightUpdatedCards() {
    const cards = document.querySelectorAll('.card.feature');
    cards.forEach(card => {
        card.classList.add('updated');
        setTimeout(() => card.classList.remove('updated'), 1000);
    });
}

function showSuccessIndicator(message) {
    // Remove existing indicator
    const existing = document.getElementById('updateIndicator');
    if (existing) existing.remove();
    
    const indicator = document.createElement('div');
    indicator.id = 'updateIndicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b759;
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        animation: fadeInOut 3s ease;
    `;
    indicator.textContent = message;
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.remove();
        }
    }, 3000);
}

// ========== FALLBACK DATA ==========
function loadFallbackData() {
    console.warn('⚠️ Loading fallback data');
    
    // Get static values from HTML or use defaults
    const fallbackStats = {
        totalUsers: 3,
        adminCount: 1,
        managerCount: 1,
        kasirCount: 1,
        onlineUsers: 1,
        offlineUsers: 2,
        activeAdmins: 1,
        activeManagers: 0,
        activeKasirs: 0
    };
    
    updateStatsFromResponse(fallbackStats);
    
    // Show fallback users
    const fallbackUsers = [
        { username: 'admin', email: 'admin@example.com', role: 'ADMIN', isOnline: true },
        { username: 'manajer', email: 'manajer@example.com', role: 'MANAJER', isOnline: false },
        { username: 'kasir', email: 'kasir@example.com', role: 'KASIR', isOnline: true }
    ];
    
    updateUsersTable(fallbackUsers);
    
    // Show warning
    const warning = document.createElement('div');
    warning.style.cssText = `
        background: #fef3c7;
        color: #92400e;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 14px;
        border: 1px solid #fde68a;
    `;
    warning.innerHTML = `
        <strong>⚠️ Mode Offline</strong> - Menampilkan data contoh.
        Periksa koneksi server Spring Boot Anda.
    `;
    
    const contentMain = document.querySelector('.content-main');
    if (contentMain) {
        contentMain.insertAdjacentElement('afterbegin', warning);
    }
}

// ========== AUTO REFRESH ==========
let refreshInterval;

function startAutoRefresh() {
    console.log('⏰ Auto-refresh started (30 seconds)');
    
    // Clear existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Refresh every 30 seconds
    refreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing manager data...');
        loadManagerUserData();
    }, 30000);
    
    // Refresh when page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('📱 Page visible, refreshing...');
            loadManagerUserData();
        }
    });
    
    // Send activity ping every 2 minutes
    setInterval(sendActivityPing, 120000);
}

async function sendActivityPing() {
    try {
        await fetch('http://localhost:8080/api/auth/activity', {
            method: 'POST',
            headers: AuthHelper.getAuthHeaders()
        });
    } catch (error) {
        // Silent fail
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(10px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(10px); }
    }
    
    .updated {
        animation: highlightUpdate 1s ease;
    }
    
    @keyframes highlightUpdate {
        0% { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        50% { box-shadow: 0 4px 20px rgba(16, 183, 89, 0.2); }
        100% { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    }
    
    .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid rgba(0,0,0,0.1);
        border-top-color: #2b7cff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);