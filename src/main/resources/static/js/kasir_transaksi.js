// Kasir Transaksi JavaScript - Full Integration dengan Backend
class KasirTransaksi {
    constructor() {
        this.cart = [];
        this.products = [];
        this.currentTransaction = null;
        this.paymentInterval = null;
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        await this.loadProducts();
        await this.loadTransactionHistory();
    }

    async checkAuth() {
        const auth = AuthHelper.checkAuth();
        if (!auth) return;

        if (auth.userRole !== 'KASIR') {
            alert('Hanya Kasir yang dapat mengakses halaman ini');
            window.location.href = '/login';
            return;
        }
    }

    initSidebar() {
        const sidebar = document.getElementById('sidebar');
        const closeBtn = document.getElementById('sidebar-close');
        const openBtn = document.getElementById('sidebar-open-btn');

        if (!sidebar) return;

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

        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);

        // Theme toggle functionality
        themeToggle?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateThemeIcon(newTheme);
        });

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
    }

    updateThemeIcon(theme) {
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');
        
        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }

    initEventListeners() {
        // Product search
        const searchInput = document.getElementById('product-search');
        searchInput.addEventListener('input', this.handleSearch.bind(this));

        // Payment method change
        const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', this.handlePaymentMethodChange.bind(this));
        });

        // Cash amount input
        const cashInput = document.getElementById('cash-amount');
        cashInput.addEventListener('input', this.handleCashInput.bind(this));

        // Complete transaction
        const completeBtn = document.getElementById('complete-transaction');
        completeBtn.addEventListener('click', this.completeTransaction.bind(this));

        // Reset transaction
        const resetBtn = document.getElementById('reset-transaksi');
        resetBtn.addEventListener('click', this.resetTransaction.bind(this));

        // Date filter
        const dateFilter = document.getElementById('date-filter');
        dateFilter.addEventListener('change', this.loadTransactionHistory.bind(this));

        // Modal controls
        const closeModalBtn = document.getElementById('close-qris-modal');
        const cancelPaymentBtn = document.getElementById('cancel-payment');
        const checkPaymentBtn = document.getElementById('check-payment');

        closeModalBtn?.addEventListener('click', this.closeQRISModal.bind(this));
        cancelPaymentBtn?.addEventListener('click', this.cancelPayment.bind(this));
        checkPaymentBtn?.addEventListener('click', this.checkPaymentStatus.bind(this));
    }

    // ========== PRODUCT MANAGEMENT ==========

    async loadProducts() {
        try {
            const response = await fetch('http://localhost:8080/api/produk', {
                headers: AuthHelper.getAuthHeaders()
            });

            if (response.ok) {
                this.products = await response.json();
            } else {
                throw new Error('Gagal memuat data produk');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Gagal memuat data produk');
        }
    }

    handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();
        const resultsContainer = document.getElementById('search-results');

        if (query.length < 2) {
            resultsContainer.classList.remove('show');
            return;
        }

        const filteredProducts = this.products.filter(product =>
            product.namaProduk.toLowerCase().includes(query) &&
            product.stok > 0
        );

        this.displaySearchResults(filteredProducts, resultsContainer);
    }

    displaySearchResults(products, container) {
        if (products.length === 0) {
            container.innerHTML = '<div class="search-result-item">Produk tidak ditemukan</div>';
        } else {
            container.innerHTML = products.map(product => `
                <div class="search-result-item" data-product-id="${product.idProduk}">
                    <div class="product-name">${product.namaProduk}</div>
                    <div class="product-details">
                        <span>${this.formatCurrency(product.harga)}</span>
                        <span>Stok: ${product.stok}</span>
                    </div>
                </div>
            `).join('');
        }

        container.classList.add('show');

        // Add click event to search results
        container.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const productId = parseInt(item.dataset.productId);
                this.addToCart(productId);
                container.classList.remove('show');
                document.getElementById('product-search').value = '';
            });
        });
    }

    addToCart(productId) {
        const product = this.products.find(p => p.idProduk === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.product.idProduk === productId);

        if (existingItem) {
            if (existingItem.quantity < product.stok) {
                existingItem.quantity++;
            } else {
                this.showError('Stok tidak mencukupi');
                return;
            }
        } else {
            if (product.stok > 0) {
                this.cart.push({
                    product: product,
                    quantity: 1,
                    hargaSatuan: product.harga
                });
            } else {
                this.showError('Stok habis');
                return;
            }
        }

        this.updateCartDisplay();
        this.updateSummary();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.product.idProduk !== productId);
        this.updateCartDisplay();
        this.updateSummary();
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.product.idProduk === productId);
        if (!item) return;

        const newQuantity = item.quantity + change;

        if (newQuantity < 1) {
            this.removeFromCart(productId);
            return;
        }

        if (newQuantity > item.product.stok) {
            this.showError('Stok tidak mencukupi');
            return;
        }

        item.quantity = newQuantity;
        this.updateCartDisplay();
        this.updateSummary();
    }

    updateCartDisplay() {
        const container = document.getElementById('cart-items');
        const completeBtn = document.getElementById('complete-transaction');

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <p>Belum ada produk ditambahkan</p>
                </div>
            `;
            completeBtn.disabled = true;
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.product.namaProduk}</div>
                    <div class="cart-item-price">${this.formatCurrency(item.hargaSatuan)}</div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="kasirTransaksi.updateQuantity(${item.product.idProduk}, -1)">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="kasirTransaksi.updateQuantity(${item.product.idProduk}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="kasirTransaksi.removeFromCart(${item.product.idProduk})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        completeBtn.disabled = false;
    }

    // ========== PAYMENT HANDLING ==========

    handlePaymentMethodChange(e) {
        const method = e.target.value;
        const cashInput = document.getElementById('cash-input');
        const qrisPayment = document.getElementById('qris-payment');

        if (method === 'TUNAI') {
            cashInput.style.display = 'block';
            qrisPayment.style.display = 'none';
            this.handleCashInput(); // Recalculate change
        } else {
            cashInput.style.display = 'none';
            qrisPayment.style.display = 'block';
        }
    }

    handleCashInput() {
        const cashAmount = parseFloat(document.getElementById('cash-amount').value) || 0;
        const total = this.calculateTotal();
        const change = cashAmount - total;

        document.getElementById('cash-change').textContent = this.formatCurrency(Math.max(0, change));

        const completeBtn = document.getElementById('complete-transaction');
        completeBtn.disabled = change < 0;
    }

    // ========== TRANSACTION MANAGEMENT ==========

    async completeTransaction() {
        if (this.cart.length === 0) {
            this.showError('Keranjang belanja kosong');
            return;
        }

        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        const total = this.calculateTotal();

        try {
            // Prepare transaction data
            const transactionData = {
                metodePembayaran: paymentMethod,
                total: total,
                akunId: this.getCurrentUserId(),
                details: this.cart.map(item => ({
                    produkId: item.product.idProduk,
                    jumlah: item.quantity,
                    hargaSatuan: item.hargaSatuan,
                    subtotal: item.hargaSatuan * item.quantity
                }))
            };

            // Create transaction
            const response = await fetch('http://localhost:8080/api/transaksi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...AuthHelper.getAuthHeaders()
                },
                body: JSON.stringify(transactionData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal membuat transaksi');
            }

            const transaction = await response.json();

            if (paymentMethod === 'NON_TUNAI') {
                await this.handleQRISPayment(transaction.idTransaksi);
            } else {
                this.showSuccess('Transaksi tunai berhasil disimpan');
                this.resetTransaction();
                await this.loadTransactionHistory();
            }

        } catch (error) {
            console.error('Transaction error:', error);
            this.showError('Gagal menyimpan transaksi: ' + error.message);
        }
    }

    async handleQRISPayment(transactionId) {
        try {
            const response = await fetch(`http://localhost:8080/api/payment/qris/${transactionId}`, {
                method: 'POST',
                headers: AuthHelper.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gagal membuat pembayaran QRIS');
            }

            const paymentData = await response.json();
            this.showQRISModal(paymentData, transactionId);

        } catch (error) {
            console.error('QRIS payment error:', error);
            this.showError('Gagal membuat pembayaran QRIS: ' + error.message);
        }
    }

    showQRISModal(paymentData, transactionId) {
        this.currentTransaction = { id: transactionId, paymentData };
        
        const modal = document.getElementById('qris-modal');
        const qrisCode = document.getElementById('qris-code');
        const orderId = document.getElementById('qris-order-id');
        const amount = document.getElementById('qris-amount');
        const status = document.getElementById('qris-status');

        // Display QR code (you might want to use a QR code library)
        qrisCode.innerHTML = `
            <div style="text-align: center; padding: 20px; background: white; border-radius: 8px;">
                <p>QR Code akan ditampilkan di sini</p>
                <p style="font-size: 12px; color: #666;">Order: ${paymentData.order_id}</p>
            </div>
        `;

        orderId.textContent = paymentData.order_id;
        amount.textContent = this.formatCurrency(paymentData.amount || this.calculateTotal());
        status.textContent = 'MENUNGGU';
        status.className = 'status-pending';

        modal.style.display = 'flex';

        // Start polling for payment status
        this.startPaymentPolling(paymentData.order_id);
    }

    closeQRISModal() {
        const modal = document.getElementById('qris-modal');
        modal.style.display = 'none';
        this.stopPaymentPolling();
    }

    startPaymentPolling(orderId) {
        this.paymentInterval = setInterval(async () => {
            await this.checkPaymentStatus(orderId);
        }, 5000); // Check every 5 seconds
    }

    stopPaymentPolling() {
        if (this.paymentInterval) {
            clearInterval(this.paymentInterval);
            this.paymentInterval = null;
        }
    }

    async checkPaymentStatus(orderId) {
        try {
            const response = await fetch(`http://localhost:8080/api/payment/status/${orderId}`, {
                headers: AuthHelper.getAuthHeaders()
            });

            if (response.ok) {
                const status = await response.json();
                this.updatePaymentStatus(status);
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
        }
    }

    updatePaymentStatus(status) {
        const statusElement = document.getElementById('qris-status');
        
        if (status.payment_status === 'PAID') {
            statusElement.textContent = 'BERHASIL';
            statusElement.className = 'status-paid';
            this.showSuccess('Pembayaran QRIS berhasil!');
            this.stopPaymentPolling();
            setTimeout(() => {
                this.closeQRISModal();
                this.resetTransaction();
                this.loadTransactionHistory();
            }, 2000);
        } else if (status.payment_status === 'FAILED') {
            statusElement.textContent = 'GAGAL';
            statusElement.className = 'status-failed';
            this.showError('Pembayaran QRIS gagal');
            this.stopPaymentPolling();
        }
    }

    cancelPayment() {
        if (confirm('Batalkan pembayaran QRIS?')) {
            this.closeQRISModal();
            // You might want to cancel the transaction on backend as well
        }
    }

    // ========== TRANSACTION HISTORY ==========

    async loadTransactionHistory() {
        try {
            const filter = document.getElementById('date-filter').value;
            let url = 'http://localhost:8080/api/transaksi';

            // Add date filter if needed
            if (filter !== 'all') {
                const dateRange = this.getDateRange(filter);
                url += `?start=${dateRange.start}&end=${dateRange.end}`;
            }

            const response = await fetch(url, {
                headers: AuthHelper.getAuthHeaders()
            });

            if (response.ok) {
                const transactions = await response.json();
                this.displayTransactionHistory(transactions);
                this.updateTransactionSummary(transactions);
            }
        } catch (error) {
            console.error('Error loading transaction history:', error);
        }
    }

    displayTransactionHistory(transactions) {
        const container = document.getElementById('transactions-list');

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Belum ada transaksi</p>
                </div>
            `;
            return;
        }

        // Sort by date (newest first) and take last 10
        const recentTransactions = transactions
            .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
            .slice(0, 10);

        container.innerHTML = recentTransactions.map(transaction => `
            <div class="transaction-history-item">
                <div class="transaction-header">
                    <span class="transaction-id">${transaction.referenceNumber || `#${transaction.idTransaksi}`}</span>
                    <span class="transaction-amount">${this.formatCurrency(transaction.total)}</span>
                </div>
                <div class="transaction-details">
                    <span class="payment-badge ${transaction.metode_pembayaran === 'TUNAI' ? 'cash' : 'qris'}">
                        ${transaction.metode_pembayaran === 'TUNAI' ? 'TUNAI' : 'QRIS'}
                    </span>
                    <span class="status-badge status-${transaction.paymentStatus?.toLowerCase() || 'pending'}">
                        ${transaction.paymentStatus || 'PENDING'}
                    </span>
                    <span class="transaction-time">${this.formatTime(transaction.tanggal)}</span>
                </div>
            </div>
        `).join('');
    }

    updateTransactionSummary(transactions) {
        const totalTransactions = transactions.length;
        const totalSales = transactions.reduce((sum, transaction) => sum + (transaction.total || 0), 0);

        document.getElementById('total-transactions').textContent = totalTransactions;
        document.getElementById('total-sales').textContent = this.formatCurrency(totalSales);
    }

    // ========== UTILITY FUNCTIONS ==========

    calculateTotal() {
        return this.cart.reduce((total, item) => total + (item.hargaSatuan * item.quantity), 0);
    }

    updateSummary() {
        const subtotal = this.calculateTotal();
        document.getElementById('subtotal').textContent = this.formatCurrency(subtotal);
        document.getElementById('total-amount').textContent = this.formatCurrency(subtotal);
        
        // Update cash change if cash payment is selected
        this.handleCashInput();
    }

    resetTransaction() {
        this.cart = [];
        this.updateCartDisplay();
        this.updateSummary();
        
        // Reset form
        document.getElementById('product-search').value = '';
        document.querySelector('input[name="payment-method"][value="TUNAI"]').checked = true;
        document.getElementById('cash-amount').value = '';
        this.handlePaymentMethodChange({ target: { value: 'TUNAI' } });
    }

    getCurrentUserId() {
        // This should come from the authentication system
        // For now, return a default user ID
        return 1;
    }

    getDateRange(filter) {
        const now = new Date();
        let start, end;

        switch (filter) {
            case 'today':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                break;
            case 'week':
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                start = new Date(now.setDate(diff));
                end = new Date(now.setDate(diff + 6));
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                break;
            default:
                start = new Date(2000, 0, 1);
                end = new Date(2100, 0, 1);
        }

        return {
            start: start.toISOString(),
            end: end.toISOString()
        };
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    showError(message) {
        // Simple error display - enhance with toast notifications
        alert('Error: ' + message);
    }

    showSuccess(message) {
        // Simple success display - enhance with toast notifications
        alert('Sukses: ' + message);
    }
}

// Initialize the application
let kasirTransaksi;

document.addEventListener('DOMContentLoaded', () => {
    kasirTransaksi = new KasirTransaksi();
});