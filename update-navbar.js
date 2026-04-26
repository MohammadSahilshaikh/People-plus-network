const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (path.extname(file) === '.html') {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        let modified = false;

        // Pattern for the original navbar toggler and collapse
        const togglerRegex = /<button class="navbar-toggler"[\s\S]*?<\/button>/;
        const navLinksRegex = /<li class="nav-item"><a class="nav-link" href="cart\.html"><i class="fas fa-shopping-cart"><\/i> Cart <span id="cartCount" class="badge bg-danger">0<\/span><\/a><\/li>\s*<li class="nav-item">\s*<div class="dropdown">[\s\S]*?<\/div>\s*<\/li>/;

        // If toggler exists, we process
        if (content.match(togglerRegex) && content.includes('<div class="collapse navbar-collapse" id="navbarNav">')) {
            content = content.replace(togglerRegex, '');
            
            // Extract cart and dropdown
            let cartAndAvatar = "";
            content = content.replace(/<li class="nav-item">\s*<a class="nav-link.*?" href="cart\.html">[\s\S]*?<\/a>\s*<\/li>\s*<li class="nav-item" id="userNavItem">[\s\S]*?<\/li>/, match => {
                cartAndAvatar = match;
                return ''; // Remove from UL
            });
            content = content.replace(/<li class="nav-item">\s*<a class="nav-link.*?" href="cart\.html">[\s\S]*?<\/a>\s*<\/li>\s*<li class="nav-item">\s*<div class="dropdown">[\s\S]*?<\/div>\s*<\/li>/, match => {
                cartAndAvatar = match;
                return ''; // Remove from UL
            });
            
            if (cartAndAvatar) {
                // Remove the <li> wrapping from cartAndAvatar
                cartAndAvatar = cartAndAvatar.replace(/<li class="nav-item">([\s\S]*?)<\/li>/g, '$1');
                
                // Add right container before <div class="collapse
                const rightContainer = `
            <div class="d-flex align-items-center order-lg-last ms-auto ms-lg-0 gap-3">
                ${cartAndAvatar}
            </div>
            `;
                content = content.replace('<div class="collapse navbar-collapse"', rightContainer + '<div class="collapse navbar-collapse d-none d-lg-block"');
                
                // Change ms-auto to mx-auto in navbar-nav
                content = content.replace('<ul class="navbar-nav ms-auto">', '<ul class="navbar-nav mx-auto">');
                
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated navbar in ${file}`);
        }
    }
});
