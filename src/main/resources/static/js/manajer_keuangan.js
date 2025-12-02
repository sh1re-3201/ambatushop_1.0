// File: js/manajer_keuangan.js - VERSION LENGKAP

document.addEventListener('DOMContentLoaded', async () => {
    // ========== AUTH CHECK ==========
    const auth = AuthHelper.checkAuth();
    if (!auth) return;
    
    if (auth.userRole !== 'MANAJER' && auth.userRole !== 'ADMIN') {
        alert('Hanya Manajer dan Admin yang dapat mengakses halaman ini');
        window.location.href = '/kasir/dashboard';
        return;
    }

    // ========== SIDEBAR INIT ==========
    initSidebar();

    // ========== KEUANGAN FUNCTIONALITY ==========
    await loadFinancialData();
    
    // Setup form submit
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleExpenseSubmit);
    }
    
    // Setup search/filter
    const searchInput = document.getElementById('expense-search');
    const filterSelect = document.getElementById('expense-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterExpenses();
        }, 300));
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', filterExpenses);
    }
    
    // Download button
    document.getElementById('download-btn')?.addEventListener('click', function (e) {
        e.preventDefault();
        const a = document.createElement('a');
        a.href = '/api/export/download';
        a.download = 'laporan_keuangan.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
    });
    
    // Refresh button
    document.getElementById('refresh-data-btn')?.addEventListener('click', async () => {
        await loadFinancialData();
        showSuccess('Data diperbarui');
    });
});

// ========== SIDEBAR FUNCTIONS ==========

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('sidebar-close');
    const openBtn = document.getElementById('sidebar-open-btn');

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

    // Logout functionality
    logoutBtn?.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin logout?')) {
            AuthHelper.logout();
        }
    });
}

// ========== API FUNCTIONS ==========

async function loadFinancialData() {
    try {
        console.log('🔄 Loading financial data...');
        
        // Load data secara parallel
        const [keuanganData, transaksiData] = await Promise.all([
            fetchKeuanganData(),
            fetchTransaksiData()
        ]);
        
        console.log('📊 Keuangan data loaded:', keuanganData.length, 'items');
        console.log('📊 Transaksi data loaded:', transaksiData.length, 'items');
        
        // Calculate and update UI
        calculateFinancialSummary(keuanganData, transaksiData);
        updateExpensesTable(keuanganData);
        
    } catch (error) {
        console.error('❌ Error loading financial data:', error);
        showError('Gagal memuat data keuangan: ' + error.message);
    }
}

async function fetchKeuanganData() {
    try {
        console.log('🔍 Fetching keuangan data...');
        const response = await fetch('http://localhost:8080/api/keuangan', {
            headers: AuthHelper.getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Gagal mengambil data keuangan`);
        }
        
        const data = await response.json();
        console.log('✅ Keuangan data fetched:', data.length, 'items');
        return data;
    } catch (error) {
        console.error('❌ Error fetching keuangan:', error);
        showError('Gagal mengambil data pengeluaran');
        return [];
    }
}

async function fetchTransaksiData() {
    try {
        console.log('🔍 Fetching transaksi data...');
        const response = await fetch('http://localhost:8080/api/transaksi', {
            headers: AuthHelper.getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Gagal mengambil data transaksi`);
        }
        
        const data = await response.json();
        console.log('✅ Transaksi data fetched:', data.length, 'items');
        return data;
    } catch (error) {
        console.error('❌ Error fetching transaksi:', error);
        showError('Gagal mengambil data pemasukan');
        return [];
    }
}

// ========== FINANCIAL CALCULATION ==========

function calculateFinancialSummary(keuanganData, transaksiData) {
    console.log('📈 Calculating financial summary...');
    
    // Hitung untuk periode saat ini (bulan ini)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 1. Hitung TOTAL PEMASUKAN (dari transaksi PAID)
    const totalPemasukan = calculateTotalIncome(transaksiData, currentMonth, currentYear);
    
    // 2. Hitung TOTAL PENGELUARAN (dari keuangan PENGELUARAN)
    const totalPengeluaran = calculateTotalExpense(keuanganData, currentMonth, currentYear);
    
    // 3. Hitung LABA BERSIH
    const labaBersih = totalPemasukan - totalPengeluaran;
    
    // 4. Hitung TOTAL TRANSAKSI (bulan ini)
    const totalTransaksi = countMonthlyTransactions(transaksiData, currentMonth, currentYear);
    
    // 5. Update UI Cards
    updateFinancialCards(totalPemasukan, totalPengeluaran, labaBersih, totalTransaksi);
    
    // 6. Update Summary Table
    updateSummaryTable(keuanganData, transaksiData, currentMonth, currentYear, labaBersih);
}

