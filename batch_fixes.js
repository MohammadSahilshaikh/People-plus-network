const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    let original = content;

    // 1. Change "Login / Join" to "Join"
    content = content.replace(/>Login \/ Join</g, '>Join<');

    // 2. Add About link to navbar if missing
    // Find where the Cart or Blog is, and insert About.
    if (!content.includes('<a class="nav-link" href="about.html">About</a>')) {
        // Find Blog or another nav-item to insert after
        content = content.replace(
            /(<li class="nav-item">\s*<a class="nav-link" href="blog\.html".*?<\/a>\s*<\/li>)/,
            '$1\n                <li class="nav-item">\n                    <a class="nav-link" href="about.html">About</a>\n                </li>'
        );
    }
    
    // In case there is no Blog, find Products
    if (!content.includes('<a class="nav-link" href="about.html">About</a>')) {
        content = content.replace(
            /(<li class="nav-item">\s*<a class="nav-link" href="products\.html".*?<\/a>\s*<\/li>)/,
            '$1\n                <li class="nav-item">\n                    <a class="nav-link" href="about.html">About</a>\n                </li>'
        );
    }

    // 3. Update WhatsApp links
    // Update any wa.me link
    content = content.replace(/href="https:\/\/wa\.me\/[0-9]+"/g, 'href="https://wa.me/918235772175"');
    
    // Update footer WhatsApp phone numbers if any
    content = content.replace(/\+91\s*98765\s*43210/g, '+91 82357 72175');

    if (content !== original) {
        fs.writeFileSync(path.join(dir, file), content);
        console.log(`Updated ${file}`);
    }
});

// Specific fix for about.html (Fixing duplicate HTML and changing founder)
let aboutContent = fs.readFileSync(path.join(dir, 'about.html'), 'utf8');

// The user diff accidentally duplicated the whole document.
// Let's just catch the first </html> and truncate the rest.
const endTagIndex = aboutContent.indexOf('</html>');
if (endTagIndex !== -1) {
    aboutContent = aboutContent.substring(0, endTagIndex + 7);
}

// Change Rajesh Sharma to MOHAMMAD ASHRAF
aboutContent = aboutContent.replace(/Rajesh Sharma/g, 'MOHAMMAD ASHRAF');

fs.writeFileSync(path.join(dir, 'about.html'), aboutContent);
console.log('Fixed about.html specific data.');
