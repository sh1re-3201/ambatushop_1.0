// File: js/manajer_keuangan.js - VERSION LENGKAP DIPERBAIKI

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

    // Setup auto-sync untuk update real-time
    setupAutoSync();
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
        console.log('🔄 Loading INTEGRATED financial data...');

        // Ambil SEMUA data dari berbagai sumber secara parallel
        const [keuanganData, transaksiData] = await Promise.all([
            fetchKeuanganData(),     // Data pengeluaran manual
            fetchTransaksiData()     // Data pemasukan dari transaksi
        ]);

        console.log('📊 Data loaded - Pengeluaran:', keuanganData?.length || 0, 'Transaksi:', transaksiData?.length || 0);

        // Pastikan data berupa array
        const safeKeuanganData = Array.isArray(keuanganData) ? keuanganData : [];
        const safeTransaksiData = Array.isArray(transaksiData) ? transaksiData : [];

        // PROSES DATA TERINTEGRASI
        const integratedData = processIntegratedData(safeKeuanganData, safeTransaksiData);

        // Update UI dengan data REAL
        updateFinancialUI(integratedData);

        // Tampilkan semua records terintegrasi
        displayIntegratedRecords(integratedData);

    } catch (error) {
        console.error('❌ Error loading financial data:', error);
        showError('Gagal memuat data keuangan: ' + error.message);
    }
}

// ========== FUNGSI BARU UNTUK INTEGRASI ==========

// FUNGSI BARU yang benar
function processIntegratedData(keuanganData, transaksiData) {
    console.log('🔧 Processing integrated data dengan LOGIKA BARU...');

    // 1. Filter HANYA pengeluaran manual dari keuanganData
    const manualExpenses = keuanganData.filter(k => {
        if (!k) return false;
        const jenis = k.jenis ? k.jenis.toString().toUpperCase() : '';
        // ✅ HANYA ambil yang PENGELUARAN
        return jenis === 'PENGELUARAN';
    });

    console.log('📊 Manual expenses found:', manualExpenses.length);

    // 2. Filter transaksi untuk PEMASUKAN dan PENGELUARAN STOCK
    const allTransaksi = Array.isArray(transaksiData) ? transaksiData : [];

    // PEMASUKAN: Transaksi PAID yang BUKAN stock purchase
    const incomeTransactions = allTransaksi.filter(t => {
        if (!t) return false;

        // Status harus PAID
        if (!(t.paymentStatus === 'PAID' || t.paymentStatus === 'LUNAS')) return false;

        // ✅ BUKAN stock purchase
        const isStockPurchase = t.paymentGatewayResponse &&
            (t.paymentGatewayResponse.toString().toUpperCase().includes('STOCK_PURCHASE') ||
                t.paymentGatewayResponse.toString().toUpperCase().includes('PEMBELIAN'));
        return !isStockPurchase;
    });

    // PENGELUARAN STOCK: Transaksi yang stock purchase
    const stockPurchaseTransactions = allTransaksi.filter(t => {
        if (!t) return false;

        // Status harus PAID
        if (!(t.paymentStatus === 'PAID' || t.paymentStatus === 'LUNAS')) return false;

        // ✅ HARUS stock purchase
        return t.paymentGatewayResponse &&
            (t.paymentGatewayResponse.toString().toUpperCase().includes('STOCK_PURCHASE') ||
                t.paymentGatewayResponse.toString().toUpperCase().includes('PEMBELIAN'));
    });

    console.log('📊 Transaction breakdown:', {
        totalTransactions: allTransaksi.length,
        incomeTransactions: incomeTransactions.length,
        stockPurchases: stockPurchaseTransactions.length
    });

    // 3. HITUNG TOTAL
    const totalPemasukan = incomeTransactions.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);

    const pengeluaranManual = manualExpenses.reduce((sum, k) => sum + (parseFloat(k.nominal) || 0), 0);
    const pengeluaranStock = stockPurchaseTransactions.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
    const totalPengeluaran = pengeluaranManual + pengeluaranStock;

    // 4. GABUNGKAN RECORDS
    const allRecords = [];

    // ✅ PEMASUKAN HANYA DARI PENJUALAN
    incomeTransactions.forEach(t => {
        allRecords.push({
            id: 'INC-' + (t.idTransaksi || t.id),
            type: 'PEMASUKAN',
            description: `Penjualan #${t.referenceNumber || t.id}`,
            amount: parseFloat(t.total) || 0,
            tanggal: t.tanggal || new Date().toISOString(),
            category: 'PENJUALAN',
            source: 'TRANSAKSI',
            details: {
                metode: t.metodePembayaran || t.metode_pembayaran || 'TUNAI',
                kasir: t.namaKasir || t.kasirName || t.akun?.username || 'Kasir',
                isStockPurchase: false
            }
        });
    });

    // ✅ PENGELUARAN MANUAL (hanya dari keuangan)
    manualExpenses.forEach(k => {
        allRecords.push({
            id: 'EXP-MANUAL-' + (k.idKeuangan || k.id),
            type: 'PENGELUARAN',
            description: k.keterangan || 'Pengeluaran',
            amount: parseFloat(k.nominal) || 0,
            tanggal: k.tanggal || new Date().toISOString(),
            category: categorizeExpense(k.keterangan),
            source: 'KEUANGAN_MANUAL',
            details: {
                jenis: k.jenis,
                pegawai: k.akun?.username || 'System'
            }
        });
    });

    // ✅ PENGELUARAN STOCK PURCHASE
    stockPurchaseTransactions.forEach(t => {
        const notes = t.paymentGatewayResponse || '';
        const description = parseStockPurchaseNotes(notes);

        allRecords.push({
            id: 'EXP-STOCK-' + (t.idTransaksi || t.id),
            type: 'PENGELUARAN',
            description: description,
            amount: parseFloat(t.total) || 0,
            tanggal: t.tanggal || new Date().toISOString(),
            category: 'STOK',
            source: 'STOCK_PURCHASE',
            details: {
                reference: t.referenceNumber || t.id,
                kasir: t.namaKasir || t.kasirName || t.akun?.username || 'Kasir',
                isStockPurchase: true
            }
        });
    });

    // Urutkan dari terbaru
    allRecords.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    return {
        totalPemasukan,
        totalPengeluaran,
        labaBersih: totalPemasukan - totalPengeluaran,
        totalTransaksi: allTransaksi.length,
        salesCount: incomeTransactions.length,
        stockPurchaseCount: stockPurchaseTransactions.length,
        manualExpensesCount: manualExpenses.length,
        totalRecords: allRecords.length,
        records: allRecords,
        breakdown: {
            salesIncome: totalPemasukan,
            manualExpenses: pengeluaranManual,
            stockExpenses: pengeluaranStock,
            totalExpenses: totalPengeluaran
        }
    };
}

