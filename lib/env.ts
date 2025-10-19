/**
 * Este archivo centraliza la configuración de variables de entorno
 * para asegurarse de que se leen correctamente tanto en el cliente como en el servidor
 */

export const env = {
  // Aplicación
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Chat',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  appVersion: process.env.APP_VERSION || '1.0.0',

  // n8n configuración
  n8n: {
    baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
    webhookPath: process.env.N8N_WEBHOOK_PATH || '/webhook/rag-chat',
    apiKey: process.env.N8N_API_KEY || '',
    
    // Configuración para cliente o servidor
    useProd: process.env.NEXT_PUBLIC_N8N_USE_PROD === 'true' || process.env.N8N_USE_PROD === 'true',
    
    // URLs de webhooks para Gemini (predeterminado)
    prodWebhookUrl: process.env.NEXT_PUBLIC_N8N_PROD_WEBHOOK_URL || 
                   process.env.N8N_PROD_WEBHOOK_URL || 
                   'https://hooks.singularity.cyou/webhook/d6ac9b0e-d367-43a0-9953-6071ccc35cb7',
    testWebhookUrl: process.env.NEXT_PUBLIC_N8N_TEST_WEBHOOK_URL || 
                   process.env.N8N_TEST_WEBHOOK_URL || 
                   'https://flows.singularity.cyou/webhook-test/d6ac9b0e-d367-43a0-9953-6071ccc35cb7',
    
    // URLs de subida de archivos para Gemini
    prodFileUploadUrl: process.env.NEXT_PUBLIC_N8N_PROD_FILE_UPLOAD_URL || 
                      process.env.N8N_PROD_FILE_UPLOAD_URL || 
                      'https://hooks.singularity.cyou/form/82848bc4-5ea2-4e5a-8bb6-3c09b94a8c5d',
    testFileUploadUrl: process.env.NEXT_PUBLIC_N8N_TEST_FILE_UPLOAD_URL || 
                      process.env.N8N_TEST_FILE_UPLOAD_URL || 
                      'https://flows.singularity.cyou/form-test/82848bc4-5ea2-4e5a-8bb6-3c09b94a8c5d',
    
    // URLs de webhooks para OpenAI
    prodWebhookUrlOpenAI: process.env.N8N_PROD_WEBHOOK_URL_OPENAI || 
                       'https://hooks.singularity.cyou/webhook/08e3bc57-0bff-4d7a-ba05-197dad2e7a5e',
    testWebhookUrlOpenAI: process.env.N8N_TEST_WEBHOOK_URL_OPENAI || 
                       'https://flows.singularity.cyou/webhook-test/08e3bc57-0bff-4d7a-ba05-197dad2e7a5e',
    
    // URLs de subida de archivos para OpenAI
    prodFileUploadUrlOpenAI: process.env.N8N_PROD_FILE_UPLOAD_URL_OPENAI || 
                          'https://hooks.singularity.cyou/form/5e219549-758d-4451-865a-ac0da40cec40',
    testFileUploadUrlOpenAI: process.env.N8N_TEST_FILE_UPLOAD_URL_OPENAI || 
                          'https://flows.singularity.cyou/form-test/5e219549-758d-4451-865a-ac0da40cec40',
    
    // Obtener las URLs activas según la configuración y el modelo
    get activeWebhookUrl() {
      return this.useProd ? this.prodWebhookUrl : this.testWebhookUrl;
    },
    
    get activeFileUploadUrl() {
      return this.useProd ? this.prodFileUploadUrl : this.testFileUploadUrl;
    },
    
    getActiveWebhookUrl(model: 'gemini' | 'openai' = 'gemini') {
      if (model === 'openai') {
        return this.useProd ? this.prodWebhookUrlOpenAI : this.testWebhookUrlOpenAI;
      }
      return this.useProd ? this.prodWebhookUrl : this.testWebhookUrl;
    },
    
    getActiveFileUploadUrl(model: 'gemini' | 'openai' = 'gemini') {
      if (model === 'openai') {
        return this.useProd ? this.prodFileUploadUrlOpenAI : this.testFileUploadUrlOpenAI;
      }
      return this.useProd ? this.prodFileUploadUrl : this.testFileUploadUrl;
    }
  },
  
  // i18n configuración
  i18n: {
    defaultLocale: process.env.DEFAULT_LOCALE || 'es-ES',
    supportedLocales: (process.env.SUPPORTED_LOCALES || 'es-ES,en-US,es-CO').split(','),
  }
};