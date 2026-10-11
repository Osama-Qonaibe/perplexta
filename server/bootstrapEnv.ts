import { loadEnvFile } from 'node:process';
import fs from 'node:fs';

const vpsEnv = '/home/perplexta1/public_html/.env';

function parseAndLoadEnv(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
      if (key && val) {
        if (!process.env[key] || (process.env[key]!.length < 32 && val.length >= 32)) {
          process.env[key] = val;
        }
      }
    }
  } catch {}
}

try {
  if (fs.existsSync(vpsEnv)) {
    loadEnvFile(vpsEnv);
    parseAndLoadEnv(vpsEnv);
  } else if (fs.existsSync('.env')) {
    loadEnvFile('.env');
    parseAndLoadEnv('.env');
  } else {
    loadEnvFile();
  }
} catch {
  // Graceful fallback if already injected or non-existent in current runner
}
