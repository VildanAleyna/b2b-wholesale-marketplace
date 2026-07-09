const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = __dirname;
const ignoredDirs = new Set(['node_modules']);

const collectJsFiles = (dir) => {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            return ignoredDirs.has(entry.name) ? [] : collectJsFiles(fullPath);
        }

        return entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'check-syntax.js'
            ? [fullPath]
            : [];
    });
};

const files = collectJsFiles(rootDir);
let hasError = false;

files.forEach((file) => {
    const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
    if (result.status !== 0) {
        hasError = true;
    }
});

if (hasError) {
    process.exit(1);
}

console.log(`Checked ${files.length} server files.`);
