// ============ AUTHENTICATION ==========

// Update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.querySelectorAll('#cartCount').forEach(el => {
        if (el) el.innerText = count;
    });
}

// Add to cart
function addToCartLocal(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert(product.name + " added to cart!");
}

// Logout function
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('adminLoggedIn');
        window.location.href = 'index.html';
    }
}

// Check page auth
function checkPageAuth() {
    const path = window.location.pathname;
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isAdminPage = path.includes('admin') && !path.includes('admin-login');
    const isUserPage = path.includes('user-') || path.includes('user-dashboard') || path.includes('user-profile') || path.includes('user-orders') || path.includes('user-withdrawal') || path.includes('user-team') || path.includes('user-genealogy') || path.includes('user-commissions');
    
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

// Update navbar for logged in user
function updateNavbarForLoggedInUser() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userMenu = document.getElementById('userMenu');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (!userMenu) return;
    
    if (currentUser) {
        const firstLetter = (currentUser.name || 'U').charAt(0).toUpperCase();
        userMenu.innerHTML = `
            <div class="d-flex align-items-center">
                <div style="width: 30px; height: 30px; background: #ffd700; color: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 8px;">
                    ${firstLetter}
                </div>
                <span class="fw-bold text-white">${(currentUser.name || 'User').split(' ')[0]}</span>
            </div>
        `;
        
        if (dropdownMenu) {
            if (currentUser.role === 'admin') {
                dropdownMenu.innerHTML = `
                    <li><a class="dropdown-item" href="admin.html"><i class="fas fa-tachometer-alt me-2 text-primary"></i> Admin Dashboard</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logoutUser()"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
                `;
            } else {
                dropdownMenu.innerHTML = `
                    <li><a class="dropdown-item" href="user-dashboard.html"><i class="fas fa-tachometer-alt me-2 text-primary"></i> Dashboard</a></li>
                    <li><a class="dropdown-item" href="user-profile.html"><i class="fas fa-user-edit me-2 text-success"></i> My Profile</a></li>
                    <li><a class="dropdown-item" href="user-orders.html"><i class="fas fa-shopping-bag me-2 text-warning"></i> My Orders</a></li>
                    <li><a class="dropdown-item" href="user-withdrawal.html"><i class="fas fa-money-bill-wave me-2 text-info"></i> Withdraw</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logoutUser()"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
                `;
            }
        }
    }
}

// Auto-run on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    checkPageAuth();
    updateNavbarForLoggedInUser();
    
    // Monitor cart changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        if (key === 'cart') {
            updateCartCount();
        }
    };
});

// Export functions
window.updateCartCount = updateCartCount;
window.addToCartLocal = addToCartLocal;
window.logoutUser = logoutUser;
window.checkPageAuth = checkPageAuth;