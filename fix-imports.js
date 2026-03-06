const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./app/(main)');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace imports
    const newContent = content
        .replace(/(from\s+)['"](\.\.\/)+actions\/(.*?)['"]/g, '$1"@/actions/$3"')
        .replace(/(from\s+)['"](\.\.\/)+components\/(.*?)['"]/g, '$1"@/components/$3"')
        .replace(/(from\s+)['"](\.\.\/)+hooks\/(.*?)['"]/g, '$1"@/hooks/$3"')
        .replace(/(from\s+)['"](\.\.\/)+lib\/(.*?)['"]/g, '$1"@/lib/$3"');
    
    if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log("Fixed imports in: " + file);
    }
});
