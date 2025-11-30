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
    
    // Initialize search manager
    searchManager = new SearchManager();
    
    // Load products data
    await loadProductsData();
});

// ========== SEARCH FUNCTIONALITY ==========

class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('product-search-input');
        this.searchTimeout = null;
        this.debounceDelay = 300; // ms
        this.init();
    }

    init() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.handleSearch.bind(this));
            this.searchInput.addEventListener('keypress', this.handleKeyPress.bind(this));
        }
    }

    handleSearch(e) {
        const query = e.target.value.trim();

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, this.debounceDelay);
    }

    handleKeyPress(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = this.searchInput.value.trim();
            this.performSearch(query);
        }
    }

    async performSearch(query) {
        try {
            console.log('🔍 Searching products:', query);

            let url = 'http://localhost:8080/api/produk';

            // Jika ada query, gunakan endpoint search
            if (query && query.length > 0) {
                url = `http://localhost:8080/api/produk/search?keyword=${encodeURIComponent(query)}`;
            }

            const response = await fetch(url, {
                headers: AuthHelper.getAuthHeaders()
            });

            if (response.ok) {
                const products = await response.json();
                this.displaySearchResults(products, query);
            } else {
                throw new Error('Gagal melakukan pencarian');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showSearchError('Gagal melakukan pencarian: ' + error.message);
        }
    }

    displaySearchResults(products, query) {
        // Update products table
        updateProductsTable(products);

        // Update search stats
        this.updateSearchStats(products.length, query);

        // Update main stats cards based on search results
        updateStockStats(products);
    }

    updateSearchStats(resultCount, query) {
        const tableContainer = document.getElementById('products-table-container');
        const existingStats = document.getElementById('search-stats');

        // Remove existing stats if any
        if (existingStats) {
            existingStats.remove();
        }

        // Add search stats if there's a query
        if (query && query.length > 0) {
            const statsHtml = `
                <div id="search-stats" style="margin-bottom:16px;padding:12px 16px;background:var(--page-bg);border-radius:8px;border:1px solid var(--border-color);font-size:14px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span>
                            🔍 Menampilkan <strong>${resultCount}</strong> produk untuk pencarian: 
                            <strong>"${query}"</strong>
                        </span>
                        <button onclick="searchManager.clearSearch()" 
                                style="padding:4px 8px;background:transparent;border:1px solid var(--border-color);border-radius:4px;cursor:pointer;font-size:12px;">
                            ✕ Hapus Pencarian
                        </button>
                    </div>
                </div>
            `;

            tableContainer.insertAdjacentHTML('afterbegin', statsHtml);
        }
    }

    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }

        // Reload all products
        loadProductsData();

        // Remove search stats
        const existingStats = document.getElementById('search-stats');
        if (existingStats) {
            existingStats.remove();
        }
    }

    showSearchError(message) {
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding:40px;text-align:center;color:var(--text-secondary)">
                    <div style="color:var(--error);margin-bottom:8px;">❌</div>
                    <div>${message}</div>
                    <button onclick="searchManager.clearSearch()" 
                            style="margin-top:12px;padding:8px 16px;background:var(--accent);color:white;border:none;border-radius:6px;cursor:pointer;">
                        Muat Ulang Data
                    </button>
                </td>
            </tr>
        `;
    }
}

// Initialize search manager
let searchManager;

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

            // Clear any existing search stats
            const existingStats = document.getElementById('search-stats');
            if (existingStats) {
                existingStats.remove();
            }
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
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    if (products.length === 0) {
        showEmptyState();
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr style="border-bottom:1px solid var(--border-color)">
            <td style="padding:12px 8px;color:var(--text-primary)">
                <div style="display:flex;align-items:center;gap:8px">
                    <span>${product.namaProduk}</span>
                    ${product.stok <= 10 ? '<span style="color:#f59e0b;font-size:12px">⚠️</span>' : ''}
                </div>
            </td>
            <td style="padding:12px 8px;text-align:center;" class="barcode-cell">
                ${product.barcode ? `
                    <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
                        <div class="barcode-preview" 
                             onclick="adminBarcodeManager.showBarcodeModal(${JSON.stringify(product).replace(/"/g, '&quot;')})"
                             title="Klik untuk lihat barcode lengkap">
                            <div style="font-size:10px;color:#666;margin-bottom:2px">${product.barcode.substring(0, 8)}...</div>
                            <div style="display:flex;gap:1px;justify-content:center">
                                ${'█'.repeat(6)}
                            </div>
                        </div>
                        <button class="view-barcode-btn" 
                                onclick="adminBarcodeManager.showBarcodeModal(${JSON.stringify(product).replace(/"/g, '&quot;')})"
                                style="padding:2px 8px;background:rgba(43,124,255,0.1);color:#2b7cff;border:1px solid rgba(43,124,255,0.3);border-radius:4px;cursor:pointer;font-size:10px">
                            👁️ Lihat
                        </button>
                    </div>
                ` : `
                    <span style="color:var(--text-secondary);font-size:12px;font-style:italic">
                        Belum ada barcode
                    </span>
                `}
            </td>
            <td style="padding:12px 8px;text-align:center;color:var(--text-secondary)">${generateSKU(product.idProduk)}</td>
            <td style="padding:12px 8px;text-align:center;font-weight:600;color:${getStockColor(product.stok)}">
                ${product.stok}
            </td>
            <td style="padding:12px 8px;text-align:right;color:var(--text-primary)">${formatCurrency(product.harga)}</td>
            <td style="padding:12px 8px;text-align:center">
                <span style="background:${getStockStatus(product.stok).bg};color:${getStockStatus(product.stok).color};padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600">
                    ${getStockStatus(product.stok).text}
                </span>
            </td>
        </tr>
    `).join('');
}

