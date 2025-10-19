import { BackendType, getActiveBackend, logActiveBackend } from '@/lib/backend-config';
import { N8nClient, N8nResponseBody, N8nFileUploadResponse } from '@/lib/services/n8n';
import { PythonClient, PythonResponseBody, PythonFileUploadResponse } from '@/lib/services/python';

// Interfaz unificada para respuestas de los backends
export interface BackendResponse {
  output: string;
  sources?: {
    title: string;
    url: string;
    snippet: string;
    page?: string;
  }[];
  usage?: {
    tokensInput: number;
    tokensOutput: number;
  };
}

// Interfaz unificada para respuestas de subida de archivos
export interface FileUploadResponse {
  success: boolean;
  fileUrl?: string;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  message?: string;
}

/**
 * Servicio unificado para interactuar con los diferentes backends (n8n o Python)
 */
export class BackendService {
  private activeBackend: BackendType;
  private n8nClient: N8nClient | null = null;
  private pythonClient: PythonClient | null = null;
  private model: 'gemini' | 'openai';

  constructor(model: 'gemini' | 'openai' = 'gemini', backend?: BackendType) {
    // Use the explicitly passed backend type if provided, otherwise use the detected one
    this.activeBackend = backend || getActiveBackend();
    this.model = model;
  }

  /**
   * Envía un mensaje al backend activo
   */
  async sendMessage(
    message: string, 
    topK?: number, 
    temperature?: number, 
    chatbotId?: string
  ): Promise<BackendResponse> {
    logActiveBackend();
    
    console.log(`%c📨 Enviando mensaje al backend: ${this.activeBackend}`, 'color: #0099CC; font-weight: bold;');
    console.log(`%cMensaje: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`, 'color: #666;');
    console.log(`%c🔑 ChatbotId recibido: ${chatbotId || 'UNDEFINED'}`, `color: ${chatbotId ? '#00AA00' : '#FF0000'}; font-weight: bold;`);
    
    if (this.activeBackend === 'n8n') {
      console.log('%c→ Usando N8n Client', 'color: #00AA00; font-weight: bold;');
      if (!this.n8nClient) {
        this.n8nClient = new N8nClient(this.model);
      }
      const response = await this.n8nClient.sendMessage(message, topK, temperature);
      console.log('%c✅ Respuesta recibida de N8n', 'color: #00AA00;');
      return this.mapN8nResponseToBackendResponse(response);
    } else if (this.activeBackend === 'python') {
      console.log('%b→ Usando Python Client', 'color: #0099CC; font-weight: bold;');
      if (!this.pythonClient) {
        this.pythonClient = new PythonClient();
      }
      
      if (!chatbotId) {
        const errorMsg = 'Para usar el backend Python, primero debes cargar un archivo PDF. Por favor, usa el botón de carga de archivos para subir tu documento.';
        console.error('%c❌ Error: ' + errorMsg, 'color: #FF0000; font-weight: bold;');
        console.error('%c⚠️ ChatbotId es undefined o vacío', 'color: #FF6600; font-weight: bold;');
        throw new Error(errorMsg);
      }
      
      console.log(`%c✅ ChatbotId válido, enviando a Python Backend: ${chatbotId}`, 'color: #00AA00; font-weight: bold;');
      const response = await this.pythonClient.sendMessage(chatbotId, message);
      console.log('%c✅ Respuesta recibida de Python', 'color: #0099CC;');
      return this.mapPythonResponseToBackendResponse(response);
    } else {
      throw new Error(`Backend desconocido: ${this.activeBackend}`);
    }
  }

  /**
   * Sube un archivo al backend activo
   */
  async uploadFile(file: File): Promise<FileUploadResponse> {
    logActiveBackend();
    
    console.log(`%c📤 Subiendo archivo al backend: ${this.activeBackend}`, 'color: #0099CC; font-weight: bold;');
    console.log(`%cArchivo: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, 'color: #666;');
    
    if (this.activeBackend === 'n8n') {
      console.log('%c→ Usando N8n Client', 'color: #00AA00; font-weight: bold;');
      if (!this.n8nClient) {
        this.n8nClient = new N8nClient(this.model);
      }
      const response = await this.n8nClient.uploadFile(file);
      console.log('%c✅ Archivo subido a N8n', 'color: #00AA00;');
      return this.mapN8nUploadToFileUploadResponse(response);
    } else if (this.activeBackend === 'python') {
      console.log('%c→ Usando Python Client', 'color: #0099CC; font-weight: bold;');
      if (!this.pythonClient) {
        this.pythonClient = new PythonClient();
      }
      const response = await this.pythonClient.uploadFile(file);
      console.log('%c✅ Archivo subido a Python', 'color: #0099CC;');
      return this.mapPythonUploadToFileUploadResponse(response);
    } else {
      throw new Error(`Backend desconocido: ${this.activeBackend}`);
    }
  }

  /**
   * Mapea la respuesta de n8n al formato unificado
   */
  private mapN8nResponseToBackendResponse(response: N8nResponseBody): BackendResponse {
    return {
      output: response.output,
      sources: response.sources,
      usage: response.usage
    };
  }

  /**
   * Mapea la respuesta de Python al formato unificado
   */
  private mapPythonResponseToBackendResponse(response: PythonResponseBody): BackendResponse {
    return {
      output: response.answer,
      sources: response.sources
    };
  }

  /**
   * Mapea la respuesta de subida de n8n al formato unificado
   */
  private mapN8nUploadToFileUploadResponse(response: N8nFileUploadResponse): FileUploadResponse {
    return {
      success: response.success,
      fileUrl: response.fileUrl,
      fileName: response.fileName,
      fileSize: response.fileSize,
      fileType: response.fileType,
      message: response.message
    };
  }

  /**
   * Mapea la respuesta de subida de Python al formato unificado
   */
  private mapPythonUploadToFileUploadResponse(response: PythonFileUploadResponse): FileUploadResponse {
    return {
      success: response.success,
      fileId: response.chatbot_id,
      message: response.message
    };
  }

  /**
   * Obtiene el tipo de backend activo
   */
  getActiveBackend(): BackendType {
    return this.activeBackend;
  }

  /**
   * Cambia el tipo de backend activo
   */
  setActiveBackend(backend: BackendType): void {
    this.activeBackend = backend;
  }
}