const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\People plus network';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

// 1. Fix the index.html corruption directly
const indexPath = path.join(dir, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');
const fixRegex = /<\/head>[\\s\\S]*?<\/head>/;
if (indexContent.match(fixRegex)) {
    indexContent = indexContent.replace(fixRegex, '</head>');
    fs.writeFileSync(indexPath, indexContent);
    console.log('Fixed index.html structure');
}

// 2. Add text back to logos globally
files.forEach(file => {
    let filePath = path.join(dir, file);
    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;
    
    // Pattern 1: d-flex align-items-center version
    const p1 = /<a class="navbar-brand d-flex align-items-center" href="index\.html">\s*<img src="site-logo\.jpg" alt="People Plus Network" style="height: 50px; border-radius: 8px; box-shadow: 0 2px 4px rgba\(0,0,0,0\.1\); background: white; padding: 2px;">\s*<\/a>/g;
    content = content.replace(p1, '<a class="navbar-brand d-flex align-items-center" href="index.html"><img src="site-logo.jpg" alt="Logo" style="height: 48px; border-radius: 6px; background: white; padding: 2px; margin-right: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"> PEOPLE PLUS NETWORK</a>');
    
    // Pattern 2: generic version
    const p2 = /<a class="navbar-brand" href="index\.html">\s*<img src="site-logo\.jpg" alt="Logo" style="height: 50px; border-radius: 8px; background: white; padding: 2px;">\s*<\/a>/g;
    content = content.replace(p2, '<a class="navbar-brand" href="index.html"><img src="site-logo.jpg" alt="Logo" style="height: 48px; border-radius: 6px; background: white; padding: 2px; margin-right: 12px;"> PEOPLE PLUS NETWORK</a>');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log("Restored logo text in " + file);
    }
});
