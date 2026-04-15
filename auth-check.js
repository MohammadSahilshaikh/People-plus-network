// ============ AUTHENTICATION WITH BACKEND API ============
// Change this to your backend URL after deploying to Render
const API_URL = 'https://people-plus-network.onrender.com/api';

// Store token
let authToken = localStorage.getItem('authToken');

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            if (!window.location.pathname.includes('register.html')) {
                window.location.href = 'register.html';
            }
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { error: 'Network error. Make sure backend is running.' };
    }
}

// Login function
async function loginUser(email, password) {
    const result = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    if (result.success && result.token) {
        authToken = result.token;
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        return { success: true, user: result.user };
    }
    
    return { success: false, error: result.error || 'Login failed' };
}

// Register function
async function registerUser(userData) {
    const result = await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    
    if (result.success && result.token) {
        authToken = result.token;
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        return { success: true, user: result.user };
    }
    
    return { success: false, error: result.error || 'Registration failed' };
}

// Logout function
function logoutUser() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Load products from server
async function loadProducts() {
    const products = await apiCall('/products');
    return products || [];
}

// Add to cart (local storage)
function addToCartLocal(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.find(item => item._id === product._id || item.name === product.name);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Update cart count display
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.querySelectorAll('#cartCount').forEach(el => {
        if (el) el.innerText = count;
    });
}

// Page-specific auth checks
function checkPageAuth() {
    const path = window.location.pathname;
    const isAdminPage = path.includes('admin') && !path.includes('admin-login');
    const isUserPage = path.includes('user-') || path.includes('user-dashboard') || path.includes('user-profile') || path.includes('user-orders') || path.includes('user-withdrawal') || path.includes('user-team') || path.includes('user-genealogy') || path.includes('user-commissions');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (isAdminPage && (!currentUser || currentUser.role !== 'admin')) {
        window.location.href = 'register.html';
        return false;
    }
    
    if (isUserPage && !currentUser) {
        window.location.href = 'register.html';
        return false;
    }
    
    return true;
}

// Get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Export functions for use in HTML
window.apiCall = apiCall;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;
window.loadProducts = loadProducts;
window.addToCartLocal = addToCartLocal;
window.updateCartCount = updateCartCount;
window.checkPageAuth = checkPageAuth;
window.getCurrentUser = getCurrentUser;

// Auto-run on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    checkPageAuth();
});