'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { CheckCircle } from 'lucide-react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import FileUpload from '@/components/upload/FileUpload';
import { Message, Conversation } from '@/types/chat.types';

// Force dynamic rendering to avoid static generation issues with next-intl
export const dynamic = 'force-dynamic';

// Initial messages for new conversations
const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant', 
  content: 'Bienvenido al chat de la escuela sabatica. ¿En qué puedo ayudarte hoy?' 
};

export default function ChatLayout() {
  const t = useTranslations('chat');
  const router = useRouter();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  // State for streaming messages
  const [streamingMessage, setStreamingMessage] = useState('');
  
  // State for model selection (gemini es el predeterminado)
  const [currentModel, setCurrentModel] = useState<'gemini' | 'openai'>('gemini');

  // Get app name from environment variable
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'MiChat';
  
  // Fetch conversations on component mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }
        
        const data = await response.json();
        setConversations(data);
        
        // If there are conversations, select the most recent one
        if (data.length > 0) {
          setActiveConversationId(data[0].id);
          await fetchMessages(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };
    
    fetchConversations();
  }, []);
  
  // Function to fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      if (data.length > 0) {
        setMessages(data);
      } else {
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([welcomeMessage]);
    }
  };
  
  // Function to create a new conversation
  const handleNewConversation = async () => {
    try {
      // Formato de fecha más corto y legible: DD/MM/YYYY, HH:MM
      const now = new Date();
      const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${formattedDate}`,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const newConversation = await response.json();
      
      setConversations([newConversation, ...conversations]);
      setActiveConversationId(newConversation.id);
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };
  
  // Function to select an existing conversation
  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    await fetchMessages(id);
  };
  
  // Function to delete a conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      
      // Remove from local state
      setConversations(conversations.filter(conv => conv.id !== id));
      
      // If the active conversation was deleted, select another one or create new
      if (activeConversationId === id) {
        if (conversations.length > 1) {
          const nextConversation = conversations.find(conv => conv.id !== id);
          if (nextConversation) {
            setActiveConversationId(nextConversation.id);
            await fetchMessages(nextConversation.id);
          } else {
            setActiveConversationId(null);
            setMessages([welcomeMessage]);
          }
        } else {
          setActiveConversationId(null);
          setMessages([welcomeMessage]);
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };
  
  // Function to send a message
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message to the chat
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: message,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingMessage('');
    
    try {
      // Create ID for assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      let messageContent = '';
      let messageSources: Array<{ title: string; url: string; snippet: string }> = [];
      
      // Add empty assistant message to show immediately
      setMessages((prev) => [...prev, {
        id: assistantMessageId,
        role: 'assistant' as const,
        content: ''
      }]);
      
      // If no active conversation, create one first
      let conversationId = activeConversationId;
      if (!conversationId) {
        try {
          const convResponse = await fetch('/api/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              // Formato de fecha más corto y legible: DD/MM/YYYY, HH:MM
              title: `${new Date().getDate().toString().padStart(2, '0')}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}, ${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`,
            }),
          });
          
          if (!convResponse.ok) {
            throw new Error('Failed to create conversation');
          }
          
          const newConversation = await convResponse.json();
          setConversations([newConversation, ...conversations]);
          setActiveConversationId(newConversation.id);
          conversationId = newConversation.id;
        } catch (error) {
          console.error('Error creating conversation:', error);
          return;
        }
      }
      
      // Configure EventSource for SSE - Use POST directly instead of GET with query params
      // Import getActiveBackend to send backend info to server
      const { getActiveBackend } = await import('@/lib/backend-config');
      const activeBackend = getActiveBackend();
      
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId,
          model: currentModel, // Incluir el modelo seleccionado
          activeBackend, // Incluir el backend activo
          settings: { topK: 5, temperature: 0.7 }
        })
      });
      
      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Set up the reader for the response body stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          try {
            const eventData = line.replace('data: ', '');
            const parsedData = JSON.parse(eventData);
            
            if (parsedData.type === 'message') {
              messageContent += parsedData.data.content;
              setStreamingMessage(messageContent);
              
              // Update messages
              setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages];
                const assistantMessageIndex = updatedMessages.findIndex(m => m.id === assistantMessageId);
                
                if (assistantMessageIndex >= 0) {
                  updatedMessages[assistantMessageIndex] = {
                    ...updatedMessages[assistantMessageIndex],
                    content: messageContent
                  };
                }
                
                return updatedMessages;
              });
            } else if (parsedData.type === 'sources' && parsedData.data.sources) {
              messageSources = parsedData.data.sources;
              
              // Update messages with sources
              setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages];
                const assistantMessageIndex = updatedMessages.findIndex(m => m.id === assistantMessageId);
                
                if (assistantMessageIndex >= 0) {
                  updatedMessages[assistantMessageIndex] = {
                    ...updatedMessages[assistantMessageIndex],
                    content: messageContent,
                    sources: messageSources
                  };
                }
                
                return updatedMessages;
              });
            } else if (parsedData.type === 'complete') {
              setIsLoading(false);
            } else if (parsedData.type === 'error') {
              console.error('Error from SSE:', parsedData.data);
              setIsLoading(false);
              
              // Mostrar mensaje de error y sugerir cargar archivo si es necesario
              const errorMessage = parsedData.data.message || 'Error desconocido';
              const errorCode = parsedData.data.code;
              
              setMessages((prev) => {
                const updatedMessages = [...prev];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                
                // Si el último mensaje es el del asistente que estaba vacío, lo reemplazamos con el error
                if (lastMessage && lastMessage.role === 'assistant' && lastMessage.id === assistantMessageId && lastMessage.content === '') {
                  updatedMessages[updatedMessages.length - 1] = {
                    ...lastMessage,
                    content: `❌ ${errorMessage}`
                  };
                } else {
                  updatedMessages.push({
                    id: `error-${Date.now()}`,
                    role: 'assistant' as const,
                    content: `❌ ${errorMessage}`
                  });
                }
                
                return updatedMessages;
              });
              
              // Si es error de archivo no cargado, mostrar notificación para cargar
              if (errorCode === 'PYTHON_FILE_REQUIRED') {
                showTemporaryNotification(t('FileUpload.uploadRequired') || 'Por favor, carga un archivo primero');
              }
            }
          } catch (e) {
            console.error('Error parsing SSE message:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      
      // Show error to the user
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant' as const,
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.'
      }]);
    }
  };
  
  // Set up modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  // Notificaciones
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // Función para mostrar una notificación temporal
  const showTemporaryNotification = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    
    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      {/* Sidebar - hidden on small screens by default */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:w-64 flex-shrink-0`}>
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onShowFileUpload={() => setShowFileUpload(true)}
          currentModel={currentModel}
        />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatHeader
          title={appName}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          currentModel={currentModel}
          onModelChange={(model) => setCurrentModel(model)}
        />
        
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          currentModel={currentModel}
          conversationId={activeConversationId || undefined}
        />
      </div>

      {/* Settings Modal - can be implemented later if needed */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t('settings.title')}</h2>
            {/* Settings content would go here */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md"
              >
                {t('settings.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t('interface.uploadFile')}</h2>
            <div className="mt-2 mb-4">
              <FileUpload 
                model={currentModel}
                conversationId={activeConversationId || undefined}
                onUploadComplete={(fileData: any) => {
                  console.log("ChatPage: Archivo subido correctamente", fileData);
                  setShowFileUpload(false);
                  // Mostrar notificación
                  showTemporaryNotification("Archivo subido correctamente");
                }}
                onError={(error: any) => {
                  console.error('ChatPage: Error uploading file:', error);
                  setShowFileUpload(false);
                  showTemporaryNotification("Error al subir el archivo");
                }}
              />
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowFileUpload(false)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors"
              >
                {t('settings.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificación pop-up */}
      {showNotification && (
        <div className="fixed top-16 right-4 z-50 flex items-center p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400 animate-fade-in-out">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span className="font-medium">{notificationMessage}</span>
        </div>
      )}
    </div>
  );
}
