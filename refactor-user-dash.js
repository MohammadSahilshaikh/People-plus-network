const fs = require('fs');
const path = require('path');

const dir = __dirname;
const userFiles = [
    'user-dashboard.html',
    'user-profile.html',
    'user-team.html',
    'user-commissions.html',
    'user-withdrawal.html',
    'user-orders.html'
];

userFiles.forEach(file => {
    let filePath = path.join(dir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Extract sidebar links block correctly before doing heavy replacements
        let activeLink = file;
        
        // 1. Remove the large Navbar code entirely since we are using fixed sidebar now
        content = content.replace(/<nav class="navbar navbar-expand-lg sticky-top">[\s\S]*?<\/nav>/i, '');

        // 2. Add New Styles matching Admin Sidebar
        const newStyles = `
        /* User Sidebar Dashboard Layout */
        .user-sidebar {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            color: white;
            position: fixed;
            left: 0;
            top: 0;
            width: 260px;
            transition: all 0.3s;
            z-index: 1000;
            box-shadow: 4px 0 15px rgba(0,0,0,0.1);
            overflow-y: auto;
        }
        .user-sidebar .brand {
            padding: 25px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            background: rgba(0,0,0,0.2);
        }
        .user-sidebar .brand img {
            height: 50px;
            border-radius: 8px;
            margin-bottom: 10px;
            background: white;
            padding: 2px;
        }
        .user-sidebar .nav-link {
            color: rgba(255,255,255,0.7) !important;
            padding: 12px 25px;
            margin: 5px 10px;
            border-radius: 10px;
            text-decoration: none;
            display: block;
            font-size: 14px;
            transition: all 0.3s;
        }
        .user-sidebar .nav-link:hover,
        .user-sidebar .nav-link.active {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white !important;
            transform: translateX(5px);
        }
        .user-sidebar .nav-link i { width: 25px; margin-right: 10px; }
        
        .user-content {
            margin-left: 260px;
            padding: 20px;
        }
        .user-header {
            background: white;
            padding: 15px 20px;
            border-radius: 15px;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .sidebar-toggle { display: none; }
        
        @media (max-width: 992px) {
            .user-sidebar { transform: translateX(-100%); }
            .user-sidebar.show { transform: translateX(0); }
            .user-content { margin-left: 0; padding: 15px; }
            .sidebar-toggle { display: inline-block; }
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #667eea; border-radius: 5px; }
        `;
        
        if (!content.includes('.user-sidebar {')) {
            content = content.replace('</style>', newStyles + '\\n</style>');
        }

        // 3. Rebuild the Body Layout
        const sidebarHTML = `
<!-- User Sidebar -->
<div class="user-sidebar" id="userSidebar">
    <div class="brand">
        <a href="index.html"><img src="img/site-logo.jpg" alt="Logo"></a>
        <h5 class="text-white mt-2 mb-0">PeoplePlus</h5>
        <small class="text-white-50">Member Area</small>
    </div>
    <div class="text-center py-3 border-bottom" style="border-color: rgba(255,255,255,0.1) !important;">
        <img src="img/default-avatar.png" class="rounded-circle" width="60" height="60" style="object-fit:cover; border:2px solid #667eea;" id="commonSidebarImg">
        <div class="mt-2 fw-bold text-white"><span id="commonSidebarName">Loading...</span></div>
        <small class="text-white-50">ID: <span id="commonSidebarId">---</span></small>
    </div>
    <nav class="nav flex-column mt-3">
        <a class="nav-link ${activeLink==='user-profile.html'?'active':''}" href="user-profile.html"><i class="fas fa-user-circle"></i> My Profile</a>
        <a class="nav-link ${activeLink==='user-dashboard.html'?'active':''}" href="user-dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
        <a class="nav-link ${activeLink==='user-orders.html'?'active':''}" href="user-orders.html"><i class="fas fa-shopping-bag"></i> My Orders</a>
        <a class="nav-link ${activeLink==='user-team.html'?'active':''}" href="user-team.html"><i class="fas fa-users"></i> My Team</a>
        <a class="nav-link ${activeLink==='user-commissions.html'?'active':''}" href="user-commissions.html"><i class="fas fa-coins"></i> Commissions</a>
        <a class="nav-link ${activeLink==='user-withdrawal.html'?'active':''}" href="user-withdrawal.html"><i class="fas fa-money-bill-wave"></i> Withdraw</a>
        <hr class="bg-light opacity-25 mx-3">
        <a class="nav-link" href="index.html"><i class="fas fa-home"></i> Back to Home</a>
        <a class="nav-link text-warning" href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
    </nav>
</div>

<!-- Main Content -->
<div class="user-content">
    <div class="user-header">
        <button class="btn btn-sm btn-outline-primary sidebar-toggle me-3" onclick="toggleSidebar()">
            <i class="fas fa-bars fa-lg"></i>
        </button>
        <h4 class="mb-0 text-primary fw-bold" style="letter-spacing:0.5px; text-transform:capitalize;">${file.replace('.html', '').replace('user-', '')}</h4>
    </div>
    <div class="container-fluid px-0">
        <!-- INJECT CONTENT -->
`;

        // We need to extract the existing content from the col-md-9 block.
        const contentMatch = content.match(/<div class="col-md-9">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*(?:<footer[\s\S]*?<\/footer>)?/);
        let innerContent = "";
        if (contentMatch) {
            innerContent = contentMatch[1];
            // Remove the old container row col-md-3 wrapper
            content = content.replace(/<div class="container my-4">\s*<div class="row">\s*<div class="col-md-3">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*(?:<footer[\s\S]*?<\/footer>)?/, sidebarHTML + innerContent + '\\n    </div>\\n</div>');
        }

        // 4. Update Scripts
        if (!content.includes('function toggleSidebar()')) {
            content = content.replace(/<\/script>\s*<\/body>/, `
    function toggleSidebar() {
        document.getElementById('userSidebar').classList.toggle('show');
    }
    window.toggleSidebar = toggleSidebar;

    // Load common sidebar details if user exists
    const localUser = JSON.parse(localStorage.getItem('currentUser'));
    if (localUser) {
        let nameEl = document.getElementById('commonSidebarName');
        if(nameEl) nameEl.innerText = localUser.name || 'User';
        let idEl = document.getElementById('commonSidebarId');
        if(idEl) idEl.innerText = localUser.userId || '---';
        const simg = localStorage.getItem('profileImage_' + localUser.id);
        if(simg) {
             let imgEl = document.getElementById('commonSidebarImg');
             if(imgEl) imgEl.src = simg;
        }
    }
</script>\n</body>`);
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Refactored " + file);
    } else {
        console.log("Skipped " + file + " - not found");
    }
});
