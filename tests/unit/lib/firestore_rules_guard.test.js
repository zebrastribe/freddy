const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

describe('firestore rules release guard', () => {
  test('fails release mode when rules are fully permissive', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rules-guard-'));
    fs.writeFileSync(
      path.join(tempDir, 'firestore.rules'),
      "rules_version = '2';\nservice cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if true; } } }"
    );

    const result = spawnSync('node', ['scripts/check-firestore-rules.cjs', '--mode=release', `--rules=${path.join(tempDir, 'firestore.rules')}`], {
      cwd: '/home/jesper/Documents/dev/freddy',
      encoding: 'utf8',
    });
    expect(result.status).not.toBe(0);
  });

  test('passes release mode for non-permissive rules', () => {
    const output = execSync('node scripts/check-firestore-rules.cjs --mode=release', {
      cwd: '/home/jesper/Documents/dev/freddy',
    }).toString();
    expect(output).toContain('passed');
  });

  test('fails release mode when users read is public', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rules-guard-users-'));
    fs.writeFileSync(
      path.join(tempDir, 'firestore.rules'),
      "rules_version = '2';\nservice cloud.firestore { match /databases/{database}/documents { match /users/{userId} { allow read: if true; } match /{document=**} { allow read, write: if false; } } }"
    );

    const result = spawnSync('node', ['scripts/check-firestore-rules.cjs', '--mode=release', `--rules=${path.join(tempDir, 'firestore.rules')}`], {
      cwd: '/home/jesper/Documents/dev/freddy',
      encoding: 'utf8',
    });
    expect(result.status).not.toBe(0);
  });
});
