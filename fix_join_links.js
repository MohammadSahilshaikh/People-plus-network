const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\People plus network';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let totalReplacements = 0;

files.forEach(file => {
    let filePath = path.join(dir, file);
    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;
    
    // We want to find anchor tags containing "Join Now" or "Join the Network" or just "Join"
    // and ensure their href is "register.html" if it's currently "#" or index or something else.
    // Example: <a class="..." href="#">Join Now</a>
    
    // Replace all href="..." where it's immediately followed by "Join" inside the tag.
    // This regex matches <a ... href="SOMETHING" ...> ... Join ... </a>
    // We'll replace the href part.
    // Simpler regex for `<a href="#">Join the Network</a>`
    content = content.replace(/<(a\s+[^>]*?href=)["'][^"']*?["']([^>]*?>\s*(?:<i[^>]*><\/i>\s*)?Join\s+the\s+Network\s*<\/a>)/gi, '<$1"register.html"$2');
    
    content = content.replace(/<(a\s+[^>]*?href=)["'][^"']*?["']([^>]*?>\s*(?:<i[^>]*><\/i>\s*)?Join\s+Now\s*<\/a>)/gi, '<$1"register.html"$2');
    
    content = content.replace(/<(button\s+[^>]*?)>\s*Join\s+the\s+Network\s*<\/button>/gi, '<a href="register.html" $1 style="display:inline-block; text-decoration:none;">Join the Network</a>');
    
    content = content.replace(/<(button\s+[^>]*?)>\s*Join\s+Now\s*<\/button>/gi, '<a href="register.html" $1 style="display:inline-block; text-decoration:none;">Join Now</a>');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        totalReplacements++;
        console.log("Updated links in " + file);
    }
});

console.log("Total files updated with Join links: " + totalReplacements);
