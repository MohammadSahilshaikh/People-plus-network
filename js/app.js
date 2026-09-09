import { 
    registerUser, loginUser, logoutUser, getCurrentUserData, getCurrentUserLocal, 
    updateUserProfile, changeUserPassword, getAllUsers, updateUserStatus, deleteUser, addToUserWallet, 
    getActiveProducts, getAllProducts, addProduct, updateProduct, deleteProduct, 
    placeOrder, getMyOrders, getAllOrders, updateOrderStatus, cancelOrder, 
    requestWithdrawal, getMyWithdrawals, getAllWithdrawals, approveWithdrawal, rejectWithdrawal, 
    getMyCommissions, getMyTeam, getDashboardStats 
} from './firebase-config.js';

// Global State
let currentUser = null;
let currentCheckoutItem = JSON.parse(sessionStorage.getItem('checkoutItem')) || null;
const appDiv = document.getElementById('app');

// --- UTILS ---
window.navigate = (path) => { window.location.hash = path; };
window.showToast = (msg, type = 'success') => {
    const box = document.getElementById('toastBox');
    const t = document.createElement('div');
    t.style.cssText = `background:${type === 'success' ? '#28a745' : '#e74c3c'};color:white;padding:10px 20px;border-radius:25px;font-size:0.85rem;font-weight:600;box-shadow:0 4px 15px rgba(0,0,0,0.2);pointer-events:auto;animation:slideUp 0.3s ease-out;`;
    t.innerHTML = type === 'success' ? `<i class="fas fa-check-circle me-1"></i> ${msg}` : `<i class="fas fa-exclamation-circle me-1"></i> ${msg}`;
    box.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(20px)'; t.style.transition = '0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
};

// Dropdown logic
window.toggleUserMenu = (e) => {
    e.stopPropagation();
    document.getElementById('userDropdown')?.classList.toggle('show-dropdown');
};

document.addEventListener('click', (e) => {
    if(!e.target.closest('.user-wrap')) {
        document.getElementById('userDropdown')?.classList.remove('show-dropdown');
    }
});

function updateNavUI(hash) {
    // Bottom Nav Active State
    document.querySelectorAll('.bn-item').forEach(el => el.classList.remove('active'));
    
    // User nav
    if(hash === '/') document.getElementById('bn-home')?.classList.add('active');
    else if(hash.startsWith('/about')) document.getElementById('bn-about')?.classList.add('active');
    else if(hash.startsWith('/products')) document.getElementById('bn-shop')?.classList.add('active');
    else if(['/dashboard', '/profile', '/orders', '/team', '/commissions', '/withdraw'].some(p => hash.startsWith(p))) document.getElementById('bn-me')?.classList.add('active');

    // Admin nav
    if(hash === '/admin') document.getElementById('bn-a-dash')?.classList.add('active');
    else if(hash.startsWith('/admin/users')) document.getElementById('bn-a-users')?.classList.add('active');
    else if(hash.startsWith('/admin/products')) document.getElementById('bn-a-prods')?.classList.add('active');
    else if(hash.startsWith('/admin/orders')) document.getElementById('bn-a-orders')?.classList.add('active');
}

