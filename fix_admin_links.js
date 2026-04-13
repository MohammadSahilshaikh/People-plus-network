const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\People plus network';
const adminFiles = ['admin.html', 'admin-users.html', 'admin-products.html', 'admin-orders.html', 'admin-withdrawals.html'];

adminFiles.forEach(file => {
    const fullPath = path.join(dir, file);
    if (!fs.existsSync(fullPath)) return;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix dashboard link
    content = content.replace(/href="admin-index\.html"/g, 'href="admin.html"');
    
    // Fix logout link
    content = content.replace(/href="login\.html"/g, 'href="#" onclick="logoutUser(event)"');
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed links in ${file}`);
});