function calculateTotalIncome(transaksiData, month, year) {
    const monthlyIncome = transaksiData.filter(transaksi => {
        try {
            // Pastikan transaksi PAID dan tanggal sesuai bulan
            const isPaid = transaksi.paymentStatus === 'PAID' || 
                          transaksi.paymentStatus === 'LUNAS';
            
            if (!isPaid || !transaksi.tanggal) return false;
            
            const transDate = new Date(transaksi.tanggal);
            return transDate.getMonth() === month && 
                   transDate.getFullYear() === year;
        } catch (error) {
            console.error('Error processing transaction:', transaksi, error);
            return false;
        }
    });
    
    const total = monthlyIncome.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
    console.log('💰 Total pemasukan bulan ini:', total, 'from', monthlyIncome.length, 'transactions');
    return total;
}

function calculateTotalExpense(keuanganData, month, year) {
    const monthlyExpenses = keuanganData.filter(keuangan => {
        try {
            // Pastikan ini pengeluaran dan tanggal sesuai bulan
            const isPengeluaran = keuangan.jenis === 'PENGELUARAN' || 
                                 (keuangan.jenis && 
                                  keuangan.jenis.toString().toUpperCase().includes('PENGELUARAN'));
            
            if (!isPengeluaran || !keuangan.tanggal) return false;
            
            const expDate = new Date(keuangan.tanggal);
            return expDate.getMonth() === month && 
                   expDate.getFullYear() === year;
        } catch (error) {
            console.error('Error processing expense:', keuangan, error);
            return false;
        }
    });
    
    const total = monthlyExpenses.reduce((sum, k) => sum + (parseFloat(k.nominal) || 0), 0);
    console.log('💸 Total pengeluaran bulan ini:', total, 'from', monthlyExpenses.length, 'expenses');
    return total;
}

function countMonthlyTransactions(transaksiData, month, year) {
    return transaksiData.filter(transaksi => {
        try {
            if (!transaksi.tanggal) return false;
            const transDate = new Date(transaksi.tanggal);
            return transDate.getMonth() === month && 
                   transDate.getFullYear() === year;
        } catch (error) {
            return false;
        }
    }).length;
}

function updateFinancialCards(pemasukan, pengeluaran, laba, transaksiCount) {
    // Update card values
    const cards = [
        { selector: '.card.feature:nth-child(1) .value', value: formatCurrency(pemasukan) },
        { selector: '.card.feature:nth-child(2) .value', value: formatCurrency(pengeluaran) },
        { selector: '.card.feature:nth-child(3) .value', value: formatCurrency(laba), color: laba >= 0 ? '#10b759' : '#ff5252' },
        { selector: '.card.feature:nth-child(4) .value', value: `${transaksiCount} Transaksi` }
    ];
    
    cards.forEach(card => {
        const element = document.querySelector(card.selector);
        if (element) {
            element.textContent = card.value;
            if (card.color) {
                element.style.color = card.color;
            }
        }
    });
}

function updateSummaryTable(keuanganData, transaksiData, month, year, labaBersih) {
    const tbody = document.querySelector('.card table tbody');
    if (!tbody) return;
    
    // Kategori pengeluaran
    const monthlyExpenses = keuanganData.filter(k => {
        try {
            if (!k.tanggal || k.jenis !== 'PENGELUARAN') return false;
            const expDate = new Date(k.tanggal);
            return expDate.getMonth() === month && expDate.getFullYear() === year;
        } catch (error) {
            return false;
        }
    });
    
    // Group by kategori
    const categories = {
        'Penjualan Produk': calculateTotalIncome(transaksiData, month, year),
        'Pembelian Stok': calculateCategoryExpense(monthlyExpenses, 'stok'),
        'Gaji Karyawan': calculateCategoryExpense(monthlyExpenses, 'gaji'),
        'Operasional': calculateCategoryExpense(monthlyExpenses, 'operasional'),
        'Lain-lain': calculateCategoryExpense(monthlyExpenses, 'lain')
    };
    
    // Filter hanya kategori yang ada nilainya
    const activeCategories = Object.entries(categories)
        .filter(([_, amount]) => amount > 0)
        .map(([name, amount]) => ({ name, amount }));
    
    // Buat rows
    const rowsHtml = activeCategories.map(cat => `
        <tr style="border-bottom:1px solid var(--border-color)">
            <td style="padding:12px 8px;color:var(--text-primary)">${cat.name}</td>
            <td style="padding:12px 8px;text-align:right;font-weight:600;color:var(--text-primary)">
                ${formatCurrency(cat.amount)}
            </td>
            <td style="padding:12px 8px;text-align:right;color:#10b759">
                +${calculateGrowth(cat.name, cat.amount)}%
            </td>
        </tr>
    `).join('');
    
    // Tambah total laba
    const totalRow = `
        <tr>
            <td style="padding:12px 8px;font-weight:700;color:var(--text-primary)">Total Laba</td>
            <td style="padding:12px 8px;text-align:right;font-weight:700;color:#10b759">
                ${formatCurrency(labaBersih)}
            </td>
            <td style="padding:12px 8px;text-align:right;color:#10b759;font-weight:600">
                +${calculateGrowth('Total Laba', labaBersih)}%
            </td>
        </tr>
    `;
    
    tbody.innerHTML = rowsHtml + totalRow;
}

