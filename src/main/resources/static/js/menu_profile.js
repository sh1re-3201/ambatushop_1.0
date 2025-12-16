// javascript
// File: `src/main/resources/static/js/menu_profile.js`
document.addEventListener('DOMContentLoaded', () => {
    // Try common storage keys (note: login stores the id as `userId`)
    const AKUN_ID = localStorage.getItem('userId')
        || localStorage.getItem('id')
        || localStorage.getItem('akunId')
        || document.body?.dataset?.akunId;

    const API_BY_ID = id => `/api/admin/akun/${encodeURIComponent(id)}`;
    const API_SELF = '/api/profile';

    const usernameEl = document.getElementById('username');
    const emailEl = document.getElementById('email');
    const roleEl = document.getElementById('role');

    const btnLogout = document.getElementById('logout-btn');
    const btnEdit = document.getElementById('btnEdit');
    const btnBack = document.getElementById('btnBack');

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');

    function populateProfile(data) {
        if (!usernameEl || !emailEl || !roleEl) return;
        usernameEl.textContent = data.username || data.name || '—';
        emailEl.textContent = data.email || '—';
        if (Array.isArray(data.roles)) roleEl.textContent = data.roles.join(', ');
        else roleEl.textContent = data.role || data.roles || '—';
    }

    function fetchById(id) {
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        return fetch(API_BY_ID(id), { credentials: 'same-origin', headers })
            .then(r => {
                if (r.status === 401) { window.location.href = '/login.html'; throw new Error('unauthorized'); }
                if (!r.ok) throw new Error('fetch failed: ' + r.status);
                return r.json();
            })
            .then(populateProfile);
    }

    function fetchSelf() {
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        return fetch(API_SELF, { credentials: 'same-origin', headers })
            .then(r => {
                if (r.status === 401) { window.location.href = '/login.html'; throw new Error('unauthorized'); }
                if (!r.ok) throw new Error('profile fetch failed: ' + r.status);
                return r.json();
            })
            .then(data => {
                if (data.id || data.idPegawai) {
                    // prefer admin endpoint if self profile contains an id required by your admin API
                    return fetchById(data.id || data.idPegawai);
                }
                populateProfile(data);
            });
    }

    if (AKUN_ID) {
        fetchById(AKUN_ID).catch(err => console.error('Profile fetch error:', err));
    } else {
        fetchSelf().catch(err => {
            console.error('Profile fallback error:', err);
            // optional: redirect if you want strict behavior
            // window.location.href = '/login.html';
        });
    }

    btnLogout?.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin logout?')) {
            localStorage.clear();
            window.location.href = '/login.html';
        }
    });

    btnEdit?.addEventListener('click', () => {
            window.location.href = '/edit_profile.html';
    });

    btnBack?.addEventListener('click', () => {
        window.history.back();
    });
});
