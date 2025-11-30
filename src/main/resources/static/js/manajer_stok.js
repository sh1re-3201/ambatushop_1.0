// Kontrol sidebar dan authentication untuk Manajer Stok
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

    // ========== STOCK MANAGEMENT FUNCTIONALITY ==========

    // Load products data
    await loadProductsData();

    // Add event listener for "Tambah Produk" button if exists
    const addProductBtn = document.querySelector('button[style*="background:#2b7cff"]');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', showAddProductModal);
    }
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
        showEmptyState();
    }
}

async function createProduct(productData) {
    try {
        const response = await fetch('http://localhost:8080/api/produk', {
            method: 'POST',
            headers: AuthHelper.getAuthHeaders(),
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.message || data.details || 'Gagal membuat produk' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateProduct(productId, productData) {
    try {
        const response = await fetch(`http://localhost:8080/api/produk/${productId}`, {
            method: 'PUT',
            headers: AuthHelper.getAuthHeaders(),
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.message || data.details || 'Gagal mengupdate produk' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function updateProductStock(productId, newStock) {
    try {
        const productData = { stok: newStock };
        const response = await fetch(`http://localhost:8080/api/produk/${productId}`, {
            method: 'PUT',
            headers: AuthHelper.getAuthHeaders(),
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.message || data.details || 'Gagal mengupdate stok' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function deleteProduct(productId) {
    try {
        console.log('Deleting product:', productId);

        const response = await fetch(`http://localhost:8080/api/produk/${productId}`, {
            method: 'DELETE',
            headers: AuthHelper.getAuthHeaders()
        });

        console.log('Delete response status:', response.status);
        console.log('Delete response ok:', response.ok);

        if (response.ok) {
            // ✅ PERBAIKAN: Handle case where response body is empty
            const responseText = await response.text();
            console.log('Delete response text:', responseText);

            if (responseText) {
                try {
                    const data = JSON.parse(responseText);
                    return { success: true, data };
                } catch (e) {
                    // If it's not JSON but response is ok, still consider it success
                    return { success: true };
                }
            } else {
                // Empty response but status is ok
                return { success: true };
            }
        } else {
            // Handle different error cases
            const responseText = await response.text();
            console.error('Delete error response:', responseText);

            let errorMessage = `HTTP ${response.status}: `;

            try {
                const errorData = JSON.parse(responseText);
                errorMessage += errorData.message || errorData.details || 'Gagal menghapus produk';
            } catch (e) {
                errorMessage += responseText || 'Gagal menghapus produk';
            }

            return { success: false, error: errorMessage };
        }
    } catch (error) {
        console.error('Network error deleting product:', error);
        return {
            success: false,
            error: 'Network error: ' + error.message
        };
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
            <td style="padding:12px 8px;text-align:center;color:var(--text-secondary);font-family:'Courier New',monospace;font-size:12px">
                ${product.barcode ? `
                    <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                        <span>${product.barcode}</span>
                        <button class="view-barcode-btn" data-product-id="${product.idProduk}" 
                                style="padding:2px 6px;background:rgba(43,124,255,0.1);color:#2b7cff;border:1px solid rgba(43,124,255,0.3);border-radius:4px;cursor:pointer;font-size:10px">
                            👁️ Lihat
                        </button>
                    </div>
                ` : `
                    <button class="generate-barcode-btn" data-product-id="${product.idProduk}" 
                            style="padding:4px 8px;background:rgba(16,183,89,0.1);color:#10b759;border:1px solid rgba(16,183,89,0.3);border-radius:6px;cursor:pointer;font-size:11px">
                        🏷️ Generate
                    </button>
                `}
            </td>
            <td style="padding:12px 8px;text-align:center;color:var(--text-secondary)">${generateSKU(product.idProduk)}</td>
            <td style="padding:12px 8px;text-align:center;font-weight:600;color:${getStockColor(product.stok)}">
                <div style="display:flex;align-items:center;justify-content:center;gap:8px">
                    <span>${product.stok}</span>
                    <button class="edit-stock-btn" data-product-id="${product.idProduk}" data-product-name="${product.namaProduk}" data-current-stock="${product.stok}" style="padding:2px 6px;background:rgba(43,124,255,0.1);color:#2b7cff;border:1px solid rgba(43,124,255,0.3);border-radius:4px;cursor:pointer;font-size:12px">Edit</button>
                </div>
            </td>
            <td style="padding:12px 8px;text-align:right;color:var(--text-primary)">${formatCurrency(product.harga)}</td>
            <td style="padding:12px 8px;text-align:center">
                <span style="background:${stockStatus.bg};color:${stockStatus.color};padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600">${stockStatus.text}</span>
            </td>
            <td style="padding:12px 8px;text-align:center">
                <button class="edit-product-btn" data-product-id="${product.idProduk}" style="padding:4px 12px;background:#f3f4f6;border:0;border-radius:6px;cursor:pointer;margin:0 4px">Edit</button>
                <button class="delete-product-btn" data-product-id="${product.idProduk}" data-product-name="${product.namaProduk}" style="padding:4px 12px;background:#fee2e2;color:#991b1b;border:0;border-radius:6px;cursor:pointer">Hapus</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    // Add event listeners untuk barcode buttons
    this.addBarcodeEventListeners();
}

// Add barcode event listeners
function addBarcodeEventListeners() {
    // Generate barcode buttons
    document.querySelectorAll('.generate-barcode-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const productId = e.target.getAttribute('data-product-id');
            const updatedProduct = await barcodeManager.generateBarcode(productId);
            if (updatedProduct) {
                await loadProductsData();
            }
        });
    });

    // View barcode buttons
    document.querySelectorAll('.view-barcode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-product-id');
            const product = products.find(p => p.idProduk == productId);
            if (product) {
                barcodeManager.showBarcodeModal(product);
            }
        });
    });

    // Existing event listeners...
    document.querySelectorAll('.edit-stock-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-product-id');
            const productName = e.target.getAttribute('data-product-name');
            const currentStock = e.target.getAttribute('data-current-stock');
            showEditStockModal(productId, productName, parseInt(currentStock));
        });
    });

    document.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-product-id');
            showEditProductModal(productId);
        });
    });

    document.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-product-id');
            const productName = e.target.getAttribute('data-product-name');
            confirmDeleteProduct(productId, productName);
        });
    });
}

