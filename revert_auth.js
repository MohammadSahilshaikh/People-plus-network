const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\People plus network';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let filePath = path.join(dir, file);
    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;
    
    // Remove auth-check.js script tag
    content = content.replace(/<script src="auth-check\.js"><\/script>/g, '');
    
    // Also remove any dropdown injections that might have been hardcoded if they were part of the change
    // but usually they were dynamic.
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log("Removed auth-check.js from " + file);
    }
});
