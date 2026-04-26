const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (path.extname(file) === '.html') {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Replace firebase-config.js script tag
        if (content.includes('<script src="js/firebase-config.js"></script>')) {
            content = content.replace('<script src="js/firebase-config.js"></script>', '<script type="module" src="js/firebase-config.js"></script>');
            modified = true;
        }

        // Replace auth.js script tag
        if (content.includes('<script src="js/auth.js"></script>')) {
            content = content.replace('<script src="js/auth.js"></script>', '<script type="module" src="js/auth.js"></script>');
            modified = true;
        }
        
        // Also ensure inline scripts after auth.js or firebase-config.js are modules
        // Only if they contain logic that uses vars
        if (modified) {
            content = content.replace(/<script>\s*const currentUser/g, '<script type="module">\n    const currentUser');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${file}`);
        }
    }
});