// Add event listeners to buttons
document.querySelectorAll('.edit-stock-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const productId = e.target.getAttribute('data-product-id');
        const productName = e.target.getAttribute('data-product-name');
        const currentStock = e.target.getAttribute('data-current-stock');
        showEditStockModal(productId, productName, parseInt(currentStock));
    });
});

document.querySelectorAll('.edit-product-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const productId = e.target.getAttribute('data-product-id');
        showEditProductModal(productId);
    });
});

document.querySelectorAll('.delete-product-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const productId = e.target.getAttribute('data-product-id');
        const productName = e.target.getAttribute('data-product-name');
        confirmDeleteProduct(productId, productName);
    });
});

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

// ========== MODAL FUNCTIONS ==========

function showAddProductModal() {
    const modalHtml = `
        <div class="modal-overlay" id="productModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Tambah Produk Baru</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="productForm" class="modal-form">
                    <input type="hidden" id="productId">
                    <div class="form-group">
                        <label for="productName">Nama Produk *</label>
                        <input type="text" id="productName" required>
                    </div>
                    <div class="form-group">
                        <label for="productPrice">Harga *</label>
                        <input type="number" id="productPrice" min="0" step="100" required>
                    </div>
                    <div class="form-group">
                        <label for="productStock">Stok Awal *</label>
                        <input type="number" id="productStock" min="0" required>
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
    setupProductModalEvents();
}

function showEditProductModal(productId) {
    // Fetch product data first
    fetch(`http://localhost:8080/api/produk/${productId}`, {
        headers: AuthHelper.getAuthHeaders()
    })
        .then(response => response.json())
        .then(product => {
            const modalHtml = `
            <div class="modal-overlay" id="productModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Edit Produk</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="productForm" class="modal-form">
                        <input type="hidden" id="productId" value="${product.idProduk}">
                        <div class="form-group">
                            <label for="productName">Nama Produk *</label>
                            <input type="text" id="productName" value="${product.namaProduk}" required>
                        </div>
                        <div class="form-group">
                            <label for="productPrice">Harga *</label>
                            <input type="number" id="productPrice" value="${product.harga}" min="0" step="100" required>
                        </div>
                        <div class="form-group">
                            <label for="productStock">Stok *</label>
                            <input type="number" id="productStock" value="${product.stok}" min="0" required>
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
            setupProductModalEvents();
        })
        .catch(error => {
            showError('Gagal memuat data produk: ' + error.message);
        });
}

function showEditStockModal(productId, productName, currentStock) {
    const modalHtml = `
        <div class="modal-overlay" id="stockModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Update Stok</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <form id="stockForm" class="modal-form">
                    <input type="hidden" id="stockProductId" value="${productId}">
                    <div class="form-group">
                        <label>Produk</label>
                        <div style="padding:8px 12px;background:var(--border-color);border-radius:6px;font-weight:600">${productName}</div>
                    </div>
                    <div class="form-group">
                        <label for="newStock">Stok Baru *</label>
                        <input type="number" id="newStock" value="${currentStock}" min="0" required>
                        <small>Stok saat ini: ${currentStock}</small>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-cancel">Batal</button>
                        <button type="submit" class="btn-submit">Update Stok</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    setupStockModalEvents();
}

function setupProductModalEvents() {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
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
        await handleProductSubmit();
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function setupStockModalEvents() {
    const modal = document.getElementById('stockModal');
    const form = document.getElementById('stockForm');
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
        await handleStockUpdate();
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

async function handleProductSubmit() {
    const form = document.getElementById('productForm');
    const productId = document.getElementById('productId').value;
    const productName = document.getElementById('productName').value;
    const productPrice = parseFloat(document.getElementById('productPrice').value);
    const productStock = parseInt(document.getElementById('productStock').value);

    const productData = {
        namaProduk: productName,
        harga: productPrice,
        stok: productStock
    };

    let result;
    if (productId) {
        // Update existing product
        result = await updateProduct(productId, productData);
    } else {
        // Create new product
        result = await createProduct(productData);
    }

    if (result.success) {
        // Close modal and refresh data
        document.getElementById('productModal').remove();
        await loadProductsData();
        showSuccess(productId ? 'Produk berhasil diupdate' : 'Produk berhasil dibuat');
    } else {
        showError(result.error);
    }
}

async function handleStockUpdate() {
    const productId = document.getElementById('stockProductId').value;
    const newStock = parseInt(document.getElementById('newStock').value);

    const result = await updateProductStock(productId, newStock);

    if (result.success) {
        // Close modal and refresh data
        document.getElementById('stockModal').remove();
        await loadProductsData();
        showSuccess('Stok berhasil diupdate');
    } else {
        showError(result.error);
    }
}

async function confirmDeleteProduct(productId, productName) {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"?\n\nTindakan ini tidak dapat dibatalkan.`)) {
        try {
            const result = await deleteProduct(productId);

            if (result.success) {
                await loadProductsData();
                showSuccess(`Produk "${productName}" berhasil dihapus`);
            } else {
                // ✅ PERBAIKAN: Tampilkan error message asli dari backend
                showError(result.error);
            }
        } catch (error) {
            console.error('Unexpected error in confirmDeleteProduct:', error);
            showError('Terjadi kesalahan tak terduga: ' + error.message);
        }
    }
}

function showEmptyState() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="padding: 40px; text-align: center; color: var(--text-secondary)">
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

function showSuccess(message) {
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
        await loadProductsData();
    }
}, 30000);

