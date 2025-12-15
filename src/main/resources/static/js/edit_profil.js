/**
 * Edit Profile JavaScript (PUT backend)
 * - Prefill form with existing data (captures id)
 * - Make fields optional for edit
 * - Send a full resource via PUT by merging initial snapshot with changed fields
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const alert = document.getElementById('alert');

    const ID = document.getElementById('id_pegawai');
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const role = document.getElementById('role');
    const terms = document.getElementById('terms');

    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

    const passwordStrength = document.getElementById('passwordStrength');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    let initialData = {};

    const validationRules = {
        username: {
            required: false,
            minLength: 4,
            maxLength: 20,
            pattern: /^[a-zA-Z0-9_]+$/,
            messages: {
                minLength: 'Username minimal 4 karakter',
                maxLength: 'Username maksimal 20 karakter',
                pattern: 'Username hanya boleh mengandung huruf, angka, dan underscore'
            }
        },
        email: {
            required: false,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            messages: { pattern: 'Format email tidak valid' }
        },
        password: {
            required: false,
            minLength: 8,
            messages: { minLength: 'Password minimal 8 karakter' }
        },
        confirmPassword: {
            required: false,
            match: 'password',
            messages: { match: 'Password tidak cocok' }
        },
        role: { required: false, messages: {} },
        terms: { required: false, messages: {} }
    };

    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup && formGroup.querySelector('.error-message');
        input.classList.add('error');
        input.classList.remove('success');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    function showSuccess(input) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup && formGroup.querySelector('.error-message');
        input.classList.remove('error');
        input.classList.add('success');
        if (errorElement) errorElement.classList.remove('show');
    }

    function validateField(field, value) {
        const rules = validationRules[field.name];
        if (!rules) return true;

        const hasValue = (field.type === 'checkbox') ? field.checked : (value !== undefined && value !== null && String(value).trim() !== '');
        if (!hasValue) {
            field.classList.remove('error', 'success');
            const formGroup = field.closest('.form-group');
            const errorElement = formGroup && formGroup.querySelector('.error-message');
            if (errorElement) errorElement.classList.remove('show');
            return true;
        }

        if (rules.minLength && value.length < rules.minLength) {
            showError(field, rules.messages.minLength);
            return false;
        }
        if (rules.maxLength && value.length > rules.maxLength) {
            showError(field, rules.messages.maxLength);
            return false;
        }
        if (rules.pattern && !rules.pattern.test(value)) {
            showError(field, rules.messages.pattern);
            return false;
        }
        if (rules.match) {
            const matchField = document.getElementById(rules.match);
            if ((matchField && matchField.value) || value) {
                if (value !== matchField.value) {
                    showError(field, rules.messages.match);
                    return false;
                }
            }
        }

        showSuccess(field);
        return true;
    }

    function checkPasswordStrength(pwd) {
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (pwd.length >= 12) strength++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
        if (/[0-9]/.test(pwd)) strength++;
        if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
        return strength;
    }

    function updatePasswordStrength(pwd) {
        if (pwd.length === 0) {
            passwordStrength.classList.remove('active');
            return;
        }
        passwordStrength.classList.add('active');
        const strength = checkPasswordStrength(pwd);
        strengthFill.className = 'strength-fill';
        if (strength <= 2) {
            strengthFill.classList.add('weak');
            strengthText.textContent = 'Lemah';
            strengthText.style.color = '#ff5252';
        } else if (strength <= 3) {
            strengthFill.classList.add('medium');
            strengthText.textContent = 'Sedang';
            strengthText.style.color = '#f6b24a';
        } else {
            strengthFill.classList.add('strong');
            strengthText.textContent = 'Kuat';
            strengthText.style.color = '#10b759';
        }
    }

    function togglePasswordVisibility(input, button) {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        const icon = button.querySelector('.eye-icon');
        if (icon) icon.style.opacity = (type === 'text') ? '0.5' : '1';
    }

    function populateForm(data) {
        if (!data) return;
        username.value = data.username || '';
        email.value = data.email || '';
        role.value = data.role || '';
        if (typeof data.terms !== 'undefined') terms.checked = !!data.terms;

        password.value = '';
        confirmPassword.value = '';

        initialData = {
            id: data.id || data.userId || data.ID || null,
            username: username.value,
            email: email.value,
            role: role.value,
            terms: terms.checked
        };
    }

    async function fetchInitialData() {
        const pageIdInput = document.getElementById('userId');
        const pageId = (pageIdInput && pageIdInput.value) || document.body.dataset.userId || window.userID || null;

        try {
            const res = await fetch('/api/admin/akun/${pageId}');
            if (!res.ok) return;
            const json = await res.json();
            const profile = json.data || json.user || json;
            populateForm(profile);
        } catch (err) {
            console.warn('Could not fetch initial profile data', err);
        }
    }

    fetchInitialData();

    username.addEventListener('blur', () => validateField(username, username.value));
    email.addEventListener('blur', () => validateField(email, email.value));
    password.addEventListener('blur', () => validateField(password, password.value));
    confirmPassword.addEventListener('blur', () => validateField(confirmPassword, confirmPassword.value));
    role.addEventListener('change', () => validateField(role, role.value));

    password.addEventListener('input', (e) => {
        updatePasswordStrength(e.target.value);
        if (confirmPassword.value) validateField(confirmPassword, confirmPassword.value);
    });

    confirmPassword.addEventListener('input', () => {
        if (confirmPassword.value.length > 0) validateField(confirmPassword, confirmPassword.value);
    });

    togglePassword.addEventListener('click', () => togglePasswordVisibility(password, togglePassword));
    toggleConfirmPassword.addEventListener('click', () => togglePasswordVisibility(confirmPassword, toggleConfirmPassword));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const current = {
            username: username.value.trim(),
            email: email.value.trim(),
            password: password.value,
            role: role.value,
            terms: terms.checked
        };

        const toValidate = [];
        if (current.username && current.username !== (initialData.username || '')) toValidate.push({ field: username, value: current.username });
        if (current.email && current.email !== (initialData.email || '')) toValidate.push({ field: email, value: current.email });
        if (current.password) toValidate.push({ field: password, value: current.password });
        if (current.role && current.role !== (initialData.role || '')) toValidate.push({ field: role, value: current.role });
        if (current.terms !== initialData.terms) toValidate.push({ field: terms, value: current.terms });
        if (current.password) toValidate.push({ field: confirmPassword, value: confirmPassword.value });

        for (const item of toValidate) {
            if (!validateField(item.field, item.value)) {
                showAlert('Please fix validation errors before saving', 'error');
                return;
            }
        }

        const changed = {};
        if (current.username !== (initialData.username || '') && current.username !== '') changed.username = current.username;
        if (current.email !== (initialData.email || '') && current.email !== '') changed.email = current.email;
        if (current.role !== (initialData.role || '') && current.role !== '') changed.role = current.role;
        if (current.terms !== initialData.terms) changed.terms = current.terms;
        if (current.password && current.password.length > 0) changed.password = current.password;

        if (Object.keys(changed).length === 0) {
            showAlert('No changes to save', 'info');
            return;
        }

        // For PUT, merge initial snapshot with changed fields to send a full resource
        const requestBody = Object.assign({}, initialData, changed);
        // ensure id is not accidentally null in URL; id included in path
        const idPath = initialData.id ? `/${initialData.id}` : '';

        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';

        try {
            const response = await fetch(`/api/admin/akun${idPath}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Perubahan berhasil disimpan', 'success');
                // update snapshot
                Object.assign(initialData, changed);
                password.value = '';
                confirmPassword.value = '';
                passwordStrength.classList.remove('active');
            } else {
                showAlert(data.message || 'Gagal menyimpan perubahan', 'error');
            }
        } catch (error) {
            console.error('Update error:', error);
            showAlert('Terjadi kesalahan. Silakan coba lagi.', 'error');
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
        }
    });

    function showAlert(message, type) {
        alert.textContent = message;
        alert.className = `alert ${type}`;
        alert.style.display = 'block';
        setTimeout(() => { alert.style.display = 'none'; }, 5000);
    }

    const inputs = [username, email, password, confirmPassword, role];
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.classList.contains('error') || input.classList.contains('success')) {
                input.classList.remove('error', 'success');
                const formGroup = input.closest('.form-group');
                const errorElement = formGroup && formGroup.querySelector('.error-message');
                if (errorElement) errorElement.classList.remove('show');
            }
        });
    });

    console.log('✅ Edit profile page initialized (PUT)');
});
