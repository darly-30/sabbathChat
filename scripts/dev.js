#!/usr/bin/env node

/**
 * Script para iniciar backend Python y frontend Next.js
 * 
 * Flujo:
 * 1. Inicia backend Python (localhost:5000)
 * 2. Espera hasta que esté listo
 * 3. Inicia frontend Next.js (localhost:3000)
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

// Colores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, ...args) {
  console.log(`${color}`, ...args, colors.reset);
}

function logSection(title) {
  console.log(
    `\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`
  );
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(
    `${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`
  );
}

/**
 * Verifica si el backend está disponible
 */
function checkBackendReady() {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 60; // 30 segundos de espera máximo
    
    const checkConnection = () => {
      attempts++;
      
      const req = http.get('http://localhost:5000/health', (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else if (attempts < maxAttempts) {
          setTimeout(checkConnection, 500);
        } else {
          resolve(false);
        }
      });

      req.on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(checkConnection, 500);
        } else {
          resolve(false);
        }
      });
      
      req.on('timeout', () => {
        req.destroy();
        if (attempts < maxAttempts) {
          setTimeout(checkConnection, 500);
        } else {
          resolve(false);
        }
      });
      
      req.setTimeout(1000);
    };

    checkConnection();
  });
}

/**
 * Inicia el backend Python
 */
function startBackend() {
  return new Promise((resolve, reject) => {
    logSection('🚀 Iniciando Backend Python...');

    const backendDir = path.join(__dirname, '..', 'backend');
    const python = process.platform === 'win32' ? 'python' : 'python3';

    log(colors.blue, `   Comando: ${python} app.py`);
    log(colors.blue, `   Directorio: ${backendDir}`);
    log(colors.blue, `   Puerto: 5000`);
    log(colors.blue, `   URL: http://localhost:5000\n`);

    // Usar shell: 'powershell.exe' en Windows para mejor manejo de rutas con espacios
    const backend = spawn(python, ['app.py'], {
      cwd: backendDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32' ? 'powershell.exe' : false,
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    let backendOutput = '';
    let backendError = '';
    let errorEncountered = false;

    backend.stdout.on('data', (data) => {
      const message = data.toString().trim();
      backendOutput += message + '\n';
      if (message) {
        log(colors.cyan, `   [BACKEND] ${message}`);
      }
    });

    backend.stderr.on('data', (data) => {
      const message = data.toString().trim();
      backendError += message + '\n';
      // Solo mostrar errores reales, no logs de Flask
      if (message && !message.includes('WARNING: This is a development server') && 
          !message.includes('Production WSGI server') &&
          !message.includes('Running on http://') &&
          !message.includes('Press CTRL+C') &&
          !message.includes('Restarting with') &&
          !message.includes('Debugger is active') &&
          !message.includes('Debugger PIN') &&
          !message.includes('HTTP/1.1')) {
        log(colors.red, `   [ERROR] ${message}`);
        // Detectar errores que impidan la ejecución
        if (message.includes("No module named") || message.includes("can't open file")) {
          errorEncountered = true;
        }
      }
    });

    backend.on('error', (error) => {
      log(colors.red, `   ❌ Error iniciando backend:`, error.message);
      log(colors.red, `   💡 Asegurate de que Python esté en PATH`);
      reject(error);
    });

    backend.on('exit', (code) => {
      if (code !== null && code !== 0 && !errorEncountered) {
        log(colors.yellow, `   ⚠️  Backend terminó con código ${code}`);
      }
    });

    // Dar tiempo para que el backend arranque
    setTimeout(() => {
      if (errorEncountered) {
        log(colors.red, '\n   ❌ Backend tuvo errores al iniciar. Verifica los logs arriba.');
        reject(new Error('Backend failed to start'));
        backend.kill();
        return;
      }

      log(colors.yellow, '   ⏳ Esperando a que el backend esté listo...\n');

      checkBackendReady()
        .then(() => {
          log(colors.green, '   ✅ Backend listo en http://localhost:5000\n');
          resolve(backend);
        })
        .catch((error) => {
          log(colors.red, '   ❌ No se pudo conectar al backend');
          log(colors.red, `   💡 Verifica que:`);
          log(colors.red, `      - backend/app.py exista`);
          log(colors.red, `      - Las dependencias estén instaladas: pip install -r backend/requirements.txt`);
          log(colors.red, `      - El puerto 5000 esté disponible`);
          if (backendError) {
            log(colors.red, `\n   Errores del backend:`);
            backendError.split('\n').forEach(line => {
              if (line.trim()) log(colors.red, `   ${line}`);
            });
          }
          reject(error);
          backend.kill();
        });
    }, 2000);
  });
}

/**
 * Inicia el frontend Next.js
 */
function startFrontend() {
  logSection('🎨 Iniciando Frontend Next.js...');

  log(colors.blue, `   Puerto: 3000`);
  log(colors.blue, `   URL: http://localhost:3000\n`);

  const frontend = spawn('npm', ['run', 'dev:frontend'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  frontend.stdout.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      log(colors.magenta, `   [FRONTEND] ${message}`);
    }
  });

  frontend.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      log(colors.yellow, `   [FRONTEND] ${message}`);
    }
  });

  frontend.on('error', (error) => {
    log(colors.red, `   ❌ Error iniciando frontend:`, error.message);
    process.exit(1);
  });

  return frontend;
}

