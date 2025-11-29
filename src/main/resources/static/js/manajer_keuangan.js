// Kontrol sidebar (toggle open/close) — memperbaiki referensi elemen dan mencegah error jika elemen tidak ada.
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('sidebar-close');     // tombol "×"
    const openBtn = document.getElementById('sidebar-open-btn');   // hamburger di content area
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

    if (!sidebar) return; // tidak ada sidebar -> hentikan

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

    // pastikan state awal
    sidebar.classList.remove('closed');
    sidebar.setAttribute('aria-hidden', 'false');

    // close (×) -> collapse ke icon-only
    closeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.add('closed');
        sidebar.setAttribute('aria-hidden', 'true');
    });

    // hamburger open button (di content area) -> buka sidebar
    openBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.remove('closed');
        sidebar.setAttribute('aria-hidden', 'false');
        
        // fokus ke menu pertama
        const first = document.querySelector('.menu-item.pill');
        first?.focus();
    });

    // Avatar Dropdown functionality
    avatarBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        avatarDropdown?.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (avatarDropdown && !avatarDropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
            avatarDropdown.classList.remove('show');
        }
    });

    // Avatar selection
    avatarOptions.forEach(option => {
        option.addEventListener('click', () => {
            const avatarSrc = option.src;
            
            // Update current avatar
            currentAvatar.src = avatarSrc;
            currentAvatar.style.display = 'block';
            defaultAvatar.style.display = 'none';
            
            // Update selected state
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            // Save to localStorage
            localStorage.setItem('selectedAvatar', avatarSrc);
            
            // Close dropdown
            avatarDropdown.classList.remove('show');
        });
    });

    // Load saved avatar on page load
    const savedAvatar = localStorage.getItem('selectedAvatar');
    if (savedAvatar) {
        currentAvatar.src = savedAvatar;
        currentAvatar.style.display = 'block';
        defaultAvatar.style.display = 'none';
        
        // Mark the selected avatar
        avatarOptions.forEach(option => {
            if (option.src === savedAvatar) {
                option.classList.add('selected');
            }
        });
    }

    // Logout functionality
    logoutBtn?.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin logout?')) {
            localStorage.removeItem('selectedAvatar');
            window.location.href = '/logout';
        }
    });

    // visual: aktivasi menu (highlight kartu yang ada)
    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            menuButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // reset style semua card
            document.querySelectorAll('.card.feature').forEach(c => {
                c.style.opacity = '1';
                c.style.transform = 'none';
                c.style.boxShadow = '0 12px 30px rgba(27,31,35,0.04)';
            });

            const target = btn.getAttribute('data-tab');
            const cardMap = {
                'keuangan': '#card-keuangan',
                'stok': '#card-stok',
                'pengguna': '#card-pengguna',
                'dashboard': null
            };
            const selector = cardMap[target];
            if (selector) {
                const el = document.querySelector(selector);
                if (el) {
                    el.style.transform = 'translateY(-6px)';
                    el.style.boxShadow = '0 18px 40px rgba(27,31,35,0.08)';
                }
            }
        });
    });


    const downloadBtn = document.getElementById('download-excel-btn');

    if (!downloadBtn) {
        console.warn('download-excel-btn not found in DOM. Verify the button id in HTML.');
    } else {
        downloadBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            try {
                // Retrieve bearer token (adjust key if your app uses a different storage)
                const token = localStorage.getItem('accessToken'); // or null

                const headers = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const resp = await fetch('/api/keuangan/report/download', {
                    method: 'GET',
                    headers,
                    credentials: 'include' // keep cookies if backend requires session cookies
                });

                if (resp.status === 401 || resp.status === 403) {
                    console.warn('Auth error during download:', resp.status);
                    alert('Authentication required or session expired. Please login.');
                    return;
                }

                if (!resp.ok) {
                    const txt = await resp.text().catch(() => '<no body>');
                    console.error('Download failed:', resp.status, txt);
                    alert('Download failed: ' + resp.status);
                    return;
                }

                const blob = await resp.blob();
                if (!blob || blob.size === 0) {
                    const text = await resp.text().catch(() => '<no body>');
                    console.error('Received empty file/blob. Server returned:', text);
                    alert('Server returned an empty file. Check server logs and Network tab.');
                    return;
                }

                // Try to extract filename from Content-Disposition
                const cd = resp.headers.get('content-disposition') || '';
                let filename = 'laporan_keuangan.xls';
                const filenameMatch = /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i.exec(cd);
                if (filenameMatch && filenameMatch[1]) {
                    try {
                        filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
                    } catch (e) {
                        filename = filenameMatch[1].replace(/['"]/g, '');
                    }
                }

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);

                console.log('Download triggered for', filename);
            } catch (err) {
                console.error('Error downloading file:', err);
                alert('Error downloading file. See console for details.');
            }
        });
    }



    // try {
        //     // If you use Bearer token, set it in localStorage (or replace with your auth retrieval)
        //     const token = localStorage.getItem('accessToken'); // or null
        //     const resp = await fetch('/api/keuangan/report/download', {
        //         method: 'GET',
        //         headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        //         credentials: 'include' // keep cookies if your auth uses them
        //     });                 // window.alert('File Anda Berhasil Diunduh!');


            //
            //
            // if (!resp.ok) {
            //     console.error('Download failed', resp.status, resp.statusText);
            //     // return;
            // }
            //
            // const blob = await resp.blob();
            //
            // // try to get filename from Content-Disposition
            // const cd = resp.headers.get('content-disposition');
            // let filename = 'keuangan.xls';
            // if (cd) {
            //     const match = /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i.exec(cd);
            //     if (match && match[1]) filename = decodeURIComponent(match[1].replace(/['"]/g, ''));
            // }
            //
            // const url = URL.createObjectURL(blob);
            // const a = document.createElement('a');
            // a.href = url;
            // a.download = filename;
            // document.body.appendChild(a);
            // a.click();
            // a.remove();
            // URL.revokeObjectURL(url);
    //     } catch (err) {
    //         console.error('Error downloading file', err);
    //     }
    // });


    //
    //     try {
    //         const response = await fetch('/api/keuangan/report/download', { method: 'GET' });
    //         if (!response.ok) throw new Error('Failed to download');
    //
    //         const blob = await response.blob();
    //         const url = window.URL.createObjectURL(blob);
    //         const a = document.createElement('a');
    //         a.href = url;
    //         a.download = 'laporan_keuangan.xls';
    //         document.body.appendChild(a);
    //         a.click();
    //         a.remove();
    //         window.URL.revokeObjectURL(url);
    //     } catch (err) {
    //         console.error(err);
    //         alert('Terjadi kesalahan saat mengunduh laporan keuangan!');
    //     }
    // });




    // (opsional) jangan crash bila user klik di luar; tidak auto-close supaya UX stabil
});