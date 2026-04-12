const fs = require('fs');

const file = 'c:\\\\People plus network\\\\index.html';
let content = fs.readFileSync(file, 'utf8');

const parts = content.split('</head>');

if (parts.length > 2) {
    // Keep the part before the first </head>
    // Keep the part after the last </head>
    // Everything in between is garbage
    
    // Actually parts[0] is until first </head>
    // parts[parts.length - 1] is after the last </head>
    
    content = parts[0] + '</head>' + parts[parts.length - 1];
    fs.writeFileSync(file, content);
    console.log('Fixed index html completely');
} else {
    console.log('No extra </head> found. Parts length:', parts.length);
}
