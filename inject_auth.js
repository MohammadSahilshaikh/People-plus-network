const fs = require('fs');
const path = require('path');

const fileContent = `
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('/api/session');
        if (response.ok) {
            const data = await response.json();
            if (data.user) {
                // User is logged in
                const joinItem = document.querySelector('.nav-item a.btn-join');
                if (joinItem) {
                    const liParent = joinItem.parentElement;
                    const getAvatar = (name) => {
                        return name ? name.charAt(0).toUpperCase() : 'U';
                    };
                    const dashLink = data.user.role === 'admin' ? 'admin.html' : 'user-dashboard.html';
                    
                    liParent.innerHTML = \`
                        <div class="dropdown">
                            <a class="nav-link dropdown-toggle d-flex align-items-center text-white" href="#" role="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50px; padding: 5px 15px;">
                                <div style="width: 30px; height: 30px; background: white; color: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 10px;">
                                    \${getAvatar(data.user.name)}
                                </div>
                                <span class="fw-bold">\${data.user.name.split(' ')[0]}</span>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3" aria-labelledby="userMenu">
                                <li><a class="dropdown-item" href="\${dashLink}"><i class="fas fa-tachometer-alt me-2 text-primary"></i> Dashboard</a></li>
                                <li><a class="dropdown-item" href="user-profile.html"><i class="fas fa-user me-2 text-success"></i> My Profile</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
                            </ul>
                        </div>
                    \`;
                    
                    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
                        e.preventDefault();
                        await fetch('/api/logout', { method: 'POST' });
                        window.location.href = 'index.html';
                    });
                }
            }
        }
    } catch (e) {
        console.error('Auth Check Error', e);
    }
});
`;

fs.writeFileSync(path.join(__dirname, 'auth-check.js'), fileContent);

const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
htmlFiles.forEach(file => {
    let content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    
    // Inject auth-check.js if not exists
    if (!content.includes('<script src="auth-check.js"></script>')) {
        content = content.replace('</body>', '    <script src="auth-check.js"></script>\n</body>');
        fs.writeFileSync(path.join(__dirname, file), content);
        console.log(`Injected auth-check.js in ${file}`);
    }
});
