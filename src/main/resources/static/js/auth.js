/**
 * Authentication Utility - digunakan di semua dashboard pages
 */

class AuthHelper {
    static checkAuth() {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        if (!token) {
            window.location.href = '/login';
            return false;
        }
        
        return { token, userRole };
    }
    
    static getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    
    static logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        window.location.href = '/login';
    }
    
    static getCurrentUser() {
        return {
            username: localStorage.getItem('username'),
            role: localStorage.getItem('userRole')
        };
    }
}

// Auto-check auth on page load untuk dashboard pages
document.addEventListener('DOMContentLoaded', function() {
    // Only run on dashboard pages (not login page)
    if (!window.location.pathname.includes('login.html')) {
        const auth = AuthHelper.checkAuth();
        if (auth) {
            console.log('User authenticated:', auth.userRole);
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
    
    // Hide/show elements based on role
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