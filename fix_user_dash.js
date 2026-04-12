const fs = require('fs');
const path = require('path');

const dir = __dirname;

// Rename typo file
const oldGenealogyPath = path.join(dir, 'user-generalogy.html');
const newGenealogyPath = path.join(dir, 'user-genealogy.html');
if (fs.existsSync(oldGenealogyPath)) {
    fs.renameSync(oldGenealogyPath, newGenealogyPath);
    console.log('Renamed user-generalogy.html to user-genealogy.html');
}

const userFiles = [
    'user-dashboard.html',
    'user-team.html',
    'user-genealogy.html',
    'user-commissions.html',
    'user-withdrawal.html',
    'user-orders.html',
    'user-profile.html'
];

const standardNavbar = '<!-- Navbar -->\n' +
'<nav class="navbar navbar-expand-lg sticky-top">\n' +
'    <div class="container">\n' +
'        <a class="navbar-brand" href="index.html"><i class="fas fa-users"></i> PEOPLE PLUS NETWORK</a>\n' +
'        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">\n' +
'            <span class="navbar-toggler-icon bg-white rounded"></span>\n' +
'        </button>\n' +
'        <div class="collapse navbar-collapse" id="navbarNav">\n' +
'            <ul class="navbar-nav ms-auto">\n' +
'                <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>\n' +
'                <li class="nav-item"><a class="nav-link" href="products.html">Products</a></li>\n' +
'                <li class="nav-item"><a class="nav-link" href="blog.html">Blog</a></li>\n' +
'                <li class="nav-item"><a class="nav-link" href="about.html">About</a></li>\n' +
'                <li class="nav-item"><a class="nav-link" href="cart.html"><i class="fas fa-shopping-cart"></i> Cart <span id="cartCount" class="badge bg-danger">0</span></a></li>\n' +
'                <li class="nav-item"><a class="nav-link btn-join" href="register.html"><i class="fas fa-user-plus"></i> Join Now</a></li>\n' +
'            </ul>\n' +
'        </div>\n' +
'    </div>\n' +
'</nav>';

const createSidebar = (currentFile) => '            <div class="sidebar">\n' +
'                <div class="text-center mb-3">\n' +
'                    <img src="https://randomuser.me/api/portraits/men/32.jpg" class="rounded-circle" width="80" alt="User">\n' +
'                    <h5 class="mt-2">Rajesh Kumar</h5>\n' +
'                    <p class="text-muted small">Member ID: PPN10001</p>\n' +
'                    <span class="badge bg-success">Active</span>\n' +
'                </div>\n' +
'                <hr>\n' +
'                <nav class="nav flex-column">\n' +
'                    <a class="nav-link ' + (currentFile === 'user-dashboard.html' ? 'active' : '') + '" href="user-dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>\n' +
'                    <a class="nav-link ' + (currentFile === 'user-team.html' ? 'active' : '') + '" href="user-team.html"><i class="fas fa-users"></i> My Team</a>\n' +
'                    <a class="nav-link ' + (currentFile === 'user-genealogy.html' ? 'active' : '') + '" href="user-genealogy.html"><i class="fas fa-code-branch"></i> Genealogy Tree</a>\n' +
'                    <a class="nav-link ' + (currentFile === 'user-commissions.html' ? 'active' : '') + '" href="user-commissions.html"><i class="fas fa-coins"></i> Commissions</a>\n' +
'                    <a class="nav-link ' + (currentFile === 'user-withdrawal.html' ? 'active' : '') + '" href="user-withdrawal.html"><i class="fas fa-money-bill-wave"></i> Withdraw</a>\n' +
'                    <a class="nav-link ' + (currentFile === 'user-orders.html' ? 'active' : '') + '" href="user-orders.html"><i class="fas fa-shopping-cart"></i> My Orders</a>\n' +
'                    <a class="nav-link ' + (currentFile === 'user-profile.html' ? 'active' : '') + '" href="user-profile.html"><i class="fas fa-user-edit"></i> Profile</a>\n' +
'                </nav>\n' +
'            </div>\n';

userFiles.forEach(file => {
    let filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) {
        console.log("File " + file + " does not exist. Skipping...");
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    content = content.replace(/<nav class="navbar navbar-expand-lg sticky-top">[\s\S]*?<\/nav>/, standardNavbar);
    content = content.replace(/<\/ul>\s*<\/li>\s*<\/ul>/g, '</ul>');
    
    const sidebarRegex = /<div class="sidebar">[\s\S]*?<\/div>\s*<\/div>\s*<div class="col-md-9">/;
    if (content.match(sidebarRegex)) {
        content = content.replace(sidebarRegex, createSidebar(file) + '        </div>\n        <div class="col-md-9">');
    }
    
    fs.writeFileSync(filePath, content);
    console.log("Fixed " + file);
});
