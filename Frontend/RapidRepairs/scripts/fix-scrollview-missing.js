const fs = require('fs');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/Users/Jason/Downloads/Skripsi/Frontend/LoginPage/app');

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    if (content.includes('<ScrollView')) {
        // Simple heuristic: does the text 'ScrollView' appear in the import block for react-native?
        const rnImportMatch = content.match(/import\s*\{([^}]*)\}\s*from\s*['"]react-native['"]/);
        if (rnImportMatch) {
            const imports = rnImportMatch[1];
            if (!imports.includes('ScrollView')) {
                const newImports = imports.trim() === '' ? 'ScrollView' : imports + ', ScrollView';
                const newContent = content.replace(rnImportMatch[0], `import { ${newImports} } from "react-native"`);
                fs.writeFileSync(f, newContent, 'utf8');
                console.log('Added ScrollView to ' + f);
            }
        } else {
           // No react-native import block? Just add one.
           if (!content.includes('import { ScrollView } from "react-native"')) {
               const newContent = `import { ScrollView } from "react-native";\n` + content;
               fs.writeFileSync(f, newContent, 'utf8');
               console.log('Added ScrollView import top to ' + f);
           }
        }
    }
});
