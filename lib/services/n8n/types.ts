/**
 * Tipos específicos para n8n
 */

export type N8nModel = 'gemini' | 'openai';

export type N8nRequestBody = {
  chatInput: string;
  topK?: number;
  temperature?: number;
  history?: { role: 'USER' | 'ASSISTANT' | 'SYSTEM'; content: string }[];
  metadata?: Record<string, unknown>;
};

export type N8nSource = {
  title: string;
  url: string;
  snippet: string;
};

export type N8nUsage = {
  tokensInput: number;
  tokensOutput: number;
};

export type N8nResponseBody = {
  output: string;
  sources?: N8nSource[];
  usage?: N8nUsage;
};

export type N8nFileUploadResponse = {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  message?: string;
};

export type SSEEvent = {
  type: 'message' | 'sources' | 'usage' | 'complete' | 'error';
  data: any;
};

/**
 * Interfaz para almacenar la sesión de n8n
 * Se guarda en conversation.settings
 */
export type N8nSessionData = {
  model: 'gemini' | 'openai';
  uploadedAt: string;
};
