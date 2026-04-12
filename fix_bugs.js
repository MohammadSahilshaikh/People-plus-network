const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\People plus network';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let filePath = path.join(dir, file);
    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;
    
    // Fix Hero pointer-events so buttons become clickable
    content = content.replace(/\.hero::before\s*\{[\s\S]*?opacity:\s*[\d\.]+;/g, match => {
        if (!match.includes('pointer-events')) {
            return match + '\\n            pointer-events: none;';
        }
        return match;
    });

    // Fix QR Code in register.html (or any other file if present)
    content = content.replace(/<img src="qr-code\.(png|jpg)" alt="Payment QR Code"/g, '<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=paytmqr2810050501011sq8k6p1f3k2@paytm" alt="Payment QR Code"');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log("Fixed issues in " + file);
    }
});
