const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\People plus network';
const files = ['register.html', 'admin-login.html'];

files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (!fs.existsSync(fullPath)) return;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace alert(data.error || '...') with something more informative
    content = content.replace(/alert\(data\.error\s*\|\|\s*['"]Login failed['"]\)/g, "alert(data.error ? 'Error: ' + data.error : 'Login failed. Check server status.')");
    content = content.replace(/alert\(['"]Login failed! Check credentials\.['"]\)/g, "alert(data.error ? 'Error: ' + data.error : 'Invalid credentials')");

    fs.writeFileSync(fullPath, content);
    console.log(`Improved feedback in ${file}`);
});