async function syncUser() {
    currentUser = await getCurrentUserData();
    const userDropdown = document.getElementById('userDropdown');
    const userAvatar = document.getElementById('userAvatar');

    if (currentUser) {
        const initial = (currentUser.name || 'U').charAt(0).toUpperCase();
        userAvatar.innerHTML = currentUser.profileImage && currentUser.profileImage !== 'img/default-avatar.png' ? `<img src="${currentUser.profileImage}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : initial;
        
        if (currentUser.role === 'admin') {
            document.getElementById('bottomNav').style.display = 'none';
            document.getElementById('adminBottomNav').style.display = 'flex';
            userDropdown.innerHTML = `
                <div class="dp-header"><strong>${currentUser.name}</strong><small>Admin</small></div>
                <div class="dp-link text-danger" onclick="doLogout()"><i class="fas fa-sign-out-alt"></i> Logout</div>
            `;
        } else {
            document.getElementById('bottomNav').style.display = 'flex';
            document.getElementById('adminBottomNav').style.display = 'none';
            userDropdown.innerHTML = `
                <div class="dp-header"><strong>${currentUser.name}</strong><small>${currentUser.userId}</small></div>
                <div class="dp-link text-danger" onclick="doLogout()"><i class="fas fa-sign-out-alt"></i> Logout</div>
            `;
        }
    } else {
        document.getElementById('bottomNav').style.display = 'flex';
        document.getElementById('adminBottomNav').style.display = 'none';
        userAvatar.innerHTML = '<i class="fas fa-user"></i>';
        userDropdown.innerHTML = `<a onclick="navigate('/login')"><i class="fas fa-sign-in-alt"></i> Login</a>`;
    }
}

window.doLogout = async () => {
    await logoutUser();
    currentUser = null;
    navigate('/login');
    showToast('Logged out successfully');
};

// --- ROUTER ---
async function router() {
    let hash = window.location.hash.replace('#', '') || '/';
    updateNavUI(hash);
    
    appDiv.innerHTML = '<div class="loading-view"><i class="fas fa-spinner fa-spin fa-3x mb-3 d-block"></i><p>Loading...</p></div>';
    
    await syncUser();
    const isAuth = !!currentUser;
    const isAdmin = currentUser?.role === 'admin';
    const isPending = isAuth && currentUser.status === 'pending';

    // Route Guards
    if (hash.startsWith('/admin') && !isAdmin) return navigate('/dashboard');
    if (['/dashboard', '/profile', '/orders', '/team', '/commissions', '/withdraw'].includes(hash) && !isAuth) return navigate('/login');
    if (hash === '/login' && isAuth) return navigate(isAdmin ? '/admin' : '/dashboard');
    
    // Pending Payment Block
    if (isPending && !hash.startsWith('/admin') && hash !== '/pending' && hash !== '/orders') {
        return navigate('/pending');
    }

    try {
        switch(hash) {
            case '/': renderHome(); break;
            case '/login': renderLogin(); break;
            case '/about': renderAbout(); break;
            case '/products': renderProducts(); break;
            case '/checkout': renderCheckout(); break;
            case '/pending': renderPending(); break;
            case '/dashboard': renderUserDashboard(); break;
            case '/profile': renderUserProfile(); break;
            case '/orders': renderUserOrders(); break;
            case '/team': renderUserTeam(); break;
            case '/commissions': renderUserCommissions(); break;
            case '/withdraw': renderUserWithdrawal(); break;
            case '/admin': renderAdminDashboard(); break;
            case '/admin/users': renderAdminUsers(); break;
            case '/admin/products': renderAdminProducts(); break;
            case '/admin/orders': renderAdminOrders(); break;
            case '/admin/withdrawals': renderAdminWithdrawals(); break;
            default: renderHome();
        }
    } catch(e) {
        console.error("Routing error:", e);
        appDiv.innerHTML = `<div class="container py-5 text-center"><h3 class="text-danger">Error loading page</h3><p>${e.message}</p><button class="btn-pp" onclick="navigate('/')">Go Home</button></div>`;
    }
    window.scrollTo(0, 0);
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// --- VIEWS ---

function renderPending() {
    appDiv.innerHTML = `
        <div class="view-enter container py-5 text-center">
            <i class="fas fa-clock fa-4x text-warning mb-3"></i>
            <h3 class="fw-bold">Payment Under Verification</h3>
            <p class="text-muted">Your payment UTR is currently being verified by our admin team. Once approved, your account will be activated and you can access your dashboard.</p>
            <button class="btn-outline-pp mt-3" onclick="navigate('/orders')">View My Orders</button>
        </div>
    `;
}

// 1. Home
async function renderHome() {
    appDiv.innerHTML = `
        <div class="view-enter">
            <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:60px 20px;color:white;text-align:center;">
                <h1 style="font-weight:800;font-size:2.5rem;margin-bottom:15px;">Welcome to People Plus</h1>
                <p style="font-size:1.1rem;opacity:0.9;max-width:600px;margin:0 auto 25px;">Join India's fastest growing network marketing platform. Upgrade your tier and earn up to 70% direct commissions.</p>
                <div class="d-flex justify-content-center gap-3">
                    <button class="btn-pp" style="background:white;color:#667eea;" onclick="navigate('/products')">Explore Products</button>
                </div>
            </div>
            
            <div class="container py-5">
                <div class="row g-4 text-center">
                    <div class="col-md-4">
                        <div class="card-box h-100">
                            <i class="fas fa-shopping-bag fa-3x text-primary mb-3"></i>
                            <h6>Tier Upgrades</h6>
                            <p class="text-muted small">Start with ₹499 and upgrade to ₹999 or ₹1999 anytime.</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card-box h-100">
                            <i class="fas fa-users fa-3x text-success mb-3"></i>
                            <h6>Build Network</h6>
                            <p class="text-muted small">Buy a product, submit UTR, get verified, and share your referral link.</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card-box h-100">
                            <i class="fas fa-money-bill-wave fa-3x text-warning mb-3"></i>
                            <h6>Massive Commissions</h6>
                            <p class="text-muted small">Earn 50%, 60%, or 70% direct commission depending on your upgrade tier!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 1.5 About
function renderAbout() {
    appDiv.innerHTML = `
        <div class="view-enter">
            <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:60px 20px;color:white;text-align:center;">
                <h2 class="fw-bold mb-3">About People Plus Network</h2>
                <p class="opacity-75">Empowering people through tiered products and network marketing.</p>
            </div>
            <div class="container py-5">
                <div class="card-box mb-4">
                    <h5 class="fw-bold text-primary mb-3">Our Mission</h5>
                    <p class="text-muted">To provide high-quality tiered digital products while offering a lucrative business opportunity.</p>
                </div>
                <div class="card-box">
                    <h5 class="fw-bold text-success mb-3">How It Works</h5>
                    <ul class="text-muted list-unstyled mb-0" style="line-height:1.8;">
                        <li><i class="fas fa-check-circle text-success me-2"></i> Register by buying the Starter ₹499 package & providing payment UTR</li>
                        <li><i class="fas fa-check-circle text-success me-2"></i> Admin verifies your payment and activates your account</li>
                        <li><i class="fas fa-check-circle text-success me-2"></i> Share your link and earn 50% commission</li>
                        <li><i class="fas fa-check-circle text-success me-2"></i> Upgrade to ₹999 or ₹1999 to earn 60% and 70% direct commissions!</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// 2. Login
function renderLogin() {
    appDiv.innerHTML = `
        <div class="view-enter container py-4" style="max-width:500px;">
            <div class="card-box p-4">
                <div class="text-center mb-4">
                    <img src="img/site-logo.jpg" style="height:60px;border-radius:10px;margin-bottom:10px;">
                    <h4 class="fw-bold">Welcome Back</h4>
                </div>

                <form id="formLogin" onsubmit="doAuth(event)">
                    <div class="fgroup">
                        <label class="flabel">Email</label>
                        <input type="email" class="form-f" id="lEmail" required>
                    </div>
                    <div class="fgroup">
                        <label class="flabel">Password</label>
                        <input type="password" class="form-f" id="lPass" required>
                    </div>
                    <button type="submit" class="btn-pp w100 mt-2" id="lBtn">Login</button>
                </form>

                <div class="text-center mt-4 pt-4 border-top">
                    <p class="small text-muted mb-2">Want to join our network?</p>
                    <button class="btn-outline-pp w100" onclick="navigate('/products')">Buy Product to Register</button>
                </div>
            </div>
        </div>
    `;

    window.doAuth = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('lBtn');
        const origText = btn.innerText;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btn.disabled = true;

        try {
            const res = await loginUser(document.getElementById('lEmail').value, document.getElementById('lPass').value);
            if(res.success) {
                showToast('Login successful!');
                setTimeout(() => navigate(res.user.role === 'admin' ? '/admin' : (res.user.status === 'pending' ? '/pending' : '/dashboard')), 500);
            } else throw new Error(res.error);
        } catch(err) {
            showToast(err.message, 'error');
            btn.innerHTML = origText;
            btn.disabled = false;
        }
    };
}

// 3. Products
async function renderProducts() {
    appDiv.innerHTML = '<div class="loading-view"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    const products = await getActiveProducts();
    
    appDiv.innerHTML = `
        <div class="view-enter container py-4 pb-5">
            <h4 class="fw-bold mb-4"><i class="fas fa-store text-primary me-2"></i>Our Packages</h4>
            <div class="row g-3">
                ${products.length ? products.map(p => {
                    return `
                    <div class="col-6 col-md-4 col-lg-3">
                        <div class="product-card">
                            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://placehold.co/400x400/eee/999?text=Image'">
                            <div class="pc-body">
                                <div class="pc-name">${p.name}</div>
                                <div class="mb-2">
                                    <span class="pc-price">₹${p.price}</span>
                                </div>
                                <button class="btn-cart" onclick="buyNow('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')">
                                    <i class="fas fa-bolt me-1"></i> Buy & Upgrade
                                </button>
                            </div>
                        </div>
                    </div>`;
                }).join('') : '<div class="col-12 text-center py-5 text-muted">No products available.</div>'}
            </div>
        </div>
    `;

    window.buyNow = (id, name, price, image) => {
        const item = { id, name, price, image, quantity: 1 };
        sessionStorage.setItem('checkoutItem', JSON.stringify(item));
        currentCheckoutItem = item;
        navigate('/checkout');
    };
}

// 4. Checkout
function renderCheckout() {
    if(!currentCheckoutItem) return navigate('/products');
    
    const item = currentCheckoutItem;
    const total = item.price * item.quantity;

    const u = currentUser || {};
    const isGuest = !currentUser;
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const ref = urlParams.get('ref') || '';

    appDiv.innerHTML = `
        <div class="view-enter container py-4">
            <div class="d-flex align-items-center gap-2 mb-4">
                <button class="btn btn-sm btn-light" onclick="navigate('/products')"><i class="fas fa-arrow-left"></i></button>
                <h4 class="fw-bold mb-0">Checkout</h4>
            </div>
            
            <div class="row g-4">
                <div class="col-lg-7">
                    <div class="card-box">
                        ${isGuest ? `
                        <div class="alert alert-info small" style="background:#e3f2fd;color:#0d47a1;padding:12px;border-radius:10px;margin-bottom:20px;">
                            <i class="fas fa-info-circle me-1"></i> <strong>New User?</strong> Fill your details below to create your account and join the network.
                        </div>
                        <h6 class="mb-3"><i class="fas fa-user-plus text-primary me-2"></i>Account Details</h6>
                        <div class="row g-3 mb-4 pb-4 border-bottom">
                            <div class="col-md-6"><label class="flabel">Sponsor ID (Optional)</label><input type="text" class="form-f" id="rSponsor" value="${ref}" placeholder="e.g. PPN12345" oninput="this.value=this.value.toUpperCase()"></div>
                            <div class="col-md-6"><label class="flabel">Create Password *</label><input type="password" class="form-f" id="rPass" minlength="6" placeholder="Min 6 characters" required></div>
                            <div class="col-12"><label class="flabel">Email *</label><input type="email" class="form-f" id="rEmail" required></div>
                        </div>
                        ` : ''}

                        <h6 class="mb-3"><i class="fas fa-id-badge text-danger me-2"></i>Personal Details</h6>
                        <form id="checkoutForm" onsubmit="doPlaceOrder(event)">
                            <div class="row g-3">
                                <div class="col-md-6"><label class="flabel">Full Name *</label><input type="text" class="form-f" id="cName" value="${u.name||''}" required></div>
                                <div class="col-md-6"><label class="flabel">Phone *</label><input type="tel" class="form-f" id="cPhone" value="${u.phone||''}" pattern="[0-9]{10}" placeholder="10 digits" required></div>
                            </div>
                            
                            <h6 class="mt-4 mb-3"><i class="fas fa-wallet text-success me-2"></i>Payment Verification</h6>
                            <div class="p-3 border rounded-3 mb-3 bg-light border-primary text-center">
                                <p class="small text-muted mb-2">Please scan the QR code or use the UPI ID to make the payment of <strong>₹${total}</strong>. After payment, enter your 12-digit UTR number below.</p>
                                <div class="bg-white p-3 d-inline-block rounded shadow-sm mb-3">
                                    <!-- Replace src with actual merchant QR -->
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=admin@upi&pn=PeoplePlus&am=${total}" alt="UPI QR" style="width:150px;height:150px;">
                                </div>
                                <div class="fw-bold text-primary mb-2">UPI ID: admin@upi</div>
                            </div>

                            <div class="fgroup">
                                <label class="flabel text-danger">Enter 12-Digit UTR / Reference No. *</label>
                                <input type="text" class="form-f border-danger" id="cUtr" placeholder="e.g. 325412345678" required pattern="[a-zA-Z0-9]{8,15}">
                            </div>
                            
                            <button type="submit" class="btn-pp w100 mt-2" id="btnPlaceOrder">Confirm Payment & Submit UTR</button>
                        </form>
                    </div>
                </div>
                <div class="col-lg-5">
                    <div class="card-box bg-light">
                        <h6 class="mb-3">Order Details</h6>
                        <div class="d-flex align-items-center gap-3 pb-3 mb-3 border-bottom">
                            <img src="${item.image}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
                            <div>
                                <div class="fw-bold small">${item.name}</div>
                                <div class="text-primary fw-bold">₹${item.price} <span class="text-muted fw-normal">x ${item.quantity}</span></div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between small mb-1"><span>Subtotal</span><span>₹${total}</span></div>
                        <div class="d-flex justify-content-between fw-bold fs-5 text-primary border-top pt-2 mt-2"><span>Total</span><span>₹${total}</span></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    window.doPlaceOrder = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnPlaceOrder');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btn.disabled = true;

        try {
            let uid = currentUser?.uid;

            if (isGuest) {
                // Register user first (will be set to status: "pending")
                const regData = {
                    name: document.getElementById('cName').value,
                    email: document.getElementById('rEmail').value,
                    phone: document.getElementById('cPhone').value,
                    sponsor: document.getElementById('rSponsor').value,
                    password: document.getElementById('rPass').value
                };
                
                const regRes = await registerUser(regData.email, regData.password, regData);
                if (!regRes.success) throw new Error(regRes.error);
                
                uid = regRes.user.uid;
            }

            // Just update basic profile info
            await updateUserProfile(uid, {
                name: document.getElementById('cName').value,
                phone: document.getElementById('cPhone').value
            });

            // Submit order with UTR
            const utrNumber = document.getElementById('cUtr').value;
            const res = await placeOrder({ items: [currentCheckoutItem], address: {}, utr: utrNumber });
            if (res.success) {
                currentCheckoutItem = null;
                sessionStorage.removeItem('checkoutItem');
                showToast(isGuest ? 'Registration successful! Awaiting verification.' : 'Purchase successful! Awaiting verification.');
                await syncUser();
                navigate('/pending');
            } else {
                throw new Error(res.error);
            }
        } catch (err) {
            showToast(err.message, 'error');
            btn.innerHTML = `Confirm Payment & Submit UTR`;
            btn.disabled = false;
        }
    };
}

// User Layout Helper (Sidebar + Content)
function userLayout(title, content) {
    const u = currentUser;
    const initial = (u.name || 'U').charAt(0).toUpperCase();
    const avatar = u.profileImage && u.profileImage !== 'img/default-avatar.png' ? `<img src="${u.profileImage}" class="us-avatar">` : `<div class="us-avatar" style="display:flex;align-items:center;justify-content:center;font-size:1.8rem;background:#eee;color:#667eea;font-weight:700;">${initial}</div>`;
    
    return `
        <div class="view-enter container py-4">
            <h5 class="fw-bold d-lg-none mb-3">${title}</h5>
            <div class="row g-4">
                <div class="col-lg-3 user-sidebar-wrap">
                    <div class="user-sidebar">
                        <div class="text-center mb-3">
                            ${avatar}
                            <h6 class="fw-bold mt-2 mb-0">${u.name}</h6>
                            <small class="text-muted">ID: ${u.userId}</small><br>
                            <span class="badge mt-1" style="background:linear-gradient(135deg,#667eea,#764ba2);">${u.level || 'Starter'}</span>
                        </div>
                        <hr>
                        <a class="us-link ${window.location.hash==='#/dashboard'?'active':''}" onclick="navigate('/dashboard')"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                        <a class="us-link ${window.location.hash==='#/profile'?'active':''}" onclick="navigate('/profile')"><i class="fas fa-user-edit"></i> My Profile</a>
                        <a class="us-link ${window.location.hash==='#/orders'?'active':''}" onclick="navigate('/orders')"><i class="fas fa-shopping-bag"></i> My Orders</a>
                        <a class="us-link ${window.location.hash==='#/team'?'active':''}" onclick="navigate('/team')"><i class="fas fa-users"></i> My Team</a>
                        <a class="us-link ${window.location.hash==='#/commissions'?'active':''}" onclick="navigate('/commissions')"><i class="fas fa-coins"></i> Commissions</a>
                        <a class="us-link ${window.location.hash==='#/withdraw'?'active':''}" onclick="navigate('/withdraw')"><i class="fas fa-money-bill-wave"></i> Withdraw</a>
                        <a class="us-link text-danger mt-2" onclick="doLogout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
                    </div>
                </div>
                <div class="col-lg-9">
                    ${content}
                </div>
            </div>
        </div>
    `;
}

// 6. User Dashboard
async function renderUserDashboard() {
    appDiv.innerHTML = '<div class="loading-view"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    const u = currentUser;
    const [team, orders, comms] = await Promise.all([
        getMyTeam(u.userId).catch(()=>({total:0,level1:[],level2:[]})),
        getMyOrders(u.uid).catch(()=>([])),
        getMyCommissions(u.uid).catch(()=>([]))
    ]);
    const totalEarned = comms.reduce((s,c)=>s+c.amount,0);
    const refLink = `${window.location.origin}${window.location.pathname}#/login?ref=${u.userId}`;

    const content = `
        <div class="card-box mb-3 bg-light">
            <h5 class="mb-1">Welcome back, <span class="text-primary">${u.name.split(' ')[0]}</span>! 👋</h5>
            <small class="text-muted">Member since ${u.joined ? new Date(u.joined).toLocaleDateString() : '---'}</small>
        </div>
        
        <div class="row g-3 mb-4">
            <div class="col-6 col-md-3">
                <div class="stat-card text-center">
                    <div class="s-icon mx-auto mb-2" style="background:linear-gradient(135deg,#667eea,#764ba2);"><i class="fas fa-wallet"></i></div>
                    <div class="s-val text-primary">₹${u.wallet||0}</div>
                    <div class="s-lbl">Wallet Balance</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="stat-card text-center">
                    <div class="s-icon mx-auto mb-2" style="background:linear-gradient(135deg,#11998e,#38ef7d);"><i class="fas fa-users"></i></div>
                    <div class="s-val text-success">${team.total}</div>
                    <div class="s-lbl">Total Team</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="stat-card text-center">
                    <div class="s-icon mx-auto mb-2" style="background:linear-gradient(135deg,#f093fb,#f5576c);"><i class="fas fa-coins"></i></div>
                    <div class="s-val text-danger">₹${totalEarned}</div>
                    <div class="s-lbl">Total Earned</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="stat-card text-center">
                    <div class="s-icon mx-auto mb-2" style="background:linear-gradient(135deg,#4facfe,#00f2fe);"><i class="fas fa-shopping-bag"></i></div>
                    <div class="s-val text-info">${orders.length}</div>
                    <div class="s-lbl">Total Orders</div>
                </div>
            </div>
        </div>

        <div class="card-box mb-4">
            <h6><i class="fas fa-share-alt text-primary me-2"></i>Referral Link</h6>
            <div class="referral-box">
                <p class="small mb-2">Share to earn ₹100 per direct join + 10% on their purchases!</p>
                <div class="d-flex gap-2">
                    <input type="text" class="ref-input" value="${refLink}" readonly id="dashRefInput">
                    <button class="btn btn-light btn-sm fw-bold px-3" onclick="navigator.clipboard.writeText(document.getElementById('dashRefInput').value);showToast('Copied!')">Copy</button>
                </div>
            </div>
        </div>

        <div class="row g-3">
            <div class="col-6"><button class="btn-outline-pp w-100 py-3" onclick="navigate('/products')"><i class="fas fa-store fa-lg d-block mb-1"></i>Shop Now</button></div>
            <div class="col-6"><button class="btn-outline-pp w-100 py-3 text-success border-success" onclick="navigate('/withdraw')"><i class="fas fa-money-bill-wave fa-lg d-block mb-1"></i>Withdraw</button></div>
        </div>
    `;
    appDiv.innerHTML = userLayout('Dashboard', content);
}

// 7. Profile
function renderUserProfile() {
    const u = currentUser;
    const refLink = `${window.location.origin}${window.location.pathname}#/login?ref=${u.userId}`;
    
    const content = `
        <div class="card-box mb-4 text-center pb-4 pt-4" style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;">
            <h4 class="fw-bold">${u.name}</h4>
            <p class="mb-0 opacity-75">ID: ${u.userId}</p>
        </div>
        
        <div class="card-box mb-4">
            <h6><i class="fas fa-user-edit text-primary me-2"></i>Edit Profile</h6>
            <form onsubmit="doSaveProfile(event)">
                <div class="row g-3">
                    <div class="col-md-6"><label class="flabel">Full Name</label><input type="text" class="form-f" id="pName" value="${u.name}" required></div>
                    <div class="col-md-6"><label class="flabel">Phone Number</label><input type="tel" class="form-f" id="pPhone" value="${u.phone||''}" pattern="[0-9]{10}"></div>
                    <div class="col-12"><label class="flabel">Email (Cannot change)</label><input type="email" class="form-f" value="${u.email}" disabled></div>
                    <div class="col-12"><button type="submit" class="btn-pp" id="btnSaveProfile">Save Changes</button></div>
                </div>
            </form>
        </div>

        <div class="card-box mb-4">
            <h6><i class="fas fa-lock text-danger me-2"></i>Change Password</h6>
            <form onsubmit="doChangePass(event)">
                <div class="row g-3">
                    <div class="col-md-4"><label class="flabel">Current Password</label><input type="password" class="form-f" id="cpCurr" required></div>
                    <div class="col-md-4"><label class="flabel">New Password</label><input type="password" class="form-f" id="cpNew" required minlength="6"></div>
                    <div class="col-md-4"><label class="flabel">Confirm Password</label><input type="password" class="form-f" id="cpConf" required></div>
                    <div class="col-12"><button type="submit" class="btn-pp" style="background:#e74c3c;">Change Password</button></div>
                </div>
            </form>
        </div>
    `;
    appDiv.innerHTML = userLayout('My Profile', content);

    window.doSaveProfile = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSaveProfile');
        btn.disabled = true;
        const res = await updateUserProfile(u.uid, { name: document.getElementById('pName').value, phone: document.getElementById('pPhone').value });
        btn.disabled = false;
        if(res.success) { showToast('Profile updated!'); syncUser(); renderUserProfile(); }
        else showToast(res.error, 'error');
    };
    
    window.doChangePass = async (e) => {
        e.preventDefault();
        const curr = document.getElementById('cpCurr').value;
        const newP = document.getElementById('cpNew').value;
        if(newP !== document.getElementById('cpConf').value) return showToast('New passwords mismatch', 'error');
        const res = await changeUserPassword(curr, newP);
        if(res.success) { showToast('Password changed! Please login again.'); setTimeout(()=>navigate('/login'),2000); }
        else showToast(res.error, 'error');
    };
}