function calculateCategoryExpense(expenses, category) {
    const keywords = {
        'stok': ['stok', 'pembelian', 'beli', 'stock'],
        'gaji': ['gaji', 'upah', 'salary'],
        'operasional': ['operasional', 'listrik', 'air', 'sewa', 'internet'],
        'lain': [] // default
    };
    
    return expenses.filter(exp => {
        const keterangan = (exp.keterangan || '').toLowerCase();
        const catKeywords = keywords[category] || [];
        
        if (category === 'lain') {
            // Tidak termasuk dalam kategori lain
            return !keywords.stok.some(kw => keterangan.includes(kw)) &&
                   !keywords.gaji.some(kw => keterangan.includes(kw)) &&
                   !keywords.operasional.some(kw => keterangan.includes(kw));
        }
        
        return catKeywords.some(kw => keterangan.includes(kw));
    }).reduce((sum, exp) => sum + (parseFloat(exp.nominal) || 0), 0);
}

function calculateGrowth(category, currentAmount) {
    // Simple growth calculation (bisa diganti dengan data historis)
    const growthRates = {
        'Penjualan Produk': 12.5,
        'Pembelian Stok': 8.2,
        'Gaji Karyawan': 5.0,
        'Operasional': 3.1,
        'Lain-lain': 2.0,
        'Total Laba': 18.4
    };
    
    return growthRates[category] || 0.0;
}

// ========== EXPENSES TABLE ==========

