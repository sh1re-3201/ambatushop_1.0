/**
 * Login Page JavaScript dengan AuthHelper Enhanced - FIXED VERSION
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========== DOM ELEMENTS ==========
    const loginForm = document.getElementById('loginForm');
    const userIdInput = document.getElementById('userId');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('.login-button');
    const errorMessage = document.getElementById('errorMessage');

    // ========== BASE URL ==========
    const API_BASE_URL = 'http://localhost:8080'; // Explicit base URL

    // ========== VALIDATION FUNCTIONS ==========
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        userIdInput.classList.add('error');
        passwordInput.classList.add('error');

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
            showError('Username tidak boleh kosong');
            userIdInput.focus();
            return false;
        }

        if (!password) {
            showError('Password tidak boleh kosong');
            passwordInput.focus();
            return false;
        }

        return true; // Remove password length validation for now
    }

    // ========== LOADING STATE ==========
    function setLoading(isLoading) {
        loginButton.disabled = isLoading;
        if (isLoading) {
            loginButton.classList.add('loading');
            loginButton.textContent = 'LOGGING IN...';
        } else {
            loginButton.classList.remove('loading');
            loginButton.textContent = 'LOGIN';
        }
    }

    // ========== FORM SUBMIT ==========
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        if (!validateInputs()) {
            return;
        }

        const username = userIdInput.value.trim();
        const password = passwordInput.value;

        setLoading(true);

        try {
            console.log('🔍 Attempting login...');
            
            //  Gunakan full URL dengan base URL
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

            //  Handle case where response might not be JSON
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
                
                //  Pastikan data yang diperlukan ada
                if (!data.token || !data.role) {
                    throw new Error('Invalid response data from server');
                }

                // Save token dan user info
                AuthHelper.saveLoginInfo(
                    data.token, 
                    data.role, 
                    data.username || username, // Fallback ke username input
                    data.userId
                );

                console.log('✅ Auth data saved');
                
                // Redirect based on role
                redirectToRolePage(data.role);
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
            
            // ✅ Better error messages
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

        // Smooth transition
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
        input.addEventListener('focus', function () {
            this.style.transform = 'scale(1.02)';
        });

        input.addEventListener('blur', function () {
            this.style.transform = 'scale(1)';
        });
    });

    // ========== AUTO FOCUS ON PAGE LOAD ==========
    setTimeout(() => {
        userIdInput.focus();
    }, 500);

    // ========== CHECK IF ALREADY LOGGED IN ==========
    // ✅ FIX: Comment dulu untuk testing
    /*
    const existingAuth = AuthHelper.checkAuth();
    if (existingAuth) {
        console.log('User already logged in, redirecting...');
        redirectToRolePage(existingAuth.userRole);
    }
    */

    console.log('✅ Login page initialized');
});