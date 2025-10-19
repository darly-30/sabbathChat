'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquarePlus, PaperclipIcon, Trash2, MoreVertical } from 'lucide-react';
import { ConversationSidebarProps } from '@/types/chat.types';

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onShowFileUpload,
  currentModel,
}: ConversationSidebarProps) {
  const t = useTranslations('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Format conversation title to ensure date and time are fully visible
  const formatConversationTitle = (title: string) => {
    // Split the title if it contains a date-like format
    if (title.includes('Conversación')) {
      const parts = title.split('Conversación ');
      if (parts.length > 1) {
        // Format the date part to be more readable
        return parts[1];
      }
    }
    return title;
  };

  // Filter conversations based on search query
  const filteredConversations = searchQuery
    ? conversations.filter((conv) =>
        (conv.title || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <div className="w-64 h-full border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* New conversation button */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          data-testid="new-conversation"
          onClick={onNewConversation}
          className="flex items-center justify-center gap-2 w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors mb-2"
        >
          <MessageSquarePlus className="h-5 w-5" />
          <span>{t('interface.newConversation')}</span>
        </button>
        
        {/* Botón de subida de archivos */}
        {onShowFileUpload && (
          <button
            onClick={onShowFileUpload}
            className="flex items-center justify-center gap-2 w-full p-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors"
          >
            <PaperclipIcon className="h-5 w-5" />
            <span>{t('interface.uploadFile')}</span>
          </button>
        )}
      </div>
      
      {/* Search input */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          data-testid="sidebar-search"
          placeholder={t('sidebar.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      
      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 px-2">
          {t('sidebar.conversations')}
        </h2>
        
        {filteredConversations.length > 0 ? (
          <ul className="space-y-1">
            {filteredConversations.map((conversation) => (
              <li key={conversation.id} className="relative">
                <div className={`w-full p-2 rounded-md flex items-start justify-between ${
                  activeConversationId === conversation.id
                    ? 'bg-gray-200 dark:bg-gray-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                  <button
                    onClick={() => onSelectConversation(conversation.id)}
                    className="flex-grow text-left text-sm overflow-hidden mr-1"
                  >
                    <div className="w-full">
                      <span className="block text-gray-900 dark:text-gray-50 text-xs whitespace-normal leading-relaxed">
                        {formatConversationTitle(conversation.title || 'Untitled conversation')}
                      </span>
                    </div>
                  </button>
                  
                  <button 
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeleteConversation) {
                        onDeleteConversation(conversation.id);
                      }
                    }}
                    title={t('sidebar.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  {/* Eliminado el menú desplegable ya que ahora mostramos el botón de eliminar directamente */}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 p-2">
            {searchQuery ? 'No conversations found' : t('sidebar.noConversations')}
          </p>
        )}
      </div>
    </div>
  );
}