// 8. Orders
async function renderUserOrders() {
    appDiv.innerHTML = '<div class="loading-view"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    const orders = await getMyOrders(currentUser.uid);
    
    let html = '';
    if(!orders.length) {
        html = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><p>No orders yet</p><button class="btn-pp btn-sm" onclick="navigate(\'/products\')">Shop Now</button></div>';
    } else {
        html = orders.map(o => {
            const t = o.tracking || {};
            const isDeliv = o.status === 'Delivered';
            const isCanc = o.status === 'Cancelled';
            const canCancel = ['Pending', 'Confirmed'].includes(o.status);
            const steps = [{l:'Ordered', d:true}, {l:'Confirmed', d:t.confirmed||isDeliv}, {l:'Shipped', d:t.shipped||isDeliv}, {l:'Delivered', d:t.delivered||isDeliv}];
            
            return `
            <div class="order-card">
                <div class="d-flex justify-content-between mb-2">
                    <div><div class="fw-bold small">#${o.orderId}</div><div class="text-muted" style="font-size:0.75rem;">${new Date(o.date).toLocaleDateString()}</div></div>
                    <div class="text-end"><span class="b-${o.status}">${o.status}</span><div class="fw-bold text-primary mt-1">₹${o.total}</div></div>
                </div>
                <div class="small text-muted mb-2">${o.items.map(i=>i.name).join(', ')}</div>
                ${!isCanc ? `
                <div class="t-track">
                    ${steps.map((s,i) => `<div class="t-step ${s.d?'done':'pending'}"><div class="t-dot"><i class="fas fa-check"></i></div><span>${s.l}</span></div>${i<3?`<div class="t-line ${s.d&&steps[i+1].d?'done':''}"></div>`:''}`).join('')}
                </div>` : '<div class="text-danger small"><i class="fas fa-times-circle"></i> Cancelled</div>'}
                ${o.trackingNumber ? `<div class="mt-2 small"><i class="fas fa-truck text-info"></i> Track: <strong>${o.trackingNumber}</strong></div>` : ''}
                ${canCancel ? `<div class="mt-3"><button class="btn btn-sm btn-outline-danger py-1 px-3 rounded-pill" onclick="doCancelOrder('${o.id}')">Cancel</button></div>` : ''}
            </div>`;
        }).join('');
    }

    appDiv.innerHTML = userLayout('My Orders', `<div class="card-box"><h6><i class="fas fa-box text-primary me-2"></i>Order History</h6>${html}</div>`);
    
    window.doCancelOrder = async (id) => {
        if(!confirm('Cancel order?')) return;
        const res = await cancelOrder(id);
        if(res.success) { showToast('Order cancelled'); renderUserOrders(); }
        else showToast(res.error, 'error');
    };
}

