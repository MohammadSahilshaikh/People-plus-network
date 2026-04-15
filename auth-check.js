// ============ AUTHENTICATION CHECK - Working Version ============

(function() {
    const currentPath = window.location.pathname;
    
    // Admin credentials (fixed)
    const ADMIN_EMAIL = 'admin@peopleplus.com';
    const ADMIN_PASSWORD = 'admin123';
    
    // Check login status
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    const isUserLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    
    // ============ PAGE REDIRECTION RULES ============
    
    // Admin pages - only accessible by admin
    if (currentPath.includes('admin') && !currentPath.includes('admin-login.html')) {
        if (!isAdminLoggedIn) {
            window.location.href = 'register.html';
            return;
        }
    }
    
    // User dashboard pages - only accessible by logged in users
    if (currentPath.includes('user-') || 
        currentPath.includes('user-dashboard.html') ||
        currentPath.includes('user-team.html') ||
        currentPath.includes('user-genealogy.html') ||
        currentPath.includes('user-commissions.html') ||
        currentPath.includes('user-withdrawal.html') ||
        currentPath.includes('user-orders.html') ||
        currentPath.includes('user-profile.html')) {
        
        if (!isUserLoggedIn) {
            window.location.href = 'register.html';
            return;
        }
    }
    
    // If already logged in and trying to access register page
    if (currentPath.includes('register.html')) {
        if (isAdminLoggedIn) {
            window.location.href = 'admin.html';
            return;
        }
        if (isUserLoggedIn) {
            window.location.href = 'user-dashboard.html';
            return;
        }
    }
    
    // ============ UPDATE NAVBAR FOR LOGGED IN USERS ============
    function updateNavbarForLoggedInUser() {
        const userMenu = document.getElementById('userMenu');
        const userMenuDropdown = document.querySelector('.dropdown-menu');
        
        if (!userMenu) return;
        
        if (isAdminLoggedIn) {
            userMenu.innerHTML = `
                <div class="d-flex align-items-center">
                    <div style="width: 35px; height: 35px; background: #ffd700; color: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 10px;">
                        A
                    </div>
                    <span class="fw-bold text-white">Admin</span>
                </div>
            `;
            
            if (userMenuDropdown) {
                userMenuDropdown.innerHTML = `
                    <li><a class="dropdown-item" href="admin.html"><i class="fas fa-tachometer-alt me-2 text-primary"></i> Admin Dashboard</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logoutUser()"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
                `;
            }
        } 
        else if (isUserLoggedIn && currentUser) {
            const userName = currentUser.name || 'Member';
            const firstLetter = userName.charAt(0).toUpperCase();
            
            userMenu.innerHTML = `
                <div class="d-flex align-items-center">
                    <div style="width: 35px; height: 35px; background: #ffd700; color: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 10px;">
                        ${firstLetter}
                    </div>
                    <span class="fw-bold text-white">${userName.split(' ')[0]}</span>
                </div>
            `;
            
            if (userMenuDropdown) {
                userMenuDropdown.innerHTML = `
                    <li><a class="dropdown-item" href="user-dashboard.html"><i class="fas fa-tachometer-alt me-2 text-primary"></i> Dashboard</a></li>
                    <li><a class="dropdown-item" href="user-profile.html"><i class="fas fa-user-edit me-2 text-success"></i> My Profile</a></li>
                    <li><a class="dropdown-item" href="user-orders.html"><i class="fas fa-shopping-bag me-2 text-warning"></i> My Orders</a></li>
                    <li><a class="dropdown-item" href="user-withdrawal.html"><i class="fas fa-money-bill-wave me-2 text-info"></i> Withdraw</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logoutUser()"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
                `;
            }
        }
        
        // Update all display elements
        if (currentUser) {
            document.querySelectorAll('.display-user-name').forEach(el => {
                el.innerText = currentUser.name || 'Member';
            });
            document.querySelectorAll('.display-user-id').forEach(el => {
                el.innerText = currentUser.userId || currentUser.sponsor || 'PPN' + Math.floor(Math.random() * 90000 + 10000);
            });
        }
    }
    
    // ============ UPDATE CART COUNT ============
    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const cartCountSpan = document.getElementById('cartCount');
        if (cartCountSpan) {
            cartCountSpan.innerText = count;
        }
    }
    
    // ============ LOGOUT FUNCTION ============
    window.logoutUser = function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('userLoggedIn');
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('adminEmail');
            window.location.href = 'index.html';
        }
    };
    
    // ============ GLOBAL FUNCTIONS ============
    window.updateCartCount = updateCartCount;
    
    // ============ RUN ON PAGE LOAD ============
    document.addEventListener('DOMContentLoaded', function() {
        updateCartCount();
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
})();

// Helper functions for pages
function checkAdminAuth() {
    if (localStorage.getItem('adminLoggedIn') !== 'true') {
        window.location.href = 'register.html';
        return false;
    }
    return true;
}

function checkUserAuth() {
    if (localStorage.getItem('userLoggedIn') !== 'true') {
        window.location.href = 'register.html';
        return false;
    }
    return true;
}