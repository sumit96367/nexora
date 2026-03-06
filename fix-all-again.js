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
    
    // Fix imports replacing "@/;" with proper ones by guessing based on what's imported
    let changed = false;
    
    // Split into lines
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('} from "@/";') || lines[i].includes('} "@/";') || lines[i].includes('from "@/";')) {
            // Find what is imported
            // Usually we have import { Button } from "@/"; or import { Card } from "@/";
            // Or multiline import { ... } from "@/";
            
            // To do this right, let's just use regex on the whole document
            changed = true;
        }
    }
});