// 9. Team
async function renderUserTeam() {
    appDiv.innerHTML = '<div class="loading-view"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    const team = await getMyTeam(currentUser.userId);
    
    const mCard = (m, lvl) => `
        <div class="member-card">
            <div class="m-avatar">${(m.name||'U').charAt(0)}</div>
            <div class="flex-grow-1">
                <div class="fw-bold small">${m.name} <span class="${lvl===1?'discount-pill':'b-Pending'} ms-1">L${lvl}</span></div>
                <div class="text-muted" style="font-size:0.75rem;">${m.email}</div>
            </div>
            <span class="b-${m.status||'active'}">${m.status||'active'}</span>
        </div>`;

    const content = `
        <div class="row g-3 mb-4">
            <div class="col-4"><div class="stat-card text-center px-2"><div class="s-val text-primary">${team.level1.length}</div><div class="s-lbl">Direct (L1)</div></div></div>
            <div class="col-4"><div class="stat-card text-center px-2"><div class="s-val text-info">${team.level2.length}</div><div class="s-lbl">Level 2</div></div></div>
            <div class="col-4"><div class="stat-card text-center px-2"><div class="s-val text-success">${team.total}</div><div class="s-lbl">Total</div></div></div>
        </div>
        <div class="card-box mb-3">
            <h6>Level 1 (Direct)</h6>
            ${team.level1.length ? team.level1.map(m=>mCard(m,1)).join('') : '<p class="text-muted small">No direct referrals yet.</p>'}
        </div>
        <div class="card-box">
            <h6>Level 2</h6>
            ${team.level2.length ? team.level2.map(m=>mCard(m,2)).join('') : '<p class="text-muted small">No Level 2 members yet.</p>'}
        </div>
    `;
    appDiv.innerHTML = userLayout('My Team', content);
}

