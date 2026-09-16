import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import fs from 'fs';
import { getCachedSystemSettings } from './db/queries.js';

let firebaseApp: App | null = null;

export async function getFirebaseApp(): Promise<App | null> {
  if (firebaseApp) return firebaseApp;
  if (getApps().length) {
    firebaseApp = getApps()[0];
    return firebaseApp;
  }

  try {
    const settings = await getCachedSystemSettings().catch(() => null);
    
    const serviceAccountPath = settings?.firebase_service_account_path || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    let serviceAccount: any = null;

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
      } catch (e) {
        console.error('[PUSH] Failed to parse Firebase service account file:', e);
      }
    }

    if (!serviceAccount) {
      const projectId = settings?.firebase_project_id || process.env.FIREBASE_PROJECT_ID;
      const clientEmail = settings?.firebase_client_email || process.env.FIREBASE_CLIENT_EMAIL;
      const rawPrivateKey = settings?.firebase_private_key || process.env.FIREBASE_PRIVATE_KEY;
      const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;

      if (projectId && clientEmail && privateKey) {
        serviceAccount = { projectId, clientEmail, privateKey };
      }
    }

    if (serviceAccount && serviceAccount.projectId) {
      firebaseApp = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('[PUSH] Firebase Admin initialized successfully.');
      return firebaseApp;
    }
  } catch (error) {
    console.error('[PUSH] Firebase Admin initialization failed:', error);
  }

  return null;
}

export function invalidateFirebaseApp() {
  firebaseApp = null;
}



