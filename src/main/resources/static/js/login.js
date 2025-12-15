/**
 * Login Page JavaScript dengan AuthHelper Enhanced - FIXED VERSION
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========== DOM ELEMENTS ==========
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('.login-button');
    const buttonText = loginButton.querySelector('.button-text');
    const buttonLoader = loginButton.querySelector('.button-loader');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const togglePasswordBtn = document.getElementById('togglePassword');

    // ========== BASE URL ==========
    const API_BASE_URL = 'http://localhost:8080';

    // ========== VALIDATION FUNCTIONS ==========
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        successMessage.classList.remove('show');
        usernameInput.classList.add('error');
        passwordInput.classList.add('error');

        setTimeout(() => {
            hideError();
        }, 5000);
    }
    
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.add('show');
        errorMessage.classList.remove('show');
    }

    function hideError() {
        errorMessage.classList.remove('show');
        usernameInput.classList.remove('error');
        passwordInput.classList.remove('error');
    }

    function validateInputs() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username) {
            showError('Username tidak boleh kosong');
            usernameInput.focus();
            return false;
        }

        if (!password) {
            showError('Password tidak boleh kosong');
            passwordInput.focus();
            return false;
        }

        return true;
    }

    // ========== TOGGLE PASSWORD VISIBILITY ==========
    function togglePasswordVisibility() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const icon = togglePasswordBtn.querySelector('i');
        if (type === 'text') {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    // ========== LOADING STATE ==========
    function setLoading(isLoading) {
        loginButton.disabled = isLoading;
        if (isLoading) {
            buttonText.style.display = 'none';
            buttonLoader.style.display = 'block';
            loginButton.classList.add('loading');
        } else {
            buttonText.style.display = 'block';
            buttonLoader.style.display = 'none';
            loginButton.classList.remove('loading');
        }
    }

    // ========== FORM SUBMIT ==========
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        successMessage.classList.remove('show');

        if (!validateInputs()) {
            return;
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        setLoading(true);

        try {
            console.log('🔍 Attempting login...');
            
            const loginUrl = `${API_BASE_URL}/api/auth/login`;
            console.log('Login URL:', loginUrl);

            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            console.log('🔍 Response status:', response.status);
            console.log('🔍 Response ok:', response.ok);

            let data;
            const responseText = await response.text();
            
            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('Parse error:', parseError);
                data = { message: 'Invalid server response' };
            }

            if (response.ok) {
                console.log('✅ Login successful:', data);
                
                if (!data.token || !data.role) {
                    throw new Error('Invalid response data from server');
                }

                // Save token dan user info
                AuthHelper.saveLoginInfo(
                    data.token, 
                    data.role, 
                    data.username || username,
                    data.userId
                );

                console.log('✅ Auth data saved');
                
                // Show success message
                showSuccess('Login berhasil! Mengalihkan...');
                
                // Smooth transition
                loginForm.style.opacity = '0';
                loginForm.style.transform = 'translateY(-20px)';

                // Redirect based on role
                setTimeout(() => {
                    redirectToRolePage(data.role);
                }, 1000);
                
            } else {
                console.error('❌ Login failed:', data);
                const errorMsg = data.message ||
                    data.details ||
                    data.error ||
                    `Login gagal (Status: ${response.status})`;
                showError(errorMsg);
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                showError('Tidak dapat terhubung ke server. Pastikan backend Spring Boot berjalan di localhost:8080');
            } else {
                showError('Terjadi kesalahan: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    });

    // ========== REDIRECT BASED ON ROLE ==========
    function redirectToRolePage(role) {
        let targetPage;

        if (role === 'ADMIN') {
            targetPage = 'beranda_admin.html';
        } else if (role === 'KASIR') {
            targetPage = 'kasir_dashboard.html';
        } else if (role === 'MANAJER') {
            targetPage = 'manajer_dashboard.html';
        } else {
            targetPage = 'login.html';
        }

        console.log('🎯 Redirecting to:', targetPage, 'for role:', role);
        window.location.href = targetPage;
    }

    // ========== EVENT LISTENERS ==========
    
    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }
    
    // Clear error on input
    usernameInput.addEventListener('input', hideError);
    passwordInput.addEventListener('input', hideError);
    
    // Enter key navigation
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            passwordInput.focus();
        }
    });
    
    // Auto focus on page load
    setTimeout(() => {
        usernameInput.focus();
    }, 500);

    console.log('✅ Login page initialized');
});