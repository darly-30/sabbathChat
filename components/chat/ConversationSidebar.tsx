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
    <div className="w-64 h-full border-r border-zinc-800 flex flex-col bg-zinc-900/95 backdrop-blur-sm">
      {/* New conversation button */}
      <div className="p-3 border-b border-zinc-800">
        <button
          data-testid="new-conversation"
          onClick={onNewConversation}
          className="flex items-center justify-center gap-2 w-full p-3 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-black font-semibold rounded-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-200 mb-2"
        >
          <MessageSquarePlus className="h-5 w-5" />
          <span>{t('interface.newConversation')}</span>
        </button>
        
        {/* Botón de subida de archivos */}
        {onShowFileUpload && (
          <button
            onClick={onShowFileUpload}
            className="flex items-center justify-center gap-2 w-full p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg transition-all duration-200"
          >
            <PaperclipIcon className="h-5 w-5" />
            <span>{t('interface.uploadFile')}</span>
          </button>
        )}
      </div>
      
      {/* Search input */}
      <div className="p-3 border-b border-zinc-800">
        <input
          type="text"
          data-testid="sidebar-search"
          placeholder={t('sidebar.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-zinc-700 rounded-lg bg-zinc-800/50 text-white placeholder:text-zinc-500 focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
        />
      </div>
      
      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 px-2">
          {t('sidebar.conversations')}
        </h2>
        
        {filteredConversations.length > 0 ? (
          <ul className="space-y-1">
            {filteredConversations.map((conversation) => (
              <li key={conversation.id} className="relative">
                <div className={`w-full p-2 rounded-lg flex items-start justify-between transition-all duration-200 ${
                  activeConversationId === conversation.id
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'hover:bg-zinc-800 border border-transparent'
                }`}>
                  <button
                    onClick={() => onSelectConversation(conversation.id)}
                    className="flex-grow text-left text-sm overflow-hidden mr-1"
                  >
                    <div className="w-full">
                      <span className={`block text-xs whitespace-normal leading-relaxed ${
                        activeConversationId === conversation.id
                          ? 'text-green-400 font-medium'
                          : 'text-zinc-300'
                      }`}>
                        {formatConversationTitle(conversation.title || 'Untitled conversation')}
                      </span>
                    </div>
                  </button>
                  
                  <button 
                    className="p-1 text-zinc-500 hover:text-red-400 flex-shrink-0 transition-colors"
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
          <p className="text-sm text-zinc-500 p-2">
            {searchQuery ? 'No conversations found' : t('sidebar.noConversations')}
          </p>
        )}
      </div>
    </div>
  );
}
