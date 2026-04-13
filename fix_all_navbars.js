const fs = require('fs');
const path = require('path');

// Pages and their "active" nav item
const pages = {
    'index.html':         'home',
    'about.html':         'about',
    'products.html':      'products',
    'cart.html':          'cart',
    'checkout.html':      'cart',
    'product-detail.html':'products',
    'register.html':      'none',
    'verify-otp.html':    'none',
};

const STANDARD_NAVBAR = (activePage) => {
    const homeActive     = activePage === 'home'     ? 'active' : '';
    const productsActive = activePage === 'products' ? 'active' : '';
    const aboutActive    = activePage === 'about'    ? 'active' : '';
    const cartActive     = activePage === 'cart'     ? 'active' : '';

    return `<!-- Navbar -->
<nav class="navbar navbar-expand-lg sticky-top">
    <div class="container">
        <a class="navbar-brand fw-bold d-flex align-items-center" href="index.html">
            <img src="site-logo.jpg" alt="Logo" style="height: 48px; border-radius: 6px; background: white; padding: 2px; margin-right: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            PEOPLE PLUS NETWORK
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon bg-white rounded"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item">
                    <a class="nav-link ${homeActive}" href="index.html">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link ${productsActive}" href="products.html">Products</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link ${aboutActive}" href="about.html">About</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link ${cartActive}" href="cart.html"><i class="fas fa-shopping-cart"></i> Cart <span id="cartCount" class="badge bg-danger">0</span></a>
                </li>
                <li class="nav-item">
                    <div class="dropdown">
                        <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false" style="padding: 5px 15px;">
                            <img src="default-avatar.png" style="width: 35px; height: 35px; border-radius: 50%; border: 2px solid #ccc; object-fit: cover;" alt="Guest Avatar">
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3" aria-labelledby="userMenu">
                            <li><a class="dropdown-item fw-bold" href="register.html" style="color: #667eea;"><i class="fas fa-user-plus me-2"></i> Join Now / Login</a></li>
                        </ul>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</nav>`;
};

const NAVBAR_CSS = `
        /* Navbar */
        .navbar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
            padding: 1rem 0;
        }
        .navbar-brand {
            font-size: 1.5rem;
            font-weight: 800;
            color: white !important;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .nav-link {
            color: white !important;
            font-weight: 500;
            transition: all 0.3s ease;
            margin: 0 5px;
            position: relative;
        }
        .nav-link:hover {
            color: #ffd700 !important;
        }
        .nav-link.active {
            color: #ffd700 !important;
            font-weight: 700;
        }
        .nav-link.active::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            right: 0;
            height: 2px;
            background: #ffd700;
            border-radius: 2px;
        }
        .btn-join {
            background: #ffd700;
            color: #333 !important;
            border-radius: 50px;
            padding: 8px 25px !important;
        }`;

for (const [file, activePage] of Object.entries(pages)) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping (not found): ${file}`);
        continue;
    }

    let html = fs.readFileSync(filePath, 'utf8');

    // --- 1. Replace/inject navbar CSS ---
    // Remove existing navbar css block if present and add fresh one
    html = html.replace(/\/\* Navbar \*\/[\s\S]*?\.btn-join[^}]*\}/g, '');
    // Inject into existing <style> or add before </head>
    if (html.includes('<style>')) {
        html = html.replace('<style>', '<style>' + NAVBAR_CSS);
    } else {
        html = html.replace('</head>', `<style>${NAVBAR_CSS}</style>\n</head>`);
    }

    // --- 2. Replace entire <nav>...</nav> block ---
    const navRegex = /<!--\s*Navbar\s*-->[\s\S]*?<\/nav>/i;
    const newNav = STANDARD_NAVBAR(activePage);

    if (navRegex.test(html)) {
        html = html.replace(navRegex, newNav);
    } else {
        // inject right after <body>
        html = html.replace('<body>', '<body>\n\n' + newNav + '\n');
    }

    // --- 3. Ensure auth-check.js is included before </body> ---
    if (!html.includes('auth-check.js')) {
        html = html.replace('</body>', '    <script src="auth-check.js"></script>\n</body>');
    }

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Updated: ${file} (active: ${activePage})`);
}

console.log('\n✅ All navbars updated!');
