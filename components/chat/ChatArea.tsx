'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, PaperclipIcon, CheckCircle } from 'lucide-react';
import { ChatInput } from './ChatInput';
import { SourcesView } from './SourcesView';
import { ChatAreaProps, Message } from '@/types/chat.types';
import FileUpload from '@/components/upload/FileUpload';
import { Button } from '@/components/ui/button';

export function ChatArea({ messages, isLoading, onSendMessage, currentModel = 'gemini', conversationId }: ChatAreaProps) {
  const t = useTranslations('chat');
  const [showSources, setShowSources] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [activeSources, setActiveSources] = useState<Array<{ title: string; url: string; snippet: string }>>([]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  // Scroll to the bottom of the message list when messages change or a new message arrives
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle click on "View Sources" button
  const handleViewSources = (sources: Array<{ title: string; url: string; snippet: string }>) => {
    setActiveSources(sources);
    setShowSources(true);
  };
  
  // Handler to close file upload when clicking outside
  useEffect(() => {
    if (showFileUpload) {
      const handleClickOutside = (event: MouseEvent) => {
        // Check if the click is outside the file upload component
        const fileUploadEl = document.getElementById('file-upload-container');
        const uploadButtonEl = document.getElementById('upload-button');
        
        if (fileUploadEl && uploadButtonEl && 
            !fileUploadEl.contains(event.target as Node) && 
            !uploadButtonEl.contains(event.target as Node)) {
          setShowFileUpload(false);
        }
      };
      
      // Add event listener
      document.addEventListener('mousedown', handleClickOutside);
      
      // Clean up
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showFileUpload]);
  
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
    <div className="flex flex-col h-full bg-black">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                <svg className="w-10 h-10 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <p className="text-zinc-400 text-center">
                {t('sidebar.noConversations')}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              data-testid={message.role === 'user' ? 'message-user' : 'message-assistant'}
              className={`flex flex-col ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-green-400 to-green-500 text-black font-medium shadow-lg shadow-green-500/30'
                    : 'bg-zinc-800/50 border border-zinc-700 text-white'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
              
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2">
                  <button
                    data-testid="view-sources"
                    onClick={() => handleViewSources(message.sources || [])}
                    className="inline-flex items-center text-sm text-green-400 hover:text-green-300 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {t('interface.viewSources')}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div data-testid="message-assistant" className="flex flex-col items-start">
            <div className="max-w-3xl rounded-lg px-4 py-3 bg-zinc-800/50 border border-zinc-700 text-white">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse delay-300"></div>
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse delay-600"></div>
                <span className="ml-2">{t('interface.typing')}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* This div is used to scroll to the bottom */}
        <div ref={endOfMessagesRef} />
      </div>
      
      <div className="relative">
        {showFileUpload && (
          <div 
            id="file-upload-container"
            className="absolute bottom-full w-full p-4 bg-zinc-900 border-t border-zinc-800 rounded-t-lg shadow-xl"
          >
            <FileUpload 
              model={currentModel}
              conversationId={conversationId}
              onUploadComplete={(fileData) => {
                console.log("ChatArea: Archivo subido correctamente", fileData);
                console.log("ChatArea: Conversación ID:", conversationId);
                console.log("ChatArea: fileId/chatbotId recibido:", fileData?.fileId || fileData?.chatbot_id);
                setShowFileUpload(false);
                // Mostrar notificación en lugar de enviar un mensaje
                showTemporaryNotification(t('FileUpload.uploadSuccess'));
              }} 
              onError={(error) => {
                console.error('ChatArea: Error uploading file:', error);
                setShowFileUpload(false);
                showTemporaryNotification(t('FileUpload.uploadError'));
              }} 
            />
          </div>
        )}

        <div className="flex items-center border-t border-zinc-800 p-2 bg-black/50">
          <div className="flex-1">
            <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>
      
      <SourcesView
        sources={activeSources}
        isOpen={showSources}
        onClose={() => setShowSources(false)}
      />
      
      {/* Notificación pop-up */}
      {showNotification && (
        <div className="fixed top-16 right-4 z-50 flex items-center p-4 mb-4 text-sm text-black rounded-lg bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/50 animate-fade-in-out">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span className="font-semibold">{notificationMessage}</span>
        </div>
      )}
    </div>
  );
}
