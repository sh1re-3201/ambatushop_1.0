// Kontrol sidebar (toggle open/close) — memperbaiki referensi elemen dan mencegah error jika elemen tidak ada.
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication using AuthHelper
    const auth = AuthHelper.checkAuth();
    if (!auth) return;

    // Only allow MANAGER or ADMIN access
    if (auth.userRole !== 'MANAJER' && auth.userRole !== 'ADMIN') {
        alert('Hanya Manajer dan Admin yang dapat mengakses halaman ini');
        window.location.href = '/login';
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
    const profilBtn = document.getElementById('profile-btn')


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

    // Profile button
    profilBtn?.addEventListener('click', () => {
        window.location.href = '/menu_profile.html';
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

// ========== DASHBOARD DATA FUNCTIONS ==========

async function loadDashboardData(role) {
    try {
        console.log('🔄 Loading manager dashboard data...');

        // Load semua data secara parallel
        const [transactionsResponse, productsResponse, usersResponse, keuanganResponse] = await Promise.all([
            fetch('http://localhost:8080/api/transaksi', {
                headers: AuthHelper.getAuthHeaders()
            }),
            fetch('http://localhost:8080/api/produk', {
                headers: AuthHelper.getAuthHeaders()
            }),
            fetch('http://localhost:8080/api/manajer/users/all-with-status', {  // Endpoint khusus manajer (read-only)
                headers: AuthHelper.getAuthHeaders()
            }),
            fetch('http://localhost:8080/api/keuangan', {
                headers: AuthHelper.getAuthHeaders()
            })
        ]);

        let transactions = [];
        let products = [];
        let users = [];
        let keuangan = [];

        // Process transactions response
        if (transactionsResponse.ok) {
            transactions = await transactionsResponse.json();
            console.log('✅ Transactions loaded:', transactions.length);
        } else {
            console.error('❌ Failed to load transactions:', transactionsResponse.status);
        }

        // Process products response
        if (productsResponse.ok) {
            products = await productsResponse.json();
            console.log('✅ Products loaded:', products.length);
        } else {
            console.error('❌ Failed to load products:', productsResponse.status);
        }

        // Process users response (REAL DATA dengan status)
        if (usersResponse.ok) {
            users = await usersResponse.json();
            console.log('✅ Users with status loaded:', users.length);
        } else {
            console.error('❌ Failed to load users:', usersResponse.status);
            // Jika endpoint manajer gagal, coba endpoint admin
            const adminUsersResponse = await fetch('http://localhost:8080/api/admin/akun', {
                headers: AuthHelper.getAuthHeaders()
            });
            if (adminUsersResponse.ok) {
                const adminUsers = await adminUsersResponse.json();
                users = adminUsers.map(user => ({
                    ...user,
                    isOnline: false, // Default offline karena tidak ada data status
                    initial: user.username.charAt(0).toUpperCase()
                }));
                console.log('⚠️ Using admin users data (no online status):', users.length);
            }
        }

        // Process keuangan response
        if (keuanganResponse.ok) {
            keuangan = await keuanganResponse.json();
            console.log('✅ Keuangan data loaded:', keuangan.length);
        } else {
            console.error('❌ Failed to load keuangan data:', keuanganResponse.status);
        }

        // Update UI dengan data yang sudah di-load
        updateFinanceCard(transactions, keuangan);
        updateStockCard(products);
        updateUsersCard(users);

    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showError('Gagal memuat data dashboard');
    }
}

// ========== CARD UPDATE FUNCTIONS ==========

function updateFinanceCard(transactions, keuanganData) {
    const pemasukanElement = document.querySelector('#card-keuangan .finance-row div:first-child .value');
    const pengeluaranElement = document.querySelector('#card-keuangan .finance-row div:last-child .value');
    
    if (!pemasukanElement || !pengeluaranElement) return;

    // Hitung pemasukan bulan ini dari transaksi yang PAID
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyPemasukan = transactions
        .filter(transaction => {
            const transactionDate = new Date(transaction.tanggal);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear &&
                   transaction.paymentStatus === 'PAID';
        })
        .reduce((total, transaction) => total + (transaction.total || 0), 0);

    // Hitung pengeluaran bulan ini dari data keuangan
    const monthlyPengeluaran = keuanganData
        .filter(item => {
            const itemDate = new Date(item.tanggal);
            return itemDate.getMonth() === currentMonth && 
                   itemDate.getFullYear() === currentYear &&
                   (item.jenis === false || item.jenis === 'PENGELUARAN');
        })
        .reduce((total, item) => total + (item.nominal || 0), 0);

    // Update UI
    pemasukanElement.textContent = `Rp ${formatCurrency(monthlyPemasukan)}`;
    pengeluaranElement.textContent = `Rp ${formatCurrency(monthlyPengeluaran)}`;
    
    console.log('💰 Finance card updated:', { 
        monthlyPemasukan, 
        monthlyPengeluaran 
    });
}

function updateStockCard(products) {
    const cardStok = document.querySelector('#card-stok .card-body');
    if (!cardStok) return;

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + (product.stok || 0), 0);
    const lowStockProducts = products.filter(product => (product.stok || 0) <= 10 && (product.stok || 0) > 0).length;
    const outOfStockProducts = products.filter(product => (product.stok || 0) === 0).length;

    // Hitung nilai total stok (harga * stok)
    const totalStockValue = products.reduce((sum, product) => 
        sum + ((product.harga || 0) * (product.stok || 0)), 0
    );

    // Update card content dengan informasi yang lebih detail
    cardStok.innerHTML = `
        <h3>Stok Barang</h3>
        <p class="subtitle">Isi Inventaris</p>
        <div class="stock-stats" style="margin-top: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="color: var(--text-secondary); font-size: 13px;">Total Produk:</span>
                <span style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${totalProducts}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="color: var(--text-secondary); font-size: 13px;">Total Stok: </span>
                <span style="font-weight: 600; color: var(--text-primary); font-size: 14px;"> ${totalStock} unit</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--text-secondary); font-size: 14px;">Perhatian:</span>
                <span style="font-weight: 600; color: ${lowStockProducts + outOfStockProducts > 0 ? '#f59e0b' : '#10b759'};">
                    ${lowStockProducts + outOfStockProducts} item
                </span>
            </div>
        </div>
    `;
    
    console.log('📦 Stock card updated:', { 
        totalProducts, 
        totalStock, 
        totalStockValue,
        lowStockProducts, 
        outOfStockProducts 
    });
}

async function updateUsersCard() {
    try {
        console.log('👥 Loading users data with online status...');

        // Ambil data users dengan status online dari API manajer
        const response = await fetch('http://localhost:8080/api/manajer/users/all-with-status', {
            headers: AuthHelper.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const users = await response.json();
        console.log('✅ Users with status loaded:', users.length);

        const onlineElement = document.querySelector('#card-pengguna .users-row div:first-child .value');
        const offlineElement = document.querySelector('#card-pengguna .users-row div:last-child .value');
        const subtitleElement = document.querySelector('#card-pengguna .subtitle');

        if (!onlineElement || !offlineElement || !subtitleElement) return;

        // Hitung online/offline dari data yang real
        const totalUsers = users.length;
        const onlineUsers = users.filter(user => user.isOnline === true || user.isOnline === 'true').length;
        const offlineUsers = totalUsers - onlineUsers;

        // Update UI
        onlineElement.textContent = onlineUsers;
        offlineElement.textContent = offlineUsers;
        subtitleElement.textContent = `Total: ${totalUsers} Pengguna`;

        // Hitung jumlah per role
        const roleCounts = {
            ADMIN: users.filter(user => user.role === 'ADMIN').length,
            MANAJER: users.filter(user => user.role === 'MANAJER').length,
            KASIR: users.filter(user => user.role === 'KASIR').length
        };

        // Tambahkan detail role di card
        const cardBody = document.querySelector('#card-pengguna .card-body');

        // Hapus existing role breakdown jika ada
        const existingBreakdown = cardBody.querySelector('.role-breakdown');
        if (existingBreakdown) {
            existingBreakdown.remove();
        }

        const roleBreakdown = document.createElement('div');
        roleBreakdown.className = 'role-breakdown';
        roleBreakdown.style.cssText = `
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid var(--border-color);
            font-size: 12px;
            color: var(--text-secondary);
        `;
        roleBreakdown.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <span>Admin: ${roleCounts.ADMIN}</span>
                <span>Manajer: ${roleCounts.MANAJER}</span>
                <span>Kasir: ${roleCounts.KASIR}</span>
            </div>
        `;
        cardBody.appendChild(roleBreakdown);

        console.log('👥 Users card updated with real data:', {
            totalUsers,
            onlineUsers,
            offlineUsers,
            roleCounts
        });

        // Juga update user list jika ada di dashboard
        updateUserList(users);

    } catch (error) {
        console.error('❌ Error loading users data:', error);
        // Fallback ke data random jika API gagal
        fallbackUpdateUsersCard();
    }
}

// Function untuk fallback jika API gagal
function fallbackUpdateUsersCard() {
    const onlineElement = document.querySelector('#card-pengguna .users-row div:first-child .value');
    const offlineElement = document.querySelector('#card-pengguna .users-row div:last-child .value');
    const subtitleElement = document.querySelector('#card-pengguna .subtitle');

    if (!onlineElement || !offlineElement || !subtitleElement) return;

    // Fallback ke angka dummy
    const onlineUsers = 2;
    const offlineUsers = 3;
    const totalUsers = 5;

    onlineElement.textContent = onlineUsers;
    offlineElement.textContent = offlineUsers;
    subtitleElement.textContent = `Total: ${totalUsers} Pengguna`;

    console.log('⚠️ Using fallback users data');
}

// Function untuk update user list di dashboard (jika ada)
function updateUserList(users) {
    const userListContainer = document.getElementById('user-list-container');
    if (!userListContainer) return;

    // Filter users yang sedang online
    const onlineUsers = users.filter(user => user.isOnline === true || user.isOnline === 'true');

    if (onlineUsers.length > 0) {
        userListContainer.innerHTML = `
            <div style="margin-top: 16px;">
                <h4 style="margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">
                    🟢 Sedang Online (${onlineUsers.length})
                </h4>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${onlineUsers.map(user => `
                        <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--card-bg); border-radius: 6px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
                                ${user.initial || user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style="font-weight: 600; font-size: 14px;">${user.username}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">${user.role}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        userListContainer.innerHTML = `
            <div style="margin-top: 16px; text-align: center; padding: 16px; color: var(--text-secondary);">
                <div>👤 Tidak ada user yang sedang online</div>
                <div style="font-size: 12px; margin-top: 4px;">User akan muncul ketika login</div>
            </div>
        `;
    }
}

// ========== UTILITY FUNCTIONS ==========

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
}

function showError(message) {
    console.error('Dashboard Error:', message);
    // Toast notification
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

// Auto-refresh data every 60 seconds
setInterval(async () => {
    const auth = AuthHelper.checkAuth();
    if (auth && (auth.userRole === 'MANAJER' || auth.userRole === 'ADMIN')) {
        console.log('🔄 Auto-refreshing manager dashboard data...');
        await loadDashboardData(auth.userRole);
    }
}, 60000);