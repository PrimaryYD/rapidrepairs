const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/Users/Jason/Downloads/Skripsi/Frontend/LoginPage/app');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Remove standalone ScrollView import if it exists
    const scrollViewImport = 'import { ScrollView } from "react-native";';
    if (content.includes(scrollViewImport)) {
        // We assume it's duplicated from user's mass paste.
        content = content.replace(/import \{ ScrollView \} from "react-native";\r?\n?/g, '');
        modified = true;
    }

    // Fix duplicate Ionicons import seen in the stack trace
    const ioniconsImport = 'import { Ionicons } from "@expo/vector-icons";';
    let count = content.split(ioniconsImport).length - 1;
    if (count > 1) {
        let parts = content.split(ioniconsImport);
        content = parts[0] + ioniconsImport + parts.slice(1).join('');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed imports in ' + file);
    }
});
