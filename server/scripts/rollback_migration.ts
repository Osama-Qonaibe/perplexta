import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

async function rollback() {
  const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error('[Rollback] DATABASE_URL not set');
  }
  
  if (!fs.existsSync(BACKUP_DIR)) {
    throw new Error(`[Rollback] Backup directory does not exist: ${BACKUP_DIR}`);
  }

  // Get latest backup
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    throw new Error('[Rollback] No backup files found in ' + BACKUP_DIR);
  }
  
  const latestBackup = path.join(BACKUP_DIR, files[0]);
  console.log(`[Rollback] Restoring from ${latestBackup}...`);
  
  await execAsync(`psql "${dbUrl}" < "${latestBackup}"`);
  console.log(`[Rollback] ✅ Database restored from ${latestBackup}`);
}

rollback().catch(err => {
  console.error('[Rollback] ❌ Failed to execute database rollback:', err);
  process.exit(1);
});
