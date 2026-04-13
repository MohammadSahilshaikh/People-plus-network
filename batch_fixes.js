const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\People plus network';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // 1. Add global style.css link if not present
    if (!content.includes('style.css')) {
        content = content.replace('</head>', '    <link rel="stylesheet" href="style.css">\\n</head>');
    }
    
    // 2. Add table-responsive to all tables if missing
    content = content.replace(/<table/g, '<div class="table-responsive"><table');
    content = content.replace(/<\/table>/g, '</table></div>');
    // Fix double wrapping
    content = content.replace(/<div class="table-responsive"><div class="table-responsive">/g, '<div class="table-responsive">');
    content = content.replace(/<\/div><\/div>/g, '</div>');

    // 3. Inject dynamic user info classes where static info was hardcoded
    // Fix names like "Rajesh Kumar" or "Admin User"
    content = content.replace(/Rajesh Kumar/g, '<span class="display-user-name">Rajesh Kumar</span>');
    content = content.replace(/PPN10001/g, '<span class="display-user-id">PPN10001</span>');
    
    // 4. Improve navbarbrand on mobile (make it slightly smaller / responsive)
    content = content.replace(/navbar-brand/g, 'navbar-brand fw-bold');
    
    // 5. Ensure all admin sidebars are responsive
    if (file.includes('admin')) {
        content = content.replace(/admin-sidebar/g, 'admin-sidebar sidebar');
    }

    fs.writeFileSync(fullPath, content);
    console.log(`Processed ${file}`);
});
