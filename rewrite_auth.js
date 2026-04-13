const fs = require('fs');

const path = 'c:\\\\People plus network\\\\auth-check.js';

const newAuthCheckContent = `document.addEventListener("DOMContentLoaded", async () => {
    const isLoginPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
    const isAdminPage = window.location.pathname.includes('admin') && !window.location.pathname.includes('login');
    const isUserPage = window.location.pathname.includes('user-') || window.location.pathname.includes('checkout.html');

    try {
        const response = await fetch('/api/session');
        const data = response.ok ? await response.json() : null;
        const user = data ? data.user : null;

        // Security Redirection Logic
        if (isAdminPage && (!user || user.role !== 'admin')) {
            window.location.href = 'admin-login.html';
            return;
        }
        if (isUserPage && !user) {
            window.location.href = 'register.html';
            return;
        }
        if (isLoginPage && user) {
            window.location.href = user.role === 'admin' ? 'admin.html' : 'user-dashboard.html';
            return;
        }

        // Navbar / Menu Update Logic
        const joinItem = document.querySelector('.nav-item a.btn-join') || document.querySelector('.nav-link.btn-join');
        
        if (joinItem && user) {
            const liParent = joinItem.closest('li') || joinItem.parentElement;
            const dashLink = user.role === 'admin' ? 'admin.html' : 'user-dashboard.html';
            
            liParent.innerHTML = \`
                <div class="dropdown">
                    <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false" style="padding: 5px 15px;">
                        <img src="\\\${user.avatar || 'default-avatar.png'}" style="width: 35px; height: 35px; border-radius: 50%; border: 2px solid #667eea; object-fit: cover; margin-right: 8px;" alt="Avatar" onerror="this.onerror=null;this.src='default-avatar.png';">
                        <span class="fw-bold d-none d-md-inline" style="color:#667eea;">\\\${user.name.split(' ')[0]}</span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3" aria-labelledby="userMenu">
                        <li><a class="dropdown-item" href="\\\${dashLink}"><i class="fas fa-tachometer-alt me-2 text-primary"></i> Dashboard</a></li>
                        <li><a class="dropdown-item" href="user-profile.html"><i class="fas fa-user-edit me-2 text-success"></i> My Profile</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="logoutUser(event)"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
                    </ul>
                </div>
            \`;
        }

        // Update Admin Sidebar Name if applicable
        const adminNameSpan = document.querySelector('.admin-navbar span');
        if (adminNameSpan && user && user.role === 'admin') {
            adminNameSpan.innerHTML = \\\`<i class="fas fa-user-circle"></i> \\\${user.name}\\\`;
        }

        // Bind all logout links
        document.querySelectorAll('a[href*="logout"], #logoutBtn').forEach(btn => {
            btn.onclick = logoutUser;
        });

    } catch (e) {
        console.error('Auth Check Error', e);
    }
});

async function logoutUser(e) {
    if(e) e.preventDefault();
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = 'index.html';
    } catch(err) {
        window.location.href = 'index.html';
    }
}
`;


fs.writeFileSync(path, newAuthCheckContent);
console.log('auth-check.js totally rewritten!');
