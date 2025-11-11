// Kontrol sidebar dan authentication
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const auth = AuthHelper.checkAuth();
    if (!auth) return;
    
    // Only allow ADMIN access
    if (auth.userRole !== 'ADMIN') {
        alert('Hanya ADMIN yang dapat mengakses halaman ini');
        window.location.href = '/admin/dashboard';
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

    // ========== USER MANAGEMENT FUNCTIONALITY ==========
    
    // Load users data
    await loadUsersData();
    
    // Add event listener for "Tambah Pengguna" button
    const addUserBtn = document.querySelector('button[style*="background:#2b7cff"]');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', showAddUserModal);
    }
});

// ========== API FUNCTIONS ==========

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
            throw new Error('Gagal memuat data pengguna');
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
        
        // Determine status (for now, we'll use random status since we don't have real-time tracking)
        const isOnline = Math.random() > 0.5; // Mock data
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
    updateCardValue('.card.feature:nth-child(5) .value', `${onlineCount} Online`);
    updateCardValue('.card.feature:nth-child(6) .value', `${offlineCount} Offline`);
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

// ========== MODAL FUNCTIONS ==========

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
        await loadUsersData();
        showSuccess(userId ? 'Pengguna berhasil diupdate' : 'Pengguna berhasil dibuat');
    } else {
        showError(result.error);
    }
}

async function confirmDeleteUser(userId, username) {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${username}"?`)) {
        const result = await deleteUser(userId);
        
        if (result.success) {
            await loadUsersData();
            showSuccess('Pengguna berhasil dihapus');
        } else {
            showError(result.error);
        }
    }
}

// ========== UTILITY FUNCTIONS ==========

function showError(message) {
    // Simple error display - you can enhance this with better UI
    alert('Error: ' + message);
}

function showSuccess(message) {
    // Simple success display - you can enhance this with better UI
    alert('Sukses: ' + message);
}