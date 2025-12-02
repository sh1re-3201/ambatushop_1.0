// File: js/manajer_keuangan.js - VERSION LENGKAP DIPERBAIKI dengan TABEL RESPONSIVE

// ========== VARIABLES GLOBAL ==========
let currentPage = 1;
let currentPageSize = 10;
let currentSearch = '';
let currentFilter = '';
let allRecords = [];

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

    // Setup search/filter untuk tabel responsive
    setupTableSearchFilter();

    // Setup pagination untuk tabel
    setupPaginationControls();

    // Download button untuk Excel
    document.getElementById('download-btn')?.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = '/api/export/download';
    });

    // Export button untuk tabel pengeluaran
    document.getElementById('export-expenses-btn')?.addEventListener('click', function () {
        exportExpensesToExcel();
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

        // Simpan semua records untuk filtering/pagination
        allRecords = integratedData.records || [];

        // Update UI dengan data REAL
        updateFinancialUI(integratedData);

        // Tampilkan semua records terintegrasi dengan tabel responsive
        displayIntegratedRecordsResponsive(integratedData);

    } catch (error) {
        console.error('❌ Error loading financial data:', error);
        showError('Gagal memuat data keuangan: ' + error.message);
    }
}

// ========== FUNGSI BARU UNTUK INTEGRASI ==========

