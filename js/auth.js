// ============ AUTHENTICATION - PROFESSIONAL VERSION ==========

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

// Get current user from Firebase Auth
async function getCurrentUser() {
    return new Promise((resolve) => {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                // Get user data from Firestore
                const doc = await firebase.firestore().collection('users').doc(user.uid).get();
                if (doc.exists) {
                    resolve({ id: user.uid, ...doc.data() });
                } else {
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    });
}

// Update navbar for logged in user
async function updateNavbarForUser() {
    const userMenu = document.getElementById('userMenu');
    const dropdownMenu = userMenu?.closest('.dropdown')?.querySelector('.dropdown-menu');
    
    if (!userMenu) return;
    
    // Check Firebase Auth state
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            // Get user data from Firestore
            const doc = await firebase.firestore().collection('users').doc(user.uid).get();
            const userData = doc.exists ? doc.data() : null;
            
            if (userData) {
                localStorage.setItem('currentUser', JSON.stringify({ id: user.uid, ...userData }));
                
                const firstLetter = (userData.name || 'U').charAt(0).toUpperCase();
                userMenu.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div style="width: 30px; height: 30px; background: #ffd700; color: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 8px;">
                            ${firstLetter}
                        </div>
                        <span class="fw-bold text-white">${(userData.name || 'User').split(' ')[0]}</span>
                    </div>
                `;
                
                if (dropdownMenu) {
                    if (userData.role === 'admin') {
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
                            <li><a class="dropdown-item" href="user-team.html"><i class="fas fa-users me-2 text-primary"></i> My Team</a></li>
                            <li><a class="dropdown-item" href="user-commissions.html"><i class="fas fa-coins me-2 text-success"></i> Commissions</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="logoutUser()"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
                        `;
                    }
                }
            }
        } else {
            // User not logged in - show default
            localStorage.removeItem('currentUser');
            userMenu.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="img/default-avatar.png" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ccc; object-fit: cover;">
                </div>
            `;
            if (dropdownMenu) {
                dropdownMenu.innerHTML = `
                    <li><a class="dropdown-item fw-bold" href="register.html" style="color: #667eea;"><i class="fas fa-user-plus me-2"></i> Join Now / Login</a></li>
                `;
            }
        }
    });
}

// Logout function with Firebase signOut
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        firebase.auth().signOut().then(() => {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Logout error:', error);
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }
}

// Check page auth - improved version
function checkPageAuth() {
    const path = window.location.pathname;
    const isAdminPage = path.endsWith('admin.html') || 
                         path.endsWith('admin-users.html') || 
                         path.endsWith('admin-products.html') || 
                         path.endsWith('admin-orders.html') || 
                         path.endsWith('admin-withdrawals.html');
    
    const isUserPage = path.includes('user-') || 
                       path.endsWith('user-dashboard.html') || 
                       path.endsWith('user-profile.html') || 
                       path.endsWith('user-orders.html') || 
                       path.endsWith('user-withdrawal.html') || 
                       path.endsWith('user-team.html') || 
                       path.endsWith('user-genealogy.html') || 
                       path.endsWith('user-commissions.html');
    
    // Check Firebase Auth state
    firebase.auth().onAuthStateChanged(async (user) => {
        if (isAdminPage) {
            if (!user) {
                window.location.href = 'register.html';
                return;
            }
            const doc = await firebase.firestore().collection('users').doc(user.uid).get();
            const userData = doc.exists ? doc.data() : null;
            if (!userData || userData.role !== 'admin') {
                window.location.href = 'register.html';
                return;
            }
        }
        
        if (isUserPage && !user) {
            window.location.href = 'register.html';
            return;
        }
    });
    
    return true;
}

// Auto-run on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    checkPageAuth();
    updateNavbarForUser();
    
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
window.updateNavbarForUser = updateNavbarForUser;
window.getCurrentUser = getCurrentUser;