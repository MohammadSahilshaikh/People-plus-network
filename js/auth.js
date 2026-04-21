// ============ AUTHENTICATION - COMPLETE VERSION ============
// Import Firebase modules (assuming firebase-config.js already has these initialized)
import { 
    auth, 
    db, 
    googleProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    updateDoc
} from './firebase-config.js';

// ============ CART FUNCTIONS ============

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

// ============ USER REGISTRATION ============

// Register with Email/Password
async function registerWithEmail(email, password, userData) {
    try {
        // Check if email already exists in Firestore
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            return { success: false, error: "Email already exists" };
        }
        
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // Generate unique user ID
        const userId = "PPN" + Math.floor(Math.random() * 90000 + 10000);
        
        // Save user data to Firestore
        await setDoc(doc(db, "users", firebaseUser.uid), {
            uid: firebaseUser.uid,
            userId: userId,
            name: userData.name,
            email: email,
            phone: userData.phone,
            sponsor: userData.sponsor || "PPN0001",
            wallet: 0,
            status: "active",
            role: "user",
            joined: new Date().toISOString(),
            profileImage: "img/default-avatar.png",
            directReferrals: 0,
            totalReferrals: 0,
            level: "Starter"
        });
        
        // Save to localStorage
        const savedUser = {
            uid: firebaseUser.uid,
            userId: userId,
            name: userData.name,
            email: email,
            role: "user",
            wallet: 0
        };
        localStorage.setItem('currentUser', JSON.stringify(savedUser));
        
        return { 
            success: true, 
            user: savedUser 
        };
    } catch (error) {
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Email already registered";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "Password should be at least 6 characters";
        }
        return { success: false, error: errorMessage };
    }
}

// ============ LOGIN FUNCTIONS ============

// Login with Email/Password
async function loginWithEmail(email, password) {
    try {
        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const userInfo = {
                uid: firebaseUser.uid,
                userId: userData.userId,
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                role: userData.role,
                wallet: userData.wallet,
                status: userData.status,
                sponsor: userData.sponsor,
                profileImage: userData.profileImage,
                joined: userData.joined
            };
            localStorage.setItem('currentUser', JSON.stringify(userInfo));
            return { success: true, user: userInfo };
        } else {
            return { success: false, error: "User data not found" };
        }
    } catch (error) {
        if (error.code === 'auth/invalid-credential') {
            return { success: false, error: "Invalid email or password" };
        } else if (error.code === 'auth/user-not-found') {
            return { success: false, error: "No account found with this email" };
        } else if (error.code === 'auth/wrong-password') {
            return { success: false, error: "Incorrect password" };
        }
        return { success: false, error: error.message };
    }
}

// Login with Google
async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        
        if (!userDoc.exists()) {
            // Create new user if doesn't exist
            const userId = "PPN" + Math.floor(Math.random() * 90000 + 10000);
            await setDoc(doc(db, "users", firebaseUser.uid), {
                uid: firebaseUser.uid,
                userId: userId,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                phone: firebaseUser.phoneNumber || "",
                sponsor: "PPN0001",
                wallet: 0,
                status: "active",
                role: "user",
                joined: new Date().toISOString(),
                profileImage: firebaseUser.photoURL || "img/default-avatar.png",
                directReferrals: 0,
                totalReferrals: 0,
                level: "Starter"
            });
            
            const newUser = {
                uid: firebaseUser.uid,
                userId: userId,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                role: "user",
                wallet: 0
            };
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            return { success: true, user: newUser };
        } else {
            const userData = userDoc.data();
            const userInfo = {
                uid: firebaseUser.uid,
                userId: userData.userId,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                wallet: userData.wallet,
                status: userData.status
            };
            localStorage.setItem('currentUser', JSON.stringify(userInfo));
            return { success: true, user: userInfo };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============ LOGOUT FUNCTION ============

// Logout function with Firebase signOut
async function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await signOut(auth);
            localStorage.removeItem('currentUser');
            sessionStorage.clear();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    }
}

// ============ GET CURRENT USER ============

// Get current user from Firebase Auth
async function getCurrentUser() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Get user data from Firestore
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    resolve({ uid: user.uid, ...userDoc.data() });
                } else {
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    });
}

// Get current user sync (from localStorage)
function getCurrentUserSync() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// ============ UPDATE USER PROFILE ============

// Update user profile
async function updateUserProfile(updateData) {
    try {
        const currentUser = getCurrentUserSync();
        if (!currentUser) {
            return { success: false, error: "No user logged in" };
        }
        
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, updateData);
        
        // Update localStorage
        const updatedUser = { ...currentUser, ...updateData };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        return { success: true, user: updatedUser };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============ UPDATE NAVBAR ============

// Update navbar for logged in user
async function updateNavbarForUser() {
    const userMenu = document.getElementById('userMenu');
    const dropdownMenu = userMenu?.closest('.dropdown')?.querySelector('.dropdown-menu');
    
    if (!userMenu) return;
    
    // Check Firebase Auth state
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Get user data from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.exists ? userDoc.data() : null;
            
            if (userData) {
                localStorage.setItem('currentUser', JSON.stringify({ uid: user.uid, ...userData }));
                
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
                            <li><a class="dropdown-item text-danger" href="#" onclick="window.logoutUserWrapper()"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
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
                            <li><a class="dropdown-item text-danger" href="#" onclick="window.logoutUserWrapper()"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
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

// ============ CHECK PAGE AUTH ============

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
    onAuthStateChanged(auth, async (user) => {
        if (isAdminPage) {
            if (!user) {
                window.location.href = 'register.html';
                return;
            }
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.exists ? userDoc.data() : null;
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

// ============ WALLET FUNCTIONS ============

// Get user wallet balance
async function getWalletBalance() {
    const user = await getCurrentUser();
    if (user) {
        return user.wallet || 0;
    }
    return 0;
}

// Update wallet (add or subtract)
async function updateWallet(amount) {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "User not logged in" };
    }
    
    try {
        const userRef = doc(db, "users", user.uid);
        const newBalance = (user.wallet || 0) + amount;
        await updateDoc(userRef, { wallet: newBalance });
        
        // Update localStorage
        const currentUser = getCurrentUserSync();
        if (currentUser) {
            currentUser.wallet = newBalance;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        return { success: true, newBalance: newBalance };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============ LOGOUT WRAPPER FOR GLOBAL USE ============
window.logoutUserWrapper = async function() {
    if (confirm('Are you sure you want to logout?')) {
        await logoutUser();
    }
};

// ============ AUTO-RUN ON PAGE LOAD ============
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

// ============ EXPORT FUNCTIONS FOR GLOBAL USE ============
window.updateCartCount = updateCartCount;
window.addToCartLocal = addToCartLocal;
window.logoutUser = logoutUser;
window.checkPageAuth = checkPageAuth;
window.updateNavbarForUser = updateNavbarForUser;
window.getCurrentUser = getCurrentUser;
window.getCurrentUserSync = getCurrentUserSync;
window.registerWithEmail = registerWithEmail;
window.loginWithEmail = loginWithEmail;
window.loginWithGoogle = loginWithGoogle;
window.updateUserProfile = updateUserProfile;
window.getWalletBalance = getWalletBalance;
window.updateWallet = updateWallet;

console.log("✅ Auth.js loaded successfully!");