function updateExpensesTable(keuanganData) {
    const tbody = document.getElementById('expenses-tbody');
    if (!tbody) return;
    
    // Filter hanya pengeluaran
    const expenses = keuanganData.filter(k => {
        return k.jenis === 'PENGELUARAN' || 
               (k.jenis && k.jenis.toString().toUpperCase().includes('PENGELUARAN'));
    });
    
    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding:40px;text-align:center;color:var(--text-secondary)">
                    <div style="font-size:48px;margin-bottom:16px;">💰</div>
                    <div style="font-size:16px;margin-bottom:8px;font-weight:600">Belum ada data pengeluaran</div>
                    <div style="font-size:14px;">Tambahkan pengeluaran pertama Anda</div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by date (newest first)
    expenses.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    tbody.innerHTML = expenses.map(expense => {
        const jenis = getExpenseType(expense.keterangan);
        const jenisClass = getExpenseTypeClass(jenis);
        
        return `
            <tr class="expense-row" data-type="${jenis}">
                <td style="padding:12px 8px;color:var(--text-primary)">
                    ${formatDateTime(expense.tanggal)}
                </td>
                <td style="padding:12px 8px;">
                    <span class="badge ${jenisClass}">
                        ${jenis}
                    </span>
                </td>
                <td style="padding:12px 8px;color:var(--text-primary)" title="${expense.keterangan}">
                    ${truncateText(expense.keterangan, 50)}
                </td>
                <td style="padding:12px 8px;text-align:right;font-weight:600;color:#ef4444">
                    ${formatCurrency(expense.nominal)}
                </td>
                <td style="padding:12px 8px;text-align:center">
                    <button onclick="deleteExpense(${expense.idKeuangan}, '${expense.keterangan.replace(/'/g, "\\'")}')" 
                            style="padding:4px 12px;background:#fee2e2;color:#991b1b;border:0;border-radius:6px;cursor:pointer;font-size:12px">
                        Hapus
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getExpenseType(keterangan) {
    const k = (keterangan || '').toLowerCase();
    if (k.includes('gaji') || k.includes('upah')) return 'GAJI';
    if (k.includes('listrik') || k.includes('air') || k.includes('pln')) return 'LISTRIK';
    if (k.includes('sewa') || k.includes('rent')) return 'SEWA';
    if (k.includes('stok') || k.includes('beli') || k.includes('pembelian')) return 'STOK';
    if (k.includes('operasional')) return 'OPERASIONAL';
    return 'LAINNYA';
}

function getExpenseTypeClass(jenis) {
    const classes = {
        'GAJI': 'badge-gaji',
        'LISTRIK': 'badge-listrik', 
        'SEWA': 'badge-sewa',
        'STOK': 'badge-stok',
        'OPERASIONAL': 'badge-operasional',
        'LAINNYA': 'badge-lain'
    };
    return classes[jenis] || 'badge-lain';
}

function filterExpenses() {
    const searchTerm = (document.getElementById('expense-search')?.value || '').toLowerCase();
    const filterType = document.getElementById('expense-filter')?.value || '';
    
    document.querySelectorAll('.expense-row').forEach(row => {
        const rowType = row.getAttribute('data-type') || '';
        const rowText = row.textContent.toLowerCase();
        
        const matchesSearch = !searchTerm || rowText.includes(searchTerm);
        const matchesFilter = !filterType || rowType === filterType;
        
        row.style.display = matchesSearch && matchesFilter ? '' : 'none';
    });
}

// ========== FORM HANDLING ==========

async function handleExpenseSubmit(e) {
    e.preventDefault();
    
    const typeSelect = document.getElementById('expense-type');
    const amountInput = document.getElementById('expense-amount');
    const descriptionInput = document.getElementById('expense-description');
    
    // Validasi
    if (!typeSelect.value) {
        showError('Pilih jenis pengeluaran terlebih dahulu');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) {
        showError('Jumlah pengeluaran harus lebih dari 0');
        return;
    }
    
    if (!descriptionInput.value.trim()) {
        showError('Keterangan tidak boleh kosong');
        return;
    }
    
    try {
        // Get user info
        const authData = AuthHelper.getAuthData();
        if (!authData || !authData.userId) {
            throw new Error('User tidak terautentikasi');
        }
        
        // Prepare data
        const expenseData = {
            jenis: 'PENGELUARAN',
            keterangan: getExpenseDescription(typeSelect.value, descriptionInput.value),
            nominal: amount,
            tanggal: new Date().toISOString(),
            akun: { idPegawai: authData.userId }
        };
        
        console.log('📤 Adding expense:', expenseData);
        
        // Send request
        const response = await fetch('http://localhost:8080/api/keuangan', {
            method: 'POST',
            headers: AuthHelper.getAuthHeaders(),
            body: JSON.stringify(expenseData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gagal menambahkan pengeluaran: ${response.status} - ${errorText}`);
        }
        
        // Success
        showSuccess('Pengeluaran berhasil ditambahkan');
        
        // Reset form
        typeSelect.value = '';
        amountInput.value = '';
        descriptionInput.value = '';
        
        // Reload data
        await loadFinancialData();
        
    } catch (error) {
        console.error('❌ Error adding expense:', error);
        showError(error.message);
    }
}

function getExpenseDescription(type, customDesc) {
    const typeMap = {
        'GAJI': 'Gaji Karyawan',
        'LISTRIK': 'Listrik & Air',
        'SEWA': 'Sewa Tempat',
        'OPERASIONAL': 'Operasional',
        'LAINNYA': 'Pengeluaran Lainnya'
    };
    
    const base = typeMap[type] || 'Pengeluaran';
    return customDesc ? `${base}: ${customDesc}` : base;
}

async function deleteExpense(id, description) {
    if (!confirm(`Hapus pengeluaran "${description}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:8080/api/keuangan/${id}`, {
            method: 'DELETE',
            headers: AuthHelper.getAuthHeaders()
        });
        
        if (response.ok) {
            showSuccess('Pengeluaran berhasil dihapus');
            await loadFinancialData();
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error deleting expense:', error);
        showError('Gagal menghapus pengeluaran');
    }
}

// ========== UTILITY FUNCTIONS ==========

function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDateTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification error';
    errorDiv.textContent = '❌ ' + message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'notification success';
    successDiv.textContent = '✅ ' + message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => successDiv.remove(), 3000);
}

// ========== GLOBAL FUNCTIONS ==========

window.deleteExpense = deleteExpense;

// Auto-refresh
setInterval(async () => {
    const auth = AuthHelper.checkAuth();
    if (auth && (auth.userRole === 'MANAJER' || auth.userRole === 'ADMIN')) {
        await loadFinancialData();
    }
}, 30000);