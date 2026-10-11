import './server/bootstrapEnv.js';
import fs from 'fs';

// If running in production and compiled bundle exists, delegate to it
if (process.env.NODE_ENV === 'production' && fs.existsSync('./dist/server.cjs')) {
  import('./dist/server.cjs');
} else if (fs.existsSync('./server/index.ts')) {
  import('./server/index.ts');
} else {
  import('./server/index.js');
}