// ========== BARCODE MANAGEMENT ==========

class BarcodeManager {
    constructor() {
        this.initBarcodeFeatures();
    }

    initBarcodeFeatures() {
        console.log('🔄 Initializing barcode features...');
    }

    // Generate barcode untuk produk
    async generateBarcode(productId) {
        try {
            console.log('🔄 Generating barcode for product:', productId);

            const response = await fetch(`http://localhost:8080/api/barcode/produk/${productId}/generate`, {
                method: 'POST',
                headers: AuthHelper.getAuthHeaders()
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Barcode berhasil digenerate!');
                return result.produk;
            } else {
                throw new Error(result.error || 'Gagal generate barcode');
            }
        } catch (error) {
            console.error('Barcode generation error:', error);
            this.showError('Error: ' + error.message);
            return null;
        }
    }

    // Show barcode modal
    showBarcodeModal(product) {
        const modalHtml = `
            <div class="modal-overlay" id="barcodeModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Barcode - ${product.namaProduk}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body" style="text-align: center;">
                        <div class="barcode-display">
                            ${product.barcodeImagePath ? `
                                <img src="http://localhost:8080/api/barcode/produk/${product.idProduk}/image?t=${new Date().getTime()}" 
                                     alt="Barcode ${product.barcode}" 
                                     style="max-width: 100%; border: 1px solid #ddd; padding: 15px; background: white; margin-bottom: 15px;">
                            ` : `
                                <div style="padding: 40px; background: #f5f5f5; border-radius: 8px; margin-bottom: 15px;">
                                    <div style="color: #666; margin-bottom: 10px;">📷</div>
                                    <div style="color: #999; font-size: 14px;">Barcode image belum tersedia</div>
                                </div>
                            `}
                            <div style="margin-top: 10px; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #333;">
                                ${product.barcode || 'No barcode'}
                            </div>
                            <div style="margin-top: 5px; font-size: 12px; color: #666;">
                                Scan barcode ini di kasir untuk input otomatis
                            </div>
                        </div>
                        <div class="barcode-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                            <button class="btn-secondary" onclick="barcodeManager.printBarcode(${product.idProduk})">
                                🖨️ Print Label
                            </button>
                            <button class="btn-primary" onclick="barcodeManager.downloadBarcode(${product.idProduk})" ${!product.barcodeImagePath ? 'disabled' : ''}>
                                📥 Download PNG
                            </button>
                            ${!product.barcode ? `
                                <button class="btn-success" onclick="barcodeManager.regenerateBarcode(${product.idProduk})">
                                    🔄 Generate Barcode
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.setupBarcodeModalEvents();
    }

    setupBarcodeModalEvents() {
        const modal = document.getElementById('barcodeModal');
        const closeBtn = modal.querySelector('.modal-close');

        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // Download barcode image
    async downloadBarcode(productId) {
        try {
            const response = await fetch(`http://localhost:8080/api/barcode/produk/${productId}/image`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `barcode-${productId}.png`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                this.showSuccess('Barcode downloaded!');
            } else {
                throw new Error('Gagal download barcode');
            }
        } catch (error) {
            this.showError('Download error: ' + error.message);
        }
    }

    // Print barcode
    async printBarcode(productId) {
        try {
            const response = await fetch(`http://localhost:8080/api/barcode/produk/${productId}/image`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Print Barcode</title>
                            <style>
                                body { 
                                    margin: 0; 
                                    padding: 20px; 
                                    font-family: Arial, sans-serif;
                                    text-align: center;
                                }
                                img { 
                                    max-width: 100%; 
                                    height: auto; 
                                    margin-bottom: 10px;
                                }
                                .barcode-text {
                                    font-family: 'Courier New', monospace;
                                    font-size: 14px;
                                    font-weight: bold;
                                    margin-top: 10px;
                                }
                                @media print {
                                    body { margin: 0; }
                                }
                            </style>
                        </head>
                        <body>
                            <img src="${url}" alt="Barcode">
                            <div class="barcode-text">${productId}</div>
                            <script>
                                window.onload = function() {
                                    window.print();
                                    setTimeout(() => window.close(), 1000);
                                }
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();

            } else {
                throw new Error('Gagal load barcode untuk print');
            }
        } catch (error) {
            this.showError('Print error: ' + error.message);
        }
    }

    // Regenerate barcode
    async regenerateBarcode(productId) {
        const updatedProduct = await this.generateBarcode(productId);
        if (updatedProduct) {
            // Close modal and refresh data
            document.getElementById('barcodeModal')?.remove();
            await loadProductsData();
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
        const feedback = document.createElement('div');
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
        `;
        feedback.textContent = message;

        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.remove();
        }, 3000);
    }
}

// Initialize barcode manager
const barcodeManager = new BarcodeManager();