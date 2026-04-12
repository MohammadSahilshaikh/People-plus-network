const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    let original = content;

    // Remove the explicit Login link from all navbars
    const loginNavRegex = /<li class="nav-item">\s*<a class="nav-link" href="register\.html">Login<\/a>\s*<\/li>/g;
    content = content.replace(loginNavRegex, '');

    if (content !== original) {
        fs.writeFileSync(path.join(dir, file), content);
        console.log(`Updated ${file}`);
    }
});
