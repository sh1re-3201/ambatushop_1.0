// Kasir Dashboard JavaScript - Terintegrasi dengan Backend
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const auth = AuthHelper.checkAuth();
    if (!auth) return;

    // Only allow KASIR access
    if (auth.userRole !== 'KASIR') {
        alert('Hanya Kasir yang dapat mengakses halaman ini');
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

    // ========== LOAD DASHBOARD DATA ==========
    await loadDashboardData();
});

// ========== API FUNCTIONS ==========

async function loadDashboardData() {
    try {
        console.log('🔄 Loading dashboard data...');

        // Load today's transactions
        const today = new Date().toISOString().split('T')[0];
        const startOfDay = `${today}T00:00:00`;
        const endOfDay = `${today}T23:59:59`;

        const [transactionsResponse, productsResponse] = await Promise.all([
            fetch(`http://localhost:8080/api/transaksi?start=${startOfDay}&end=${endOfDay}`, {
                headers: AuthHelper.getAuthHeaders()
            }),
            fetch('http://localhost:8080/api/produk', {
                headers: AuthHelper.getAuthHeaders()
            })
        ]);

        let transactions = [];
        let products = [];

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

        // Update UI with loaded data
        updateTransactionStats(transactions);
        updateProductStats(products);
        updateRecentTransactions(transactions);
        updateMonthlyRevenue(transactions);

    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showError('Gagal memuat data dashboard');
        
        // Fallback: Try to load at least products data
        await loadProductsFallback();
    }
}

// Fallback function untuk load products saja
async function loadProductsFallback() {
    try {
        const productsResponse = await fetch('http://localhost:8080/api/produk', {
            headers: AuthHelper.getAuthHeaders()
        });

        if (productsResponse.ok) {
            const products = await productsResponse.json();
            updateProductStats(products);
            console.log('✅ Products loaded via fallback:', products.length);
        }
    } catch (error) {
        console.error('❌ Fallback also failed:', error);
    }
}

// ========== UI UPDATE FUNCTIONS ==========

function updateTransactionStats(transactions) {
    const todayTransactions = transactions.length;
    const todayRevenue = transactions.reduce((total, transaction) => total + (transaction.total || 0), 0);

    document.getElementById('today-transactions').textContent = `${todayTransactions} Transaksi`;
    document.getElementById('today-revenue').textContent = formatCurrency(todayRevenue);
    
    console.log('📊 Transaction stats updated:', { todayTransactions, todayRevenue });
}

function updateProductStats(products) {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(product => product.stok <= 10 && product.stok > 0).length;
    const outOfStockProducts = products.filter(product => product.stok === 0).length;

    document.getElementById('total-products').textContent = `${totalProducts} Produk`;
    document.getElementById('low-stock').textContent = `${lowStockProducts} Produk`;
    
    // Optional: Tambahkan warning jika ada stok habis
    if (outOfStockProducts > 0) {
        const lowStockElement = document.getElementById('low-stock');
        lowStockElement.innerHTML = `${lowStockProducts} Produk <span style="color: var(--error); margin-left: 4px;">(${outOfStockProducts} habis)</span>`;
    }
    
    console.log('📦 Product stats updated:', { 
        totalProducts, 
        lowStockProducts, 
        outOfStockProducts 
    });
}

function updateMonthlyRevenue(transactions) {
    // Hitung revenue bulan ini dari transaksi PAID
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyRevenue = transactions
        .filter(transaction => {
            const transactionDate = new Date(transaction.tanggal);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear &&
                   transaction.paymentStatus === 'PAID';
        })
        .reduce((total, transaction) => total + (transaction.total || 0), 0);

    document.getElementById('monthly-income').textContent = formatCurrency(monthlyRevenue);
    
    console.log('💰 Monthly revenue updated:', monthlyRevenue);
}

function updateRecentTransactions(transactions) {
    const container = document.getElementById('recent-transactions');
    
    if (!transactions || transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Belum ada transaksi hari ini</p>
                <small style="color: var(--text-secondary);">Transaksi yang dibuat akan muncul di sini</small>
            </div>
        `;
        return;
    }

    // Sort by date (newest first) and take last 5
    const recentTransactions = transactions
        .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
        .slice(0, 5);

    container.innerHTML = recentTransactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <span class="transaction-id">${transaction.referenceNumber || `TRX-${transaction.idTransaksi}`}</span>
                <span class="transaction-detail">
                    ${formatPaymentMethod(transaction.metodePembayaran || transaction.metode_pembayaran)} • 
                    ${formatTime(transaction.tanggal)} •
                    <span class="status-badge status-${(transaction.paymentStatus || 'PENDING').toLowerCase()}">
                        ${formatPaymentStatus(transaction.paymentStatus)}
                    </span>
                </span>
            </div>
            <div class="transaction-amount ${transaction.paymentStatus === 'PAID' ? 'amount-paid' : 'amount-pending'}">
                ${formatCurrency(transaction.total)}
            </div>
        </div>
    `).join('');
    
    console.log('📋 Recent transactions updated:', recentTransactions.length);
}

// ========== UTILITY FUNCTIONS ==========

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatPaymentMethod(method) {
    const methods = {
        'TUNAI': 'Cash',
        'NON_TUNAI': 'QRIS'
    };
    return methods[method] || method || 'Unknown';
}

function formatPaymentStatus(status) {
    const statusMap = {
        'PAID': 'LUNAS',
        'PENDING': 'PENDING', 
        'FAILED': 'GAGAL',
        'EXPIRED': 'EXPIRED'
    };
    return statusMap[status] || 'PENDING';
}

function formatTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (error) {
        return '--:--';
    }
}

function showError(message) {
    console.error('Dashboard Error:', message);
    // Bisa ditambahkan toast notification di sini
}

// Auto-refresh data every 30 seconds
setInterval(async () => {
    const auth = AuthHelper.checkAuth();
    if (auth && auth.userRole === 'KASIR') {
        console.log('🔄 Auto-refreshing dashboard data...');
        await loadDashboardData();
    }
}, 30000);