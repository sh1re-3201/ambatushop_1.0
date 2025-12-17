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


    btnEdit?.addEventListener('click', showEditSelfModal);

    btnBack?.addEventListener('click', () => {
        window.history.back();
    });


    if (document.getElementById('profile-modal-style')) return;

    const style = document.createElement('style');
    style.id = 'profile-modal-style';
    style.textContent = `
/* ===== MODAL OVERLAY ===== */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.2s ease;
}

/* ===== MODAL BOX ===== */
.modal-content {
    background: var(--card-bg, #fff);
    width: 100%;
    max-width: 420px;
    border-radius: 14px;
    box-shadow: 0 25px 50px rgba(0,0,0,0.25);
    animation: scaleIn 0.25s ease;
    overflow: hidden;
}

/* ===== HEADER ===== */
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 20px;
    border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
}

.modal-close {
    background: none;
    border: none;
    font-size: 22px;
    cursor: pointer;
    opacity: 0.6;
}
.modal-close:hover {
    opacity: 1;
}

/* ===== FORM ===== */
.modal-form {
    padding: 20px;
}

.form-group {
    margin-bottom: 14px;
}

.form-group label {
    font-size: 13px;
    font-weight: 600;
    display: block;
    margin-bottom: 6px;
}

.form-group input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    font-size: 14px;
    outline: none;
}

.form-group input:focus {
    border-color: #2b7cff;
    box-shadow: 0 0 0 2px rgba(43,124,255,0.15);
}

.form-group small {
    font-size: 11px;
    color: #6b7280;
}

/* ===== ACTIONS ===== */
.modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 18px;
}

.btn-cancel {
    flex: 1;
    background: #f3f4f6;
    border: none;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
}

.btn-submit {
    flex: 1;
    background: #2b7cff;
    color: white;
    border: none;
    padding: 10px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

.btn-submit:hover {
    background: #1f5edc;
}

/* ===== ANIMATION ===== */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes scaleIn {
    from {
        transform: scale(0.95);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

/* ===== MOBILE ===== */
@media (max-width: 480px) {
    .modal-content {
        margin: 16px;
    }
}
`;
    document.head.appendChild(style);
});

function getLoggedInUserId() {
    return localStorage.getItem('userId')
        || localStorage.getItem('id')
        || localStorage.getItem('akunId');
}

async function showEditSelfModal() {
    const userId = getLoggedInUserId();
    if (!userId) {
        alert('Session tidak valid. Silakan login ulang.');
        window.location.href = '/login.html';
        return;
    }

    try {
        const res = await fetch(`/api/admin/akun/${userId}`, {
            headers: AuthHelper.getAuthHeaders()
        });

        if (!res.ok) throw new Error('Gagal memuat profil');

        const user = await res.json();

        const modalHtml = `
        <div class="modal-overlay" id="userModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Profil</h3>
                    <button class="modal-close">&times;</button>
                </div>

                <form id="userForm" class="modal-form">
                    <input type="hidden" id="userId" value="${user.idPegawai}">

                    <div class="form-group">
                        <label>Username *</label>
                        <input type="text" id="username" value="${user.username}" required>
                    </div>

                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" id="email" value="${user.email}" required>
                    </div>

                    <div class="form-group">
                        <label>Password Baru</label>
                        <input type="password" id="password"
                               placeholder="Kosongkan jika tidak ingin mengubah">
                        <small>Minimal 8 karakter</small>
                    </div>

                    <!-- Role shown but locked -->
                    <div class="form-group" style="opacity: 0.6;">
                        <label>Role</label>
                        <input type="text" value="${user.role}" disabled>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn-cancel">Batal</button>
                        <button type="submit" class="btn-submit">Update</button>
                    </div>
                </form>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        setupSelfModalEvents();

    } catch (err) {
        alert('❌ ' + err.message);
    }
}

function setupSelfModalEvents() {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');

    modal.querySelector('.modal-close').onclick =
        modal.querySelector('.btn-cancel').onclick = () => modal.remove();

    modal.addEventListener('click', e => {
        if (e.target === modal) modal.remove();
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();

        const userId = document.getElementById('userId').value;
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const payload = { username, email };
        if (password) payload.password = password;

        const res = await fetch(`/api/admin/akun/${userId}`, {
            method: 'PUT',
            headers: AuthHelper.getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (res.ok) {
            modal.remove();
            alert('✅ Profil berhasil diperbarui');
            location.reload(); // refresh displayed profile
        } else {
            alert('❌ ' + (result.message || 'Gagal update profil'));
        }
    });
}

