const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    let original = content;

    // 1. Rename PEOPLE PLUS to People Plus Network in the navbar brand
    content = content.replace(/<i class="fas fa-users"><\/i>\s*PEOPLE PLUS/g, '<i class="fas fa-users"></i> PEOPLE PLUS NETWORK');
    
    // In index.html, make "1. JOIN" card a clickable link to register.html
    if (file === 'index.html') {
        const joinCardRegex = /<div class="step-card">(\s*<div class="step-icon bg-primary text-white">.*?<\/i>\s*<\/div>\s*<h4>1\. JOIN<\/h4>\s*<p>Become a member with a simple registration<\/p>\s*)<\/div>/s;
        if (joinCardRegex.test(content)) {
            content = content.replace(joinCardRegex, '<a href="register.html" style="text-decoration:none; color:inherit; display:block;"><div class="step-card" style="transition: transform 0.3s; cursor: pointer;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'">$1<p class="text-primary mt-2"><strong>Join Now &rarr;</strong></p></div></a>');
        }
    }

    // Rewrite products.html layout completely
    if (file === 'products.html') {
        // Remove Sidebar completely
        const sidebarRegex = /<div class="col-lg-3">.*?<div class="col-lg-9">/s;
        content = content.replace(sidebarRegex, '<div class="col-lg-12">');
        
        // Find the start of Products Section
        const productsSectionRegex = /<!-- Products Section -->\s*<section class="container my-5">/s;
        
        const sortAndCategoriesHtml = `<!-- Products Section -->
<section class="container my-5">
    <!-- Top Filter & Category Bar -->
    <div class="row mb-4 align-items-center">
        <!-- Sort By Dropdown -->
        <div class="col-md-3 mb-3 mb-md-0">
            <label class="fw-bold mb-2">Refine</label>
            <select class="form-select border-primary shadow-sm">
                <option value="relevance">Sort by: Relevance</option>
                <option value="popularity">Sort by: Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
            </select>
        </div>
        
        <!-- Horizontal Categories with Images -->
        <div class="col-md-9">
            <div class="d-flex overflow-auto gap-3 pb-2" style="scrollbar-width: thin;">
                
                <a href="#" class="text-decoration-none text-center bg-white p-2 rounded shadow-sm border" style="min-width: 120px; transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <img src="https://via.placeholder.com/60x60/667eea/ffffff?text=All" class="rounded-circle mb-2" alt="All">
                    <h6 class="text-dark small m-0 fw-bold">All Products</h6>
                </a>
                
                <a href="#" class="text-decoration-none text-center bg-white p-2 rounded shadow-sm border" style="min-width: 120px; transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <img src="https://via.placeholder.com/60x60/11998e/ffffff?text=Health" class="rounded-circle mb-2" alt="Health">
                    <h6 class="text-dark small m-0 fw-bold">Health Sup.</h6>
                </a>
                
                <a href="#" class="text-decoration-none text-center bg-white p-2 rounded shadow-sm border" style="min-width: 120px; transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <img src="https://via.placeholder.com/60x60/ff9900/ffffff?text=Ayur" class="rounded-circle mb-2" alt="Ayur">
                    <h6 class="text-dark small m-0 fw-bold">Ayurvedic</h6>
                </a>
                
                <a href="#" class="text-decoration-none text-center bg-white p-2 rounded shadow-sm border" style="min-width: 120px; transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <img src="https://via.placeholder.com/60x60/764ba2/ffffff?text=Teas" class="rounded-circle mb-2" alt="Teas">
                    <h6 class="text-dark small m-0 fw-bold">Herbal Teas</h6>
                </a>
                
                <a href="#" class="text-decoration-none text-center bg-white p-2 rounded shadow-sm border" style="min-width: 120px; transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <img src="https://via.placeholder.com/60x60/e83e8c/ffffff?text=Skin" class="rounded-circle mb-2" alt="Skin">
                    <h6 class="text-dark small m-0 fw-bold">Skin Care</h6>
                </a>
                
                <a href="#" class="text-decoration-none text-center bg-white p-2 rounded shadow-sm border" style="min-width: 120px; transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <img src="https://via.placeholder.com/60x60/28a745/ffffff?text=Nutri" class="rounded-circle mb-2" alt="Nutri">
                    <h6 class="text-dark small m-0 fw-bold">Nutrition</h6>
                </a>
                
            </div>
        </div>
    </div>`;
        content = content.replace(productsSectionRegex, sortAndCategoriesHtml);
        
        // Also fix the grid to use col-md-3 instead of col-md-4 since it's full width now
        content = content.replace(/col-md-4 col-sm-6/g, 'col-lg-3 col-md-4 col-sm-6');
    }

    if (content !== original) {
        fs.writeFileSync(path.join(dir, file), content);
        console.log(`Updated ${file}`);
    }
});
