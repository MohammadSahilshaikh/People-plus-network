const fs = require('fs');

let content = fs.readFileSync('register.html', 'utf8');

// The login form is broken around line 357. 
// We will replace the broken event listeners with working ones.

const replaceRegex = /document\.getElementById\('loginForm'\)\.addEventListener[\s\S]*?window\.logoutUser = function\(.*?\) \{/m;

const correctCode = `document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!email || !password) { alert('Please enter email and password'); return; }
        
        const btn = e.target.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        btn.disabled = true;
        
        try {
            const result = await loginUser(email, password);
            if (result.success) {
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                updateNavbar(result.user);
                if (result.user.role === 'admin') {
                    alert('✅ Welcome Admin!');
                    window.location.href = 'admin.html';
                } else {
                    alert('✅ Login Successful!');
                    window.location.href = 'user-profile.html';
                }
            } else {
                alert('❌ Login failed: ' + result.error);
            }
        } catch (error) {
            alert('❌ Error: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const sponsor = document.getElementById('regSponsor').value.trim();
        
        if (!name || !email || !phone || !password) { alert('Please fill all required fields'); return; }
        if (password.length < 6) { alert('Password must be at least 6 characters'); return; }
        
        const btn = e.target.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        btn.disabled = true;
        
        try {
            const result = await registerUser({ name, email, phone, password, sponsor });
            if (result.success) {
                alert('✅ Registration successful! Welcome!');
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                updateNavbar(result.user);
                window.location.href = 'user-profile.html';
            } else {
                alert('❌ Registration failed: ' + result.error);
            }
        } catch (error) {
            alert('❌ Error: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    window.logoutUser = function() {`;

content = content.replace(replaceRegex, correctCode);

// Also replace the dropdown link from user-dashboard to user-profile 
content = content.replace(/<li><a class="dropdown-item" href="user-dashboard.html"><i class="fas fa-tachometer-alt me-2"><\/i> Dashboard<\/a><\/li>/g, '<li><a class="dropdown-item" href="user-profile.html"><i class="fas fa-user-edit me-2"></i> My Profile</a></li>\n                    <li><a class="dropdown-item" href="user-dashboard.html"><i class="fas fa-tachometer-alt me-2"></i> Dashboard</a></li>');

// Deduplicate if we just added it twice
content = content.replace(/<li><a class="dropdown-item" href="user-profile.html"><i class="fas fa-user-edit me-2"><\/i> My Profile<\/a><\/li>\s*<li><a class="dropdown-item" href="user-profile.html"><i class="fas fa-user-edit me-2"><\/i> My Profile<\/a><\/li>/g, '<li><a class="dropdown-item" href="user-profile.html"><i class="fas fa-user-edit me-2"></i> My Profile</a></li>');


fs.writeFileSync('register.html', content, 'utf8');
console.log("Register fixed!");
