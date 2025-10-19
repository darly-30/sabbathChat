// Tipado para el cliente SSE
interface StreamingMessage {
  type: 'message' | 'sources' | 'usage' | 'complete' | 'error';
  data: any;
}

// Tipado para los mensajes
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  sources?: {
    title: string;
    url: string;
    snippet: string;
  }[];
  usage?: {
    tokensInput: number;
    tokensOutput: number;
  };
}

// Tipado para las conversaciones
interface Conversation {
  id: string;
  title?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Tipado para la configuración de usuario
interface UserSettings {
  topK: number;
  temperature: number;
  language: string;
  theme: 'light' | 'dark' | 'system';
}
