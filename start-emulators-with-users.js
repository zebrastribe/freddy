import { spawn, spawnSync } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, rm } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Configuration
const EMULATOR_PORTS = {
  firestore: 8180,
  auth: 9099,
  hub: 4400,
  ui: 4000
};

// Ensure emulator ports are free before startup so repeated runs don't fail.
async function cleanupStaleEmulatorProcesses() {
  const ports = Object.values(EMULATOR_PORTS);
  for (const port of ports) {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      const pids = stdout.trim().split('\n').filter(Boolean);
      for (const pid of pids) {
        try {
          await execAsync(`kill -TERM ${pid}`);
          console.log(`🧹 Released port ${port} (PID ${pid})`);
        } catch (error) {
          console.warn(`⚠️  Could not terminate PID ${pid} on port ${port}: ${error.message}`);
        }
      }
    } catch (error) {
      // No process bound to this port, which is expected in a clean startup.
    }
  }

  // Small grace period so the OS fully releases sockets before emulator boot.
  await new Promise(resolve => setTimeout(resolve, 800));
}

async function removeMacMetadataFiles(targetDir) {
  let entries = [];
  try {
    entries = await readdir(targetDir, { withFileTypes: true });
  } catch (error) {
    return;
  }

  for (const entry of entries) {
    const entryPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await removeMacMetadataFiles(entryPath);
      continue;
    }

    if (entry.name.startsWith('._')) {
      try {
        await rm(entryPath, { force: true });
        console.log(`🧹 Removed macOS metadata file: ${entryPath}`);
      } catch (error) {
        console.warn(`⚠️  Could not remove metadata file ${entryPath}: ${error.message}`);
      }
    }
  }
}

// Wait for a port to be available
async function waitForPort(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await execAsync(`lsof -i :${port}`);
      console.log(`✅ Port ${port} is ready`);
      return true;
    } catch (error) {
      console.log(`⏳ Waiting for port ${port}... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  console.error(`❌ Port ${port} never became available`);
  return false;
}

// Start Firebase emulators
async function startEmulators() {
  console.log('🚀 Starting Firebase emulators...');
  const firebaseCommand = resolveFirebaseCommand();
  
  const emulatorProcess = spawn(firebaseCommand.command, firebaseCommand.args.concat([
    'emulators:start',
    '--only', 'firestore,auth',
    '--import=./emulator-data',
    '--export-on-exit=./emulator-data'
  ]), {
    stdio: 'pipe',
    shell: true
  });

  // Log emulator output
  emulatorProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[EMULATOR] ${output.trim()}`);
    
    // Check if emulators are ready
    if (output.includes('All emulators ready!')) {
      console.log('🎉 Emulators are ready!');
    }
  });

  emulatorProcess.stderr.on('data', (data) => {
    console.error(`[EMULATOR ERROR] ${data.toString().trim()}`);
  });

  return emulatorProcess;
}

function resolveFirebaseCommand() {
  const globalFirebase = spawnSync('firebase', ['--version'], { stdio: 'ignore', shell: true });
  if (globalFirebase.status === 0) {
    return { command: 'firebase', args: [] };
  }

  const npxFirebase = spawnSync('npx', ['firebase-tools', '--version'], { stdio: 'ignore', shell: true });
  if (npxFirebase.status === 0) {
    console.log('ℹ️  Using local firebase-tools via npx');
    return { command: 'npx', args: ['firebase-tools'] };
  }

  throw new Error('Firebase CLI not found. Install with `npm i -g firebase-tools` or add `firebase-tools` dependency.');
}

// Run the user setup script
async function setupUsers() {
  console.log('👥 Setting up test users...');
  
  try {
    const { stdout, stderr } = await execAsync('node setup-test-users.js');
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error('❌ Failed to setup users:', error.message);
  }
}

async function setupUrlNames() {
  console.log('🔗 Setting up URL names...');
  try {
    const { stdout, stderr } = await execAsync('node trace/add-url-names.cjs');
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
  } catch (error) {
    console.error('❌ Failed to setup URL names:', error.message);
  }
}

// Main function
async function main() {
  try {
    console.log('🧹 Cleaning stale emulator ports/processes...');
    await cleanupStaleEmulatorProcesses();
    await removeMacMetadataFiles(path.join(process.cwd(), 'emulator-data'));

    // Start emulators
    const emulatorProcess = await startEmulators();
    
    // Wait for emulators to be ready
    console.log('⏳ Waiting for emulators to start...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    // Wait for specific ports
    const firestoreReady = await waitForPort(EMULATOR_PORTS.firestore);
    const authReady = await waitForPort(EMULATOR_PORTS.auth);
    
    if (firestoreReady && authReady) {
      console.log('✅ All emulators are ready!');
      
      // Wait a bit more to ensure emulators are fully initialized
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Setup test users
      await setupUsers();
      await setupUrlNames();
      
      console.log('\n🎉 Setup complete!');
      console.log('📱 You can now access:');
      console.log('   - Main app: http://localhost:8016');
      console.log('   - Admin panel: http://localhost:8016/admin');
      console.log('   - Emulator UI: http://127.0.0.1:4000');
      console.log('\n👤 Test users:');
      console.log('   - guest@test.com (guest)');
      console.log('   - user@test.com (user)');
      console.log('   - admin@test.com (admin)');
      console.log('   - superadmin@test.com (superadmin)');
      console.log('   Password for all: password123');
      
    } else {
      console.error('❌ Emulators failed to start properly');
      emulatorProcess.kill();
      process.exit(1);
    }
    
    // Keep the process running
    emulatorProcess.on('exit', (code) => {
      console.log(`Emulator process exited with code ${code}`);
      process.exit(code);
    });
    
  } catch (error) {
    console.error('❌ Failed to start emulators:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});

// Start the main process
main(); 