// 10. Commissions
async function renderUserCommissions() {
    appDiv.innerHTML = '<div class="loading-view"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    const comms = await getMyCommissions(currentUser.uid);
    const total = comms.reduce((s,c)=>s+c.amount,0);
    
    const content = `
        <div class="w-wallet mb-4" style="background:linear-gradient(135deg,#f093fb,#f5576c);">
            <div class="small opacity-75">Total Earnings</div>
            <div class="display-4 fw-bold">₹${total}</div>
        </div>
        <div class="card-box">
            <h6><i class="fas fa-history text-primary me-2"></i>History</h6>
            ${!comms.length ? '<p class="text-muted small py-3">No commissions earned yet.</p>' : comms.map(c => `
                <div class="comm-row">
                    <div class="c-icon" style="background:${c.type==='joining'?'#e8f5e9':'#e3f2fd'};color:${c.type==='joining'?'#28a745':'#1565c0'};"><i class="fas ${c.type==='joining'?'fa-user-plus':'fa-shopping-cart'}"></i></div>
                    <div class="flex-grow-1">
                        <div class="fw-bold small">${c.description}</div>
                        <div class="text-muted" style="font-size:0.75rem;">From: ${c.fromUserName} &bull; L${c.level}</div>
                    </div>
                    <div class="fw-bold text-success">+₹${c.amount}</div>
                </div>
            `).join('')}
        </div>
    `;
    appDiv.innerHTML = userLayout('Commissions', content);
}

