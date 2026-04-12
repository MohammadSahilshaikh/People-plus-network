const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    let original = content;

    // 1. In index.html, remove the "Join Now ->" text from the card, keep link wrapping
    if (file === 'index.html') {
        content = content.replace(/<p class="text-primary mt-2"><strong>Join Now &rarr;<\/strong><\/p>/g, '');
    }

    // 2. In register.html, fix the tab names
    if (file === 'register.html') {
        // Fix Login tab
        content = content.replace(/<button class="nav-link active" id="login-tab".*?>Join Now<\/button>/, '<button class="nav-link active" id="login-tab" data-bs-toggle="pill" data-bs-target="#login" type="button" role="tab">Login</button>');
        // Fix Register tab
        content = content.replace(/<button class="nav-link" id="register-tab".*?>Register<\/button>/, '<button class="nav-link" id="register-tab" data-bs-toggle="pill" data-bs-target="#register" type="button" role="tab">Join Now</button>');
        
        // Also fix the form button if it says Register
        content = content.replace(/<i class="fas fa-user-check"><\/i> Register Securely/g, '<i class="fas fa-user-check"></i> Join Now (Pay ₹499)');
    }

    // 3. Fix navbars in ALL files
    // Replace the single btn-join li with Login and Join Now
    const singleJoinRegex = /<li class="nav-item">\s*<a class="nav-link btn-join" href="register\.html".*?<\/li>/s;
    const newAuthLinks = `                <li class="nav-item">
                    <a class="nav-link" href="register.html">Login</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link btn-join" href="register.html"><i class="fas fa-user-plus"></i> Join Now</a>
                </li>`;
                
    if (singleJoinRegex.test(content)) {
        content = content.replace(singleJoinRegex, newAuthLinks);
    }

    if (content !== original) {
        fs.writeFileSync(path.join(dir, file), content);
        console.log(`Updated ${file}`);
    }
});
