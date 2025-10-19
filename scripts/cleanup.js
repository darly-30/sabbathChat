#!/usr/bin/env node

/**
 * Script para limpiar procesos de Node.js y Python que puedan estar corriendo
 * Útil si pnpm run dev se interrumpió abruptamente
 * 
 * Uso: node scripts/cleanup.js
 */

const { exec } = require('child_process');
const os = require('os');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(`${color}`, ...args, colors.reset);
}

function logSection(title) {
  console.log(
    `\n${colors.cyan}${'═'.repeat(50)}${colors.reset}`
  );
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(
    `${colors.cyan}${'═'.repeat(50)}${colors.reset}\n`
  );
}

function executeCommand(command) {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
      } else {
        console.log(stdout);
      }
      resolve();
    });
  });
}

async function cleanup() {
  logSection('🧹 Limpiando procesos...');

  if (os.platform() === 'win32') {
    // Windows
    log(colors.yellow, '🔍 Buscando procesos Node.js en puerto 3000...');
    await executeCommand('netstat -ano | findstr :3000');

    log(colors.yellow, '🔍 Buscando procesos Python en puerto 5000...');
    await executeCommand('netstat -ano | findstr :5000');

    log(colors.blue, '\n💡 Para matar procesos específicos:');
    log(colors.blue, '   taskkill /PID [PID] /F');

    log(colors.yellow, '\n📋 O detén todos los Node.js y Python:');
    log(colors.blue, '   Get-Process node | Stop-Process -Force');
    log(colors.blue, '   Get-Process python | Stop-Process -Force');
  } else {
    // Linux/Mac
    log(colors.blue, '💻 Matando procesos Node.js en puerto 3000...');
    await executeCommand('lsof -ti:3000 | xargs kill -9 2>/dev/null || true');

    log(colors.blue, '💻 Matando procesos Python en puerto 5000...');
    await executeCommand('lsof -ti:5000 | xargs kill -9 2>/dev/null || true');
  }

  logSection('✅ Limpieza completada');
  log(colors.green, '✓ Puedes ejecutar: pnpm run dev');
}

cleanup().catch(console.error);
