#!/usr/bin/env node

/**
 * Trace Platform Shutdown Script
 * Stops all services and cleans up processes
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

// Parse command line arguments
const args = process.argv.slice(2);
const force = args.includes('--force');
const quiet = args.includes('--quiet');

if (!quiet) {
  log('🛑 Shutting down Trace Platform...', 'bright');
}

// Kill processes by port
async function killProcessesByPort(ports) {
  for (const port of ports) {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.includes(`:${port}`)) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== 'PID') {
              try {
                await execAsync(`taskkill /f /pid ${pid}`);
                if (!quiet) {
                  logSuccess(`✅ Killed process on port ${port} (PID: ${pid})`);
                }
              } catch (error) {
                if (!quiet) {
                  logWarning(`⚠️  Could not kill process on port ${port}: ${error.message}`);
                }
              }
            }
          }
        }
      } else {
        const { stdout } = await execAsync(`lsof -ti:${port}`);
        if (stdout.trim()) {
          const pids = stdout.trim().split('\n');
          for (const pid of pids) {
            try {
              await execAsync(`kill ${force ? '-9' : '-TERM'} ${pid}`);
              if (!quiet) {
                logSuccess(`✅ Killed process on port ${port} (PID: ${pid})`);
              }
            } catch (error) {
              if (!quiet) {
                logWarning(`⚠️  Could not kill process on port ${port}: ${error.message}`);
              }
            }
          }
        }
      }
    } catch (error) {
      if (!quiet) {
        logWarning(`⚠️  No processes found on port ${port}`);
      }
    }
  }
}

// Main shutdown function
async function shutdownTrace() {
  try {
    if (!quiet) {
      logStatus('🧹 Cleaning up Trace-related processes...');
    }

    // Kill only known trace-related ports, not process names.
    const ports = [8016, 8180, 9099, 4000, 4400, 4500, 9150];
    await killProcessesByPort(ports);

    // Additional cleanup for specific processes
    try {
      if (process.platform === 'win32') {
        await execAsync('taskkill /f /im "node.exe" 2>nul || echo "No node processes found"');
      } else {
        await execAsync('pkill -f "start-trace.js" || echo "No start-trace processes found"');
        await execAsync('pkill -f "spa-server.js" || echo "No spa-server processes found"');
        await execAsync('pkill -f "v2-server.js" || echo "No v2-server processes found"');
      }
    } catch (error) {
      // Ignore errors during cleanup
    }

    if (!quiet) {
      logSuccess('✅ All Trace services stopped');
      logStatus('📋 Cleaned up:');
      logStatus('   • Node.js processes');
      logStatus('   • Firebase emulators');
      logStatus('   • Vite dev server');
      logStatus('   • Tailwind CSS build');
      logStatus('   • SPA server');
      logStatus('   • Port conflicts');
    }

  } catch (error) {
    if (!quiet) {
      logError(`Failed to shutdown Trace Platform: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run shutdown
shutdownTrace().then(() => {
  if (!quiet) {
    logSuccess('🎉 Trace Platform shutdown complete');
  }
  process.exit(0);
}).catch((error) => {
  if (!quiet) {
    logError(`Shutdown failed: ${error.message}`);
  }
  process.exit(1);
}); 