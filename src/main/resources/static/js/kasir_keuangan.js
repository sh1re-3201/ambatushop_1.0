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
            const period = document.getElementById('period-filter').value;
            
            // Load transactions for income calculation
            const response = await fetch('http://localhost:8080/api/transaksi', {
                headers: AuthHelper.getAuthHeaders()
            });

            if (response.ok) {
                const transactions = await response.json();
                await this.calculateFinancialSummary(transactions);
            }

            // Load expenses
            await this.loadExpenses();

        } catch (error) {
            console.error('Error loading financial data:', error);
            this.showError('Gagal memuat data keuangan');
        }
    }




    async calculateFinancialSummary(transactions) {
        try {
            // Juga ambil data keuangan untuk pengeluaran
            const keuanganResponse = await fetch('http://localhost:8080/api/keuangan', {
                headers: AuthHelper.getAuthHeaders()
            });
            
            let totalPengeluaran = 0;
            if (keuanganResponse.ok) {
                const keuanganData = await keuanganResponse.json();
                totalPengeluaran = keuanganData
                    .filter(k => k.jenis === 'PENGELUARAN' || 
                               (k.jenis && k.jenis.toString().toUpperCase().includes('PENGELUARAN')))
                    .reduce((sum, k) => sum + (k.nominal || 0), 0);
            }
            
            // Filter hanya transaksi yang sudah PAID
            const paidTransactions = transactions.filter(t => 
                t.paymentStatus === 'PAID' || t.paymentStatus === 'LUNAS'
            );

            // Hitung total pemasukan
            const totalIncome = paidTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
            
            // Hitung rata-rata transaksi
            const avgTransaction = paidTransactions.length > 0 
                ? totalIncome / paidTransactions.length 
                : 0;

            // Update UI
            document.getElementById('total-income').textContent = this.formatCurrency(totalIncome);
            document.getElementById('total-expense').textContent = this.formatCurrency(totalPengeluaran);
            document.getElementById('success-transactions').textContent = paidTransactions.length;
            document.getElementById('average-transaction').textContent = this.formatCurrency(avgTransaction);

            // Tampilkan detail pemasukan
            this.displayIncomeDetails(paidTransactions);
            
        } catch (error) {
            console.error('Error in calculateFinancialSummary:', error);
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

        incomeList.innerHTML = transactions.slice(0, 10).map(transaction => {
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
                akun: { idPegawai: authData.userId || 1 } // Fallback ke user ID 1 jika null
            };

            console.log('📤 Adding expense:', expenseData);

            const response = await fetch('http://localhost:8080/api/keuangan', {
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
                await this.loadFinancialData(); // Reload data
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