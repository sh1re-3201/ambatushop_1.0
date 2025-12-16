/**
 * Kasir Transaksi JavaScript - Fixed Version with Proper Stock Management
 */
class KasirTransaksi {
    constructor() {
        this.cart = [];
        this.products = [];
        this.currentTransaction = null;
        this.paymentInterval = null;
        this.paymentTimer = null;

        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        await this.loadProducts();
        await this.loadTransactionHistory();

        // Initialize camera scanner jika ada
        if (typeof CameraBarcodeScanner !== 'undefined') {
            this.cameraScanner = new CameraBarcodeScanner(this);
        }
    }

    async checkAuth() {
        const auth = AuthHelper.checkAuth();
        if (!auth) return;

        if (auth.userRole !== "KASIR") {
            alert("Hanya Kasir yang dapat mengakses halaman ini");
            window.location.href = "/login.html";
            return;
        }
    }

    initSidebar() {
        const sidebar = document.getElementById("sidebar");
        const closeBtn = document.getElementById("sidebar-close");
        const openBtn = document.getElementById("sidebar-open-btn");

        if (!sidebar) return;

        // Avatar dropdown
        const avatarBtn = document.getElementById("avatar-btn");
        const avatarDropdown = document.getElementById("avatar-dropdown");
        const avatarOptions = document.querySelectorAll(".avatar-option");
        const currentAvatar = document.getElementById("current-avatar");
        const defaultAvatar = document.getElementById("default-avatar");
        const logoutBtn = document.getElementById("logout-btn");

        // Theme toggle
        const themeToggle = document.getElementById("theme-toggle");
        const sunIcon = document.querySelector(".sun-icon");
        const moonIcon = document.querySelector(".moon-icon");

        // Load saved theme
        const savedTheme = localStorage.getItem("theme") || "light";
        document.documentElement.setAttribute("data-theme", savedTheme);
        this.updateThemeIcon(savedTheme);

        // Theme toggle functionality
        themeToggle?.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark";

            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
            this.updateThemeIcon(newTheme);
        });

        // Sidebar functionality
        sidebar.classList.remove("closed");
        sidebar.setAttribute("aria-hidden", "false");

        closeBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.add("closed");
            sidebar.setAttribute("aria-hidden", "true");
        });

        openBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.remove("closed");
            sidebar.setAttribute("aria-hidden", "false");
        });

        // Avatar Dropdown functionality
        if (avatarBtn) {
            avatarBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (avatarDropdown) {
                    avatarDropdown.classList.toggle("show");
                }
            });
        }

        document.addEventListener("click", (e) => {
            if (avatarDropdown && !avatarDropdown.contains(e.target) && avatarBtn && !avatarBtn.contains(e.target)) {
                avatarDropdown.classList.remove("show");
            }
        });

        // Avatar selection
        avatarOptions.forEach((option) => {
            option.addEventListener("click", () => {
                const avatarSrc = option.src;
                if (currentAvatar) {
                    currentAvatar.src = avatarSrc;
                    currentAvatar.style.display = "block";
                }
                if (defaultAvatar) {
                    defaultAvatar.style.display = "none";
                }
                avatarOptions.forEach((opt) => opt.classList.remove("selected"));
                option.classList.add("selected");
                localStorage.setItem("selectedAvatar", avatarSrc);
                if (avatarDropdown) {
                    avatarDropdown.classList.remove("show");
                }
            });
        });

        // Load saved avatar
        const savedAvatar = localStorage.getItem("selectedAvatar");
        if (savedAvatar && currentAvatar) {
            currentAvatar.src = savedAvatar;
            currentAvatar.style.display = "block";
            if (defaultAvatar) {
                defaultAvatar.style.display = "none";
            }
            avatarOptions.forEach((option) => {
                if (option.src === savedAvatar) {
                    option.classList.add("selected");
                }
            });
        }

        // Logout functionality using AuthHelper
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                if (confirm("Apakah Anda yakin ingin logout?")) {
                    AuthHelper.logout();
                }
            });
        }
    }

    updateThemeIcon(theme) {
        const sunIcon = document.querySelector(".sun-icon");
        const moonIcon = document.querySelector(".moon-icon");

        if (theme === "dark") {
            if (sunIcon) sunIcon.style.display = "none";
            if (moonIcon) moonIcon.style.display = "block";
        } else {
            if (sunIcon) sunIcon.style.display = "block";
            if (moonIcon) moonIcon.style.display = "none";
        }
    }

    initEventListeners() {
        // Product search
        const searchInput = document.getElementById("product-search");
        if (searchInput) {
            searchInput.addEventListener("input", this.handleSearch.bind(this));
        }

        // Payment method change
        const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
        paymentMethods.forEach((method) => {
            method.addEventListener("change", this.handlePaymentMethodChange.bind(this));
        });

        // Cash amount input
        const cashInput = document.getElementById("cash-amount");
        if (cashInput) {
            cashInput.addEventListener("input", this.handleCashInput.bind(this));
        }

        // Complete transaction
        const completeBtn = document.getElementById("complete-transaction");
        if (completeBtn) {
            completeBtn.addEventListener("click", this.completeTransaction.bind(this));
        }

        // Reset transaction
        const resetBtn = document.getElementById("reset-transaksi");
        if (resetBtn) {
            resetBtn.addEventListener("click", this.resetTransaction.bind(this));
        }

        // Date filter
        const dateFilter = document.getElementById("date-filter");
        if (dateFilter) {
            dateFilter.addEventListener("change", this.loadTransactionHistory.bind(this));
        }

        // Modal controls
        this.setupModalEventListeners();

        // Camera scanner controls jika ada
        const uploadImageBtn = document.getElementById("upload-image-btn");
        if (uploadImageBtn) {
            uploadImageBtn.addEventListener("click", () => {
                document.getElementById("barcode-image-input")?.click();
            });
        }

        const barcodeImageInput = document.getElementById("barcode-image-input");
        if (barcodeImageInput) {
            barcodeImageInput.addEventListener("change", (e) => this.handleBarcodeImageUpload(e));
        }
    }

    setupModalEventListeners() {
        // Cash modal
        const closeCashModal = document.getElementById("close-cash-modal");
        const cancelCashPayment = document.getElementById("cancel-cash-payment");
        const confirmCashPayment = document.getElementById("confirm-cash-payment");

        if (closeCashModal) {
            closeCashModal.addEventListener("click", () => this.closeCashModal());
        }
        
        if (cancelCashPayment) {
            cancelCashPayment.addEventListener("click", () => this.closeCashModal());
        }
        
        if (confirmCashPayment) {
            confirmCashPayment.addEventListener("click", () => this.confirmCashPayment());
        }

        // QRIS status modal
        const closeStatusModal = document.getElementById("close-status-modal");
        const closeQrisStatusModal = document.getElementById("close-qris-status-modal");
        const retryPayment = document.getElementById("retry-payment");

        if (closeStatusModal) {
            closeStatusModal.addEventListener("click", () => this.closeQRISStatusModal());
        }
        
        if (closeQrisStatusModal) {
            closeQrisStatusModal.addEventListener("click", () => this.closeQRISStatusModal());
        }
        
        if (retryPayment) {
            retryPayment.addEventListener("click", () => this.retryQRISPayment());
        }
    }

    async handleBarcodeImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch("http://localhost:8080/api/barcode/decode", {
                method: "POST",
                headers: {
                    "Authorization": AuthHelper.getAuthHeaders().Authorization || ""
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.produk) {
                    this.addToCart(data.produk.idProduk);
                } else {
                    this.showError("Barcode tidak terdeteksi atau produk tidak ditemukan");
                }
            } else {
                this.showError("Gagal memproses gambar barcode");
            }
        } catch (error) {
            console.error("Error uploading barcode image:", error);
            this.showError("Gagal mengupload gambar");
        }
    }

    // ========== PRODUCT MANAGEMENT ==========

    async loadProducts() {
        try {
            const response = await fetch("http://localhost:8080/api/produk", {
                headers: AuthHelper.getAuthHeaders(),
            });

            if (response.ok) {
                this.products = await response.json();
                console.log("✅ Products loaded:", this.products.length);
            } else {
                throw new Error("Gagal memuat data produk");
            }
        } catch (error) {
            console.error("Error loading products:", error);
            this.showError("Gagal memuat data produk");
        }
    }

    handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();
        const resultsContainer = document.getElementById("search-results");

        if (!resultsContainer) return;

        if (query.length < 2) {
            resultsContainer.classList.remove("show");
            return;
        }

        const filteredProducts = this.products.filter(
            (product) =>
                product.namaProduk.toLowerCase().includes(query) && product.stok > 0
        );

        this.displaySearchResults(filteredProducts, resultsContainer);
    }

    displaySearchResults(products, container) {
        if (products.length === 0) {
            container.innerHTML = '<div class="search-result-item">Produk tidak ditemukan</div>';
        } else {
            container.innerHTML = products
                .map(
                    (product) => `
                <div class="search-result-item" data-product-id="${product.idProduk}">
                    <div class="product-name">${product.namaProduk}</div>
                    <div class="product-details">
                        <span>${this.formatCurrency(product.harga)}</span>
                        <span>Stok: ${product.stok}</span>
                    </div>
                </div>
            `
                )
                .join("");
        }

        container.classList.add("show");

        // Add click event to search results
        container.querySelectorAll(".search-result-item").forEach((item) => {
            item.addEventListener("click", () => {
                const productId = parseInt(item.dataset.productId);
                this.addToCart(productId);
                container.classList.remove("show");
                const searchInput = document.getElementById("product-search");
                if (searchInput) searchInput.value = "";
            });
        });
    }

    addToCart(productId) {
        const product = this.products.find((p) => p.idProduk === productId);
        if (!product) return;

        const existingItem = this.cart.find(
            (item) => item.product.idProduk === productId
        );

        if (existingItem) {
            if (existingItem.quantity < product.stok) {
                existingItem.quantity++;
            } else {
                this.showError("Stok tidak mencukupi");
                return;
            }
        } else {
            if (product.stok > 0) {
                this.cart.push({
                    product: product,
                    quantity: 1,
                    hargaSatuan: product.harga,
                });
            } else {
                this.showError("Stok habis");
                return;
            }
        }

        this.updateCartDisplay();
        this.updateSummary();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter((item) => item.product.idProduk !== productId);
        this.updateCartDisplay();
        this.updateSummary();
    }

    updateQuantity(productId, change) {
        const item = this.cart.find((item) => item.product.idProduk === productId);
        if (!item) return;

        const newQuantity = item.quantity + change;

        if (newQuantity < 1) {
            this.removeFromCart(productId);
            return;
        }

        if (newQuantity > item.product.stok) {
            this.showError("Stok tidak mencukupi");
            return;
        }

        item.quantity = newQuantity;
        this.updateCartDisplay();
        this.updateSummary();
    }

    updateCartDisplay() {
        const container = document.getElementById("cart-items");
        const completeBtn = document.getElementById("complete-transaction");

        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <p>Belum ada produk ditambahkan</p>
                </div>
            `;
            if (completeBtn) completeBtn.disabled = true;
            return;
        }

        container.innerHTML = this.cart
            .map(
                (item) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.product.namaProduk}</div>
                    <div class="cart-item-price">${this.formatCurrency(item.hargaSatuan)}</div>
                    <div class="cart-item-stock" style="font-size: 11px; color: var(--text-secondary);">
                        Stok tersedia: ${item.product.stok}
                    </div>
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
        `
            )
            .join("");

        if (completeBtn) completeBtn.disabled = false;
    }

    // ========== PAYMENT HANDLING ==========

    handlePaymentMethodChange(e) {
        const method = e.target.value;
        const cashInput = document.getElementById("cash-input");
        const qrisPayment = document.getElementById("qris-payment");

        if (method === "TUNAI") {
            if (cashInput) cashInput.style.display = "block";
            if (qrisPayment) qrisPayment.style.display = "none";
            this.handleCashInput(); // Recalculate change
        } else {
            if (cashInput) cashInput.style.display = "none";
            if (qrisPayment) qrisPayment.style.display = "block";
        }
    }

    handleCashInput() {
        const cashInput = document.getElementById("cash-amount");
        if (!cashInput) return;

        const cashAmount = parseFloat(cashInput.value) || 0;
        const total = this.calculateTotal();
        const change = cashAmount - total;

        const cashChangeElement = document.getElementById("cash-change");
        if (cashChangeElement) {
            cashChangeElement.textContent = this.formatCurrency(Math.max(0, change));
        }

        const completeBtn = document.getElementById("complete-transaction");
        if (completeBtn) {
            completeBtn.disabled = change < 0;
        }
    }

    // ========== TRANSACTION MANAGEMENT ==========

    async completeTransaction() {
        if (this.cart.length === 0) {
            this.showError("Keranjang belanja kosong");
            return;
        }

        const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
        if (!paymentMethod) {
            this.showError("Pilih metode pembayaran terlebih dahulu");
            return;
        }

        const method = paymentMethod.value;
        const total = this.calculateTotal();

        // Validasi untuk tunai
        if (method === "TUNAI") {
            const cashAmount = parseFloat(document.getElementById("cash-amount")?.value) || 0;
            if (cashAmount < total) {
                this.showError("Jumlah uang tidak mencukupi");
                return;
            }
        }

        try {
            this.setLoadingState(true);

            // DAPATKAN USER INFO KASIR
            const userInfo = await this.getCurrentUserInfo();
            const kasirName = userInfo.username || 'Kasir';

            console.log('Kasir yang membuat transaksi:', kasirName);

            // Prepare transaction data
            const transactionData = {
                metodePembayaran: method,
                total: total,
                akunId: userInfo.userId || this.getCurrentUserId(),
                kasirName: kasirName,
                details: this.cart.map(item => ({
                    produkId: item.product.idProduk,
                    jumlah: item.quantity,
                    hargaSatuan: item.hargaSatuan,
                    subtotal: item.hargaSatuan * item.quantity
                }))
            };

            console.log("Creating transaction:", transactionData);

            // Create transaction - STOK BELUM DIKURANGI
            const response = await fetch("http://localhost:8080/api/transaksi", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...AuthHelper.getAuthHeaders(),
                },
                body: JSON.stringify(transactionData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = "Gagal membuat transaksi";
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const transaction = await response.json();
            console.log("Transaction created:", transaction);
            this.currentTransaction = transaction;

            // Handle berdasarkan metode pembayaran
            if (method === "TUNAI") {
                await this.handleCashPayment(transaction);
            } else {
                await this.handleQRISPayment(transaction.idTransaksi);
            }
        } catch (error) {
            console.error("Transaction error:", error);
            this.showError("Gagal menyimpan transaksi: " + error.message);
            this.setLoadingState(false);
        }
    }

    // ========== CASH PAYMENT FLOW (FIXED) ==========

    async handleCashPayment(transaction) {
        const cashInput = document.getElementById("cash-amount");
        const cashAmount = cashInput ? parseFloat(cashInput.value) || 0 : 0;
        const total = transaction.total;
        const change = cashAmount - total;

        // Tampilkan modal konfirmasi tunai
        this.showCashModal(transaction, cashAmount, change);
    }

    showCashModal(transaction, cashAmount, change) {
        const modal = document.getElementById("cash-modal");
        if (!modal) return;

        // Update informasi di modal
        const cashTotalAmount = document.getElementById("cash-total-amount");
        const cashReceivedAmount = document.getElementById("cash-received-amount");
        const cashChangeAmount = document.getElementById("cash-change-amount");

        if (cashTotalAmount) cashTotalAmount.textContent = this.formatCurrency(transaction.total);
        if (cashReceivedAmount) cashReceivedAmount.textContent = this.formatCurrency(cashAmount);
        if (cashChangeAmount) cashChangeAmount.textContent = this.formatCurrency(change);

        modal.style.display = "flex";
        this.currentTransaction = transaction;
    }

    async confirmCashPayment() {
        try {
            if (!this.currentTransaction) {
                throw new Error("Tidak ada transaksi yang dipilih");
            }

            console.log("💰 Konfirmasi pembayaran tunai untuk transaksi:", this.currentTransaction.idTransaksi);
            
            // API call untuk konfirmasi pembayaran tunai
            const response = await fetch(
                `http://localhost:8080/api/transaksi/${this.currentTransaction.idTransaksi}/confirm-cash`,
                {
                    method: "POST",
                    headers: AuthHelper.getAuthHeaders(),
                }
            );

            const responseText = await response.text();
            
            if (!response.ok) {
                let errorMessage = "Gagal mengkonfirmasi pembayaran";
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = responseText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            let updatedTransaction;
            try {
                updatedTransaction = JSON.parse(responseText);
            } catch (e) {
                throw new Error("Invalid response from server");
            }

            console.log("✅ Pembayaran tunai berhasil:", updatedTransaction);

            this.showSuccess(
                "Pembayaran tunai berhasil! Transaksi #" +
                (updatedTransaction.referenceNumber || this.currentTransaction.referenceNumber)
            );
            
            this.closeCashModal();
            this.resetTransaction();

            // Reload produk untuk update stok yang baru
            await this.loadProducts();
            await this.loadTransactionHistory();
            
        } catch (error) {
            console.error("Cash payment confirmation error:", error);
            this.showError("Gagal mengkonfirmasi pembayaran: " + error.message);
            this.closeCashModal();
            this.setLoadingState(false);
        }
    }

    closeCashModal() {
        const modal = document.getElementById("cash-modal");
        if (modal) {
            modal.style.display = "none";
        }
        this.currentTransaction = null;
        this.setLoadingState(false);
    }

    // ========== QRIS PAYMENT FLOW (FIXED) ==========

    async handleQRISPayment(transactionId) {
        try {
            console.log("🔄 Membuat pembayaran QRIS untuk transaksi:", transactionId);

            const response = await fetch(
                `http://localhost:8080/api/payment/qris/${transactionId}`,
                {
                    method: "POST",
                    headers: AuthHelper.getAuthHeaders(),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = "Gagal membuat pembayaran QRIS";
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const paymentData = await response.json();
            console.log("Response Midtrans:", paymentData);

            // Redirect otomatis ke payment URL
            const paymentUrl = paymentData.payment_url || paymentData.redirect_url;

            if (paymentUrl) {
                console.log("🔗 Redirect ke:", paymentUrl);
                // Buka tab baru untuk payment
                window.open(paymentUrl, "_blank");

                // Tampilkan modal waiting dengan polling
                this.showQRISWaitingModal(
                    transactionId,
                    paymentData.order_id,
                    paymentData
                );
            } else {
                throw new Error("Tidak ada payment URL dari Midtrans");
            }
        } catch (error) {
            console.error("QRIS payment error:", error);
            this.showError("Gagal membuat pembayaran QRIS: " + error.message);
            this.setLoadingState(false);
        }
    }

    showQRISWaitingModal(transactionId, orderId, paymentData) {
        const modal = document.getElementById("qris-status-modal");
        const container = document.getElementById("payment-status-container");

        if (!modal || !container) return;

        container.innerHTML = `
            <div class="status-icon pending">⏳</div>
            <div class="status-message">Menunggu Pembayaran...</div>
            
            <div class="transaction-details">
                <div class="detail-item">
                    <span>Transaction ID:</span>
                    <span>${transactionId}</span>
                </div>
                <div class="detail-item">
                    <span>Order ID:</span>
                    <span>${orderId}</span>
                </div>
                <div class="detail-item">
                    <span>Amount:</span>
                    <span>${this.formatCurrency(paymentData.amount || this.calculateTotal())}</span>
                </div>
                <div class="detail-item">
                    <span>Status:</span>
                    <span class="status-badge status-pending">MENUNGGU</span>
                </div>
            </div>
            
            <div class="payment-instructions">
                <p><strong>Instruksi:</strong></p>
                <ol>
                    <li>Halaman payment Midtrans telah dibuka di tab baru</li>
                    <li>Lakukan pembayaran di halaman tersebut</li>
                    <li>Tutup halaman payment setelah selesai</li>
                    <li>Status akan otomatis update via webhook</li>
                </ol>
                
                <div class="alert-info">
                    💡 <strong>Note:</strong> Stok akan otomatis berkurang saat pembayaran berhasil
                </div>
            </div>
        `;

        modal.style.display = "flex";

        // Start polling untuk cek status
        this.startTransactionPolling(transactionId);
    }

    startTransactionPolling(transactionId) {
        // Stop previous polling
        this.stopPaymentPolling();

        this.paymentInterval = setInterval(async () => {
            await this.checkTransactionStatus(transactionId);
        }, 3000); // Cek setiap 3 detik
    }

    async checkTransactionStatus(transactionId) {
        try {
            const response = await fetch(
                `http://localhost:8080/api/transaksi/${transactionId}`,
                {
                    headers: AuthHelper.getAuthHeaders(),
                }
            );

            if (response.ok) {
                const transaction = await response.json();
                this.updateTransactionStatusDisplay(transaction);

                // Jika sudah paid, stop polling dan refresh data
                if (transaction.paymentStatus === "PAID") {
                    this.handleSuccessfulQRISPayment(transaction);
                } else if (transaction.paymentStatus === "FAILED" || 
                          transaction.paymentStatus === "EXPIRED") {
                    this.handleFailedQRISPayment(transaction);
                }
            }
        } catch (error) {
            console.error("Error checking transaction status:", error);
        }
    }

    updateTransactionStatusDisplay(transaction) {
        const statusBadge = document.querySelector(".status-badge");
        const statusMessage = document.querySelector(".status-message");
        const statusIcon = document.querySelector(".status-icon");

        if (!statusBadge || !statusMessage || !statusIcon) return;

        switch (transaction.paymentStatus) {
            case "PAID":
                statusIcon.textContent = "✅";
                statusIcon.className = "status-icon success";
                statusMessage.textContent = "Pembayaran Berhasil!";
                statusMessage.style.color = "var(--success)";
                statusBadge.textContent = "PAID";
                statusBadge.className = "status-badge status-paid";
                break;

            case "PENDING":
                statusIcon.textContent = "⏳";
                statusIcon.className = "status-icon pending";
                statusMessage.textContent = "Menunggu Pembayaran...";
                statusMessage.style.color = "var(--warning)";
                statusBadge.textContent = "PENDING";
                statusBadge.className = "status-badge status-pending";
                break;

            case "FAILED":
            case "EXPIRED":
                statusIcon.textContent = "❌";
                statusIcon.className = "status-icon failed";
                statusMessage.textContent = "Pembayaran Gagal";
                statusMessage.style.color = "var(--error)";
                statusBadge.textContent = transaction.paymentStatus;
                statusBadge.className = "status-badge status-failed";
                break;
        }
    }

    handleSuccessfulQRISPayment(transaction) {
        this.stopPaymentPolling();

        setTimeout(() => {
            this.showSuccess(
                "Pembayaran QRIS berhasil! Transaksi #" + (transaction.referenceNumber || "")
            );
            this.closeQRISStatusModal();
            this.resetTransaction();

            // Reload produk untuk update stok yang baru
            this.loadProducts();
            this.loadTransactionHistory();
        }, 2000);
    }

    handleFailedQRISPayment(transaction) {
        this.stopPaymentPolling();
        
        const statusMessage = document.querySelector(".status-message");
        const statusIcon = document.querySelector(".status-icon");
        const retryBtn = document.getElementById("retry-payment");
        
        if (statusMessage && statusIcon) {
            statusIcon.textContent = "❌";
            statusIcon.className = "status-icon failed";
            statusMessage.textContent = "Pembayaran Gagal";
            statusMessage.style.color = "var(--error)";
        }
        
        // Tampilkan tombol retry
        if (retryBtn) {
            retryBtn.style.display = "block";
        }
    }

    async retryQRISPayment() {
        if (!this.currentTransaction) return;
        
        // Reset modal
        const container = document.getElementById("payment-status-container");
        const retryBtn = document.getElementById("retry-payment");
        
        if (container) {
            container.innerHTML = `
                <div class="status-icon pending">⏳</div>
                <div class="status-message">Mencoba kembali...</div>
            `;
        }
        
        if (retryBtn) {
            retryBtn.style.display = "none";
        }
        
        // Coba lagi pembayaran QRIS
        await this.handleQRISPayment(this.currentTransaction.idTransaksi);
    }

    closeQRISStatusModal() {
        const modal = document.getElementById("qris-status-modal");
        if (modal) {
            modal.style.display = "none";
        }
        this.stopPaymentPolling();
        this.currentTransaction = null;
        this.setLoadingState(false);
    }

    stopPaymentPolling() {
        if (this.paymentInterval) {
            clearInterval(this.paymentInterval);
            this.paymentInterval = null;
        }
    }

    // ========== TRANSACTION HISTORY ==========

    async loadTransactionHistory() {
        try {
            console.log("🔄 Loading transaction history...");

            const response = await fetch("http://localhost:8080/api/transaksi", {
                method: "GET",
                headers: AuthHelper.getAuthHeaders(),
            });

            console.log("Response status:", response.status);
            console.log("Response ok:", response.ok);

            if (response.ok) {
                const transactions = await response.json();
                console.log("✅ Transactions loaded:", transactions);
                this.displayTransactionHistory(transactions);
                this.updateTransactionSummary(transactions);
            } else {
                const errorText = await response.text();
                console.error("❌ API Error:", errorText);

                if (response.status === 401) {
                    this.showError("Session expired. Silakan login kembali.");
                    AuthHelper.logout();
                    return;
                }

                if (response.status === 403) {
                    this.showError("Akses ditolak. Pastikan Anda memiliki role KASIR.");
                    return;
                }

                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error("❌ Error loading transaction history:", error);

            if (error.message.includes("Failed to fetch")) {
                this.showError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
            } else {
                this.showError("Gagal memuat riwayat transaksi: " + error.message);
            }

            // Tampilkan empty state
            this.displayEmptyState();
        }
    }

    displayEmptyState() {
        const container = document.getElementById("transactions-list");
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="margin-bottom: 12px;">
                    <path d="M8 7V3m8 4V3M9 12h6m-6 4h4M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" 
                          stroke="var(--text-secondary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p>Belum ada transaksi</p>
                <small style="color: var(--text-secondary);">Transaksi yang dibuat akan muncul di sini</small>
            </div>
        `;

        const totalTransactionsElement = document.getElementById("total-transactions");
        const totalSalesElement = document.getElementById("total-sales");

        if (totalTransactionsElement) totalTransactionsElement.textContent = "0";
        if (totalSalesElement) totalSalesElement.textContent = this.formatCurrency(0);
    }

    displayTransactionHistory(transactions) {
        const container = document.getElementById("transactions-list");
        if (!container) return;

        if (!transactions || transactions.length === 0) {
            this.displayEmptyState();
            return;
        }

        // Sort by date (newest first)
        const sortedTransactions = transactions.sort(
            (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
        );

        container.innerHTML = sortedTransactions
            .map((transaction) => this.createTransactionItem(transaction))
            .join("");
    }

    createTransactionItem(transaction) {
        // Debug transaction data
        console.log("Processing transaction:", transaction);

        const status = transaction.paymentStatus || "PENDING";
        const method = transaction.metodePembayaran || transaction.metode_pembayaran || "TUNAI";
        const total = transaction.total || 0;
        const reference = transaction.referenceNumber || `TRX-${transaction.idTransaksi}`;
        const date = transaction.tanggal || new Date().toISOString();

        // Handle details - bisa berupa array atau undefined
        const details = transaction.details || [];
        const itemsCount = Array.isArray(details) ? details.length : 0;

        return `
            <div class="transaction-history-item" data-transaction-id="${transaction.idTransaksi}">
                <div class="transaction-header">
                    <div class="transaction-main">
                        <span class="transaction-id">${reference}</span>
                        <span class="transaction-amount">${this.formatCurrency(total)}</span>
                    </div>
                    <div class="transaction-status ${this.getStatusClass(status)}">
                        ${this.getStatusText(status)}
                    </div>
                </div>
                
                <div class="transaction-details">
                    <div class="transaction-meta">
                        <span class="payment-method ${method.toLowerCase()}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                ${this.getPaymentMethodIcon(method)}
                            </svg>
                            ${this.getPaymentMethodText(method)}
                        </span>
                        <span class="transaction-time">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                            ${this.formatDateTime(date)}
                        </span>
                    </div>
                    
                    ${itemsCount > 0 ? `
                        <div class="transaction-items">
                            <div class="items-count">
                                ${itemsCount} item${itemsCount > 1 ? "s" : ""}
                            </div>
                            <div class="items-preview">
                                ${this.getItemsPreview(details)}
                            </div>
                        </div>
                    ` : ""}
                    
                    <div class="transaction-actions">
                        <button class="btn-view-details" onclick="kasirTransaksi.viewTransactionDetails(${transaction.idTransaksi})">
                            Lihat Detail
                        </button>
                        ${status === "PENDING" && method === "NON_TUNAI" ? `
                            <button class="btn-check-status" onclick="kasirTransaksi.checkTransactionStatus(${transaction.idTransaksi})">
                                Cek Status
                            </button>
                        ` : ""}
                    </div>
                </div>
            </div>
        `;
    }

    getItemsPreview(details) {
        if (!details || !Array.isArray(details)) return "";

        const previewItems = details.slice(0, 2);
        const remaining = details.length - 2;

        return `
            ${previewItems
                .map(
                    (detail) => `
                <span class="item-name">
                    ${detail.namaProduk || detail.product?.namaProduk || "Produk"}
                </span>
            `
                )
                .join("")}
            ${remaining > 0 ? `<span class="more-items">+${remaining} lainnya</span>` : ""}
        `;
    }

    getStatusClass(status) {
        const statusMap = {
            PAID: "status-paid",
            PENDING: "status-pending",
            FAILED: "status-failed",
            EXPIRED: "status-expired",
        };
        return statusMap[status] || "status-pending";
    }

    getStatusText(status) {
        const statusMap = {
            PAID: "LUNAS",
            PENDING: "MENUNGGU",
            FAILED: "GAGAL",
            EXPIRED: "KADALUARSA",
        };
        return statusMap[status] || "MENUNGGU";
    }

    getPaymentMethodIcon(method) {
        if (method === "NON_TUNAI" || method === "QRIS") {
            return `<rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M6 9h4M6 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
        } else {
            return `<rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M2 10h20" stroke="currentColor" stroke-width="1.5"/>`;
        }
    }

    getPaymentMethodText(method) {
        return method === "NON_TUNAI" || method === "QRIS" ? "QRIS" : "TUNAI";
    }

    formatDateTime(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const transactionDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );

            let dateText;
            if (transactionDate.getTime() === today.getTime()) {
                dateText = "Hari ini";
            } else if (transactionDate.getTime() === yesterday.getTime()) {
                dateText = "Kemarin";
            } else {
                dateText = date.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                });
            }

            const timeText = date.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
            });

            return `${dateText} • ${timeText}`;
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Tanggal tidak valid";
        }
    }

    updateTransactionSummary(transactions) {
        if (!transactions || transactions.length === 0) {
            const totalTransactionsElement = document.getElementById("total-transactions");
            const totalSalesElement = document.getElementById("total-sales");
            
            if (totalTransactionsElement) totalTransactionsElement.textContent = "0";
            if (totalSalesElement) totalSalesElement.textContent = this.formatCurrency(0);
            return;
        }

        const totalTransactions = transactions.length;
        const paidTransactions = transactions.filter(
            (t) => t.paymentStatus === "PAID"
        );
        const totalSales = paidTransactions.reduce(
            (sum, transaction) => sum + (transaction.total || 0),
            0
        );
        const pendingTransactions = transactions.filter(
            (t) => t.paymentStatus === "PENDING"
        ).length;

        const totalTransactionsElement = document.getElementById("total-transactions");
        const totalSalesElement = document.getElementById("total-sales");

        if (totalTransactionsElement) totalTransactionsElement.textContent = totalTransactions;
        if (totalSalesElement) totalSalesElement.textContent = this.formatCurrency(totalSales);

        // Update dengan info pending jika ada
        if (pendingTransactions > 0 && totalTransactionsElement) {
            totalTransactionsElement.innerHTML = `
                ${totalTransactions}
                <small style="color: var(--warning); font-size: 12px; margin-left: 4px;">
                    (${pendingTransactions} pending)
                </small>
            `;
        }
    }

    async viewTransactionDetails(transactionId) {
        try {
            console.log("🔄 Loading transaction details for:", transactionId);

            const response = await fetch(
                `http://localhost:8080/api/transaksi/${transactionId}`,
                {
                    headers: AuthHelper.getAuthHeaders(),
                }
            );

            if (response.ok) {
                const transaction = await response.json();
                console.log("✅ Transaction details:", transaction);
                this.showTransactionDetailModal(transaction);
            } else {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error("Error viewing transaction details:", error);
            this.showError("Gagal memuat detail transaksi: " + error.message);
        }
    }

    showTransactionDetailModal(transaction) {
        const modal = document.createElement("div");
        modal.className = "modal-overlay";
        modal.style.display = "flex";

        const details = transaction.details || [];
        const method = transaction.metodePembayaran || transaction.metode_pembayaran || "TUNAI";
        const status = transaction.paymentStatus || "PENDING";

        // DAPATKAN NAMA KASIR DARI TRANSACTION ATAU AKUN
        const kasirName = transaction.namaKasir || transaction.akun?.username || transaction.kasirName || "Kasir";

        modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Detail Transaksi</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="transaction-detail">
                    <div class="detail-section">
                        <h4>Informasi Transaksi</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span>ID Transaksi:</span>
                                <span>${transaction.referenceNumber || `TRX-${transaction.idTransaksi}`}</span>
                            </div>
                            <div class="detail-item">
                                <span>Tanggal:</span>
                                <span>${this.formatDateTime(transaction.tanggal)}</span>
                            </div>
                            <div class="detail-item">
                                <span>Kasir:</span>
                                <span class="kasir-info">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="margin-right: 4px;">
                                        <circle cx="12" cy="8" r="4" fill="#666" />
                                        <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="#666" stroke-width="2" fill="none" stroke-linecap="round" />
                                    </svg>
                                    ${kasirName}
                                </span>
                            </div>
                            <div class="detail-item">
                                <span>Metode Bayar:</span>
                                <span class="payment-method ${method.toLowerCase()}">
                                    ${this.getPaymentMethodText(method)}
                                </span>
                            </div>
                            <div class="detail-item">
                                <span>Status:</span>
                                <span class="transaction-status ${this.getStatusClass(status)}">
                                    ${this.getStatusText(status)}
                                </span>
                            </div>
                            <div class="detail-item highlight">
                                <span>Total:</span>
                                <span>${this.formatCurrency(transaction.total)}</span>
                            </div>
                        </div>
                    </div>

                    ${details.length > 0 ? `
                    <div class="detail-section">
                        <h4>Item Pembelian (${details.length})</h4>
                        <div class="items-list">
                            ${details
                                .map(
                                    (detail) => `
                                <div class="item-detail">
                                    <div class="item-info">
                                        <span class="item-name">${detail.namaProduk || detail.product?.namaProduk || "Produk"}</span>
                                        <span class="item-price">${this.formatCurrency(detail.hargaSatuan)} × ${detail.jumlah}</span>
                                    </div>
                                    <span class="item-subtotal">${this.formatCurrency(detail.subtotal)}</span>
                                </div>
                            `
                                )
                                .join("")}
                        </div>
                    </div>
                    ` : ""}

                    ${transaction.paymentGatewayId ? `
                    <div class="detail-section">
                        <h4>Informasi Pembayaran</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span>Payment ID:</span>
                                <span class="monospace">${transaction.paymentGatewayId}</span>
                            </div>
                            ${transaction.paymentMethodDetail ? `
                            <div class="detail-item">
                                <span>Metode:</span>
                                <span>${transaction.paymentMethodDetail}</span>
                            </div>
                            ` : ""}
                        </div>
                    </div>
                    ` : ""}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Tutup</button>
                ${status === "PENDING" && method === "NON_TUNAI" ? `
                <button class="btn-primary" onclick="kasirTransaksi.checkTransactionStatus(${transaction.idTransaksi}); this.closest('.modal-overlay').remove()">
                    Cek Status Pembayaran
                </button>
                ` : ""}
            </div>
        </div>
    `;

        document.body.appendChild(modal);
    }

    async checkTransactionStatus(transactionId) {
        try {
            console.log("🔄 Checking status for transaction:", transactionId);

            const response = await fetch(
                `http://localhost:8080/api/transaksi/${transactionId}`,
                {
                    headers: AuthHelper.getAuthHeaders(),
                }
            );

            if (response.ok) {
                const transaction = await response.json();
                const status = transaction.paymentStatus || "PENDING";

                if (status === "PAID") {
                    this.showSuccess(`Transaksi #${transactionId} sudah LUNAS`);
                } else if (status === "PENDING") {
                    this.showInfo(`Transaksi #${transactionId} masih MENUNGGU pembayaran`);
                } else {
                    this.showError(`Transaksi #${transactionId} - ${this.getStatusText(status)}`);
                }

                // Refresh history
                await this.loadTransactionHistory();
            } else {
                throw new Error("Gagal memeriksa status");
            }
        } catch (error) {
            console.error("Error checking transaction status:", error);
            this.showError("Gagal memeriksa status transaksi: " + error.message);
        }
    }

    showInfo(message) {
        alert("Info: " + message);
    }

    // ========== UTILITY FUNCTIONS ==========

    calculateTotal() {
        return this.cart.reduce(
            (total, item) => total + item.hargaSatuan * item.quantity,
            0
        );
    }

    updateSummary() {
        const subtotal = this.calculateTotal();
        const subtotalElement = document.getElementById("subtotal");
        const totalAmountElement = document.getElementById("total-amount");

        if (subtotalElement) subtotalElement.textContent = this.formatCurrency(subtotal);
        if (totalAmountElement) totalAmountElement.textContent = this.formatCurrency(subtotal);

        // Update cash change if cash payment is selected
        this.handleCashInput();
    }

    resetTransaction() {
        this.cart = [];
        this.updateCartDisplay();
        this.updateSummary();

        // Reset form
        const searchInput = document.getElementById("product-search");
        if (searchInput) searchInput.value = "";
        
        const tunaiRadio = document.querySelector('input[name="payment-method"][value="TUNAI"]');
        if (tunaiRadio) tunaiRadio.checked = true;
        
        const cashAmountInput = document.getElementById("cash-amount");
        if (cashAmountInput) cashAmountInput.value = "";
        
        this.handlePaymentMethodChange({ target: { value: "TUNAI" } });
        
        // Reset loading state
        this.setLoadingState(false);
    }

    getCurrentUserId() {
        // Dapatkan user ID dari token JWT
        try {
            const token = localStorage.getItem("authToken");
            if (!token) return 2; // Fallback ke default kasir ID

            // Decode JWT token untuk mendapatkan user info
            const payload = JSON.parse(atob(token.split(".")[1]));

            // Note: Ini adalah cara sederhana, idealnya backend memberikan endpoint /api/auth/me
            console.log("JWT Payload:", payload);

            // Cari user by username di localStorage atau buat API call
            const username = payload.sub; // sub biasanya username
            const userRole = payload.role;

            console.log("Current user:", username, "Role:", userRole);

            // Untuk sekarang, return default ID untuk kasir
            return 2; // Default kasir ID
        } catch (error) {
            console.error("Error getting user ID:", error);
            return 2; // Fallback
        }
    }

    async getCurrentUserInfo() {
        try {
            // Option 1: Ambil dari localStorage (disimpan saat login)
            const userInfo = AuthHelper.getCurrentUser();
            if (userInfo.username) {
                return userInfo;
            }

            // Option 2: API call ke endpoint /api/auth/me (jika ada)
            const response = await fetch("http://localhost:8080/api/auth/me", {
                headers: AuthHelper.getAuthHeaders(),
            });

            if (response.ok) {
                return await response.json();
            }

            // Fallback: Dapatkan dari JWT token
            const token = localStorage.getItem("authToken");
            if (token) {
                const payload = JSON.parse(atob(token.split(".")[1]));
                return {
                    username: payload.sub,
                    role: payload.role,
                    userId: payload.userId || 2,
                };
            }

            return { username: "Kasir", role: "KASIR", userId: 2 };
        } catch (error) {
            console.error("Error getting user info:", error);
            return { username: "Kasir", role: "KASIR", userId: 2 };
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    showError(message) {
        alert("Error: " + message);
    }

    showSuccess(message) {
        alert("Sukses: " + message);
    }

    setLoadingState(isLoading) {
        const completeBtn = document.getElementById("complete-transaction");
        if (completeBtn) {
            completeBtn.disabled = isLoading;
            completeBtn.innerHTML = isLoading
                ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/></svg> Memproses...'
                : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Simpan Transaksi';
        }
    }
}

// Initialize the application
let kasirTransaksi;

document.addEventListener("DOMContentLoaded", () => {
    kasirTransaksi = new KasirTransaksi();
    
    // Export ke global scope untuk akses dari onclick attributes
    window.kasirTransaksi = kasirTransaksi;
});