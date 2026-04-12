const fs = require('fs');
const path = require('path');

const dir = __dirname;
const filesToDelete = [
    'blog.html',
    'blog-single.html',
    'admin-blogs.html'
];

// Delete files
filesToDelete.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted ${file}`);
    }
});

// Remove blog links from all HTML files
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    let original = content;

    // Remove Top Navbar Blog link
    const navbarBlogRegex = /<li class="nav-item">\s*<a class="nav-link" href="blog\.html">Blog<\/a>\s*<\/li>/g;
    content = content.replace(navbarBlogRegex, '');

    // Remove Admin Sidebar Blog link
    const adminSidebarBlogRegex = /<a class="nav-link.*?" href="admin-blogs\.html">.*?Blogs<\/a>/g;
    content = content.replace(adminSidebarBlogRegex, '');

    if (content !== original) {
        fs.writeFileSync(path.join(dir, file), content);
        console.log(`Removed blog links from ${file}`);
    }
});
