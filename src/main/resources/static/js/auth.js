/**
 * Authentication Utility - FIXED VERSION
 */

class AuthHelper {
    static checkAuth() {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        if (!token) {
            // Jangan redirect otomatis di login page
            if (!window.location.pathname.includes('login.html')) {
                this.redirectToLogin();
            }
            return null; // Return null instead of false
        }
        
        if (this.isTokenExpired(token)) {
            this.logout();
            return null;
        }
        
        return { token, userRole };
    }
    
    static getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }
    
    static logout() {
        // Clear semua auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('loginTime');
        
        sessionStorage.clear();
        
        console.log('✅ Logout successful - all auth data cleared');
        
        // Redirect ke login
        this.redirectToLogin();
    }
    
    static getCurrentUser() {
        return {
            username: localStorage.getItem('username'),
            role: localStorage.getItem('userRole'),
            loginTime: localStorage.getItem('loginTime')
        };
    }
    
    // Simpan login info dengan timestamp
    static saveLoginInfo(token, userRole, username) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('username', username);
        localStorage.setItem('loginTime', new Date().toISOString());
        
        console.log('Login info saved to localStorage');
    }
    
    // Cek jika token expired (basic check)
    static isTokenExpired(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;
            return Date.now() >= exp;
        } catch (error) {
            console.error('Error checking token expiry:', error);
            return false; 
        }
    }
    
    // Redirect helper
    static redirectToLogin() {
        console.log('🔀 Redirecting to login page...');
        window.location.href = '/login.html'; 
    }
    
    // Auto-logout setelah waktu tertentu (optional)
    static setupAutoLogout(minutes = 120) {
        console.log('⏰ Auto-logout setup for', minutes, 'minutes');
        setInterval(() => {
            const loginTime = localStorage.getItem('loginTime');
            if (loginTime) {
                const loginDate = new Date(loginTime);
                const now = new Date();
                const diffMinutes = (now - loginDate) / (1000 * 60);
                
                if (diffMinutes > minutes) {
                    this.logout();
                    alert('Session expired. Please login again.');
                }
            }
        }, 60000);
    }
}

// Auto-check auth on page load untuk dashboard pages
document.addEventListener('DOMContentLoaded', function() {
    // Only run on dashboard pages (not login page)
    if (!window.location.pathname.includes('login.html')) {
        const auth = AuthHelper.checkAuth();
        if (auth) {
            console.log('🔐 User authenticated:', auth.userRole);
            
            // Setup auto-logout setelah 2 jam (optional)
            AuthHelper.setupAutoLogout(120);
            
            // Update UI based on role
            updateUIForRole(auth.userRole);
        }
    }
});

function updateUIForRole(role) {
    // Update page title based on role
    const currentTitle = document.title;
    if (currentTitle.includes('AmbatuShop')) {
        if (role === 'MANAJER') {
            document.title = currentTitle.replace('AmbatuShop', 'AmbatuShop (Manajer)');
        } else if (role === 'ADMIN') {
            document.title = currentTitle.replace('AmbatuShop', 'AmbatuShop (Admin)');
        } else if (role === 'KASIR') {
            document.title = currentTitle.replace('AmbatuShop', 'AmbatuShop (Kasir)');
        }
    }
    const adminOnlyElements = document.querySelectorAll('[data-role="admin"]');
    const managerOnlyElements = document.querySelectorAll('[data-role="manager"]');
    const kasirOnlyElements = document.querySelectorAll('[data-role="kasir"]');
    
    if (role === 'ADMIN') {
        adminOnlyElements.forEach(el => el.style.display = '');
        managerOnlyElements.forEach(el => el.style.display = '');
        kasirOnlyElements.forEach(el => el.style.display = '');
    } else if (role === 'MANAJER') {
        adminOnlyElements.forEach(el => el.style.display = 'none');
        managerOnlyElements.forEach(el => el.style.display = '');
        kasirOnlyElements.forEach(el => el.style.display = '');
    } else if (role === 'KASIR') {
        adminOnlyElements.forEach(el => el.style.display = 'none');
        managerOnlyElements.forEach(el => el.style.display = 'none');
        kasirOnlyElements.forEach(el => el.style.display = '');
    }
}