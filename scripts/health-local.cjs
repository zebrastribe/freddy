#!/usr/bin/env node
const http = require('http');

const checks = [
  {name: 'app', url: 'http://localhost:8016/'},
  {name: 'admin', url: 'http://localhost:8016/admin'},
  {name: 'firestore-emulator', url: 'http://127.0.0.1:8180/'},
  {name: 'auth-emulator', url: 'http://127.0.0.1:9099/'},
];

function ping(url, expectedStatuses = [200]) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => resolve({ok: expectedStatuses.includes(res.statusCode), status: res.statusCode}));
    req.on('error', () => resolve({ok: false, status: null}));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ok: false, status: null});
    });
  });
}

(async () => {
  let failed = 0;
  for (const check of checks) {
    const expectedStatuses = check.name.includes('emulator') ? [200] : [200];
    const result = await ping(check.url, expectedStatuses);
    if (result.ok) {
      console.log(`OK   ${check.name.padEnd(20)} ${check.url} (${result.status ?? 'n/a'})`);
    } else {
      failed += 1;
      console.log(`FAIL ${check.name.padEnd(20)} ${check.url}`);
    }
  }
  process.exit(failed ? 1 : 0);
})();
