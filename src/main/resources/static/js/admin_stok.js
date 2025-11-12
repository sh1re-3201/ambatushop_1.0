// Kontrol sidebar dan authentication untuk Admin Stok (Read-Only)
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const auth = AuthHelper.checkAuth();
    if (!auth) return;
    
    // Only allow ADMIN access for this page
    if (auth.userRole !== 'ADMIN') {
        alert('Hanya Admin yang dapat mengakses halaman ini');
        window.location.href = '/manajer/dashboard';
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

    // ========== STOCK MANAGEMENT FUNCTIONALITY (READ-ONLY) ==========
    
    // Load products data
    await loadProductsData();
});

// ========== API FUNCTIONS ==========

async function loadProductsData() {
    try {
        const response = await fetch('http://localhost:8080/api/produk', {
            headers: AuthHelper.getAuthHeaders()
        });

        if (response.ok) {
            const products = await response.json();
            updateProductsTable(products);
            updateStockStats(products);
        } else {
            const errorData = await response.json().catch(() => null);
            const errorMsg = errorData?.message || errorData?.details || `HTTP ${response.status}`;
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Gagal memuat data stok: ' + error.message);
        
        // Fallback: Show empty state
        showEmptyState();
    }
}

// ========== UI UPDATE FUNCTIONS ==========

function updateProductsTable(products) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid var(--border-color)';
        
        // Determine stock status
        const stockStatus = getStockStatus(product.stok);
        
        row.innerHTML = `
            <td style="padding:12px 8px;color:var(--text-primary)">
                <div style="display:flex;align-items:center;gap:8px">
                    <span>${product.namaProduk}</span>
                    ${product.stok <= 10 ? '<span style="color:#f59e0b;font-size:12px">⚠️</span>' : ''}
                </div>
            </td>
            <td style="padding:12px 8px;text-align:center;color:var(--text-secondary)">${generateSKU(product.idProduk)}</td>
            <td style="padding:12px 8px;text-align:center;font-weight:600;color:${getStockColor(product.stok)}">
                ${product.stok}
            </td>
            <td style="padding:12px 8px;text-align:right;color:var(--text-primary)">${formatCurrency(product.harga)}</td>
            <td style="padding:12px 8px;text-align:center">
                <span style="background:${stockStatus.bg};color:${stockStatus.color};padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600">${stockStatus.text}</span>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function updateStockStats(products) {
    // Calculate statistics
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stok, 0);
    const lowStockProducts = products.filter(product => product.stok <= 10).length;
    const totalStockValue = products.reduce((sum, product) => sum + (product.harga * product.stok), 0);
    
    // Available stock is total stock minus low stock items
    const availableStock = totalStock;

    // Update cards
    updateCardValue('.card.feature:nth-child(1) .value', `${totalProducts} Produk`);
    updateCardValue('.card.feature:nth-child(2) .value', `${availableStock} Unit`);
    updateCardValue('.card.feature:nth-child(3) .value', `${lowStockProducts} Produk`);
    updateCardValue('.card.feature:nth-child(4) .value', `${formatCurrency(totalStockValue)}`);
}

function updateCardValue(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = value;
    }
}

function getStockStatus(stock) {
    if (stock <= 0) {
        return { bg: '#fee2e2', color: '#991b1b', text: 'Habis' };
    } else if (stock <= 10) {
        return { bg: '#fef3c7', color: '#92400e', text: 'Menipis' };
    } else {
        return { bg: '#d1fae5', color: '#065f46', text: 'Tersedia' };
    }
}

function getStockColor(stock) {
    if (stock <= 0) return '#ef4444';
    if (stock <= 10) return '#f59e0b';
    return '#10b759';
}

function generateSKU(productId) {
    // Simple SKU generation based on product ID
    return `PROD-${String(productId).padStart(3, '0')}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function showEmptyState() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="padding: 40px; text-align: center; color: var(--text-secondary)">
                <div style="font-size: 16px; margin-bottom: 8px;">Tidak dapat memuat data stok</div>
                <div style="font-size: 14px;">Silakan refresh halaman atau coba lagi nanti</div>
            </td>
        </tr>
    `;
}

// ========== UTILITY FUNCTIONS ==========

function showError(message) {
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

// Auto-refresh data every 30 seconds
setInterval(async () => {
    const auth = AuthHelper.checkAuth();
    if (auth && auth.userRole === 'ADMIN') {
        await loadProductsData();
    }
}, 30000);