// 11. Withdraw
async function renderUserWithdrawal() {
    appDiv.innerHTML = '<div class="loading-view"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    const history = await getMyWithdrawals(currentUser.uid);
    
    const content = `
        <div class="w-wallet">
            <div class="small opacity-75">Wallet Balance</div>
            <div class="display-4 fw-bold mb-1">₹${currentUser.wallet||0}</div>
            <div class="small opacity-75">Min. Withdrawal: ₹200</div>
        </div>
        
        <div class="card-box mb-4">
            <h6>Request Withdrawal</h6>
            <form onsubmit="doWithdraw(event)">
                <div class="row g-3">
                    <div class="col-md-6"><label class="flabel">Amount (₹)</label><input type="number" class="form-f" id="wAmt" min="200" required></div>
                    <div class="col-md-6"><label class="flabel">Account Holder Name</label><input type="text" class="form-f" id="wName" required></div>
                    <div class="col-md-6"><label class="flabel">Bank Name</label><input type="text" class="form-f" id="wBank" required></div>
                    <div class="col-md-6"><label class="flabel">A/C Number</label><input type="text" class="form-f" id="wAcc" required></div>
                    <div class="col-md-6"><label class="flabel">IFSC Code</label><input type="text" class="form-f" id="wIfsc" required></div>
                    <div class="col-md-6"><label class="flabel">UPI (Optional)</label><input type="text" class="form-f" id="wUpi"></div>
                    <div class="col-12"><button type="submit" class="btn-pp w100" id="btnWithdraw">Submit Request</button></div>
                </div>
            </form>
        </div>

        <div class="card-box">
            <h6>Recent Requests</h6>
            ${!history.length ? '<p class="text-muted small">No requests found.</p>' : history.map(w => `
                <div class="comm-row">
                    <div class="flex-grow-1">
                        <div class="fw-bold text-primary">₹${w.amount}</div>
                        <div class="text-muted" style="font-size:0.75rem;">${new Date(w.date).toLocaleDateString()}</div>
                    </div>
                    <span class="b-${w.status}">${w.status}</span>
                </div>
            `).join('')}
        </div>
    `;
    appDiv.innerHTML = userLayout('Withdraw', content);

    window.doWithdraw = async (e) => {
        e.preventDefault();
        const amt = parseInt(document.getElementById('wAmt').value);
        if(amt > (currentUser.wallet||0)) return showToast('Insufficient balance', 'error');
        const btn = document.getElementById('btnWithdraw');
        btn.disabled = true;
        const details = `${document.getElementById('wBank').value} - ${document.getElementById('wAcc').value} - IFSC: ${document.getElementById('wIfsc').value}`;
        const res = await requestWithdrawal(currentUser.uid, amt, details);
        if(res.success) {
            currentUser.wallet -= amt;
            showToast('Request submitted!');
            renderUserWithdrawal();
        } else {
            showToast(res.error, 'error');
            btn.disabled = false;
        }
    };
}


// --- ADMIN VIEWS ---

// Admin Layout Helper
function adminLayout(content) {
    return `<div class="view-enter container-fluid py-4">${content}</div>`;
}

