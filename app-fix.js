const fs = require('fs');
const path = require('path');

const UI_COMPONENTS = {
    'Button': 'components/ui/button',
    'Badge': 'components/ui/badge',
    'Card': 'components/ui/card',
    'Input': 'components/ui/input',
    'Textarea': 'components/ui/textarea',
    'Switch': 'components/ui/switch',
    'Select': 'components/ui/select',
    'Dialog': 'components/ui/dialog',
    'Tabs': 'components/ui/tabs',
    'Avatar': 'components/ui/avatar',
    'Table': 'components/ui/table',
    'Progress': 'components/ui/progress',
    'DropdownMenu': 'components/ui/dropdown-menu',
    'Label': 'components/ui/label',
};

const ACTIONS = {
    'getMentorProfile': 'actions/mentor',
    'getMentorInbox': 'actions/mentor',
    'getMentorConversation': 'actions/mentor',
    'markMentorConversationRead': 'actions/mentor',
    'getMentorDashboardData': 'actions/mentor',
    'getCoverLetters': 'actions/cover-letter',
    'saveCoverLetter': 'actions/cover-letter',
    'improveWithAI': 'actions/resume',
};

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('./app/(main)');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace: import { Something } from "@/"; 
    // And multi-line imports
    let newContent = content.replace(/import\s*\{([^}]+)\}\s*(from\s*)?["']@\/?["'];?/g, (match, importsStr, hasFrom) => {
        const imports = importsStr.split(',').map(i => i.trim()).filter(Boolean);
        if (imports.length === 0) return match;
        
        // Pick the first import to determine the path
        const first = imports[0];
        
        let targetPath = '';
        if (UI_COMPONENTS[first] || (first.startsWith('Card') && UI_COMPONENTS['Card'])) {
            // It's a UI component, probably if one is card all are
            targetPath = UI_COMPONENTS[first] || UI_COMPONENTS['Card'];
        } else if (ACTIONS[first]) {
            targetPath = ACTIONS[first];
        } else if (first.includes('Session')) {
            targetPath = 'actions/mentor';
        } else {
            // Default guess
            targetPath = 'components/ui/' + first.toLowerCase();
        }
        
        return 'import { ' + imports.join(', ') + ' } from "@/' + targetPath + '";';
    });
    
    // Also replace useFetch if broken: import useFetch from "@/"
    newContent = newContent.replace(/import\s+useFetch\s*(from\s*)?["']@\/?["'];?/g, 'import useFetch from "@/hooks/use-fetch";');

    if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Fixed imports in ' + file);
    }
});