function updateStockStats(products) {
    // Calculate statistics
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stok, 0);
    const lowStockProducts = products.filter(product => product.stok <= 10).length;
    const totalStockValue = products.reduce((sum, product) => sum + (product.harga * product.stok), 0);
    
    // Available stock is total stock minus low stock items
    const availableStock = totalStock;

    // Update cards with IDs
    document.getElementById('total-products').textContent = `${totalProducts} Produk`;
    document.getElementById('available-stock').textContent = `${availableStock} Unit`;
    document.getElementById('low-stock-products').textContent = `${lowStockProducts} Produk`;
    document.getElementById('total-stock-value').textContent = formatCurrency(totalStockValue);
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
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="padding:60px;text-align:center;color:var(--text-secondary)">
                <div style="font-size:48px;margin-bottom:16px;">📦</div>
                <div style="font-size:16px;margin-bottom:8px;font-weight:600">Tidak ada produk</div>
                <div style="font-size:14px;margin-bottom:20px;">Belum ada produk yang ditambahkan</div>
            </td>
        </tr>
    `;
}

// ========== BARCODE MANAGEMENT (READ-ONLY) ==========

class AdminBarcodeManager {
    constructor() {
        this.initBarcodeFeatures();
    }

    initBarcodeFeatures() {
        console.log('🔄 Initializing admin barcode features (read-only)...');
    }

    // Show barcode modal dengan REAL barcode image (read-only)
    async showBarcodeModal(product) {
        try {
            console.log('🔄 Loading barcode for product:', product);

            const modalHtml = `
            <div class="modal-overlay" id="barcodeModal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>🏷️ Barcode - ${product.namaProduk}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body" style="text-align: center;">
                        <div class="barcode-display" id="barcode-display-container">
                            <div class="loading-barcode">
                                <div style="padding: 40px;">
                                    <div style="color: #666; margin-bottom: 10px;">⏳</div>
                                    <div style="color: #999; font-size: 14px;">Memuat barcode...</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="product-info" style="margin-top: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-weight: 600; color: #333;">${product.namaProduk}</div>
                            <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 14px;">
                                <span>Harga: ${this.formatCurrency(product.harga)}</span>
                                <span>Stok: ${product.stok}</span>
                            </div>
                            ${product.barcode ? `
                                <div style="margin-top: 8px; font-family: 'Courier New', monospace; font-size: 12px; color: #666;">
                                    Barcode: ${product.barcode}
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="barcode-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                            ${product.barcodeImagePath ? `
                                <button class="btn-primary" onclick="adminBarcodeManager.downloadBarcode(${product.idProduk})">
                                    📥 Download PNG
                                </button>
                                <button class="btn-copy-barcode" onclick="adminBarcodeManager.copyBarcodeText('${product.barcode}')">
                                    📋 Copy Barcode
                                </button>
                            ` : `
                                <span style="color:var(--text-secondary);font-size:14px;">
                                    Barcode belum digenerate oleh Manajer
                                </span>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            this.setupBarcodeModalEvents();

            // Load barcode image setelah modal ditampilkan
            await this.loadBarcodeImage(product);

        } catch (error) {
            console.error('Error showing barcode modal:', error);
            this.showError('Gagal memuat barcode: ' + error.message);
        }
    }

    // Method untuk load barcode image
    async loadBarcodeImage(product) {
        const container = document.getElementById('barcode-display-container');
        if (!container) return;

        try {
            console.log('🔄 Loading barcode image for product:', product);

            if (!product.barcodeImagePath) {
                console.log('❌ No barcode image path for product:', product.idProduk);
                container.innerHTML = this.getBarcodePlaceholderHTML();
                return;
            }

            const imageUrl = `http://localhost:8080/api/barcode/produk/${product.idProduk}/image?t=${new Date().getTime()}`;
            console.log('🔗 Loading image with auth header:', imageUrl);

            const response = await fetch(imageUrl, {
                headers: AuthHelper.getAuthHeaders()
            });

            console.log('📡 Image response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();

            if (blob.size === 0) {
                throw new Error('Barcode image is empty');
            }

            const blobUrl = URL.createObjectURL(blob);

            container.innerHTML = `
            <div class="barcode-image-container">
                <img src="${blobUrl}" 
                     alt="Barcode ${product.barcode}" 
                     class="barcode-image"
                     onload="console.log(' Barcode image loaded successfully'); URL.revokeObjectURL(this.src)"
                     onerror="(function() { 
                         URL.revokeObjectURL(this.src);
                         adminBarcodeManager.handleImageError('Image load failed'); 
                     }).call(this)">
                <div class="barcode-text">${product.barcode}</div>
            </div>
        `;

            console.log('Barcode image loaded successfully');

        } catch (error) {
            console.error('Error loading barcode image:', error);
            this.handleImageError(error.message);
        }
    }

    getBarcodePlaceholderHTML() {
        return `
        <div class="barcode-placeholder">
            <div style="font-size: 48px; margin-bottom: 16px;">📷</div>
            <div style="color: #666; margin-bottom: 8px;">Barcode image belum tersedia</div>
            <div style="font-size: 12px; color: #999;">Barcode akan digenerate oleh Manajer</div>
        </div>
    `;
    }

    handleImageError(errorMessage = '') {
        const container = document.getElementById('barcode-display-container');
        if (!container) return;

        container.innerHTML = `
        <div class="barcode-error">
            <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
            <div style="color: #ef4444; margin-bottom: 8px;">Gagal memuat barcode image</div>
            <div style="font-size: 12px; color: #999; margin-bottom: 8px;">
                ${errorMessage || 'Barcode image mungkin belum digenerate atau terjadi error'}
            </div>
        </div>
    `;
    }

    formatCurrency(amount) {
        if (!amount && amount !== 0) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    setupBarcodeModalEvents() {
        const modal = document.getElementById('barcodeModal');
        const closeBtn = modal.querySelector('.modal-close');

        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // Download barcode image
    async downloadBarcode(productId) {
        try {
            console.log('📥 Downloading barcode for product:', productId);

            const response = await fetch(`http://localhost:8080/api/barcode/produk/${productId}/image`, {
                headers: AuthHelper.getAuthHeaders()
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `barcode-${productId}-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showSuccess('Barcode berhasil didownload!');
            } else {
                throw new Error(`HTTP ${response.status}: Gagal download barcode`);
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Download error: ' + error.message);
        }
    }

    // Copy barcode text ke clipboard
    async copyBarcodeText(barcodeText) {
        try {
            await navigator.clipboard.writeText(barcodeText);
            this.showSuccess('Barcode berhasil disalin ke clipboard!');
        } catch (error) {
            // Fallback untuk browser lama
            const textArea = document.createElement('textarea');
            textArea.value = barcodeText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showSuccess('Barcode berhasil disalin!');
        }
    }

    // Utility functions
    showSuccess(message) {
        this.showFeedback(message, 'success');
    }

    showError(message) {
        this.showFeedback(message, 'error');
    }

    showFeedback(message, type) {
        const existingFeedback = document.querySelector('.barcode-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        const feedback = document.createElement('div');
        feedback.className = 'barcode-feedback';
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#10b759' : '#ef4444'};
            color: white;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        feedback.textContent = message;

        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                feedback.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize admin barcode manager
const adminBarcodeManager = new AdminBarcodeManager();

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