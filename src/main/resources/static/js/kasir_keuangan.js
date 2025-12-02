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
                this.calculateFinancialSummary(transactions);
            }

            // Load expenses
            await this.loadExpenses();

        } catch (error) {
            console.error('Error loading financial data:', error);
            this.showError('Gagal memuat data keuangan');
        }
    }

    calculateFinancialSummary(transactions) {
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
        document.getElementById('success-transactions').textContent = paidTransactions.length;
        document.getElementById('average-transaction').textContent = this.formatCurrency(avgTransaction);

        // Tampilkan detail pemasukan
        this.displayIncomeDetails(paidTransactions);
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

        incomeList.innerHTML = transactions.slice(0, 10).map(transaction => `
            <div class="detail-item-card">
                <div class="detail-item-header">
                    <span class="detail-item-title">Transaksi #${transaction.referenceNumber}</span>
                    <span class="detail-item-amount income">${this.formatCurrency(transaction.total)}</span>
                </div>
                <div class="detail-item-description">
                    Pembayaran ${transaction.paymentMethod || 'TUNAI'} • ${this.formatDate(transaction.tanggal)}
                </div>
                <div class="detail-item-date">
                    ${this.formatDateTime(transaction.tanggal)}
                </div>
            </div>
        `).join('');
    }

    displayExpenses(expenses) {
        const expenseList = document.getElementById('expense-list');
        const recentList = document.getElementById('recent-expenses');
        
        if (!expenses || expenses.length === 0) {
            expenseList.innerHTML = '<div class="empty-state"><p>Belum ada data pengeluaran</p></div>';
            recentList.innerHTML = '<div class="empty-state"><p>Belum ada riwayat pengeluaran</p></div>';
            return;
        }

        // Total pengeluaran
        const totalExpense = expenses.reduce((sum, e) => sum + (e.nominal || 0), 0);
        document.getElementById('total-expense').textContent = this.formatCurrency(totalExpense);

        // Display expense list
        expenseList.innerHTML = expenses.map(expense => `
            <div class="detail-item-card">
                <div class="detail-item-header">
                    <span class="detail-item-title">${expense.keterangan}</span>
                    <span class="detail-item-amount expense">${this.formatCurrency(expense.nominal)}</span>
                </div>
                <div class="detail-item-description">
                    ${this.getExpenseTypeText(expense.jenis)}
                </div>
                <div class="detail-item-date">
                    ${this.formatDateTime(expense.tanggal)}
                </div>
            </div>
        `).join('');

        // Display recent expenses (max 5)
        const recentExpenses = expenses.slice(0, 5);
        recentList.innerHTML = recentExpenses.map(expense => `
            <div class="recent-item">
                <div class="recent-header">
                    <span class="recent-type ${expense.jenis || 'LAINNYA'}">
                        ${this.getExpenseTypeText(expense.jenis)}
                    </span>
                    <span class="recent-amount">${this.formatCurrency(expense.nominal)}</span>
                </div>
                <div class="recent-description">${expense.keterangan}</div>
                <div class="recent-date">${this.formatDate(expense.tanggal)}</div>
            </div>
        `).join('');
    }

    getExpenseTypeText(type) {
        const typeMap = {
            'OPERASIONAL': 'Operasional',
            'STOK': 'Pembelian Stok',
            'GAJI': 'Gaji Karyawan',
            'LAINNYA': 'Lainnya'
        };
        return typeMap[type] || 'Lainnya';
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

            const expenseData = {
                jenis: type,
                nominal: amount,
                keterangan: description,
                tanggal: new Date().toISOString()
            };

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
                await this.loadFinancialData();
            } else {
                throw new Error('Gagal menyimpan pengeluaran');
            }

        } catch (error) {
            console.error('Error submitting expense:', error);
            this.showError('Gagal menyimpan pengeluaran: ' + error.message);
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        }) + ' • ' + this.formatDate(dateString);
    }

    showError(message) {
        alert('❌ ' + message);
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
