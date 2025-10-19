import { pythonConfig } from './config';
import { 
  PythonResponseBody, 
  PythonFileUploadResponse,
  PythonSource,
  PythonSessionData
} from './types';

export class PythonClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = pythonConfig.baseUrl;
  }

  async sendMessage(chatbotId: string, message: string): Promise<PythonResponseBody> {
    const url = pythonConfig.getAskChatbotUrl(chatbotId);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: message }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python backend error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      // Extraer información de las fuentes (páginas) del texto de respuesta
      let answer = data.answer;
      let sources = [];
      
      // Buscar información de páginas si existe
      const pageInfoMatch = answer.match(/The information is in pages: ([\d,\s]+)$/);
      if (pageInfoMatch) {
        const pages = pageInfoMatch[1].split(',').map((page: string) => page.trim());
        
        // Eliminar la línea de información de páginas de la respuesta
        answer = answer.replace(/The information is in pages: [\d,\s]+$/, '').trim();
        
        // Crear fuentes a partir de las páginas
        sources = pages.map((page: string) => ({
          title: `Page ${page}`,
          url: `#page=${page}`,
          snippet: `Content from page ${page}`,
          page: page
        }));
      }
      
      return {
        answer: answer,
        sources: sources.length > 0 ? sources : undefined
      };
    } catch (error) {
      console.error('Error calling Python backend:', error);
      throw error;
    }
  }

  async uploadFile(file: File): Promise<PythonFileUploadResponse> {
    console.log('PythonClient: Iniciando subida de archivo', file.name);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Enviar a la URL del backend Python para subida de archivos
      const url = pythonConfig.getBuildChatbotUrl();
      console.log('PythonClient: Enviando archivo a', url);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      console.log('PythonClient: Respuesta recibida, status:', response.status);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('PythonClient: Datos recibidos:', data);
      
      return {
        success: true,
        chatbot_id: data.chatbot_id,
      };
    } catch (error) {
      console.error('Error uploading file to Python backend:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during file upload',
      };
    }
  }
}
