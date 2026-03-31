#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const entries = fs.readdirSync(root, { withFileTypes: true });
const exportDirs = entries
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('firebase-export-'))
  .map((entry) => path.join(root, entry.name));

for (const dir of exportDirs) {
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`Removed ${exportDirs.length} firebase export director${exportDirs.length === 1 ? 'y' : 'ies'}.`);
