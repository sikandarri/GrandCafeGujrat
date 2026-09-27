import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const target = path.resolve(process.cwd(), '.deployment-id');
const id = crypto.randomUUID();
fs.writeFileSync(target, `${id}\n`, 'utf8');
console.log(`Prepared deployment identity: ${id}`);
