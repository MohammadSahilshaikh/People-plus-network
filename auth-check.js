document.addEventListener("DOMContentLoaded", async () => {
    const path = window.location.pathname;
    const isLoginPage = path.includes('login.html') || path.includes('register.html');
    const isAdminPage = path.includes('admin') && !path.includes('login');
    const isUserPage = path.includes('user-') || path.includes('checkout.html') || path.includes('dashboard.html');

    try {
        const response = await fetch('/api/session');
        const data = response.ok ? await response.json() : null;
        const user = data ? data.user : null;
        const joinBtn = document.querySelector('.btn-join');


        // Security Redirection
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

        // Global UI Updates
        if (user) {
            // Update all elements with display classes
            document.querySelectorAll('.display-user-name').forEach(el => el.innerText = user.name);
            document.querySelectorAll('.display-user-email').forEach(el => el.innerText = user.email);
            document.querySelectorAll('.display-user-id').forEach(el => el.innerText = 'PPN' + (user.id || user._id || '000000').slice(-6).toUpperCase());
            document.querySelectorAll('.display-user-avatar').forEach(el => {
                el.src = user.avatar || 'default-avatar.png';
            });

            // Handle Navbar/Menu
            if (joinBtn) {
                const li = joinBtn.closest('li') || joinBtn.parentElement;
                const dashLink = user.role === 'admin' ? 'admin.html' : 'user-dashboard.html';
                
                li.innerHTML = `
                    <div class="dropdown">
                        <a class="nav-link dropdown-toggle d-flex align-items-center auth-visible" href="#" role="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false" style="padding: 5px 15px;">
                            <img src="${user.avatar || 'default-avatar.png'}" class="display-user-avatar" style="width: 35px; height: 35px; border-radius: 50%; border: 2px solid white; object-fit: cover; margin-right: 8px;" alt="Avatar">
                            <span class="fw-bold d-none d-md-inline" style="color:white;">${user.name.split(' ')[0]}</span>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                            <li><a class="dropdown-item" href="${dashLink}"><i class="fas fa-tachometer-alt me-2 text-primary"></i> Dashboard</a></li>
                            <li><a class="dropdown-item" href="user-profile.html"><i class="fas fa-user-edit me-2 text-success"></i> My Profile</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="logoutUser(event)"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
                        </ul>
                    </div>
                `;
            }
        } else {
            // If NOT logged in, make the Join Now button visible
            if (joinBtn) {
                joinBtn.classList.add('auth-visible');
            }
        }

        // Global Logout binding
        document.querySelectorAll('a[href*="logout"]').forEach(el => {
            el.onclick = logoutUser;
        });

    } catch (e) {
        console.error('Auth Check Error:', e);
    }
});

async function logoutUser(e) {
    if (e) e.preventDefault();
    if (!confirm('Are you sure you want to logout?')) return;
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = 'index.html';
    } catch (err) {
        window.location.href = 'index.html';
    }
}
