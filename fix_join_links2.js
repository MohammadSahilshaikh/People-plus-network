const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\People plus network';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let filePath = path.join(dir, file);
    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;
    
    // Finding standard Join Now buttons
    // Format 1: <a href="blabla" class="..."> <i class="..."></i> Join Now </a>
    // Format 2: <a ... href="blabla">Join Now</a>
    // Format 3: <a ... href="blabla"><i class="fas fa-user-plus"></i>Join Now</a>
    const anchorRegex = /<a\s+([^>]*?)href=["'][^"']*["']([^>]*?)>((?:[^<]+|<(?!\/a>))+?)<\/a>/gi;
    
    content = content.replace(anchorRegex, (match, prefix, suffix, innerHTML) => {
        // If the inner HTML text content contains "Join Now" or "Login / Join"
        if (innerHTML.match(/Join\s*Now/i) || innerHTML.match(/Login\s*\/\s*Join/i)) {
            return '<a ' + prefix + 'href="register.html"' + suffix + '>' + innerHTML + '</a>';
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log("Updated Join links in " + file);
    }
});