function categorizeExpense(keterangan) {
    if (!keterangan) return 'LAINNYA';

    const k = keterangan.toString().toLowerCase();

    if (k.includes('stok') || k.includes('pembelian') || k.includes('beli')) return 'STOK';
    if (k.includes('gaji') || k.includes('upah')) return 'GAJI';
    if (k.includes('listrik') || k.includes('air') || k.includes('pln') || k.includes('pdam')) return 'UTILITAS';
    if (k.includes('sewa') || k.includes('rent')) return 'SEWA';
    if (k.includes('operasional')) return 'OPERASIONAL';

    return 'LAINNYA';
}

function parseStockPurchaseNotes(notes) {
    if (!notes) return 'Pembelian Stok';

    try {
        // Format: "STOCK_PURCHASE|Product:xxx|Supplier:yyy|Notes:zzz"
        const parts = notes.split('|');
        let description = 'Pembelian Stok';

        parts.forEach(part => {
            if (part.includes('Product:')) {
                const product = part.split(':')[1] || '';
                description = `Pembelian Stok: ${product}`;
            } else if (part.includes('Supplier:')) {
                description += ` dari ${part.split(':')[1]}`;
            } else if (part.includes('Notes:')) {
                description += ` (${part.split(':')[1]})`;
            }
        });

        return description;
    } catch (e) {
        return 'Pembelian Stok';
    }
}

