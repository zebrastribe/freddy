#!/usr/bin/env node

/**
 * Trace Platform Startup Script
 * Starts all services with graceful shutdown
 */

import { spawn, spawnSync, exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import net from 'net';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);
const forceCleanPorts = process.argv.includes('--force-clean-ports');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStatus(message) {
  log(`[STATUS] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`[SUCCESS] ${message}`, 'green');
}

function logWarning(message) {
  log(`[WARNING] ${message}`, 'yellow');
}

function logError(message) {
  log(`[ERROR] ${message}`, 'red');
}

// Port readiness check (true when something is listening)
async function isPortListening(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// Wait for a service to start listening on a port
async function waitForPort(port, maxAttempts = 30) {
  for (let i = 1; i <= maxAttempts; i++) {
    const listening = await isPortListening(port);
    if (listening) {
      return true;
    }
    logStatus(`⏳ Waiting for port ${port}... (${i}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

// Start a service
function startService(name, command, args, cwd = __dirname) {
  return new Promise((resolve, reject) => {
    logStatus(`🚀 Starting ${name}...`);
    
    const child = spawn(command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let output = '';
    let settled = false;
    const settleSuccess = () => {
      if (!settled) {
        settled = true;
        resolve(child);
      }
    };
    const settleFailure = (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };
    
    child.stdout.on('data', (data) => {
      const message = data.toString();
      output += message;
      logStatus(`[${name}] ${message.trim()}`);
      settleSuccess();
    });
    
    child.stderr.on('data', (data) => {
      const message = data.toString();
      logWarning(`[${name}] ${message.trim()}`);
    });

    // Long-running services should not block startup sequencing forever.
    setTimeout(settleSuccess, 1200);
    
    child.on('close', (code) => {
      if (code !== 0) {
        logError(`${name} failed to start (code: ${code})`);
        settleFailure(new Error(`${name} failed to start`));
      } else if (!settled) {
        // Short-lived successful command (not expected for servers, but supported).
        settleSuccess();
      }
    });
    
    child.on('error', (error) => {
      logError(`${name} error: ${error.message}`);
      settleFailure(error);
    });
    
    // Store the child process for later cleanup
    if (!global.childProcesses) {
      global.childProcesses = [];
    }
    global.childProcesses.push(child);
  });
}

function assertFirebaseCliAvailable() {
  const globalProbe = spawnSync('firebase', ['--version'], { stdio: 'ignore', shell: true });
  if (globalProbe.status === 0) return;

  const localProbe = spawnSync('npx', ['firebase-tools', '--version'], { stdio: 'ignore', shell: true });
  if (localProbe.status === 0) return;

  throw new Error('Firebase CLI not found. Install it with: npm i -g firebase-tools');
}

async function cleanupKnownPorts(ports) {
  for (const port of ports) {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      const pids = stdout.trim().split('\n').filter(Boolean);
      for (const pid of pids) {
        try {
          await execAsync(`kill -TERM ${pid}`);
          logStatus(`🧹 Released stale process ${pid} on port ${port}`);
        } catch (error) {
          logWarning(`Could not stop PID ${pid} on port ${port}: ${error.message}`);
        }
      }
    } catch (error) {
      // No process on port, expected in clean environments.
    }
  }
  await new Promise(resolve => setTimeout(resolve, 600));
}

// Main startup function
async function startTracePlatform() {
  try {
    log('🚀 Starting Trace Platform...', 'bright');
    assertFirebaseCliAvailable();
    const frontendDevDir = existsSync(join(__dirname, 'trace', 'v2-frontend', 'package.json'))
      ? join(__dirname, 'trace', 'v2-frontend')
      : join(__dirname, 'v2-frontend');
    
    if (forceCleanPorts) {
      logStatus('🧹 Cleaning up known ports (--force-clean-ports)...');
      await cleanupKnownPorts([8180, 9099, 4000, 4400, 8016]);
    } else {
      logWarning('Skipping forced port cleanup. Use --force-clean-ports if needed.');
    }
    
    // Start Firebase emulators
    logStatus('🔥 Starting Firebase emulators...');
    const emulators = await startService('Firebase Emulators', 'npm', ['run', 'emulators:start']);
    
    // Wait for emulators to be ready
    logStatus('⏳ Waiting for emulators to start...');
    const firestorePortReady = await waitForPort(8180);
    const port9099Ready = await waitForPort(9099);
    
    if (firestorePortReady) {
      logSuccess('✅ Port 8180 is ready');
    }
    if (port9099Ready) {
      logSuccess('✅ Port 9099 is ready');
    }
    
    if (firestorePortReady && port9099Ready) {
      logSuccess('✅ All emulators are ready!');
    }
    
    // Start Tailwind CSS build
    logStatus('🎨 Starting Tailwind CSS build...');
    const tailwind = await startService('Tailwind CSS', 'npm', ['run', 'build-css']);
    
    // Start Vite development server
    logStatus('⚡ Starting Vite development server...');
    const vite = await startService('Vite Dev Server', 'npm', ['run', 'dev'], frontendDevDir);
    
    // Wait for Vite server
    logStatus('⏳ Waiting for Vite server...');
    const viteReady = await waitForPort(8016);
    if (viteReady) {
      logSuccess('✅ Port 8016 is ready');
      logSuccess('✅ Vite development server is ready');
    }
    
    // In full-stack mode we serve via Vite on :8016.
    // Starting SPA server here would conflict on the same port.
    logStatus('🌐 Using Vite as web server for stack:start');
    
    // Success message
    log('============================================================', 'green');
    log('🎉 Trace Platform is now running!', 'green');
    log('============================================================', 'green');
    logStatus('📱 Access points:');
    logStatus('   • Main app: http://localhost:8016');
    logStatus('   • Vite dev: http://localhost:8016');
    logStatus('   • Admin panel: http://localhost:8016/admin');
    logStatus('   • Emulator UI: http://127.0.0.1:4000');
    logStatus('👤 Test users: guest@test.com, user@test.com, admin@test.com, superadmin@test.com');
    logStatus('🔑 Password for all: password123');
    logStatus('🛑 Press Ctrl+C to stop all services');
    log('============================================================', 'green');
    
    // Handle shutdown
    process.on('SIGINT', async () => {
      logStatus('🛑 Shutting down Trace Platform...');
      await shutdown();
      process.exit(0);
    });
    
  } catch (error) {
    logError(`Failed to start Trace Platform: ${error.message}`);
    process.exit(1);
  }
}

// Shutdown function
async function shutdown() {
  logStatus('Stopping Firebase Emulators...');
  logStatus('Stopping Tailwind CSS...');
  logStatus('Stopping Vite Dev Server...');
  logStatus('Stopping SPA Server...');
  
  if (global.childProcesses) {
    for (const child of global.childProcesses) {
      try {
        child.kill('SIGTERM');
      } catch (error) {
        // Ignore errors during shutdown
      }
    }
  }
  
  logSuccess('All services stopped');
}

// Start the platform
startTracePlatform(); 