import { n8nConfig } from './config';
import { 
  N8nRequestBody, 
  N8nResponseBody, 
  N8nFileUploadResponse, 
  N8nModel,
  SSEEvent 
} from './types';

export class N8nClient {
  private endpointUrl: string;
  private fileUploadUrl: string;
  private apiKey?: string;
  private model: N8nModel;

  constructor(model: N8nModel = 'gemini') {
    // Guardar el modelo seleccionado
    this.model = model;
    
    // Obtener las URLs según el modelo seleccionado
    this.endpointUrl = n8nConfig.getWebhookUrl(model);
    this.fileUploadUrl = n8nConfig.getFileUploadUrl(model);
    
    console.log(`Usando webhooks de ${n8nConfig.useProd ? 'PRODUCCIÓN' : 'PRUEBA'} para ${model}`, { 
      endpoint: this.endpointUrl, 
      fileUpload: this.fileUploadUrl 
    });
    
    this.apiKey = n8nConfig.apiKey;
  }

  async sendMessage(message: string, topK?: number, temperature?: number): Promise<N8nResponseBody> {
    const url = this.endpointUrl;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const body: N8nRequestBody = {
      chatInput: message,
      topK: topK ?? 5,
      temperature: temperature ?? 0.7,
      metadata: {
        source: 'webapp',
        appVersion: '1.0.0'
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const rawText = await response.text();
      console.log('Respuesta cruda de n8n:', rawText);

      if (!response.ok) {
        throw new Error(`N8n service error: ${response.status} ${rawText}`);
      }

      // Intentar parsear el JSON
      return JSON.parse(rawText);
    } catch (error) {
      console.error('Error calling n8n webhook:', error);
      throw error;
    }
  }

  async uploadFile(file: File): Promise<N8nFileUploadResponse> {
    console.log('N8nClient: Iniciando subida de archivo', file.name);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      console.log('N8nClient: FormData creado con el archivo', file.name);
      
      // Enviar a la URL de n8n para subida de archivos
      console.log('N8nClient: Enviando archivo a', this.fileUploadUrl);
      const response = await fetch(this.fileUploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      console.log('N8nClient: Respuesta recibida, status:', response.status);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('N8nClient: Datos recibidos:', data);
      
      return {
        success: true,
        fileUrl: data.fileUrl || data.url || data.downloadUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      };
    } catch (error) {
      console.error('Error uploading file to n8n:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during file upload',
      };
    }
  }
}
