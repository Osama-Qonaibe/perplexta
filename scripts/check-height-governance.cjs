/**
 * PERPLEXTA INTERACTIVE HEIGHT GOVERNANCE SCANNER
 * Enforces vertical rhythm alignment across all buttons, inputs, selects, and textareas in src/
 * Allowed interactive height standards:
 *  - 32px (h-8, min-h-[32px]): Mini buttons, quick preset chips, table actions
 *  - 40px (h-10, min-h-[40px], min-h-[44px]): Primary action buttons, text inputs, selects
 */

const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = walk('./src');
const violations = [];

// Non-standard heights for interactive elements (32px = h-8, 40px = h-10)
const nonStandardHeightRegex = /\b(h-5|h-6|h-7|h-7\.5|h-9|h-11|h-12|h-14|h-16)\b/g;
const arbitraryHeightPxRegex = /\bh-\[(\d+)px\]\b/g;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Strictly target interactive tags (<button, <input, <select, <textarea) or button/input classes
    const isInteractiveElement = /<(button|input|select|textarea)\b/i.test(line);

    if (isInteractiveElement) {
      let match;

      // Check predefined non-standard heights attached directly to interactive tags
      while ((match = nonStandardHeightRegex.exec(line)) !== null) {
        violations.push({
          file,
          lineNum: idx + 1,
          heightClass: match[0],
          snippet: line.trim()
        });
      }

      // Check arbitrary px heights that are not 32px or 40px
      while ((match = arbitraryHeightPxRegex.exec(line)) !== null) {
        const px = parseInt(match[1], 10);
        if (px !== 32 && px !== 40 && px !== 44) {
          violations.push({
            file,
            lineNum: idx + 1,
            heightClass: match[0],
            snippet: line.trim()
          });
        }
      }
    }
  });
});

console.log('🔍 Starting Perplexta Interactive Height Governance Scan...');

if (violations.length > 0) {
  console.error(`❌ Height Governance Scan Failed: Found ${violations.length} interactive height violations deviating from 32px/40px standards:\n`);
  violations.forEach(v => {
    console.error(`  - ${v.file}:${v.lineNum} [${v.heightClass}] -> ${v.snippet.substring(0, 100)}`);
  });
  process.exit(1);
} else {
  console.log('✅ Height Governance Check Passed: All interactive buttons and inputs strictly comply with 32px/40px height alignment!');
  process.exit(0);
}
