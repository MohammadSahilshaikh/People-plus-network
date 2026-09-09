// ============ PEOPLE PLUS NETWORK - FIREBASE CONFIG (v10 Modular) ============
// Single source of truth for all Firebase operations

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    increment,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ============ FIREBASE INIT ============
const firebaseConfig = {
    apiKey: "AIzaSyDbjm0SEvm08Sl6adjeF_v3pSscbPtmTdo",
    authDomain: "people-plus-network.firebaseapp.com",
    projectId: "people-plus-network",
    storageBucket: "people-plus-network.firebasestorage.app",
    messagingSenderId: "981097644678",
    appId: "1:981097644678:web:a19be14e90e580414f0707"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ============ HELPER: Generate User ID ============
function generateUserId() {
    return "PPN" + Math.floor(Math.random() * 90000 + 10000);
}

// ============ AUTH FUNCTIONS ============

// Register new user
export async function registerUser({ name, email, phone, password, sponsorId }) {
    try {
        // Create Firebase Auth user
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;
        const userId = generateUserId();

        // Validate sponsor
        let sponsorUid = null;
        let validSponsor = "PPN0001";
        if (sponsorId && sponsorId.trim() !== "") {
            const q = query(collection(db, "users"), where("userId", "==", sponsorId.trim().toUpperCase()));
            const snap = await getDocs(q);
            if (!snap.empty) {
                sponsorUid = snap.docs[0].id;
                validSponsor = sponsorId.trim().toUpperCase();
            } else {
                return { success: false, error: "Sponsor ID not found. Please check and try again." };
            }
        }

        // Save user to Firestore
        const userData = {
            uid,
            userId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            sponsor: validSponsor,
            sponsorUid: sponsorUid || null,
            wallet: 0,
            status: "pending", // Waiting for UTR verification
            role: "user",
            isVerified: true,
            joined: new Date().toISOString(),
            profileImage: "img/default-avatar.png",
            directReferrals: 0,
            totalReferrals: 0,
            level: "Starter",
            address: {}
        };
        await setDoc(doc(db, "users", uid), userData);

        // Update sponsor's referral count
        if (sponsorUid) {
            await updateDoc(doc(db, "users", sponsorUid), {
                directReferrals: increment(1),
                totalReferrals: increment(1)
            });
        }

        // Save to localStorage
        localStorage.setItem("currentUser", JSON.stringify(userData));
        return { success: true, user: userData };
    } catch (error) {
        let msg = error.message;
        if (error.code === "auth/email-already-in-use") msg = "Email already registered. Please login.";
        if (error.code === "auth/weak-password") msg = "Password must be at least 6 characters.";
        return { success: false, error: msg };
    }
}

// Login user
export async function loginUser(email, password) {
    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;
        const userDoc = await getDoc(doc(db, "users", uid));
        if (!userDoc.exists()) return { success: false, error: "User data not found. Please contact admin." };
        const userData = { uid, ...userDoc.data() };

        if (userData.status === "blocked") return { success: false, error: "Your account has been blocked. Contact admin." };

        localStorage.setItem("currentUser", JSON.stringify(userData));
        return { success: true, user: userData };
    } catch (error) {
        let msg = "Invalid email or password.";
        if (error.code === "auth/user-not-found") msg = "No account found with this email.";
        if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") msg = "Incorrect password.";
        return { success: false, error: msg };
    }
}

// Logout user
export async function logoutUser() {
    await signOut(auth);
    localStorage.removeItem("currentUser");
}

// Get current user from Firestore (live)
export async function getCurrentUserData() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (!user) { resolve(null); return; }
            const docSnap = await getDoc(doc(db, "users", user.uid));
            if (docSnap.exists()) {
                const data = { uid: user.uid, ...docSnap.data() };
                localStorage.setItem("currentUser", JSON.stringify(data));
                resolve(data);
            } else {
                resolve(null);
            }
        });
    });
}

// Get current user from localStorage (fast, sync)
export function getCurrentUserLocal() {
    try { return JSON.parse(localStorage.getItem("currentUser")) || null; }
    catch { return null; }
}

