// Kasir Keuangan JavaScript 
class KasirKeuangan {
    constructor() {
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.initSidebar();
        this.initEventListeners();
        await this.loadFinancialData();

        this.setupAutoRefresh();
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

    setupAutoRefresh() {
        // Refresh setiap 10 detik
        setInterval(async () => {
            await this.loadFinancialData();
        }, 10000);

        // Listen untuk storage events (update dari halaman lain)
        window.addEventListener('storage', (event) => {
            if (event.key === 'finance_needs_refresh') {
                console.log('💾 Storage event detected: finance needs refresh');
                this.loadFinancialData();
            }
        });

        // Listen untuk broadcast messages
        window.addEventListener('message', (event) => {
            if (event.data.type === 'FINANCE_UPDATE') {
                console.log('📩 Received finance update broadcast');
                this.loadFinancialData();
            }
        });
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

        // Detail tabs
        const detailTabs = document.querySelectorAll('.detail-tab');
        detailTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;

                // Update active tab
                detailTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Show corresponding content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tabId}-content`).classList.add('active');
            });
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
        // Period filter
        const periodFilter = document.getElementById('period-filter');
        periodFilter.addEventListener('change', this.loadFinancialData.bind(this));

        // Expense form
        const expenseForm = document.getElementById('expense-form');
        expenseForm.addEventListener('submit', this.handleExpenseSubmit.bind(this));
    }

    async loadFinancialData() {
        try {
            console.log('🔄 Kasir loading financial data...');

            // Load summary data
            await this.loadFinancialSummary();

            // Load recent expenses
            await this.loadRecentExpenses();

            // Load income details (from transactions)
            await this.loadIncomeDetails();

        } catch (error) {
            console.error('Error loading financial data:', error);
            this.showError('Gagal memuat data keuangan: ' + error.message);
        }
    }

    async loadFinancialSummary() {
        try {
            // 1. Load transaksi untuk hitung pemasukan
            const transactionsResponse = await fetch('http://localhost:8080/api/transaksi', {
                headers: AuthHelper.getAuthHeaders()
            });

            let totalPemasukan = 0;
            let totalPengeluaran = 0;
            let successTransactions = 0;

            if (transactionsResponse.ok) {
                const transactions = await transactionsResponse.json();

                // Filter hanya transaksi PAID yang bukan stock purchase
                const paidTransactions = transactions.filter(t =>
                    (t.paymentStatus === 'PAID' || t.paymentStatus === 'LUNAS') &&
                    !this.isStockPurchase(t)
                );

                totalPemasukan = paidTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
                successTransactions = paidTransactions.length;

                // Hitung rata-rata
                const avgTransaction = successTransactions > 0 ? totalPemasukan / successTransactions : 0;
                document.getElementById('average-transaction').textContent = this.formatCurrency(avgTransaction);
            }

            // 2. Load pengeluaran dari keuangan
            const keuanganResponse = await fetch('http://localhost:8080/api/keuangan/kasir/by-type/PENGELUARAN', {
                headers: AuthHelper.getAuthHeaders()
            });

            if (keuanganResponse.ok) {
                const expenses = await keuanganResponse.json();
                totalPengeluaran = expenses.reduce((sum, e) => sum + (e.nominal || 0), 0);
            }

            // 3. Update UI
            document.getElementById('total-income').textContent = this.formatCurrency(totalPemasukan);
            document.getElementById('total-expense').textContent = this.formatCurrency(totalPengeluaran);
            document.getElementById('success-transactions').textContent = successTransactions;

        } catch (error) {
            console.error('Error loading financial summary:', error);
            this.showError('Gagal memuat data keuangan: ' + error.message);
        }
    }

    // Helper method untuk cek stock purchase
    isStockPurchase(transaction) {
        if (!transaction) return false;

        // Cek dari reference number atau metadata
        const ref = transaction.referenceNumber || '';
        const method = transaction.metodePembayaran || transaction.metode_pembayaran || '';
        const status = transaction.paymentStatus || '';

        // Stock purchase biasanya TUNAI, PAID, dan ada indikator pembelian
        return method === 'TUNAI' &&
            status === 'PAID' &&
            (transaction.description?.toLowerCase().includes('beli') ||
                transaction.notes?.toLowerCase().includes('stok') ||
                ref.includes('STOCK'));
    }





    async calculateSummaryManually() {
        try {
            // Load recent keuangan untuk kasir
            const keuanganResponse = await fetch('http://localhost:8080/api/keuangan/kasir/recent?limit=50', {
                headers: AuthHelper.getAuthHeaders()
            });

            let totalPemasukan = 0;
            let totalPengeluaran = 0;

            if (keuanganResponse.ok) {
                const keuanganData = await keuanganResponse.json();

                keuanganData.forEach(k => {
                    if (k.jenis === 'PEMASUKAN' || (k.jenis && k.jenis.toString().toUpperCase().includes('PEMASUKAN'))) {
                        totalPemasukan += k.nominal || 0;
                    } else if (k.jenis === 'PENGELUARAN' || (k.jenis && k.jenis.toString().toUpperCase().includes('PENGELUARAN'))) {
                        totalPengeluaran += k.nominal || 0;
                    }
                });
            }

            // Update UI
            document.getElementById('total-income').textContent = this.formatCurrency(totalPemasukan);
            document.getElementById('total-expense').textContent = this.formatCurrency(totalPengeluaran);

        } catch (error) {
            console.error('Error calculating manual summary:', error);
        }
    }

    async loadRecentExpenses() {
        try {
            // Load recent expenses untuk kasir
            const response = await fetch('http://localhost:8080/api/keuangan/kasir/by-type/PENGELUARAN', {
                headers: AuthHelper.getAuthHeaders()
            });

            if (response.ok) {
                const expenses = await response.json();
                this.displayExpenses(expenses);
            } else {
                // Fallback: load recent semua data
                const fallbackResponse = await fetch('http://localhost:8080/api/keuangan/kasir/recent?limit=20', {
                    headers: AuthHelper.getAuthHeaders()
                });

                if (fallbackResponse.ok) {
                    const allData = await fallbackResponse.json();
                    const expenses = allData.filter(e =>
                        e.jenis === 'PENGELUARAN' ||
                        (e.jenis && e.jenis.toString().toUpperCase().includes('PENGELUARAN'))
                    );
                    this.displayExpenses(expenses);
                }
            }

        } catch (error) {
            console.error('Error loading recent expenses:', error);
            this.displayExpenses([]);
        }
    }

    async loadIncomeDetails() {
        try {
            // Kasir bisa akses endpoint transaksi
            const response = await fetch('http://localhost:8080/api/transaksi', {
                headers: AuthHelper.getAuthHeaders()
            });

            if (response.ok) {
                const transactions = await response.json();

                // Filter hanya yang PAID
                const paidTransactions = transactions.filter(t =>
                    t.paymentStatus === 'PAID' || t.paymentStatus === 'LUNAS'
                );

                this.displayIncomeDetails(paidTransactions);

                // Update transaction stats
                const successCount = paidTransactions.length;
                const totalIncome = paidTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
                const avgTransaction = successCount > 0 ? totalIncome / successCount : 0;

                document.getElementById('success-transactions').textContent = successCount;
                document.getElementById('average-transaction').textContent = this.formatCurrency(avgTransaction);
            }

        } catch (error) {
            console.error('Error loading income details:', error);
        }
    }

    async loadTransactionStats() {
        try {
            const response = await fetch('http://localhost:8080/api/transaksi', {
                headers: AuthHelper.getAuthHeaders()
            });

            if (response.ok) {
                const transactions = await response.json();

                // Filter hanya yang PAID
                const paidTransactions = transactions.filter(t =>
                    t.paymentStatus === 'PAID' || t.paymentStatus === 'LUNAS'
                );

                const successCount = paidTransactions.length;
                const totalIncome = paidTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
                const avgTransaction = successCount > 0 ? totalIncome / successCount : 0;

                document.getElementById('success-transactions').textContent = successCount;
                document.getElementById('average-transaction').textContent = this.formatCurrency(avgTransaction);
            }

        } catch (error) {
            console.error('Error loading transaction stats:', error);
        }
    }


    async loadExpenses() {
        try {
            const response = await fetch('http://localhost:8080/api/keuangan', {
                headers: AuthHelper.getAuthHeaders()
            });

            if (response.ok) {
                const expenses = await response.json();
                this.displayExpenses(expenses);
            }
        } catch (error) {
            console.error('Error loading expenses:', error);
        }
    }

    displayIncomeDetails(transactions) {
        const incomeList = document.getElementById('income-list');

        if (!transactions || transactions.length === 0) {
            incomeList.innerHTML = '<div class="empty-state"><p>Belum ada data pemasukan</p></div>';
            return;
        }

        // Ambil hanya 10 transaksi terbaru
        const recentTransactions = transactions
            .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
            .slice(0, 10);

        incomeList.innerHTML = recentTransactions.map(transaction => {
            const metode = transaction.metodePembayaran || transaction.metode_pembayaran || 'TUNAI';
            const kasir = transaction.namaKasir || transaction.kasirName || 'Kasir';

            return `
                <div class="detail-item-card">
                    <div class="detail-item-header">
                        <span class="detail-item-title">Transaksi #${transaction.referenceNumber || transaction.idTransaksi}</span>
                        <span class="detail-item-amount income">${this.formatCurrency(transaction.total)}</span>
                    </div>
                    <div class="detail-item-description">
                        Pembayaran ${metode} • ${this.formatDate(transaction.tanggal)}
                    </div>
                    <div class="detail-item-date">
                        ${this.formatDateTime(transaction.tanggal)}
                        <span style="margin-left:8px;color:#666">• Oleh: ${kasir}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    displayExpenses(expenses) {
        const expenseList = document.getElementById('expense-list');
        const recentList = document.getElementById('recent-expenses');

        if (!expenses || expenses.length === 0) {
            expenseList.innerHTML = '<div class="empty-state"><p>Belum ada data pengeluaran</p></div>';
            recentList.innerHTML = '<div class="empty-state"><p>Belum ada riwayat pengeluaran</p></div>';
            return;
        }

        // Filter hanya pengeluaran
        const expenseItems = expenses.filter(e =>
            e.jenis === 'PENGELUARAN' ||
            (e.jenis && e.jenis.toString().toUpperCase().includes('PENGELUARAN'))
        );

        // Total pengeluaran
        const totalExpense = expenseItems.reduce((sum, e) => sum + (e.nominal || 0), 0);

        // Update total expense card
        const totalExpenseElement = document.getElementById('total-expense');
        if (totalExpenseElement) {
            totalExpenseElement.textContent = this.formatCurrency(totalExpense);
        }

        // Display expense list
        expenseList.innerHTML = expenseItems.map(expense => {
            const jenis = this.getExpenseTypeText(expense.jenis);
            const kategori = this.getExpenseCategory(expense.keterangan);
            const pegawai = expense.akun?.username || 'System';

            return `
                <div class="detail-item-card">
                    <div class="detail-item-header">
                        <span class="detail-item-title">${expense.keterangan || 'Pengeluaran'}</span>
                        <span class="detail-item-amount expense">${this.formatCurrency(expense.nominal)}</span>
                    </div>
                    <div class="detail-item-description">
                        ${jenis} • ${kategori}
                    </div>
                    <div class="detail-item-date">
                        ${this.formatDateTime(expense.tanggal)}
                        <span style="margin-left:8px;color:#666">• Dicatat oleh: ${pegawai}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Display recent expenses (max 5)
        const recentExpenses = expenseItems.slice(0, 5);
        recentList.innerHTML = recentExpenses.map(expense => {
            const jenis = this.getExpenseTypeText(expense.jenis);

            return `
                <div class="recent-item">
                    <div class="recent-header">
                        <span class="recent-type ${this.getExpenseCategory(expense.keterangan)}">
                            ${jenis}
                        </span>
                        <span class="recent-amount">${this.formatCurrency(expense.nominal)}</span>
                    </div>
                    <div class="recent-description">${expense.keterangan}</div>
                    <div class="recent-date">${this.formatDate(expense.tanggal)}</div>
                </div>
            `;
        }).join('');
    }

    getExpenseTypeText(type) {
        if (!type) return 'Lainnya';

        const typeStr = type.toString().toUpperCase();
        if (typeStr.includes('OPERASIONAL')) return 'Operasional';
        if (typeStr.includes('STOK') || typeStr.includes('STOCK')) return 'Pembelian Stok';
        if (typeStr.includes('GAJI') || typeStr.includes('SALARY')) return 'Gaji Karyawan';
        if (typeStr.includes('PENGELUARAN')) return 'Pengeluaran';

        return 'Lainnya';
    }

    getExpenseCategory(keterangan) {
        if (!keterangan) return 'LAINNYA';

        const k = keterangan.toLowerCase();
        if (k.includes('stok') || k.includes('beli') || k.includes('pembelian')) return 'STOK';
        if (k.includes('gaji') || k.includes('upah')) return 'GAJI';
        if (k.includes('listrik') || k.includes('air') || k.includes('pln')) return 'UTILITAS';
        if (k.includes('sewa')) return 'SEWA';
        if (k.includes('operasional')) return 'OPERASIONAL';

        return 'LAINNYA';
    }

    async handleExpenseSubmit(e) {
        e.preventDefault();

        try {
            const type = document.getElementById('expense-type').value;
            const amount = parseFloat(document.getElementById('expense-amount').value);
            const description = document.getElementById('expense-description').value;

            if (!type || !amount || !description) {
                this.showError('Harap isi semua field');
                return;
            }

            if (amount <= 0) {
                this.showError('Jumlah harus lebih dari 0');
                return;
            }

            // Get user info
            const authData = AuthHelper.getAuthData();
            if (!authData) {
                throw new Error('User tidak terautentikasi');
            }

            const expenseData = {
                jenis: type,
                nominal: amount,
                keterangan: description,
                tanggal: new Date().toISOString(),
                akun: { idPegawai: authData.userId || 1 }
            };

            console.log('📤 Kasir adding expense:', expenseData);

            // Kasir HANYA bisa menambahkan melalui endpoint kasir yang baru
            const response = await fetch('http://localhost:8080/api/keuangan/kasir/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...AuthHelper.getAuthHeaders()
                },
                body: JSON.stringify(expenseData)
            });

            if (response.ok) {
                this.showSuccess('Pengeluaran berhasil disimpan');
                document.getElementById('expense-form').reset();

                // Notify semua tab/halaman tentang update
                localStorage.setItem('finance_needs_refresh', Date.now().toString());

                // Broadcast ke tab lain
                if (typeof BroadcastChannel !== 'undefined') {
                    const channel = new BroadcastChannel('finance_updates');
                    channel.postMessage({ type: 'EXPENSE_ADDED' });
                }

                // Refresh data
                await this.loadFinancialData();
            } else {
                const errorText = await response.text();
                throw new Error(`Gagal menyimpan: ${response.status} - ${errorText}`);
            }

        } catch (error) {
            console.error('Error submitting expense:', error);
            this.showError('Gagal menyimpan pengeluaran: ' + error.message);
        }
    }

    formatCurrency(amount) {
        if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    }

    formatDateTime(dateString) {
        try {
            const date = new Date(dateString);
            const time = date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
            return `${time} • ${this.formatDate(dateString)}`;
        } catch (e) {
            return 'Invalid Date';
        }
    }

    showError(message) {
        // Tampilkan notifikasi error
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee2e2;
            color: #991b1b;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 1px solid #fecaca;
        `;
        notification.textContent = '❌ ' + message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    showSuccess(message) {
        // Tampilkan notifikasi sukses
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b759;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = '✅ ' + message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new KasirKeuangan();
});