#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rulesPathArg = process.argv.find((arg) => arg.startsWith('--rules='));
const rulesPath = rulesPathArg ?
  path.resolve(rulesPathArg.replace('--rules=', '')) :
  path.join(process.cwd(), 'firestore.rules');
const mode = process.argv.includes('--mode=release') ? 'release' : 'local';

if (!fs.existsSync(rulesPath)) {
  console.error('firestore.rules not found');
  process.exit(1);
}

const content = fs.readFileSync(rulesPath, 'utf8');
const hasOpenRule = /allow\s+read\s*,\s*write\s*:\s*if\s+true\s*;/.test(content);
const hasPublicUsersRead = /match\s+\/users\/\{userId\}\s*\{[^}]*allow\s+read\s*:\s*if\s+true\s*;/.test(content);
const hasOpenObjectStatusWrite = /match\s+\/object_status\/\{objectId\}[\s\S]*?allow\s+create\s*,\s*update\s*,\s*delete\s*:\s*if\s+isAuthenticated\(\)\s*;/.test(content);
const hasOpenFcmTokenWrite = /match\s+\/fcm_tokens\/\{tokenId\}[\s\S]*?allow\s+read\s*,\s*write\s*:\s*if\s+isAuthenticated\(\)\s*;/.test(content);

if (mode === 'release' && (hasOpenRule || hasPublicUsersRead || hasOpenObjectStatusWrite || hasOpenFcmTokenWrite)) {
  console.error('Blocked: insecure Firestore rules detected for release mode.');
  process.exit(1);
}

console.log(`Firestore rules check passed (${mode} mode).`);
