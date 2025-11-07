/**
 * Register Page JavaScript
 * Validasi form dan handling registrasi
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

    // ========== VALIDATION RULES ==========
    const validationRules = {
        namaLengkap: {
            required: true,
            minLength: 3,
            maxLength: 100,
            pattern: /^[a-zA-Z\s]+$/,
            messages: {
                required: 'Nama lengkap wajib diisi',
                minLength: 'Nama minimal 3 karakter',
                maxLength: 'Nama maksimal 100 karakter',
                pattern: 'Nama hanya boleh mengandung huruf dan spasi'
            }
        },
        username: {
            required: true,
            minLength: 4,
            maxLength: 20,
            pattern: /^[a-zA-Z0-9_]+$/,
            messages: {
                required: 'Username wajib diisi',
                minLength: 'Username minimal 4 karakter',
                maxLength: 'Username maksimal 20 karakter',
                pattern: 'Username hanya boleh mengandung huruf, angka, dan underscore'
            }
        },
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            messages: {
                required: 'Email wajib diisi',
                pattern: 'Format email tidak valid'
            }
        },
        password: {
            required: true,
            minLength: 8,
            messages: {
                required: 'Password wajib diisi',
                minLength: 'Password minimal 8 karakter'
            }
        },
        confirmPassword: {
            required: true,
            match: 'password',
            messages: {
                required: 'Konfirmasi password wajib diisi',
                match: 'Password tidak cocok'
            }
        },
        nomorTelepon: {
            required: true,
            pattern: /^08[0-9]{8,11}$/,
            messages: {
                required: 'Nomor telepon wajib diisi',
                pattern: 'Format nomor telepon tidak valid (08xxxxxxxxxx)'
            }
        },
        role: {
            required: true,
            messages: {
                required: 'Role wajib dipilih'
            }
        },
        terms: {
            required: true,
            checked: true,
            messages: {
                required: 'Anda harus menyetujui syarat & ketentuan'
            }
        }
    };

    // ========== VALIDATION FUNCTIONS ==========
    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        
        input.classList.add('error');
        input.classList.remove('success');
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    function showSuccess(input) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        
        input.classList.remove('error');
        input.classList.add('success');
        errorElement.classList.remove('show');
    }

    function validateField(field, value) {
        const rules = validationRules[field.name];
        if (!rules) return true;

        // Required check
        if (rules.required) {
            if (field.type === 'checkbox') {
                if (!field.checked) {
                    showError(field, rules.messages.required);
                    return false;
                }
            } else if (!value || value.trim() === '') {
                showError(field, rules.messages.required);
                return false;
            }
        }

        // Min length check
        if (rules.minLength && value.length < rules.minLength) {
            showError(field, rules.messages.minLength);
            return false;
        }

        // Max length check
        if (rules.maxLength && value.length > rules.maxLength) {
            showError(field, rules.messages.maxLength);
            return false;
        }

        // Pattern check
        if (rules.pattern && !rules.pattern.test(value)) {
            showError(field, rules.messages.pattern);
            return false;
        }

        // Match check (for password confirmation)
        if (rules.match) {
            const matchField = document.getElementById(rules.match);
            if (value !== matchField.value) {
                showError(field, rules.messages.match);
                return false;
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

    // ========== TOGGLE PASSWORD VISIBILITY ==========
    function togglePasswordVisibility(input, button) {
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        
        const icon = button.querySelector('.eye-icon');
        if (type === 'text') {
            icon.style.opacity = '0.5';
        } else {
            icon.style.opacity = '1';
        }
    }

    // ========== EVENT LISTENERS ==========
    
    // Real-time validation
    namaLengkap.addEventListener('blur', () => validateField(namaLengkap, namaLengkap.value));
    username.addEventListener('blur', () => validateField(username, username.value));
    email.addEventListener('blur', () => validateField(email, email.value));
    password.addEventListener('blur', () => validateField(password, password.value));
    confirmPassword.addEventListener('blur', () => validateField(confirmPassword, confirmPassword.value));
    nomorTelepon.addEventListener('blur', () => validateField(nomorTelepon, nomorTelepon.value));
    role.addEventListener('change', () => validateField(role, role.value));

    // Password strength
    password.addEventListener('input', (e) => {
        updatePasswordStrength(e.target.value);
        if (confirmPassword.value) {
            validateField(confirmPassword, confirmPassword.value);
        }
    });

    // Confirm password real-time check
    confirmPassword.addEventListener('input', () => {
        if (confirmPassword.value.length > 0) {
            validateField(confirmPassword, confirmPassword.value);
        }
    });

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        togglePasswordVisibility(password, togglePassword);
    });

    toggleConfirmPassword.addEventListener('click', () => {
        togglePasswordVisibility(confirmPassword, toggleConfirmPassword);
    });

    // Phone number - only allow numbers
    nomorTelepon.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // ========== FORM SUBMIT ==========
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all fields
        const isNamaValid = validateField(namaLengkap, namaLengkap.value);
        const isUsernameValid = validateField(username, username.value);
        const isEmailValid = validateField(email, email.value);
        const isPasswordValid = validateField(password, password.value);
        const isConfirmPasswordValid = validateField(confirmPassword, confirmPassword.value);
        const isPhoneValid = validateField(nomorTelepon, nomorTelepon.value);
        const isRoleValid = validateField(role, role.value);
        const isTermsValid = validateField(terms, terms.checked);

        const isValid = isNamaValid && isUsernameValid && isEmailValid && 
                       isPasswordValid && isConfirmPasswordValid && isPhoneValid && 
                       isRoleValid && isTermsValid;

        if (!isValid) {
            showAlert('Mohon lengkapi semua field dengan benar', 'error');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';

        // Prepare data
        const formData = {
            namaLengkap: namaLengkap.value.trim(),
            username: username.value.trim(),
            email: email.value.trim(),
            password: password.value,
            nomorTelepon: nomorTelepon.value.trim(),
            role: role.value
        };

        try {
            // Send to backend
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Registrasi berhasil! Mengalihkan ke halaman login...', 'success');
                form.reset();
                passwordStrength.classList.remove('active');
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                showAlert(data.message || 'Registrasi gagal. Silakan coba lagi.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('Terjadi kesalahan. Silakan coba lagi.', 'error');
        } finally {
            // Reset button state
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

        // Auto hide after 5 seconds
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }

    // Clear success/error states on input
    const inputs = [namaLengkap, username, email, password, confirmPassword, nomorTelepon, role];
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.classList.contains('error') || input.classList.contains('success')) {
                input.classList.remove('error', 'success');
                const formGroup = input.closest('.form-group');
                const errorElement = formGroup.querySelector('.error-message');
                errorElement.classList.remove('show');
            }
        });
    });

    console.log('✅ Register page initialized');
});
