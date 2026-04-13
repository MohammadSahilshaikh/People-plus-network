const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.');
files.filter(f => f.startsWith('admin') && f.endsWith('.html')).forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Remove Blog link from sidebar
    content = content.replace(/<a class="nav-link" href="admin-blogs\.html">[\s\S]*?<\/a>/gi, '');
    
    // Add Logo to sidebar brand if missing
    if (!content.includes('site-logo.jpg')) {
        content = content.replace(/<div class="brand">([\s\S]*?)<\/div>/i, (match, inner) => {
            return `<div class="brand text-center p-3">
                <img src="site-logo.jpg" alt="Logo" style="height: 50px; border-radius: 8px; margin-bottom: 10px; background: white; padding: 2px;">
                <h3 class="text-white mb-0">PeoplePlus</h3>
                <small class="opacity-75">Admin Panel</small>
            </div>`;
        });
    }

    fs.writeFileSync(f, content);
    console.log(`Cleaned ${f}`);
});