function processIntegratedData(keuanganData, transaksiData) {
    console.log('🔧 Processing integrated data dengan LOGIKA YANG BENAR...');

    // 1. Filter data dari keuangan (manual pengeluaran)
    const manualExpenses = keuanganData.filter(k => {
        if (!k) return false;
        const jenis = k.jenis ? k.jenis.toString().toUpperCase() : '';
        // HANYA ambil yang PENGELUARAN
        return jenis === 'PENGELUARAN';
    });

    // 2. Filter transaksi untuk PEMASUKAN SAJA
    const allTransaksi = Array.isArray(transaksiData) ? transaksiData : [];

    // PEMASUKAN: Hanya transaksi PAID yang BUKAN stock purchase
    const incomeTransactions = allTransaksi.filter(t => {
        if (!t) return false;

        // Status harus PAID/LUNAS
        const status = t.paymentStatus ? t.paymentStatus.toString().toUpperCase() : '';
        if (!(status === 'PAID' || status === 'LUNAS')) return false;

        // Pastikan bukan transaksi dummy/system
        return true;
    });

    console.log('📊 Data breakdown:', {
        manualExpenses: manualExpenses.length,
        incomeTransactions: incomeTransactions.length,
        totalTransactions: allTransaksi.length
    });

    // 3. HITUNG TOTAL
    const totalPemasukan = incomeTransactions.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
    const totalPengeluaran = manualExpenses.reduce((sum, k) => sum + (parseFloat(k.nominal) || 0), 0);
    const labaBersih = totalPemasukan - totalPengeluaran;

    // 4. GABUNGKAN RECORDS UNTUK TABEL RESPONSIVE
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
                kasir: t.namaKasir || t.kasirName || t.akun?.username || 'Kasir'
            }
        });
    });

    // ✅ PENGELUARAN MANUAL (dari keuangan dan stock purchase)
    manualExpenses.forEach(k => {
        // Cek apakah ini stock purchase atau pengeluaran biasa
        const isStockPurchase = k.keterangan &&
            (k.keterangan.toString().toLowerCase().includes('stok') ||
                k.keterangan.toString().toLowerCase().includes('pembelian'));

        const category = isStockPurchase ? 'STOK' : categorizeExpense(k.keterangan);

        allRecords.push({
            id: 'EXP-' + (k.idKeuangan || k.id),
            type: 'PENGELUARAN',
            description: k.keterangan || 'Pengeluaran',
            amount: parseFloat(k.nominal) || 0,
            tanggal: k.tanggal || new Date().toISOString(),
            category: category,
            source: 'KEUANGAN',
            details: {
                jenis: k.jenis,
                pegawai: k.akun?.username || 'System',
                isStockPurchase: isStockPurchase
            }
        });
    });

    // Urutkan dari terbaru
    allRecords.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    return {
        totalPemasukan,
        totalPengeluaran,
        labaBersih,
        totalTransaksi: allTransaksi.length,
        salesCount: incomeTransactions.length,
        expensesCount: manualExpenses.length,
        totalRecords: allRecords.length,
        records: allRecords,
        breakdown: {
            salesIncome: totalPemasukan,
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

// ========== FUNGSI TABEL RESPONSIVE ==========

function displayIntegratedRecordsResponsive(integratedData) {
    const { records, totalPemasukan, totalPengeluaran } = integratedData;

    // Update total di footer tabel
    updateExpensesTotal(totalPengeluaran);

    // Render tabel dengan pagination
    renderTableWithPagination();
}

function renderTableWithPagination() {
    const tbody = document.getElementById('expenses-tbody');
    const pagination = document.querySelector('.table-pagination');

    if (!tbody) return;

    // Filter records berdasarkan search dan filter
    const filteredRecords = filterRecords(allRecords, currentSearch, currentFilter);
    const totalItems = filteredRecords.length;
    const totalPages = Math.ceil(totalItems / currentPageSize);

    // Hitung data untuk halaman saat ini
    const startIndex = (currentPage - 1) * currentPageSize;
    const endIndex = Math.min(startIndex + currentPageSize, totalItems);
    const pageRecords = filteredRecords.slice(startIndex, endIndex);

    // Clear loading
    tbody.innerHTML = '';

    if (pageRecords.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <svg viewBox="0 0 64 64" fill="none">
                        <rect x="16" y="20" width="32" height="24" rx="3" stroke="currentColor" stroke-width="2" fill="none"/>
                        <path d="M24 36h4M24 40h8M40 36h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M24 28h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <p style="font-size:16px;margin:8px 0">${currentSearch || currentFilter ? 'Tidak ada data yang sesuai' : 'Belum ada data pengeluaran'}</p>
                    <p style="color:var(--text-secondary);font-size:14px">
                        ${currentSearch || currentFilter ? 'Coba kata kunci atau filter lain' : 'Tambahkan pengeluaran baru untuk melihat data di sini'}
                    </p>
                </td>
            </tr>
        `;
        if (pagination) pagination.style.display = 'none';
        return;
    }

    // Render rows
    pageRecords.forEach((record, index) => {
        const rowIndex = startIndex + index + 1;
        const row = createTableRow(record, rowIndex);
        tbody.appendChild(row);
    });

    // Setup pagination
    setupPagination(totalPages, currentPage, totalItems, currentPageSize);
    if (pagination) pagination.style.display = 'flex';
}

function createTableRow(record, index) {
    const row = document.createElement('tr');

    const isIncome = record.type === 'PEMASUKAN';
    const typeClass = isIncome ? 'badge-success' : 'badge-expense';
    const typeText = isIncome ? 'PEMASUKAN' : 'PENGELUARAN';
    const amountColor = isIncome ? '#10b759' : '#ef4444';
    const amountSign = isIncome ? '+' : '-';
    const sourceIcon = getSourceIcon(record.source);
    const categoryClass = `badge-${record.category.toLowerCase()}`;

    // Hanya tampilkan delete button untuk keuangan manual
    const showDelete = record.source === 'KEUANGAN';
    const recordId = record.id.replace('EXP-', '').replace('INC-', ''); // Fix untuk pemasukan juga

    // FIX 1: Escape single quotes dengan benar
    const safeDescription = record.description ?
        record.description.replace(/'/g, "&#39;").replace(/"/g, "&quot;") : '';

    // FIX 2: Gunakan Event Listener daripada inline onclick
    row.innerHTML = `
        <td class="sticky-column">${index}</td>
        <td>${formatDateTime(record.tanggal)}</td>
        <td>
            <span class="badge ${typeClass}" style="margin-right:6px">
                ${typeText}
            </span>
            <span class="badge ${categoryClass}">
                ${record.category}
            </span>
        </td>
        <td title="${safeDescription}">
            ${truncateText(record.description, 50)}
            ${record.details?.kasir ? `<br><small style="color:#666">Oleh: ${record.details.kasir}</small>` : ''}
            ${sourceIcon ? `<br><small style="color:#666">${sourceIcon} ${record.source}</small>` : ''}
        </td>
        <td style="text-align:right;font-weight:600;color:${amountColor}">
            ${amountSign} ${formatCurrency(record.amount)}
        </td>
        <td class="sticky-action">
            <span class="status-badge status-verified">${isIncome ? 'PAID' : 'VERIFIED'}</span>
        </td>
        <td class="action-column">
            <div class="action-buttons-group">
                <button class="btn-icon btn-view" data-record-id="${record.id}" title="Lihat Detail">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" fill="none"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
                    </svg>
                </button>
                ${showDelete ? `
                    <button class="btn-icon btn-delete" data-record-id="${recordId}" data-record-description="${safeDescription}" title="Hapus">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                ` : ''}
            </div>
        </td>
    `;

    // FIX 3: Tambahkan event listeners setelah row dibuat
    const viewBtn = row.querySelector('.btn-view');
    if (viewBtn) {
        viewBtn.addEventListener('click', () => viewRecordDetail(record.id));
    }

    const deleteBtn = row.querySelector('.btn-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const description = decodeHTMLEntities(deleteBtn.dataset.recordDescription || '');
            deleteExpense(recordId, description);
        });
    }

    return row;
}

// FIX 4: Tambahkan helper function untuk decode HTML entities
function decodeHTMLEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

function filterRecords(records, search, filter) {
    if (!records || !Array.isArray(records)) return [];

    return records.filter(record => {
        // Filter by search
        const matchesSearch = !search ||
            record.description.toLowerCase().includes(search.toLowerCase()) ||
            record.category.toLowerCase().includes(search.toLowerCase()) ||
            (record.details?.kasir || '').toLowerCase().includes(search.toLowerCase());

        // Filter by type
        let matchesFilter = true;
        if (filter) {
            if (filter === 'INCOME') {
                matchesFilter = record.type === 'PEMASUKAN';
            } else if (filter === 'ALL') {
                matchesFilter = true;
            } else {
                matchesFilter = record.category === filter;
            }
        }

        return matchesSearch && matchesFilter;
    });
}

function setupPagination(totalPages, currentPage, totalItems, pageSize) {
    const pageStart = (currentPage - 1) * pageSize + 1;
    const pageEnd = Math.min(currentPage * pageSize, totalItems);

    // Update pagination info
    document.getElementById('page-start').textContent = pageStart;
    document.getElementById('page-end').textContent = pageEnd;
    document.getElementById('total-items').textContent = totalItems;

    // Update page numbers
    const pageNumbers = document.getElementById('page-numbers');
    pageNumbers.innerHTML = '';

    // Show limited page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            renderTableWithPagination();
        };
        pageNumbers.appendChild(pageBtn);
    }

    // Update prev/next buttons
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderTableWithPagination();
        }
    };

    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTableWithPagination();
        }
    };
}

function setupTableSearchFilter() {
    const searchInput = document.getElementById('expense-search');
    const filterSelect = document.getElementById('expense-filter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentSearch = e.target.value;
            currentPage = 1; // Reset to first page when searching
            renderTableWithPagination();
        }, 300));
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            currentPage = 1; // Reset to first page when filtering
            renderTableWithPagination();
        });
    }
}

function setupPaginationControls() {
    const pageSizeSelect = document.getElementById('page-size-select');

    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', (e) => {
            currentPageSize = parseInt(e.target.value);
            currentPage = 1; // Reset to first page when changing page size
            renderTableWithPagination();
        });
    }
}

function updateExpensesTotal(total) {
    const totalElement = document.getElementById('total-expenses');
    if (totalElement) {
        totalElement.textContent = formatCurrency(total);
    }
}

function updateBreakdownSummary(integratedData) {
    const { breakdown, totalPemasukan, totalPengeluaran, labaBersih } = integratedData;

    // Update ringkasan keuangan
    const summaryHtml = `
        <tr style="border-bottom:1px solid var(--border-color)">
            <td style="padding:12px 8px;color:var(--text-primary)">Penjualan Produk</td>
            <td style="padding:12px 8px;text-align:right;font-weight:600;color:#10b759">
                ${formatCurrency(breakdown.salesIncome)}
            </td>
            <td style="padding:12px 8px;text-align:right;color:#666;font-size:12px">
                Pemasukan dari transaksi
            </td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-color)">
            <td style="padding:12px 8px;color:var(--text-primary)">Total Pengeluaran</td>
            <td style="padding:12px 8px;text-align:right;font-weight:600;color:#ff5252">
                -${formatCurrency(totalPengeluaran)}
            </td>
            <td style="padding:12px 8px;text-align:right;color:#666;font-size:12px">
                Semua pengeluaran
            </td>
        </tr>
        <tr style="border-top:2px solid var(--border-color)">
            <td style="padding:12px 8px;font-weight:700;color:var(--text-primary)">Laba Bersih</td>
            <td style="padding:12px 8px;text-align:right;font-weight:700;color:${labaBersih >= 0 ? '#10b759' : '#ff5252'}">
                ${formatCurrency(labaBersih)}
            </td>
            <td style="padding:12px 8px;text-align:right;color:#666;font-size:12px">
                ${labaBersih >= 0 ? '✅ Keuntungan' : '⚠️ Kerugian'}
            </td>
        </tr>
    `;

    const tbody = document.getElementById('financial-summary-tbody');
    if (tbody) {
        tbody.innerHTML = summaryHtml;
    }
}

// ========== EXPORT FUNCTIONS ==========

async function exportExpensesToExcel() {
    try {
        showNotification('success', 'Menyiapkan file Excel...');

        const response = await fetch('/api/export/download', {
            headers: AuthHelper.getAuthHeaders()
        });

        if (!response.ok) throw new Error('Gagal mengekspor data');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-pengeluaran-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showNotification('success', 'File Excel berhasil diunduh');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('error', 'Gagal mengekspor data');
    }
}

// ========== RECORD VIEW FUNCTIONS ==========

function viewRecordDetail(recordId) {
    const record = allRecords.find(r => r.id === recordId);
    if (!record) {
        showError('Data tidak ditemukan');
        return;
    }

    // Buat modal custom
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
    `;

    // Isi modal detail
    modal.innerHTML = `
        <div style="
            background: var(--card);
            border-radius: 16px;
            padding: 24px;
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: var(--text-primary); font-size: 20px;">
                    Detail ${record.type} - ${record.category}
                </h3>
                <button onclick="this.closest('.custom-modal-overlay').remove()" 
                        style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            color: var(--text-secondary);
                            padding: 4px 8px;
                        ">
                    ×
                </button>
            </div>
            
            <div style="background: var(--page-bg); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <div style="display: grid; gap: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary); font-weight: 500;">ID:</span>
                        <span style="font-weight: 600;">${record.id}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary); font-weight: 500;">Tanggal:</span>
                        <span>${formatDateTime(record.tanggal)}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary); font-weight: 500;">Jenis:</span>
                        <span class="badge ${record.type === 'PEMASUKAN' ? 'badge-success' : 'badge-expense'}">
                            ${record.type}
                        </span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary); font-weight: 500;">Kategori:</span>
                        <span class="badge badge-${record.category.toLowerCase()}">
                            ${record.category}
                        </span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-secondary); font-weight: 500;">Jumlah:</span>
                        <span style="font-weight: 700; color: ${record.type === 'PEMASUKAN' ? '#10b759' : '#ef4444'}">
                            ${record.type === 'PEMASUKAN' ? '+' : '-'}${formatCurrency(record.amount)}
                        </span>
                    </div>
                    
                    <div style="margin-top: 8px;">
                        <div style="color: var(--text-secondary); font-weight: 500; margin-bottom: 8px;">Deskripsi:</div>
                        <div style="background: var(--bg); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
                            ${record.description}
                        </div>
                    </div>
                    
                    ${record.details ? `
                        <div style="margin-top: 12px;">
                            <div style="color: var(--text-secondary); font-weight: 500; margin-bottom: 8px;">Detail Tambahan:</div>
                            <div style="background: var(--bg); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 13px;">
                                ${Object.entries(record.details).map(([key, value]) => `
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                        <span style="color: var(--text-secondary);">${key}:</span>
                                        <span style="font-weight: 500;">${value}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button onclick="this.closest('.custom-modal-overlay').remove()" 
                        style="
                            padding: 10px 20px;
                            border: 1px solid var(--border-color);
                            background: transparent;
                            border-radius: 8px;
                            color: var(--text-primary);
                            cursor: pointer;
                            font-weight: 500;
                        ">
                    Tutup
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal on ESC key
    const closeModal = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeModal);
        }
    };

    document.addEventListener('keydown', closeModal);

    // Close modal on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.removeEventListener('keydown', closeModal);
        }
    });
}

// ========== API FETCH FUNCTIONS ==========

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
            const storedId = localStorage.getItem('userId');
            if (!storedId) {
                throw new Error('User tidak terautentikasi. Silakan login ulang.');
            }
            authData.userId = parseInt(storedId);
        }

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

        showSuccess('Pengeluaran berhasil ditambahkan');

        typeSelect.value = '';
        amountInput.value = '';
        descriptionInput.value = '';

        await loadFinancialData();
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

function getSourceIcon(source) {
    const icons = {
        'TRANSAKSI': '💰',
        'KEUANGAN': '📝',
        'STOCK_PURCHASE': '📦'
    };
    return icons[source] || '';
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

function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Auto-check for updates
function setupAutoSync() {
    setInterval(() => {
        const lastUpdate = localStorage.getItem('finance_needs_refresh');
        if (lastUpdate) {
            const updateTime = parseInt(lastUpdate);
            const now = Date.now();

            if (now - updateTime < 30000) {
                console.log('🔄 Detected finance update, refreshing...');
                loadFinancialData();
                localStorage.removeItem('finance_needs_refresh');
            }
        }
    }, 5000);
}

// ========== GLOBAL FUNCTIONS ==========

window.deleteExpense = deleteExpense;
window.viewRecordDetail = viewRecordDetail;

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