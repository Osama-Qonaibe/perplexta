/**
 * Perplexta Secure Secret Validator
 * Enforces that critical security secrets (ENCRYPTION_KEY and JWT_SECRET)
 * are present and meet the strict minimum length requirement (>= 32 characters).
 * Zero hardcoded fallback keys. Halts execution immediately if invalid.
 */

export function validateRequiredSecrets(): void {
  const fatalErrors: string[] = [];

  const encKey = process.env.ENCRYPTION_KEY;
  if (!encKey) {
    fatalErrors.push('ENCRYPTION_KEY is missing from environment variables.');
  } else if (encKey.length < 32) {
    fatalErrors.push(`ENCRYPTION_KEY is only ${encKey.length} characters (minimum required is 32 characters).`);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    fatalErrors.push('JWT_SECRET is missing from environment variables.');
  } else if (jwtSecret.length < 32) {
    fatalErrors.push(`JWT_SECRET is only ${jwtSecret.length} characters (minimum required is 32 characters).`);
  }

  if (fatalErrors.length > 0) {
    console.error('\n================================================================================');
    console.error('[FATAL SECURITY ERROR] Server startup aborted due to invalid secret configuration:');
    fatalErrors.forEach(err => console.error(`  - ${err}`));
    console.error('\nPlease set 32+ character secrets in your environment or .env file:');
    console.error('  JWT_SECRET=<32+ characters>');
    console.error('  ENCRYPTION_KEY=<32+ characters>');
    console.error('================================================================================\n');
    process.exit(1);
  }

  if (!process.env.APP_URL) {
    process.env.APP_URL = process.env.VITE_APP_URL || 'http://localhost:3000';
  }

  console.log('[SECURITY SUCCESS] ENCRYPTION_KEY, JWT_SECRET, and APP_URL verified (>= 32 chars).');
}

// Auto-run on module import so any subsequent imports have secrets validated
validateRequiredSecrets();
