const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\People plus network';

// 1. Fix register.html
let regFile = path.join(dir, 'register.html');
let regContent = fs.readFileSync(regFile, 'utf8');

// Black border for QR code
regContent = regContent.replace(
    /style="width: 150px; border-radius: 10px; border: 2px solid #ddd; margin-bottom: 10px;"/,
    'style="width: 160px; border-radius: 5px; border: 4px solid black; padding: 5px; background: white; margin-bottom: 10px;"'
);

// Disable autofill globally for these forms
regContent = regContent.replace(/<form id="loginForm">/, '<form id="loginForm" autocomplete="off">');
regContent = regContent.replace(/<form id="registerForm">/, '<form id="registerForm" autocomplete="off">');

// Further disable autofill on inputs
regContent = regContent.replace(/id="loginEmail"/, 'id="loginEmail" autocomplete="off"');
regContent = regContent.replace(/id="loginPassword"/, 'id="loginPassword" autocomplete="new-password"');
regContent = regContent.replace(/id="regEmail"/, 'id="regEmail" autocomplete="off"');
regContent = regContent.replace(/id="regPassword"/, 'id="regPassword" autocomplete="new-password"');
regContent = regContent.replace(/id="regName"/, 'id="regName" autocomplete="off"');

fs.writeFileSync(regFile, regContent);
console.log('Fixed register.html forms and QR border');

// 2. Fix index.html hero z-index and hover
let indexHtml = path.join(dir, 'index.html');
let indexContent = fs.readFileSync(indexHtml, 'utf8');

// adding z-index 10 to hero container
indexContent = indexContent.replace(
    /<div class="container text-center fade-in-up">/g, 
    '<div class="container text-center fade-in-up" style="position: relative; z-index: 10;">'
);

// removing the broken pointer-events thing if it existed
indexContent = indexContent.replace(/\\n\\s*pointer-events:\s*none;/g, '');

// adding hover CSS
if (!indexContent.includes('.hero .btn:hover')) {
    indexContent = indexContent.replace(
        /\.hero \.btn\s*\{[\s\S]*?\}/, 
        match => match + '\\n        .hero .btn:hover { transform: scale(1.05); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }'
    );
    // ensure transition exists
    indexContent = indexContent.replace(
        /(\.hero \.btn\s*\{[\s\S]*?)(border-radius:\s*50px;)(\s*\})/,
        '$1$2\\n            transition: all 0.3s ease;$3'
    );
}

fs.writeFileSync(indexHtml, indexContent);
console.log('Fixed index.html hero clicks and hover');
