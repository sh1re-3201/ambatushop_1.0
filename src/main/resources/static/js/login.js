/**
 * Login Page JavaScript
 * Handling authentication dan validasi
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========== DOM ELEMENTS ==========
    const loginForm = document.getElementById('loginForm');
    const userIdInput = document.getElementById('userId');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('.login-button');
    const errorMessage = document.getElementById('errorMessage');

    // ========== VALIDATION FUNCTIONS ==========
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        userIdInput.classList.add('error');
        passwordInput.classList.add('error');

        // Auto hide after 5 seconds
        setTimeout(() => {
            hideError();
        }, 5000);
    }

    function hideError() {
        errorMessage.classList.remove('show');
        userIdInput.classList.remove('error');
        passwordInput.classList.remove('error');
    }

    function validateInputs() {
        const userId = userIdInput.value.trim();
        const password = passwordInput.value;

        if (!userId) {
            showError('User ID tidak boleh kosong');
            userIdInput.focus();
            return false;
        }

        if (!password) {
            showError('Password tidak boleh kosong');
            passwordInput.focus();
            return false;
        }

        if (password.length < 4) {
            showError('Password minimal 4 karakter');
            passwordInput.focus();
            return false;
        }

        return true;
    }

    // ========== LOADING STATE ==========
    function setLoading(isLoading) {
        okButton.disabled = isLoading;
        if (isLoading) {
            okButton.classList.add('loading');
        } else {
            okButton.classList.remove('loading');
        }
    }

    // ========== FORM SUBMIT ==========
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        // Validate inputs
        if (!validateInputs()) {
            return;
        }

        const userId = userIdInput.value.trim();
        const password = passwordInput.value;

        // Show loading state
        setLoading(true);

        try {
            // Send login request to backend
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: userId,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Login successful
                console.log('Login successful:', data);

                // Save token if provided
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                }

                // Save user info
                if (data.user) {
                    localStorage.setItem('userInfo', JSON.stringify(data.user));
                }

                // Redirect based on role
                redirectToRolePage(data.user?.role || data.role);
            } else {
                // Login failed
                showError(data.message || 'Login gagal. Periksa User ID dan Password Anda.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            // Hide loading state
            setLoading(false);
        }
    });

    // ========== REDIRECT BASED ON ROLE ==========
    function redirectToRolePage(role) {
        const rolePages = {
            'KASIR': '/kasir_dashboard.html',
            'MANAJER': '/manajer_dashboard.html',
            'ADMIN': '/admin_dashboard.html'
        };

        const targetPage = rolePages[role] || '/kasir_dashboard.html';
        
        // Smooth transition before redirect
        loginForm.style.opacity = '0';
        loginForm.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            window.location.href = targetPage;
        }, 300);
    }

    // ========== CLEAR ERROR ON INPUT ==========
    userIdInput.addEventListener('input', hideError);
    passwordInput.addEventListener('input', hideError);

    // ========== ENTER KEY ON USER ID ==========
    userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            passwordInput.focus();
        }
    });

    // ========== FOCUS ANIMATION ==========
    const inputs = [userIdInput, passwordInput];
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'scale(1.02)';
        });

        input.addEventListener('blur', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // ========== AUTO FOCUS ON PAGE LOAD ==========
    setTimeout(() => {
        userIdInput.focus();
    }, 500);

    console.log('✅ Login page initialized');
});
