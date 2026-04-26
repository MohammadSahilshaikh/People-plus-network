const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (path.extname(file) === '.html') {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find the last <script type="module"> where the custom code sits
        // Regex to find functions: function name( or async function name(
        const scriptMatch = content.match(/<script type="module">([\s\S]*?)<\/script>(?=\s*<\/body>)/i);
        
        if (scriptMatch) {
            let scriptContent = scriptMatch[1];
            
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
                if (!scriptContent.includes(addStr)) {
                    additions += addStr;
                }
            });
            
            if (additions) {
                const newScriptContent = scriptContent + additions + '\n';
                content = content.replace(scriptMatch[1], newScriptContent);
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Exposed functions in ${file}: ${Array.from(functionNames).join(', ')}`);
            }
        }
    }
});
