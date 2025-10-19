/**
 * Configuración específica para Python Backend
 * Centraliza todas las URLs y endpoints del backend Python
 */

export const pythonConfig = {
  // URL base del backend Python
  baseUrl: process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:5000',
  
  // Endpoints específicos
  endpoints: {
    buildChatbot: '/build_chatbot',
    askChatbot: '/ask_chatbot'
  },
  
  /**
   * Obtiene la URL completa para construir un chatbot
   */
  getBuildChatbotUrl(): string {
    return `${this.baseUrl}${this.endpoints.buildChatbot}`;
  },
  
  /**
   * Obtiene la URL completa para hacer una pregunta a un chatbot específico
   */
  getAskChatbotUrl(chatbotId: string): string {
    return `${this.baseUrl}${this.endpoints.askChatbot}/${chatbotId}`;
  }
};
