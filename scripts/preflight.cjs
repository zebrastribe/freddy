#!/usr/bin/env node
const { spawnSync } = require('child_process');

const minNodeMajor = 20;
const nodeMajor = Number((process.versions.node || '0').split('.')[0]);
const mode = process.argv.includes('--lite') ? 'lite' : 'full';

function fail(message) {
  console.error(`Preflight failed: ${message}`);
  process.exit(1);
}

function checkCommand(command, args = ['--version']) {
  const res = spawnSync(command, args, { stdio: 'ignore', shell: true });
  return res.status === 0;
}

if (!Number.isFinite(nodeMajor) || nodeMajor < minNodeMajor) {
  fail(`Node.js ${minNodeMajor}+ is required. Current: ${process.versions.node}`);
}

const hasFirebaseGlobal = checkCommand('firebase');
const hasFirebaseNpx = checkCommand('npx', ['firebase-tools', '--version']);
if (!hasFirebaseGlobal && !hasFirebaseNpx) {
  fail('Firebase CLI is required (global `firebase` or `npx firebase-tools`).');
}

if (mode === 'full') {
  // Basic npm availability check for command-driven workflows.
  if (!checkCommand('npm')) {
    fail('npm is required but not available.');
  }
}

console.log(`Preflight passed (${mode} mode).`);