// Change password
export async function changeUserPassword(currentPassword, newPassword) {
    try {
        const user = auth.currentUser;
        if (!user) return { success: false, error: "Not logged in" };
        const cred = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, cred);
        await updatePassword(user, newPassword);
        return { success: true };
    } catch (error) {
        let msg = error.message;
        if (error.code === "auth/wrong-password") msg = "Current password is incorrect.";
        return { success: false, error: msg };
    }
}

// ============ USER FUNCTIONS ============

export async function getUserById(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(uid, data) {
    try {
        const allowed = {};
        if (data.name) allowed.name = data.name;
        if (data.phone) allowed.phone = data.phone;
        if (data.profileImage) allowed.profileImage = data.profileImage;
        if (data.address) allowed.address = data.address;
        await updateDoc(doc(db, "users", uid), allowed);
        // Update localStorage
        const current = getCurrentUserLocal();
        if (current) {
            localStorage.setItem("currentUser", JSON.stringify({ ...current, ...allowed }));
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getAllUsers() {
    const snap = await getDocs(query(collection(db, "users"), orderBy("joined", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateUserStatus(uid, status) {
    await updateDoc(doc(db, "users", uid), { status });
    return { success: true };
}

export async function deleteUser(uid) {
    await deleteDoc(doc(db, "users", uid));
    return { success: true };
}

export async function addToUserWallet(uid, amount) {
    await updateDoc(doc(db, "users", uid), { wallet: increment(amount) });
    return { success: true };
}

// ============ PRODUCT FUNCTIONS ============

export async function getActiveProducts() {
    const snap = await getDocs(query(collection(db, "products"), where("status", "==", "active")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllProducts() {
    const snap = await getDocs(collection(db, "products"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addProduct(data) {
    const ref = await addDoc(collection(db, "products"), {
        ...data,
        status: data.status || "active",
        createdAt: new Date().toISOString()
    });
    return { success: true, id: ref.id };
}

export async function updateProduct(id, data) {
    await updateDoc(doc(db, "products", id), data);
    return { success: true };
}

export async function deleteProduct(id) {
    await deleteDoc(doc(db, "products", id));
    return { success: true };
}

// ============ ORDER FUNCTIONS ============

    export async function placeOrder(orderData) {
        try {
            const user = getCurrentUserLocal();
            if (!user) return { success: false, error: "Please login first" };
    
            const orderId = "ORD" + Date.now();
            const subtotal = orderData.items.reduce((s, i) => s + (i.price * i.quantity), 0);
            const delivery = 0; 
            const gst = 0; 
            const total = subtotal + delivery + gst;
    
            const order = {
                orderId,
                userId: user.uid,
                userName: user.name,
                userEmail: user.email,
                items: orderData.items,
                subtotal,
                delivery,
                gst,
                total,
                utr: orderData.utr || "N/A",
                status: "Pending UTR Verification",
                date: new Date().toISOString(),
                tracking: { ordered: true, confirmed: false, shipped: false, delivered: false },
                trackingNumber: ""
            };
            const ref = await addDoc(collection(db, "orders"), order);
            
            // Note: Commission is NOT calculated here anymore. 
            // It will be calculated when Admin approves the UTR in updateOrderStatus.
    
            return { success: true, id: ref.id, orderId };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async function calculateCommissions(userId, amount, userName) {
        try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (!userDoc.exists()) return;
            const user = userDoc.data();
            if (!user.sponsorUid) return;
    
            const sponsorDoc = await getDoc(doc(db, "users", user.sponsorUid));
            if (sponsorDoc.exists()) {
                const sponsor = sponsorDoc.data();
                
                // Tiered commission based on Sponsor's Level
                let commissionRate = 0.50; // Starter (499)
                if (sponsor.level === "Pro") commissionRate = 0.60; // Pro (999)
                if (sponsor.level === "Elite") commissionRate = 0.70; // Elite (1999)
                
                const l1 = Math.round(amount * commissionRate);
                
                await updateDoc(doc(db, "users", user.sponsorUid), { wallet: increment(l1) });
                await addDoc(collection(db, "commissions"), {
                    userId: user.sponsorUid,
                    fromUserId: userId,
                    fromUserName: userName,
                    amount: l1, 
                    level: 1, 
                    type: "purchase",
                    description: `${commissionRate * 100}% commission on ${userName}'s purchase of ₹${amount}`,
                    date: new Date().toISOString(), 
                    status: "Approved"
                });
            }
        } catch (err) {
            console.error("Commission error:", err);
        }
    }
    
    export async function getMyOrders(uid) {
        try {
            const snap = await getDocs(query(collection(db, "orders"), where("userId", "==", uid), orderBy("date", "desc")));
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch { return []; }
    }
    
    export async function getAllOrders() {
        try {
            const snap = await getDocs(query(collection(db, "orders"), orderBy("date", "desc")));
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch { return []; }
    }
    
    export async function updateOrderStatus(id, status, trackingNumber = "") {
        const orderRef = doc(db, "orders", id);
        const orderSnap = await getDoc(orderRef);
        if(!orderSnap.exists()) return { success: false, error: "Order not found" };
        
        const order = orderSnap.data();
        const wasPending = order.status === "Pending UTR Verification";
        
        const update = {
            status,
            trackingNumber,
            updatedAt: new Date().toISOString(),
            "tracking.confirmed": ["Approved", "Confirmed", "Shipped", "Delivered"].includes(status)
        };
        await updateDoc(orderRef, update);
        
        // Admin Approval Logic for UTR / Activation / Commission
        if (status === "Approved" && wasPending) {
            const userRef = doc(db, "users", order.userId);
            const userSnap = await getDoc(userRef);
            
            if(userSnap.exists()) {
                const userData = userSnap.data();
                const updates = {};
                
                // Activate pending users
                if(userData.status === "pending") {
                    updates.status = "active";
                }
                
                // Upgrade levels based on order total
                const highestItemPrice = order.items.reduce((max, item) => Math.max(max, item.price), 0);
                if (highestItemPrice >= 1999) updates.level = "Elite";
                else if (highestItemPrice >= 999 && userData.level !== "Elite") updates.level = "Pro";
                else if (highestItemPrice >= 499 && userData.level === "Starter") updates.level = "Starter";
                
                if (Object.keys(updates).length > 0) {
                    await updateDoc(userRef, updates);
                }
                
                // Release commission to sponsor NOW
                await calculateCommissions(order.userId, order.total, order.userName);
            }
        }
        
        return { success: true };
    }

export async function cancelOrder(orderId) {
    try {
        const orderDoc = await getDoc(doc(db, "orders", orderId));
        if (!orderDoc.exists()) return { success: false, error: "Order not found" };
        const order = orderDoc.data();
        if (!["Pending", "Confirmed"].includes(order.status)) return { success: false, error: "Cannot cancel this order" };
        await updateDoc(doc(db, "orders", orderId), { status: "Cancelled" });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============ WITHDRAWAL FUNCTIONS ============

export async function requestWithdrawal(uid, amount, bankDetails) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        const user = userDoc.data();
        if (!user) return { success: false, error: "User not found" };
        if (user.wallet < amount) return { success: false, error: "Insufficient wallet balance" };
        if (amount < 200) return { success: false, error: "Minimum withdrawal amount is ₹200" };

        const ref = await addDoc(collection(db, "withdrawals"), {
            userId: uid,
            userName: user.name,
            userEmail: user.email,
            amount,
            bankDetails,
            status: "Pending",
            date: new Date().toISOString()
        });
        await updateDoc(doc(db, "users", uid), { wallet: increment(-amount) });
        // Update localStorage wallet
        const current = getCurrentUserLocal();
        if (current) {
            current.wallet = (current.wallet || 0) - amount;
            localStorage.setItem("currentUser", JSON.stringify(current));
        }
        return { success: true, id: ref.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getMyWithdrawals(uid) {
    try {
        const snap = await getDocs(query(collection(db, "withdrawals"), where("userId", "==", uid), orderBy("date", "desc")));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
}

export async function getAllWithdrawals() {
    try {
        const snap = await getDocs(query(collection(db, "withdrawals"), orderBy("date", "desc")));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
}

export async function approveWithdrawal(id) {
    await updateDoc(doc(db, "withdrawals", id), { status: "Approved", processedAt: new Date().toISOString() });
    return { success: true };
}

export async function rejectWithdrawal(id) {
    const wDoc = await getDoc(doc(db, "withdrawals", id));
    const w = wDoc.data();
    await updateDoc(doc(db, "withdrawals", id), { status: "Rejected", processedAt: new Date().toISOString() });
    // Refund to wallet
    await updateDoc(doc(db, "users", w.userId), { wallet: increment(w.amount) });
    return { success: true };
}

// ============ COMMISSION FUNCTIONS ============

export async function getMyCommissions(uid) {
    try {
        const snap = await getDocs(query(collection(db, "commissions"), where("userId", "==", uid), orderBy("date", "desc")));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
}

export async function getAllCommissions() {
    try {
        const snap = await getDocs(query(collection(db, "commissions"), orderBy("date", "desc")));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
}

// ============ TEAM FUNCTIONS ============

export async function getMyTeam(userId) {
    try {
        // Direct (Level 1)
        const l1Snap = await getDocs(query(collection(db, "users"), where("sponsor", "==", userId)));
        const level1 = l1Snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Level 2
        let level2 = [];
        for (const member of level1) {
            const l2Snap = await getDocs(query(collection(db, "users"), where("sponsor", "==", member.userId)));
            level2.push(...l2Snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        return { level1, level2, total: level1.length + level2.length };
    } catch { return { level1: [], level2: [], total: 0 }; }
}

// ============ ADMIN DASHBOARD STATS ============

export async function getDashboardStats() {
    try {
        const [usersSnap, productsSnap, ordersSnap, withdrawalsSnap, commissionsSnap] = await Promise.all([
            getDocs(collection(db, "users")),
            getDocs(collection(db, "products")),
            getDocs(collection(db, "orders")),
            getDocs(collection(db, "withdrawals")),
            getDocs(collection(db, "commissions"))
        ]);

        const users = usersSnap.docs.map(d => d.data());
        const orders = ordersSnap.docs.map(d => d.data());
        const withdrawals = withdrawalsSnap.docs.map(d => d.data());

        return {
            totalUsers: users.filter(u => u.role !== "admin").length,
            activeUsers: users.filter(u => u.status === "active" && u.role !== "admin").length,
            totalProducts: productsSnap.size,
            totalOrders: ordersSnap.size,
            pendingOrders: orders.filter(o => o.status === "Pending").length,
            totalSales: orders.reduce((s, o) => s + (o.total || 0), 0),
            pendingWithdrawals: withdrawals.filter(w => w.status === "Pending").length,
            totalCommissions: commissionsSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0),
            totalWallet: users.reduce((s, u) => s + (u.wallet || 0), 0)
        };
    } catch (e) {
        console.error(e);
        return {};
    }
}

// ============ ADMIN SETUP (Auto-run once) ============

async function setupDefaultAdmin() {
    try {
        const q = query(collection(db, "users"), where("email", "==", "admin@peopleplus.com"));
        const snap = await getDocs(q);
        if (snap.empty) {
            const credential = await createUserWithEmailAndPassword(auth, "admin@peopleplus.com", "admin123");
            await setDoc(doc(db, "users", credential.user.uid), {
                uid: credential.user.uid,
                userId: "ADMIN001",
                name: "Super Admin",
                email: "admin@peopleplus.com",
                phone: "9999999999",
                role: "admin",
                status: "active",
                wallet: 0,
                isVerified: true,
                joined: new Date().toISOString(),
                profileImage: "img/default-avatar.png"
            });
            console.log("✅ Admin created: admin@peopleplus.com / admin123");
        }
    } catch (e) {
        if (e.code !== "auth/email-already-in-use") console.log("Admin setup:", e.message);
    }
}

async function setupDefaultProducts() {
    try {
        const snap = await getDocs(collection(db, "products"));
        if (snap.empty) {
            const products = [
                { name: "Ayurvedic Protein Powder", price: 999, mrp: 1499, stock: 250, image: "https://placehold.co/300x250/667eea/white?text=Protein+Powder", desc: "Pure Ayurvedic protein powder for strength and vitality", status: "active" },
                { name: "Herbal Immunity Tea", price: 599, mrp: 999, stock: 500, image: "https://placehold.co/300x250/764ba2/white?text=Immunity+Tea", desc: "Boost your immunity with natural herbs", status: "active" },
                { name: "Organic Skin Cream", price: 799, mrp: 1299, stock: 300, image: "https://placehold.co/300x250/11998e/white?text=Skin+Cream", desc: "Natural herbal skin care for glowing skin", status: "active" },
                { name: "Nutrition Supplement", price: 1499, mrp: 2499, stock: 200, image: "https://placehold.co/300x250/f5576c/white?text=Nutrition", desc: "Complete daily nutrition supplement", status: "active" }
            ];
            for (const p of products) {
                await addDoc(collection(db, "products"), { ...p, createdAt: new Date().toISOString() });
            }
            console.log("✅ Default products created");
        }
    } catch (e) { console.log("Product setup:", e.message); }
}

// Auto-initialize
setupDefaultAdmin();
setupDefaultProducts();

// ============ NAVBAR UTILITY ============

export function updateNavbar(user) {
    const userMenu = document.getElementById("userMenu");
    const userDropdown = document.getElementById("userDropdown");
    if (!userMenu) return;

    if (user) {
        const letter = (user.name || "U").charAt(0).toUpperCase();
        const firstName = (user.name || "User").split(" ")[0];
        userMenu.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <div style="width:32px;height:32px;background:#ffd700;color:#333;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;">${letter}</div>
                <span class="fw-bold text-white d-none d-md-inline">${firstName}</span>
                <i class="fas fa-chevron-down text-white" style="font-size:10px;"></i>
            </div>`;

        if (userDropdown) {
            if (user.role === "admin") {
                userDropdown.innerHTML = `
                    <li><a class="dropdown-item" href="admin.html"><i class="fas fa-tachometer-alt me-2 text-primary"></i>Admin Dashboard</a></li>
                    <li><a class="dropdown-item" href="admin-users.html"><i class="fas fa-users me-2 text-success"></i>Manage Users</a></li>
                    <li><a class="dropdown-item" href="admin-products.html"><i class="fas fa-box me-2 text-warning"></i>Manage Products</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="window._ppnLogout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>`;
            } else {
                userDropdown.innerHTML = `
                    <li><a class="dropdown-item" href="user-dashboard.html"><i class="fas fa-tachometer-alt me-2 text-primary"></i>Dashboard</a></li>
                    <li><a class="dropdown-item" href="user-profile.html"><i class="fas fa-user-edit me-2 text-success"></i>My Profile</a></li>
                    <li><a class="dropdown-item" href="user-orders.html"><i class="fas fa-shopping-bag me-2 text-warning"></i>My Orders</a></li>
                    <li><a class="dropdown-item" href="user-withdrawal.html"><i class="fas fa-money-bill-wave me-2 text-info"></i>Withdraw</a></li>
                    <li><a class="dropdown-item" href="user-team.html"><i class="fas fa-users me-2 text-primary"></i>My Team</a></li>
                    <li><a class="dropdown-item" href="user-commissions.html"><i class="fas fa-coins me-2 text-success"></i>Commissions</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="window._ppnLogout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>`;
            }
        }
    } else {
        userMenu.innerHTML = `<img src="img/default-avatar.png" style="width:32px;height:32px;border-radius:50%;border:2px solid rgba(255,255,255,0.5);" alt="User">`;
        if (userDropdown) {
            userDropdown.innerHTML = `<li><a class="dropdown-item fw-bold" href="register.html" style="color:#667eea;"><i class="fas fa-user-plus me-2"></i>Join Now / Login</a></li>`;
        }
    }
}

export function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
    document.querySelectorAll("#cartCount").forEach(el => el.innerText = count);
}

// Global logout function (called from onclick in navbars)
window._ppnLogout = async function () {
    if (confirm("Are you sure you want to logout?")) {
        await logoutUser();
        window.location.href = "index.html";
    }
};

console.log("✅ People Plus Network - Firebase Config loaded!");