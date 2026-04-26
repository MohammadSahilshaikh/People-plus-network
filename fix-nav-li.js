const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (path.extname(file) === '.html') {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        let modified = false;

        // Clean up the dangling </li> tags in the container gap-3
        // Specifically look for the flex container
        const gapContainerRegex = /<div class="d-flex align-items-center order-lg-last ms-auto ms-lg-0 gap-3">([\s\S]*?)<\/div>\s*<div class="collapse navbar-collapse d-none d-lg-block"/;
        
        if (content.match(gapContainerRegex)) {
            let gapContent = content.match(gapContainerRegex)[1];
            
            // Clean up: remove </li> that are not closing an open <li> inside this block
            // Wait, the block currently has:
            /*
                <a class="nav-link" href="cart.html"><i class="fas fa-shopping-cart"></i> Cart <span id="cartCount" class="badge bg-danger">0</span></a>
                    
                        <div class="dropdown">
                            <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false" style="padding: 5px 10px;">
                                <img src="img/default-avatar.png" style="width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ccc; object-fit: cover;" alt="Guest Avatar">
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                                <li><a class="dropdown-item fw-bold" href="register.html" style="color: #667eea;"><i class="fas fa-user-plus me-2"></i> Join Now / Login</a></li>
                            </ul>
                        </div>
                    </li>
            */
            // Looking at the above, it's missing </li> in the inner Join Now link (in some files, wait actually let me just replace poorly matched strings)
            
            let newGapContent = gapContent.replace(/<\/li>\s*<\/div>\s*<\/li>/, '</div>');
            newGapContent = newGapContent.replace(/<\/li>\s*$/, ''); // remove trailing </li>
            newGapContent = newGapContent.replace(/<a([^>]+)>([^<]+)<\/a>\s*<\/ul>/, '<a$1>$2</a></li></ul>'); // close the join now li if missing
            
            // Actually, let's just do a clean HTML parsing / regex cleanup
            // We just need to make sure the dropdown is properly formatted
            newGapContent = newGapContent.replace(/<\/li>\s*<\/div>/g, '</div>');
            newGapContent = newGapContent.replace(/<\/div>\s*<\/li>\s*$/g, '</div>\n');
            
            if (newGapContent !== gapContent) {
                 content = content.replace(gapContent, newGapContent);
                 modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed formatting in ${file}`);
        }
    }
});
