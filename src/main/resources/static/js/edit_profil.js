// javascript
/**
 * Edit Profile JavaScript (updated)
 * - Prefill form with existing data
 * - Make fields optional for edit (validation runs only when a value is present)
 * - Send only changed fields to backend (use PATCH /api/auth/profile)
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========== DOM ELEMENTS ==========
    const form = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const alert = document.getElementById('alert');

    // Form inputs
    const namaLengkap = document.getElementById('namaLengkap');
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const nomorTelepon = document.getElementById('nomorTelepon');
    const role = document.getElementById('role');
    const terms = document.getElementById('terms');

    // Password toggle
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

    // Password strength
    const passwordStrength = document.getElementById('passwordStrength');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    // store initial values to compute diffs
    let initialData = {};

    // ========== VALIDATION RULES (optional on edit) ==========
    const validationRules = {
        namaLengkap: {
            required: false,
            minLength: 3,
            maxLength: 100,
            pattern: /^[a-zA-Z\s]+$/,
            messages: {
                minLength: 'Nama minimal 3 karakter',
                maxLength: 'Nama maksimal 100 karakter',
                pattern: 'Nama hanya boleh mengandung huruf dan spasi'
            }
        },
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
            messages: {
                pattern: 'Format email tidak valid'
            }
        },
        password: {
            required: false,
            minLength: 8,
            messages: {
                minLength: 'Password minimal 8 karakter'
            }
        },
        confirmPassword: {
            required: false,
            match: 'password',
            messages: {
                match: 'Password tidak cocok'
            }
        },
        nomorTelepon: {
            required: false,
            pattern: /^08[0-9]{8,11}$/,
            messages: {
                pattern: 'Format nomor telepon tidak valid (08xxxxxxxxxx)'
            }
        },
        role: {
            required: false,
            messages: {}
        },
        terms: {
            required: false,
            messages: {}
        }
    };

    // ========== VALIDATION HELPERS ==========
    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');

        input.classList.add('error');
        input.classList.remove('success');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    function showSuccess(input) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');

        input.classList.remove('error');
        input.classList.add('success');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    // validate only when a value is present (fields are optional on edit)
    function validateField(field, value) {
        const rules = validationRules[field.name];
        if (!rules) return true;

        // If no value provided, skip validation (optional field)
        const hasValue = (field.type === 'checkbox') ? field.checked : (value !== undefined && value !== null && String(value).trim() !== '');
        if (!hasValue) {
            // clear any previous state
            field.classList.remove('error', 'success');
            const formGroup = field.closest('.form-group');
            const errorElement = formGroup && formGroup.querySelector('.error-message');
            if (errorElement) errorElement.classList.remove('show');
            return true;
        }

        // min length
        if (rules.minLength && value.length < rules.minLength) {
            showError(field, rules.messages.minLength);
            return false;
        }

        // max length
        if (rules.maxLength && value.length > rules.maxLength) {
            showError(field, rules.messages.maxLength);
            return false;
        }

        // pattern
        if (rules.pattern && !rules.pattern.test(value)) {
            showError(field, rules.messages.pattern);
            return false;
        }

        // match (confirm password) - only validate if password or confirm provided
        if (rules.match) {
            const matchField = document.getElementById(rules.match);
            // only check if either has value
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

    // ========== PASSWORD STRENGTH ==========
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

    // ========== TOGGLE VISIBILITY ==========
    function togglePasswordVisibility(input, button) {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        const icon = button.querySelector('.eye-icon');
        if (icon) icon.style.opacity = (type === 'text') ? '0.5' : '1';
    }

    // ========== PREFILL FUNCTION ==========
    function populateForm(data) {
        // Expecting fields: namaLengkap, username, email, nomorTelepon, role, terms (optional)
        if (!data) return;

        namaLengkap.value = data.namaLengkap || '';
        username.value = data.username || '';
        email.value = data.email || '';
        nomorTelepon.value = data.nomorTelepon || '';
        role.value = data.role || '';
        if (typeof data.terms !== 'undefined') terms.checked = !!data.terms;

        // do not prefill password fields
        password.value = '';
        confirmPassword.value = '';

        // store initial snapshot
        initialData = {
            namaLengkap: namaLengkap.value,
            username: username.value,
            email: email.value,
            nomorTelepon: nomorTelepon.value,
            role: role.value,
            terms: terms.checked
        };
    }

    async function fetchInitialData() {
        try {
            const res = await fetch('/api/auth/me'); // adjust endpoint to backend
            if (!res.ok) return;
            const json = await res.json();
            // assume the returned object is the user profile or in json.data
            const profile = json.data || json.user || json;
            populateForm(profile);
        } catch (err) {
            console.warn('Could not fetch initial profile data', err);
        }
    }

    // Immediately try to fetch user data to prefill
    fetchInitialData();

    // ========== EVENT LISTENERS ==========

    // Real-time validation only when user interacts
    namaLengkap.addEventListener('blur', () => validateField(namaLengkap, namaLengkap.value));
    username.addEventListener('blur', () => validateField(username, username.value));
    email.addEventListener('blur', () => validateField(email, email.value));
    password.addEventListener('blur', () => validateField(password, password.value));
    confirmPassword.addEventListener('blur', () => validateField(confirmPassword, confirmPassword.value));
    nomorTelepon.addEventListener('blur', () => validateField(nomorTelepon, nomorTelepon.value));
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

    nomorTelepon.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // ========== FORM SUBMIT (send only changed fields) ==========
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Build payload by comparing current values to initialData
        const current = {
            namaLengkap: namaLengkap.value.trim(),
            username: username.value.trim(),
            email: email.value.trim(),
            password: password.value,
            nomorTelepon: nomorTelepon.value.trim(),
            role: role.value,
            terms: terms.checked
        };

        // Validate only fields that have values or are changed
        const toValidate = [];
        if (current.namaLengkap && current.namaLengkap !== (initialData.namaLengkap || '')) toValidate.push({field: namaLengkap, value: current.namaLengkap});
        if (current.username && current.username !== (initialData.username || '')) toValidate.push({field: username, value: current.username});
        if (current.email && current.email !== (initialData.email || '')) toValidate.push({field: email, value: current.email});
        if (current.password) toValidate.push({field: password, value: current.password});
        if (current.confirmPassword && current.confirmPassword !== '') {} // confirm handled below
        if (current.nomorTelepon && current.nomorTelepon !== (initialData.nomorTelepon || '')) toValidate.push({field: nomorTelepon, value: current.nomorTelepon});
        if (current.role && current.role !== (initialData.role || '')) toValidate.push({field: role, value: current.role});
        // terms usually not required; if changed include it (checkbox)
        if (current.terms !== initialData.terms) toValidate.push({field: terms, value: current.terms});

        // Always validate confirmPassword if password is provided
        if (current.password) toValidate.push({field: confirmPassword, value: confirmPassword.value});

        // Run validations
        for (const item of toValidate) {
            if (!validateField(item.field, item.value)) {
                showAlert('Please fix validation errors before saving', 'error');
                return;
            }
        }

        // Build changed payload
        const payload = {};
        if (current.namaLengkap !== (initialData.namaLengkap || '') && current.namaLengkap !== '') payload.namaLengkap = current.namaLengkap;
        if (current.username !== (initialData.username || '') && current.username !== '') payload.username = current.username;
        if (current.email !== (initialData.email || '') && current.email !== '') payload.email = current.email;
        if (current.nomorTelepon !== (initialData.nomorTelepon || '') && current.nomorTelepon !== '') payload.nomorTelepon = current.nomorTelepon;
        if (current.role !== (initialData.role || '') && current.role !== '') payload.role = current.role;
        if (current.terms !== initialData.terms) payload.terms = current.terms;
        // include password only if user typed a new one
        if (current.password && current.password.length > 0) payload.password = current.password;

        if (Object.keys(payload).length === 0) {
            showAlert('No changes to save', 'info');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';

        try {
            const response = await fetch('/api/auth/profile', { // adjust endpoint/method to your backend
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Perubahan berhasil disimpan', 'success');
                // update initialData snapshot with saved values
                Object.assign(initialData, payload);
                // clear password fields & strength
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

    // ========== HELPER FUNCTIONS ==========
    function showAlert(message, type) {
        alert.textContent = message;
        alert.className = `alert ${type}`;
        alert.style.display = 'block';
        setTimeout(() => { alert.style.display = 'none'; }, 5000);
    }

    // Clear success/error states on input
    const inputs = [namaLengkap, username, email, password, confirmPassword, nomorTelepon, role];
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

    console.log('✅ Edit profile page initialized');
});
