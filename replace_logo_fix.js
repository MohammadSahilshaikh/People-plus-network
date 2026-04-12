const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\People plus network';
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

htmlFiles.forEach(file => {
    let filePath = path.join(dir, file);
    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;
    
    // Top Navbar
    content = content.replace(/<a class="navbar-brand" href="index\.html">\s*<i class="fas fa-users"><\/i>\s*PEOPLE PLUS NETWORK\s*<\/a>/g, 
        '<a class="navbar-brand d-flex align-items-center" href="index.html"><img src="site-logo.jpg" alt="People Plus Network" style="height: 50px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: white; padding: 2px;"></a>');
        
    // Checkout specific
    content = content.replace(/<a class="navbar-brand" href="index\.html"><i class="fas fa-users"><\/i> PEOPLE PLUS NETWORK<\/a>/g, 
        '<a class="navbar-brand" href="index.html"><img src="site-logo.jpg" alt="Logo" style="height: 50px; border-radius: 8px; background: white; padding: 2px;"></a>');
        
    // Sidebar
    content = content.replace(/<h3><i class="fas fa-users"><\/i>\s*PeoplePlus<\/h3>/g, 
        '<h3 class="d-flex align-items-center justify-content-center"><img src="site-logo.jpg" alt="People Plus" style="height: 40px; border-radius: 5px; margin-right: 10px; background: white; padding: 2px;"> PeoplePlus</h3>');

    // Admin Sidebar (usually has a brand div)
    content = content.replace(/<h3><i class="fas fa-users"><\/i>\s*Admin Panel<\/h3>/g, 
        '<h3 class="d-flex align-items-center justify-content-center"><img src="site-logo.jpg" alt="Logo" style="height: 40px; border-radius: 5px; margin-right: 10px; background: white; padding: 2px;"> Admin</h3>');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        updatedCount++;
        console.log("Updated logo in: " + file);
    }
});

console.log("Total files updated with new logo: " + updatedCount);
