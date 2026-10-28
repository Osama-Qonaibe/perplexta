/**
 * Automated Utility to safely purge orphaned sessionStorage and localStorage keys
 * related to deprecated route configurations or older storage schemas.
 * 
 * Ensures the browser environment remains clean and matches current application architecture.
 */

const DEPRECATED_PREFIXES_AND_KEYS = [
  'forum_',
  'forum-draft-',
  'marketplace_filter',
  'legacy_blog_',
  'temp_snapshot_',
  'debug_seo_items',
  'old_theme_mode',
  'chat-history-draft'
];

export function purgeOrphanedStorage() {
  if (typeof window === 'undefined') return;

  try {
    let purgedCount = 0;

    // A. Clean localStorage
    const localKeys = Object.keys(localStorage);
    for (const key of localKeys) {
      const isDeprecated = DEPRECATED_PREFIXES_AND_KEYS.some(prefix => key.startsWith(prefix));
      if (isDeprecated) {
        localStorage.removeItem(key);
        purgedCount++;
      }
    }

    // B. Clean sessionStorage
    const sessionKeys = Object.keys(sessionStorage);
    for (const key of sessionKeys) {
      const isDeprecated = DEPRECATED_PREFIXES_AND_KEYS.some(prefix => key.startsWith(prefix));
      if (isDeprecated) {
        sessionStorage.removeItem(key);
        purgedCount++;
      }
    }

    if (purgedCount > 0) {
      console.log(`[Storage Purge Service] Safely purged ${purgedCount} orphaned/deprecated storage keys.`);
    }
  } catch (err: any) {
    console.warn('[Storage Purge Service] Error purging orphaned storage:', err.message);
  }
}
