/**
 * Tipos específicos para Python Backend
 */

export type PythonSource = {
  title: string;
  url: string;
  snippet: string;
  page?: string;
};

export type PythonResponseBody = {
  answer: string;
  sources?: PythonSource[];
};

export type PythonFileUploadResponse = {
  success: boolean;
  chatbot_id?: string;
  message?: string;
};

/**
 * Interfaz para almacenar la sesión de Python
 * Se guarda en conversation.settings
 */
export type PythonSessionData = {
  chatbotId: string;
  fileName: string;
  uploadedAt: string;
  fileSize: number;
  fileType: string;
};