/**
 * Main - Controla el flujo de inicio
 */
async function main() {
  try {
    logSection('🌟 Iniciando aplicación completa...');
    log(colors.magenta, '   Backend → Frontend\n');

    // Información de diagnóstico
    const backendDir = path.join(__dirname, '..', 'backend');
    const appPyPath = path.join(backendDir, 'app.py');
    const reqPath = path.join(backendDir, 'requirements.txt');
    
    log(colors.dim, `   ℹ️  Verificando archivos:`);
    
    const fs = require('fs');
    if (fs.existsSync(appPyPath)) {
      log(colors.green, `   ✓ backend/app.py existe`);
    } else {
      log(colors.red, `   ✗ backend/app.py NO existe`);
      throw new Error('backend/app.py no encontrado');
    }
    
    if (fs.existsSync(reqPath)) {
      log(colors.green, `   ✓ backend/requirements.txt existe`);
    } else {
      log(colors.yellow, `   ⚠️  backend/requirements.txt NO existe (podría necesitarse)`);
    }
    
    log(colors.dim, `   ℹ️  Platform: ${process.platform}`);
    log(colors.dim, `   ℹ️  Node: ${process.version}\n`);

    // Iniciar backend
    const backend = await startBackend();

    // Iniciar frontend
    const frontend = startFrontend();

    // Manejar salida de procesos
    process.on('SIGINT', () => {
      logSection('🛑 Deteniendo aplicación...');
      log(colors.yellow, '   Cerrando backend y frontend...');

      // Enviar señal de terminación suave
      if (backend) backend.kill('SIGTERM');
      if (frontend) frontend.kill('SIGTERM');

      // Esperar a que se cierren gracefully, luego forzar si es necesario
      setTimeout(() => {
        if (backend && !backend.killed) backend.kill('SIGKILL');
        if (frontend && !frontend.killed) frontend.kill('SIGKILL');
        
        setTimeout(() => {
          log(colors.green, '   ✅ Aplicación detenida\n');
          process.exit(0);
        }, 500);
      }, 2000);
    });

    // Manejar otras señales
    process.on('exit', () => {
      try {
        if (backend) backend.kill();
        if (frontend) frontend.kill();
      } catch (e) {
        // Ignorar errores al cerrar procesos
      }
    });

    logSection('✨ Aplicación completamente iniciada');
    log(colors.green, `   Backend:  http://localhost:5000`);
    log(colors.green, `   Frontend: http://localhost:3000\n`);
    log(colors.cyan, `   Presiona Ctrl+C para detener\n`);
  } catch (error) {
    log(colors.red, '❌ Error fatal:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main();