// 12. Admin Dashboard
async function renderAdminDashboard() {
    appDiv.innerHTML = '<div class="loading-view"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    const [stats, orders, users] = await Promise.all([getDashboardStats(), getAllOrders(), getAllUsers()]);
    
    const content = `
        <h4 class="fw-bold mb-4">Admin Dashboard</h4>
        <div class="row g-3 mb-4">
            <div class="col-md-3 col-6"><div class="stat-card d-flex gap-3 align-items-center"><div class="s-icon" style="background:#667eea;"><i class="fas fa-users"></i></div><div><div class="s-val">${stats.totalUsers}</div><div class="s-lbl">Users</div></div></div></div>
            <div class="col-md-3 col-6"><div class="stat-card d-flex gap-3 align-items-center"><div class="s-icon" style="background:#11998e;"><i class="fas fa-shopping-cart"></i></div><div><div class="s-val">${stats.totalOrders}</div><div class="s-lbl">Orders</div></div></div></div>
            <div class="col-md-3 col-6"><div class="stat-card d-flex gap-3 align-items-center"><div class="s-icon" style="background:#f093fb;"><i class="fas fa-rupee-sign"></i></div><div><div class="s-val">₹${stats.totalSales}</div><div class="s-lbl">Sales</div></div></div></div>
            <div class="col-md-3 col-6"><div class="stat-card d-flex gap-3 align-items-center"><div class="s-icon" style="background:#ff6b6b;"><i class="fas fa-clock"></i></div><div><div class="s-val">${stats.pendingOrders}</div><div class="s-lbl">Pending Orders</div></div></div></div>
        </div>
        <div class="row g-4">
            <div class="col-lg-6">
                <div class="card-box">
                    <h6 class="mb-3">Recent Orders</h6>
                    <div class="table-responsive">
                        <table class="table table-sm align-middle">
                            <thead><tr><th>ID</th><th>User</th><th>Total</th><th>Status</th></tr></thead>
                            <tbody>${orders.slice(0,5).map(o=>`<tr><td><small>${o.orderId}</small></td><td><small>${o.userName}</small></td><td>₹${o.total}</td><td><span class="b-${o.status}">${o.status}</span></td></tr>`).join('')}</tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card-box">
                    <h6 class="mb-3">Recent Users</h6>
                    <div class="table-responsive">
                        <table class="table table-sm align-middle">
                            <thead><tr><th>Name</th><th>Email</th><th>Wallet</th></tr></thead>
                            <tbody>${users.filter(u=>u.role!=='admin').slice(0,5).map(u=>`<tr><td><small>${u.name}</small></td><td><small>${u.email}</small></td><td class="text-success fw-bold">₹${u.wallet||0}</td></tr>`).join('')}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    appDiv.innerHTML = adminLayout(content);
}

// 13. Admin Users
async function renderAdminUsers() {
    appDiv.innerHTML = '<div class="loading-view"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    let users = (await getAllUsers()).filter(u=>u.role!=='admin');
    
    window.au_users = users; // cache for UI functions

    const buildTable = () => `
        <table class="table table-hover align-middle">
            <thead class="table-light"><tr><th>Name</th><th>ID</th><th>Wallet</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
                ${window.au_users.map(u=>`
                <tr>
                    <td><div class="fw-bold small">${u.name}</div><div class="text-muted" style="font-size:0.75rem;">${u.email}</div></td>
                    <td><small>${u.userId}</small></td>
                    <td class="text-success fw-bold">₹${u.wallet||0}</td>
                    <td><span class="b-${u.status||'active'}">${u.status||'active'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary py-0 px-2" onclick="promptWallet('${u.id}')"><i class="fas fa-wallet"></i></button>
                        ${u.status==='active' ? 
                            `<button class="btn btn-sm btn-outline-warning py-0 px-2" onclick="toggleUserStatus('${u.id}', 'blocked')"><i class="fas fa-ban"></i></button>` : 
                            `<button class="btn btn-sm btn-outline-success py-0 px-2" onclick="toggleUserStatus('${u.id}', 'active')"><i class="fas fa-check"></i></button>`}
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    appDiv.innerHTML = adminLayout(`
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4 class="fw-bold mb-0">Manage Users</h4>
        </div>
        <div class="card-box p-0 overflow-hidden" id="adminUsersTableWrap">
            <div class="table-responsive">${buildTable()}</div>
        </div>
    `);

    window.toggleUserStatus = async (id, status) => {
        await updateUserStatus(id, status);
        window.au_users.find(u=>u.id===id).status = status;
        document.getElementById('adminUsersTableWrap').innerHTML = `<div class="table-responsive">${buildTable()}</div>`;
        showToast(`User ${status}`);
    };
    window.promptWallet = async (id) => {
        const amt = prompt('Enter amount to add (positive) or deduct (negative):');
        if(!amt || isNaN(amt)) return;
        await addToUserWallet(id, parseInt(amt));
        window.au_users.find(u=>u.id===id).wallet += parseInt(amt);
        document.getElementById('adminUsersTableWrap').innerHTML = `<div class="table-responsive">${buildTable()}</div>`;
        showToast('Wallet updated');
    };
}

// 14. Admin Products
async function renderAdminProducts() {
    appDiv.innerHTML = '<div class="loading-view"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    window.ap_prods = await getAllProducts();

    const buildGrid = () => window.ap_prods.map(p=>`
        <div class="col-6 col-md-4 col-lg-3">
            <div class="product-card">
                <img src="${p.image}">
                <div class="pc-body">
                    <div class="pc-name">${p.name}</div>
                    <div class="text-primary fw-bold mb-2">₹${p.price}</div>
                    <div class="d-flex gap-2 mt-auto">
                        <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="ap_edit('${p.id}')">Edit</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="ap_del('${p.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    appDiv.innerHTML = adminLayout(`
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4 class="fw-bold mb-0">Products</h4>
            <button class="btn-pp btn-sm" onclick="ap_add()"><i class="fas fa-plus"></i> Add</button>
        </div>
        <div class="row g-3" id="adminProdsGrid">${buildGrid()}</div>
        
        <!-- Quick Form (Hidden initially) -->
        <div id="apFormWrap" style="display:none;position:fixed;top:60px;right:0;bottom:0;width:100%;max-width:400px;background:white;z-index:1050;box-shadow:-5px 0 25px rgba(0,0,0,0.1);padding:20px;overflow-y:auto;">
            <div class="d-flex justify-content-between mb-3"><h5 id="apTitle">Add Product</h5><button class="btn-close" onclick="document.getElementById('apFormWrap').style.display='none'"></button></div>
            <form onsubmit="ap_save(event)">
                <input type="hidden" id="apId">
                <div class="fgroup"><label class="flabel">Name</label><input type="text" class="form-f" id="apName" required></div>
                <div class="row"><div class="col-6 fgroup"><label class="flabel">Price</label><input type="number" class="form-f" id="apPrice" required></div><div class="col-6 fgroup"><label class="flabel">MRP</label><input type="number" class="form-f" id="apMrp" required></div></div>
                <div class="fgroup"><label class="flabel">Stock</label><input type="number" class="form-f" id="apStock" required></div>
                <div class="fgroup"><label class="flabel">Image URL</label><input type="url" class="form-f" id="apImg" required></div>
                <div class="fgroup"><label class="flabel">Status</label><select class="form-f" id="apStat"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                <button type="submit" class="btn-pp w100" id="apSaveBtn">Save</button>
            </form>
        </div>
    `);

    window.ap_add = () => {
        document.getElementById('apTitle').innerText = 'Add Product';
        document.getElementById('apId').value = '';
        ['apName','apPrice','apMrp','apStock','apImg'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('apFormWrap').style.display = 'block';
    };
    window.ap_edit = (id) => {
        const p = window.ap_prods.find(x=>x.id===id);
        document.getElementById('apTitle').innerText = 'Edit Product';
        document.getElementById('apId').value = id;
        document.getElementById('apName').value = p.name;
        document.getElementById('apPrice').value = p.price;
        document.getElementById('apMrp').value = p.mrp;
        document.getElementById('apStock').value = p.stock;
        document.getElementById('apImg').value = p.image;
        document.getElementById('apStat').value = p.status;
        document.getElementById('apFormWrap').style.display = 'block';
    };
    window.ap_save = async (e) => {
        e.preventDefault();
        document.getElementById('apSaveBtn').disabled = true;
        const id = document.getElementById('apId').value;
        const data = {
            name: document.getElementById('apName').value, price: Number(document.getElementById('apPrice').value),
            mrp: Number(document.getElementById('apMrp').value), stock: Number(document.getElementById('apStock').value),
            image: document.getElementById('apImg').value, status: document.getElementById('apStat').value
        };
        if(id) {
            await updateProduct(id, data);
            const idx = window.ap_prods.findIndex(x=>x.id===id);
            window.ap_prods[idx] = {id, ...data};
        } else {
            const res = await addProduct(data);
            window.ap_prods.unshift({id: res.id, ...data});
        }
        document.getElementById('adminProdsGrid').innerHTML = buildGrid();
        document.getElementById('apFormWrap').style.display = 'none';
        document.getElementById('apSaveBtn').disabled = false;
        showToast('Product saved');
    };
    window.ap_del = async (id) => {
        if(!confirm('Delete?')) return;
        await deleteProduct(id);
        window.ap_prods = window.ap_prods.filter(x=>x.id!==id);
        document.getElementById('adminProdsGrid').innerHTML = buildGrid();
        showToast('Product deleted');
    };
}

// 15. Admin Orders
async function renderAdminOrders() {
    appDiv.innerHTML = '<div class="loading-view"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    window.ao_ords = await getAllOrders();

    const buildTbl = () => window.ao_ords.map(o=>`
        <tr>
            <td><small class="fw-bold">#${o.orderId}</small><br><small class="text-muted">${new Date(o.date).toLocaleDateString()}</small></td>
            <td><small>${o.userName}</small></td>
            <td class="text-primary fw-bold">₹${o.total}</td>
            <td>
                <span class="badge bg-secondary mb-1">UTR: ${o.utr || 'N/A'}</span><br>
                <span class="b-${o.status.replace(/ /g, '-')}">${o.status}</span>
            </td>
            <td>
                ${o.status === 'Pending UTR Verification' ? `<button class="btn btn-sm btn-success py-0 px-2 mb-1 w-100" onclick="ao_update('${o.id}', 'Approved')">Approve Payment</button><br>` : ''}
                <button class="btn btn-sm btn-outline-primary py-0 px-2 w-100" onclick="ao_update_manual('${o.id}', '${o.status}', '${o.trackingNumber||''}')">Update Status</button>
            </td>
        </tr>
    `).join('');

    appDiv.innerHTML = adminLayout(`
        <h4 class="fw-bold mb-4">Orders & Payments</h4>
        <div class="card-box p-0"><div class="table-responsive"><table class="table table-hover align-middle">
            <thead class="table-light"><tr><th>Order</th><th>User</th><th>Total</th><th>Status/UTR</th><th>Action</th></tr></thead>
            <tbody id="aoTbody">${buildTbl()}</tbody>
        </table></div></div>
    `);

    window.ao_update = (id, stat) => {
        if(!confirm(`Mark this order as ${stat} and process commissions?`)) return;
        updateOrderStatus(id, stat, '').then(()=>{
            const o = window.ao_ords.find(x=>x.id===id);
            o.status = stat;
            document.getElementById('aoTbody').innerHTML = buildTbl();
            showToast('Order and Payment Approved!');
        });
    };

    window.ao_update_manual = (id, curStat, curTrack) => {
        const stat = prompt('Enter new status (Pending UTR Verification, Approved, Cancelled):', curStat);
        if(!stat || stat===curStat) return;
        const trk = prompt('Enter tracking number (optional):', curTrack);
        updateOrderStatus(id, stat, trk).then(()=>{
            const o = window.ao_ords.find(x=>x.id===id);
            o.status = stat; o.trackingNumber = trk;
            document.getElementById('aoTbody').innerHTML = buildTbl();
            showToast('Order updated');
        });
    };
}

// 16. Admin Withdrawals
async function renderAdminWithdrawals() {
    appDiv.innerHTML = '<div class="loading-view"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    window.aw_with = await getAllWithdrawals();

    const buildTbl = () => window.aw_with.map(w=>`
        <tr>
            <td><small class="fw-bold">${w.userName}</small></td>
            <td class="text-success fw-bold">₹${w.amount}</td>
            <td><small>${w.bankDetails}</small></td>
            <td><span class="b-${w.status}">${w.status}</span></td>
            <td>
                ${w.status==='Pending' ? `
                <button class="btn btn-sm btn-success py-0 px-2" onclick="aw_act('${w.id}','approve')"><i class="fas fa-check"></i></button>
                <button class="btn btn-sm btn-danger py-0 px-2" onclick="aw_act('${w.id}','reject')"><i class="fas fa-times"></i></button>
                ` : `<small class="text-muted">Done</small>`}
            </td>
        </tr>
    `).join('');

    appDiv.innerHTML = adminLayout(`
        <h4 class="fw-bold mb-4">Withdrawals</h4>
        <div class="card-box p-0"><div class="table-responsive"><table class="table table-hover align-middle">
            <thead class="table-light"><tr><th>User</th><th>Amount</th><th>Details</th><th>Status</th><th>Action</th></tr></thead>
            <tbody id="awTbody">${buildTbl()}</tbody>
        </table></div></div>
    `);

    window.aw_act = async (id, act) => {
        if(!confirm(act==='approve' ? 'Approve?' : 'Reject & Refund?')) return;
        if(act==='approve') await approveWithdrawal(id);
        else await rejectWithdrawal(id);
        window.aw_with.find(w=>w.id===id).status = act==='approve'?'Approved':'Rejected';
        document.getElementById('awTbody').innerHTML = buildTbl();
        showToast(`Request ${act}d`);
    };
}