// TAMBAHKAN fungsi helper untuk cek stock purchase
function isStockPurchase(transaksi) {
    if (!transaksi) return false;

    // Cek berdasarkan paymentGatewayResponse
    if (transaksi.paymentGatewayResponse) {
        const response = transaksi.paymentGatewayResponse.toString().toUpperCase();
        return response.includes('STOCK_PURCHASE') ||
            response.includes('PEMBELIAN') ||
            response.includes('BELI') ||
            response.includes('STOK');
    }

    // Cek berdasarkan metode pembayaran dan total (fallback)
    // Stock purchase biasanya TUNAI dan ada di transaksi khusus
    return transaksi.metodePembayaran === 'TUNAI' &&
        transaksi.paymentStatus === 'PAID' &&
        !transaksi.referenceNumber?.includes('TRX'); // bukan transaksi penjualan reguler
}

function updateFinancialUI(integratedData) {
    console.log('🎨 Updating UI with integrated data...');

    const { totalPemasukan, totalPengeluaran, labaBersih, totalTransaksi } = integratedData;

    // 1. Update Summary Cards
    updateFinancialCards(totalPemasukan, totalPengeluaran, labaBersih, totalTransaksi);

    // 2. Update Summary Table di bagian bawah
    updateBreakdownSummary(integratedData);
}

