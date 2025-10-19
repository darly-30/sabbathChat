/**
 * Este archivo maneja la configuración del backend a utilizar: Python o n8n
 * Las configuraciones específicas están en cada carpeta (n8n/config.ts, python/config.ts)
 */

export type BackendType = 'python' | 'n8n';

export const backendConfig = {
  activeBackend: process.env.NEXT_PUBLIC_ACTIVE_BACKEND as BackendType || 'n8n'
};

/**
 * Función para cambiar el backend activo
 * Notifica al usuario del cambio y guarda en localStorage
 */
export function setActiveBackend(backend: BackendType): void {
  if (typeof window !== 'undefined') {
    const previousBackend = localStorage.getItem('activeBackend') as BackendType;
    localStorage.setItem('activeBackend', backend);
    
    // Log del cambio
    console.log(`%c🔄 CAMBIO DE BACKEND`, 'color: #FF6B00; font-weight: bold; font-size: 14px;');
    console.log(`%cBackend anterior: ${previousBackend || backendConfig.activeBackend}`, 'color: #FFA500;');
    console.log(`%cBackend nuevo: ${backend}`, 'color: #00AA00; font-weight: bold;');
    console.log(`%cTimestamp: ${new Date().toLocaleTimeString()}`, 'color: #0099CC;');
    
    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('backendChanged', { detail: { backend } }));
  }
}

/**
 * Función para obtener el backend activo
 * Primero revisa localStorage, luego fallback a variable de entorno
 */
export function getActiveBackend(): BackendType {
  if (typeof window !== 'undefined') {
    const savedBackend = localStorage.getItem('activeBackend') as BackendType;
    if (savedBackend && ['python', 'n8n'].includes(savedBackend)) {
      return savedBackend;
    }
  }
  return backendConfig.activeBackend;
}

/**
 * Función para loguear el backend activo
 */
export function logActiveBackend(): void {
  if (typeof window !== 'undefined') {
    const activeBackend = getActiveBackend();
    console.log(
      `%c✅ Backend activo: ${activeBackend}`, 
      `color: ${activeBackend === 'python' ? '#0099CC' : '#00AA00'}; font-weight: bold;`
    );
  }
}