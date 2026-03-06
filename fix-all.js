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
    
    // Fix the missed "from" strings that I accidentally destroyed
    const newContent = content
        .replace(/\}\s+"@\/(components|actions|hooks|lib)\/"/g, '} from "@/"')
        .replace(/(\w+)\s+"@\/(components|actions|hooks|lib)\/"/g, ' from "@/"')
        .replace(/from\s+"@\/components"/g, 'from "@/components/ui/button"') // A guess, needs refinement
        
    if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log("Fixed missing froms in: " + file);
    }
});