function updateFinancialCards(pemasukan, pengeluaran, laba, transaksiCount) {
    console.log('💳 Updating cards:', { pemasukan, pengeluaran, laba, transaksiCount });

    // Update card values dengan data REAL
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

function displayIntegratedRecords(integratedData) {
    const { records } = integratedData;

    // 1. Update Tabel Daftar Pengeluaran (sekarang jadi terintegrasi)
    updateIntegratedExpensesTable(records);

    // 2. Update filter stats
    updateRecordStats(records);
}

function updateIntegratedExpensesTable(records) {
    const tbody = document.getElementById('expenses-tbody');
    if (!tbody) return;

    if (!records || records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding:40px;text-align:center;color:var(--text-secondary)">
                    <div style="font-size:48px;margin-bottom:16px;">📊</div>
                    <div style="font-size:16px;margin-bottom:8px;font-weight:600">Belum ada data keuangan</div>
                    <div style="font-size:14px;">Mulai dengan transaksi atau tambah pengeluaran</div>
                </td>
            </tr>
        `;
        return;
    }

    // Tampilkan maksimal 50 records
    const displayRecords = records.slice(0, 50);

    tbody.innerHTML = displayRecords.map(record => {
        const isIncome = record.type === 'PEMASUKAN';
        const typeClass = isIncome ? 'badge-success' : 'badge-expense';
        const typeText = isIncome ? 'PEMASUKAN' : 'PENGELUARAN';
        const amountColor = isIncome ? '#10b759' : '#ef4444';
        const amountSign = isIncome ? '+' : '-';
        const sourceIcon = getSourceIcon(record.source);
        const categoryClass = `badge-${record.category.toLowerCase()}`;

        // Hanya tampilkan delete button untuk keuangan manual
        const showDelete = record.source === 'KEUANGAN_MANUAL';
        const recordId = record.id.replace('EXP-MANUAL-', '');
        const safeDescription = record.description ? record.description.replace(/'/g, "\\'") : '';

        return `
            <tr class="finance-row" data-type="${record.category}" data-source="${record.source}">
                <td style="padding:12px 8px;color:var(--text-primary);font-size:13px">
                    ${formatDateTime(record.tanggal)}
                    ${sourceIcon ? `<span style="margin-left:6px;opacity:0.6" title="${record.source}">${sourceIcon}</span>` : ''}
                </td>
                <td style="padding:12px 8px;">
                    <span class="badge ${typeClass}" style="margin-right:6px">
                        ${typeText}
                    </span>
                    <span class="badge ${categoryClass}">
                        ${record.category}
                    </span>
                </td>
                <td style="padding:12px 8px;color:var(--text-primary)" title="${safeDescription}">
                    ${truncateText(record.description, 60)}
                    ${record.details?.kasir ? `<br><small style="color:#666">Oleh: ${record.details.kasir}</small>` : ''}
                </td>
                <td style="padding:12px 8px;text-align:right;font-weight:600;color:${amountColor}">
                    ${amountSign} ${formatCurrency(record.amount)}
                </td>
                <td style="padding:12px 8px;text-align:center">
                    ${showDelete ? `
                        <button onclick="deleteExpense('${recordId}', '${safeDescription}')" 
                                style="padding:4px 12px;background:#fee2e2;color:#991b1b;border:0;border-radius:6px;cursor:pointer;font-size:12px">
                            Hapus
                        </button>
                    ` : '<span style="color:#666;font-size:12px">Otomatis</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

function updateBreakdownSummary(integratedData) {
    const { breakdown, totalPemasukan, totalPengeluaran, labaBersih } = integratedData;

    // Update ringkasan keuangan - FIXED LOGIC
    const summaryHtml = `
        <tr style="border-bottom:1px solid var(--border-color)">
            <td style="padding:12px 8px;color:var(--text-primary)">Penjualan Produk</td>
            <td style="padding:12px 8px;text-align:right;font-weight:600;color:var(--text-primary)">
                ${formatCurrency(breakdown.salesIncome)}
            </td>
            <td style="padding:12px 8px;text-align:right;color:#10b759">
                ${calculateGrowth('penjualan', breakdown.salesIncome)}%
            </td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-color)">
            <td style="padding:12px 8px;color:var(--text-primary)">Pembelian Stok</td>
            <td style="padding:12px 8px;text-align:right;font-weight:600;color:var(--text-primary)">
                ${formatCurrency(breakdown.stockExpenses)}
            </td>
            <td style="padding:12px 8px;text-align:right;color:#ff5252">
                ${calculateGrowth('stok', breakdown.stockExpenses)}%
            </td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-color)">
            <td style="padding:12px 8px;color:var(--text-primary)">Operasional & Lainnya</td>
            <td style="padding:12px 8px;text-align:right;font-weight:600;color:var(--text-primary)">
                ${formatCurrency(breakdown.manualExpenses)}
            </td>
            <td style="padding:12px 8px;text-align:right;color:#ff5252">
                ${calculateGrowth('operasional', breakdown.manualExpenses)}%
            </td>
        </tr>
        <tr>
            <td style="padding:12px 8px;font-weight:700;color:var(--text-primary)">Total Laba</td>
            <td style="padding:12px 8px;text-align:right;font-weight:700;color:#10b759">
                ${formatCurrency(labaBersih)}
            </td>
            <td style="padding:12px 8px;text-align:right;color:#10b759;font-weight:600">
                ${calculateGrowth('laba', labaBersih)}%
            </td>
        </tr>
    `;

    const tbody = document.querySelector('.card table tbody');
    if (tbody) {
        tbody.innerHTML = summaryHtml;
    }
}

function calculateGrowth(category, currentAmount) {
    // Simple growth calculation (untuk demo)
    const growthRates = {
        'penjualan': 12.5,
        'stok': 8.2,
        'operasional': 3.1,
        'laba': labaGrowthCalculation(currentAmount)
    };

    return growthRates[category] || 0.0;
}

function labaGrowthCalculation(laba) {
    if (laba <= 0) return 0.0;
    // Simple simulation: laba growth antara 5-25%
    return Math.min(25, Math.max(5, Math.round(laba / 1000000)));
}

function getSourceIcon(source) {
    const icons = {
        'TRANSAKSI': '💰',
        'KEUANGAN_MANUAL': '📝',
        'STOCK_PURCHASE': '📦'
    };
    return icons[source] || '';
}

function updateRecordStats(records) {
    const incomeCount = records.filter(r => r.type === 'PEMASUKAN').length;
    const expenseCount = records.filter(r => r.type === 'PENGELUARAN').length;

    console.log(`📊 Records: ${incomeCount} pemasukan, ${expenseCount} pengeluaran`);

    // Update filter dropdown jika perlu
    const filterSelect = document.getElementById('expense-filter');
    if (filterSelect) {
        // Tambah opsi "SEMUA" dan "PEMASUKAN" jika belum ada
        if (!filterSelect.querySelector('option[value="ALL"]')) {
            const allOption = document.createElement('option');
            allOption.value = 'ALL';
            allOption.textContent = 'Semua Data';
            filterSelect.prepend(allOption);
        }

        if (!filterSelect.querySelector('option[value="INCOME"]')) {
            const incomeOption = document.createElement('option');
            incomeOption.value = 'INCOME';
            incomeOption.textContent = 'Pemasukan';
            filterSelect.appendChild(incomeOption);
        }
    }
}

// Auto-check for updates
function setupAutoSync() {
    // Check for updates from localStorage
    setInterval(() => {
        const lastUpdate = localStorage.getItem('finance_needs_refresh');
        if (lastUpdate) {
            const updateTime = parseInt(lastUpdate);
            const now = Date.now();

            // Jika update dalam 30 detik terakhir, refresh
            if (now - updateTime < 30000) {
                console.log('🔄 Detected finance update, refreshing...');
                loadFinancialData();
                localStorage.removeItem('finance_needs_refresh');
            }
        }
    }, 5000); // Check every 5 seconds
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
        console.log('✅ Keuangan data fetched:', data?.length || 0, 'items');
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching keuangan:', error);
        showError('Gagal mengambil data pengeluaran');
        return [];
    }
}

function updateFinancialSummaryTable(integratedData) {
    const tbody = document.getElementById('financial-summary-tbody');
    if (!tbody) return;

    const { breakdown, totalPemasukan, totalPengeluaran, labaBersih } = integratedData;

    tbody.innerHTML = `
        <tr style="border-bottom:1px solid var(--border-color)">
            <td style="padding:12px 8px;color:var(--text-primary)">📈 Penjualan Produk</td>
            <td style="padding:12px 8px;text-align:right;font-weight:600;color:#10b759">
                ${formatCurrency(breakdown.salesIncome)}
            </td>
            <td style="padding:12px 8px;text-align:right;color:#666;font-size:12px">
                Pemasukan dari transaksi penjualan
            </td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-color)">
            <td style="padding:12px 8px;color:var(--text-primary)">📦 Pembelian Stok</td>
            <td style="padding:12px 8px;text-align:right;font-weight:600;color:#ff5252">
                -${formatCurrency(breakdown.stockExpenses)}
            </td>
            <td style="padding:12px 8px;text-align:right;color:#666;font-size:12px">
                Pengeluaran untuk restock produk
            </td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-color)">
            <td style="padding:12px 8px;color:var(--text-primary)">💰 Operasional & Lainnya</td>
            <td style="padding:12px 8px;text-align:right;font-weight:600;color:#ff5252">
                -${formatCurrency(breakdown.manualExpenses)}
            </td>
            <td style="padding:12px 8px;text-align:right;color:#666;font-size:12px">
                Pengeluaran operasional manual
            </td>
        </tr>
        <tr style="border-top:2px solid var(--border-color)">
            <td style="padding:12px 8px;font-weight:700;color:var(--text-primary)">💰 Total Laba Bersih</td>
            <td style="padding:12px 8px;text-align:right;font-weight:700;color:${labaBersih >= 0 ? '#10b759' : '#ff5252'}">
                ${formatCurrency(labaBersih)}
            </td>
            <td style="padding:12px 8px;text-align:right;color:#666;font-size:12px">
                ${labaBersih >= 0 ? '✅ Keuntungan' : '⚠️ Kerugian'}
            </td>
        </tr>
    `;
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
        console.log('✅ Transaksi data fetched:', data?.length || 0, 'items');
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching transaksi:', error);
        showError('Gagal mengambil data pemasukan');
        return [];
    }
}

// ========== EXPENSE FILTERING ==========

function filterExpenses() {
    const searchTerm = (document.getElementById('expense-search')?.value || '').toLowerCase();
    const filterType = document.getElementById('expense-filter')?.value || '';

    document.querySelectorAll('.finance-row').forEach(row => {
        const rowType = row.getAttribute('data-type') || '';
        const rowSource = row.getAttribute('data-source') || '';
        const rowText = row.textContent.toLowerCase();

        let matchesSearch = !searchTerm || rowText.includes(searchTerm);
        let matchesFilter = true;

        if (filterType) {
            if (filterType === 'INCOME') {
                matchesFilter = rowSource === 'TRANSAKSI';
            } else if (filterType === 'ALL') {
                matchesFilter = true; // Show all
            } else {
                matchesFilter = rowType === filterType;
            }
        }

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
    if (!typeSelect || !typeSelect.value) {
        showError('Pilih jenis pengeluaran terlebih dahulu');
        return;
    }

    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) {
        showError('Jumlah pengeluaran harus lebih dari 0');
        return;
    }

    if (!descriptionInput || !descriptionInput.value.trim()) {
        showError('Keterangan tidak boleh kosong');
        return;
    }

    try {
        // Get user info
        const authData = AuthHelper.getAuthData();
        if (!authData || !authData.userId) {
            // Fallback: coba ambil dari localStorage
            const storedId = localStorage.getItem('userId');
            if (!storedId) {
                throw new Error('User tidak terautentikasi. Silakan login ulang.');
            }
            authData.userId = parseInt(storedId);
        }

        // Prepare data sesuai dengan model Keuangan
        const expenseData = {
            jenis: 'PENGELUARAN',
            keterangan: getExpenseDescription(typeSelect.value, descriptionInput.value),
            nominal: amount,
            tanggal: new Date().toISOString(),
            akun: {
                idPegawai: authData.userId
            }
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

        const result = await response.json();
        console.log('✅ Expense added successfully:', result);

        // Success
        showSuccess('Pengeluaran berhasil ditambahkan');

        // Reset form
        typeSelect.value = '';
        amountInput.value = '';
        descriptionInput.value = '';

        // Reload data
        await loadFinancialData();

        // Notify untuk auto-refresh
        localStorage.setItem('finance_needs_refresh', Date.now().toString());

    } catch (error) {
        console.error('❌ Error adding expense:', error);
        showError(error.message || 'Gagal menambahkan pengeluaran');
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
    if (!confirm(`Hapus pengeluaran "${description}"?\n\nTindakan ini tidak dapat dibatalkan.`)) {
        return;
    }

    try {
        console.log('🗑️ Deleting expense:', id);

        const response = await fetch(`http://localhost:8080/api/keuangan/${id}`, {
            method: 'DELETE',
            headers: AuthHelper.getAuthHeaders()
        });

        if (response.ok) {
            showSuccess('Pengeluaran berhasil dihapus');
            await loadFinancialData();

            // Notify untuk auto-refresh
            localStorage.setItem('finance_needs_refresh', Date.now().toString());
        } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('❌ Error deleting expense:', error);
        showError('Gagal menghapus pengeluaran: ' + error.message);
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
        if (isNaN(date.getTime())) {
            return 'Tanggal tidak valid';
        }
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        console.error('Error formatting date:', dateString, e);
        return 'Tanggal tidak valid';
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Tanggal tidak valid';
        }
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        console.error('Error formatting date:', dateString, e);
        return 'Tanggal tidak valid';
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
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(el => el.remove());

    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification error';
    errorDiv.textContent = '❌ ' + message;
    document.body.appendChild(errorDiv);

    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(el => el.remove());

    const successDiv = document.createElement('div');
    successDiv.className = 'notification success';
    successDiv.textContent = '✅ ' + message;
    document.body.appendChild(successDiv);

    setTimeout(() => successDiv.remove(), 3000);
}

// ========== GLOBAL FUNCTIONS ==========

window.deleteExpense = deleteExpense;

// Auto-refresh setiap 30 detik
setInterval(async () => {
    const auth = AuthHelper.checkAuth();
    if (auth && (auth.userRole === 'MANAJER' || auth.userRole === 'ADMIN')) {
        await loadFinancialData();
    }
}, 30000);

// Listen untuk broadcast messages
window.addEventListener('message', (event) => {
    if (event.data.type === 'FINANCE_UPDATE') {
        console.log('📩 Received finance update broadcast');
        loadFinancialData();
    }
});

// Listen untuk storage events (multi-tab sync)
window.addEventListener('storage', (event) => {
    if (event.key === 'finance_needs_refresh') {
        console.log('💾 Storage event detected: finance needs refresh');
        loadFinancialData();
    }
});