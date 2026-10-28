/**
 * Color Governance Audit Script - Perplexta GitHub Primer Architecture
 * Validates that codebase adheres to strict semantic color system.
 */

import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const SRC_DIR = path.join(rootDir, 'src');

const HARDCODED_EMERALD_BRAND_REGEX = /text-emerald-\d+|bg-emerald-\d+|border-emerald-\d+/g;

let violationsCount = 0;

function verifySemanticTokenIntegrity() {
  const cssPath = path.join(SRC_DIR, 'index.css');
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    const requiredTokens = [
      '--fg-danger',
      '--fg-success',
      '--bg-danger-muted',
      '--bg-success-muted',
      '--status-danger',
      '--status-success',
      '--surface-page',
      '--surface-card',
    ];
    for (const token of requiredTokens) {
      if (!css.includes(token)) {
        console.error(`[FAIL] Missing required semantic token "${token}" in src/index.css`);
        violationsCount++;
      }
    }
  }
}

function scanDirectory(dir) {
  const resolvedDir = path.resolve(dir);
  if (!fs.existsSync(resolvedDir)) return;
  const files = fs.readdirSync(resolvedDir);

  for (const file of files) {
    if (file.includes('..') || file.includes('/') || file.includes('\\') || file.includes('\0')) continue;
    const fullPath = path.resolve(resolvedDir, file);
    if (!fullPath.startsWith(resolvedDir + path.sep)) continue;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (/\.(tsx|jsx|ts|js)$/.test(file) && !file.includes('constants') && !file.includes('socialColors')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const emeraldMatches = content.match(HARDCODED_EMERALD_BRAND_REGEX);
      if (emeraldMatches) {
        console.warn(`[WARN] Color Governance Violation in ${fullPath}:`);
        console.warn(`  Found direct hardcoded emerald brand classes: ${emeraldMatches.join(', ')}`);
        console.warn(`  Use Functional tokens or shared Button/Badge components instead.\n`);
        violationsCount++;
      }
    }
  }
}

console.log('🔍 Starting Perplexta Color Governance Scan...');
verifySemanticTokenIntegrity();
scanDirectory(SRC_DIR);

if (violationsCount === 0) {
  console.log('✅ Color Governance Check Passed: All semantic tokens verified & no brand violations found!');
  process.exit(0);
} else {
  console.error(`❌ Color Governance Check Failed with ${violationsCount} violation(s).`);
  process.exit(1);
}
