const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = walk('./src');
let totalReplacements = 0;
let modifiedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Refactor legacy var(--radius-*) to M3 CSS design token utilities
  content = content.replace(/\brounded-\[var\(--radius-lg\)\]/g, 'rounded-shape-lg');
  content = content.replace(/\brounded-\[var\(--radius-md\)\]/g, 'rounded-shape-md');
  content = content.replace(/\brounded-\[var\(--radius-sm\)\]/g, 'rounded-shape-sm');
  content = content.replace(/\brounded-\[var\(--radius-xs\)\]/g, 'rounded-shape-xs');

  // Top/bottom specific legacy var radii
  content = content.replace(/\brounded-t-\[var\(--radius-lg\)\]/g, 'rounded-t-shape-lg');
  content = content.replace(/\brounded-t-\[var\(--radius-md\)\]/g, 'rounded-t-shape-md');
  content = content.replace(/\brounded-b-\[var\(--radius-lg\)\]/g, 'rounded-b-shape-lg');

  // 2. Refactor hardcoded arbitrary px radii to standard tokens
  content = content.replace(/\brounded-\[16px\]/g, 'rounded-shape-lg');
  content = content.replace(/\brounded-\[12px\]/g, 'rounded-shape-md');
  content = content.replace(/\brounded-\[8px\]/g, 'rounded-shape-sm');
  content = content.replace(/\brounded-\[4px\]/g, 'rounded-shape-xs');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
  }
});

console.log(`✅ Successfully refactored design tokens in ${modifiedFiles} files.`);
