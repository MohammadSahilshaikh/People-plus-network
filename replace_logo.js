const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\People plus network';
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

htmlFiles.forEach(file => {
    let filePath = path.join(dir, file);
    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;
    
    // Replace top navbar brand
    const brandRegex = /<a class="navbar-brand" href="index\\.html">\\s*<i class="fas fa-users"><\\/i>\\s*PEOPLE PLUS NETWORK\\s*<\\/a>/g;
    content = content.replace(brandRegex, '<a class="navbar-brand d-flex align-items-center" href="index.html"><img src="site-logo.jpg" alt="People Plus Network" style="height: 50px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: white; padding: 2px;"></a>');
    
    // Replace user dashboard sidebar brand
    const sidebarBrandRegex = /<h3><i class="fas fa-users"><\\/i>\\s*PeoplePlus<\\/h3>/g;
    content = content.replace(sidebarBrandRegex, '<h3 class="d-flex align-items-center justify-content-center"><img src="site-logo.jpg" alt="People Plus" style="height: 40px; border-radius: 5px; margin-right: 10px; background: white; padding: 2px;"> PeoplePlus</h3>');

    // Checkout page might have the brand regex if standard navbar wasn't exact, or we just do a more generic replace
    const genericNavbarRegex = /<a class="navbar-brand" href="index\\.html"><i class="fas fa-users"><\\/i> PEOPLE PLUS NETWORK<\\/a>/g;
    content = content.replace(genericNavbarRegex, '<a class="navbar-brand" href="index.html"><img src="site-logo.jpg" alt="Logo" style="height: 50px; border-radius: 8px; background: white; padding: 2px;"></a>');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        updatedCount++;
        console.log("Updated logo in: " + file);
    }
});

console.log("Total files updated with new logo: " + updatedCount);
