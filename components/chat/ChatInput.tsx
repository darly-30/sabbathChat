'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SendIcon } from 'lucide-react';
import { ChatInputProps } from '@/types/chat.types';

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const t = useTranslations('chat.interface');
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <textarea
        ref={textareaRef}
        data-testid="chat-input"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('placeholder')}
        className="w-full px-4 py-3 pr-12 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 bg-zinc-800/50 text-white placeholder:text-zinc-500 resize-none scrollbar-hide transition-all"
        rows={1}
        maxLength={4000}
        disabled={isLoading}
      />
      <button
        type="submit"
        data-testid="send-button"
        disabled={!message.trim() || isLoading}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-md text-zinc-500 hover:text-green-400 hover:bg-green-400/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SendIcon className="h-5 w-5" />
        <span className="sr-only">{t('send')}</span>
      </button>
    </form>
  );
}
