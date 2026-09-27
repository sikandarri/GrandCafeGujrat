// Single Hostinger entry point.
// The whole project uses one root package.json and one npm install.
// A deployment identity is generated during npm install. If the file is missing,
// create it once here. This lets the app reset ONLY the admin account on a new
// deployment without deleting the admin on ordinary server restarts.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const deploymentFile = path.join(rootDir, '.deployment-id');
let deploymentId = '';

try {
  deploymentId = fs.readFileSync(deploymentFile, 'utf8').trim();
} catch {
  // Fresh source/deployment where postinstall was skipped.
}

if (!deploymentId) {
  deploymentId = crypto.randomUUID();
  fs.writeFileSync(deploymentFile, `${deploymentId}\n`, 'utf8');
}

process.env.ADMIN_DEPLOYMENT_ID = deploymentId;
import('./server/src/index.js').catch((err) => {
  console.error('Failed to load Grand Café server:', err);
  process.exit(1);
});
