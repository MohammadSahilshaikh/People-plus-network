const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (path.extname(file) === '.html') {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Change the main inline script to type="module"
        const scriptMatch = content.match(/<script(?:\s+type="module")?>([\s\S]*?)<\/script>\s*(?=<\/body>)/i);
        
        if (scriptMatch) {
            let scriptTagFull = scriptMatch[0];
            let scriptContent = scriptMatch[1];
            
            // If it doesn't have type="module", add it
            if (!scriptTagFull.includes('type="module"')) {
                scriptTagFull = scriptTagFull.replace('<script>', '<script type="module">');
                modified = true;
            }
            
            // Extract all function names
            const functionRegex = /(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(/g;
            let match;
            const functionNames = new Set();
            
            while ((match = functionRegex.exec(scriptContent)) !== null) {
                functionNames.add(match[1]);
            }
            
            let additions = '';
            functionNames.forEach(name => {
                const addStr = `\n    window.${name} = ${name};`;
                if (!scriptContent.includes(`window.${name} =`)) {
                    additions += addStr;
                    modified = true;
                }
            });
            
            if (modified) {
                const newScriptContent = scriptContent + additions + '\n';
                content = content.replace(scriptMatch[1], newScriptContent);
                // Also ensure the tag itself is replaced if type="module" was added
                if (!scriptMatch[0].includes('type="module"')) {
                    content = content.replace(scriptMatch[0], `<script type="module">${newScriptContent}</script>`);
                }
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated ${file}: exposed ${Array.from(functionNames).join(', ')}`);
            }
        }
    }
});
