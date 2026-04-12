const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const standardNavbar = `            <ul class="navbar-nav ms-auto">
                <li class="nav-item">
                    <a class="nav-link" href="index.html">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="products.html">Products</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="blog.html">Blog</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="about.html">About</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="cart.html"><i class="fas fa-shopping-cart"></i> Cart <span id="cartCount" class="badge bg-danger">0</span></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link btn-join" href="register.html"><i class="fas fa-user-plus"></i> Join Now</a>
                </li>
            </ul>`;

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    let original = content;

    // Replace entire navbar ul with standard set
    const navUlRegex = /<ul class="navbar-nav ms-auto">.*?<\/ul>/s;
    if (navUlRegex.test(content)) {
        content = content.replace(navUlRegex, standardNavbar);
    }
    
    // Some footers have 'login.html' or random links.
    // Replace Login link in footer
    content = content.replace(/<li><a href="login\.html">.*?<\/a><\/li>/g, '');
    
    // Replace WhatsApp links
    // Catch existing wa.me links
    content = content.replace(/href="https:\/\/wa\.me\/[0-9]+"/g, 'href="https://wa.me/qr/IG74VRFZSKIRN1"');
    content = content.replace(/href="https:\/\/wa\.me\/[A-Za-z0-9]+"/g, 'href="https://wa.me/qr/IG74VRFZSKIRN1"');
    
    // Change "Login / Join" buttons to "Join Now"
    content = content.replace(/>\s*Login \/ Join\s*</g, '>Join Now<');
    content = content.replace(/"Login \/ Join"/g, '"Join Now"');
    
    // Change "Join - It's Free" to "Join Now" 
    content = content.replace(/>\s*Join - It's Free!\s*</ig, '>Join Now<');
    content = content.replace(/>\s*Join Now - It's Free!\s*</ig, '>Join Now<');

    // Remove any text like "Login" inside CTA buttons
    content = content.replace(/>\s*Login\s*</g, '>Join Now<'); // only where it might have been missed in CTA usually

    if (content !== original) {
        fs.writeFileSync(path.join(dir, file), content);
        console.log(`Updated ${file}`);
    }
});
