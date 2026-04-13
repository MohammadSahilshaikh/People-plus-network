const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\People plus network';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix logo casing error
    content = content.replace(/Site-Logo\.jpg/g, 'site-logo.jpg');
    
    // Fix Dashboard link consistency
    content = content.replace(/admin-index\.html/g, 'admin.html');
    
    // Remove old inline media queries that might conflict
    content = content.replace(/@media \(max-width: 768px\) \{[\s\S]*?sidebar[\s\S]*?\}/g, '');
    
    // Ensure all sidebars have the 'sidebar' class for style.css to pick up
    content = content.replace(/class="sidebar"/g, 'class="sidebar"'); // Already correct usually
    content = content.replace(/class="admin-sidebar/g, 'class="admin-sidebar sidebar');
    
    // Ensure Navbar toggler color is visible
    content = content.replace(/navbar-toggler-icon/g, 'navbar-toggler-icon bg-white rounded');

    // Remove some hardcoded inline styles from tables that break responsiveness
    content = content.replace(/style="width:\s*100%;"/g, '');

    fs.writeFileSync(fullPath, content);
});
console.log('Final polish complete!');
