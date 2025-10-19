'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { SourceViewProps } from '@/types/chat.types';

export function SourcesView({ sources, isOpen, onClose }: SourceViewProps) {
  const t = useTranslations('chat');
  
  if (!isOpen || !sources || sources.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium">{t('interface.viewSources')}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="h-5 w-5" />
            <span className="sr-only">{t('common.close')}</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-4">
            {sources.map((source: { title: string; url: string; snippet: string }, index: number) => (
              <li key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h4 className="font-medium mb-1">{source.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{source.snippet}</p>
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-500 hover:underline text-sm"
                >
                  {source.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
