/**
 * Utilidades compartidas para los backends
 * Funciones comunes entre n8n y Python
 */

import { BackendType } from '@/lib/backend-config';
import { N8nSessionData } from './n8n/types';
import { PythonSessionData } from './python/types';

export type SessionData = N8nSessionData | PythonSessionData;

/**
 * Información de sesión unificada para cualquier backend
 */
export type UnifiedSessionData = {
  backend: BackendType;
  uploadedAt: string;
  // Datos específicos del backend
  n8nData?: N8nSessionData;
  pythonData?: PythonSessionData;
};

/**
 * Valida si hay una sesión válida para el backend
 */
export function isValidSession(sessionData: any, backend: BackendType): boolean {
  if (!sessionData) return false;
  
  if (backend === 'python') {
    // Python requiere un chatbotId
    return !!sessionData.chatbotId;
  }
  
  // n8n no requiere datos de sesión, siempre está listo
  return true;
}

/**
 * Obtiene los datos de sesión específicos del backend
 */
export function getSessionDataForBackend(
  sessionData: any, 
  backend: BackendType
): SessionData | null {
  if (!sessionData) return null;
  
  if (backend === 'python') {
    return {
      chatbotId: sessionData.chatbotId,
      fileName: sessionData.fileName,
      uploadedAt: sessionData.uploadedAt,
      fileSize: sessionData.fileSize,
      fileType: sessionData.fileType
    } as PythonSessionData;
  }
  
  return null;
}

/**
 * Formatea información de sesión para logging
 */
export function formatSessionInfo(backend: BackendType, sessionData: any): string {
  if (backend === 'python') {
    if (!sessionData?.chatbotId) {
      return '❌ Python: Sin sesión (no hay chatbot_id)';
    }
    return `✅ Python: Sesión activa (ID: ${sessionData.chatbotId.substring(0, 8)}...)`;
  }
  
  return `✅ n8n: Listo (sin sesión requerida)`;
}
