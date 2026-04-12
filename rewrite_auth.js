const fs = require('fs');

const path = 'c:\\\\People plus network\\\\auth-check.js';

const newAuthCheckContent = `document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('/api/session');
        const joinItem = document.querySelector('.nav-item a.btn-join');
        
        if (joinItem && !document.getElementById('userMenu')) {
            const liParent = joinItem.parentElement;
            
            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    // User is logged IN
                    const dashLink = data.user.role === 'admin' ? 'admin.html' : 'user-dashboard.html';
                    
                    liParent.innerHTML = \\`
                        <div class="dropdown">
                            <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false" style="padding: 5px 15px;">
                                <img src="\\\${data.user.avatar || 'default-avatar.png'}" style="width: 35px; height: 35px; border-radius: 50%; border: 2px solid #667eea; object-fit: cover; margin-right: 8px;" alt="Avatar" onerror="this.onerror=null;this.src='default-avatar.png';">
                                <span class="fw-bold d-none d-md-inline" style="color:#667eea;">\\\${data.user.name.split(' ')[0]}</span>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3" aria-labelledby="userMenu">
                                <li><a class="dropdown-item" href="\\\${dashLink}"><i class="fas fa-tachometer-alt me-2 text-primary"></i> Dashboard</a></li>
                                <li><a class="dropdown-item" href="user-profile.html"><i class="fas fa-user-edit me-2 text-success"></i> My Profile</a></li>
                                <li><a class="dropdown-item" href="user-orders.html"><i class="fas fa-shopping-cart me-2 text-info"></i> My Orders</a></li>
                                <li><a class="dropdown-item" href="user-team.html"><i class="fas fa-users me-2 text-warning"></i> My Team</a></li>
                                <li><a class="dropdown-item" href="user-commissions.html"><i class="fas fa-coins me-2 text-warning"></i> Commissions</a></li>
                                <li><a class="dropdown-item" href="user-withdrawal.html"><i class="fas fa-money-bill-wave me-2 text-success"></i> Withdrawal</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
                            </ul>
                        </div>
                    \\`;
                    
                    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
                        e.preventDefault();
                        await fetch('/api/logout', { method: 'POST' });
                        window.location.href = 'index.html';
                    });
                    
                    return; // Exit
                }
            }
            
            // User is logged OUT
            liParent.innerHTML = \\`
                <div class="dropdown">
                    <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false" style="padding: 5px 15px;">
                        <img src="default-avatar.png" style="width: 35px; height: 35px; border-radius: 50%; border: 2px solid #ccc; object-fit: cover;" alt="Guest Avatar">
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3" aria-labelledby="userMenu">
                        <li><a class="dropdown-item fw-bold" href="register.html" style="color: #667eea;"><i class="fas fa-user-plus me-2"></i> Join Now / Login</a></li>
                    </ul>
                </div>
            \\`;
        }
    } catch (e) {
        console.error('Auth Check Error', e);
    }
});
`;

fs.writeFileSync(path, newAuthCheckContent);
console.log('auth-check.js totally rewritten!');
