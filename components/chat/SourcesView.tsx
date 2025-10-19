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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">{t('interface.viewSources')}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-green-400 transition-colors">
            <X className="h-5 w-5" />
            <span className="sr-only">{t('common.close')}</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          <ul className="space-y-3">
            {sources.map((source: { title: string; url: string; snippet: string }, index: number) => (
              <li key={index} className="border border-zinc-800 rounded-lg p-4 bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                <h4 className="font-medium text-white mb-2">{source.title}</h4>
                <p className="text-sm text-zinc-400 mb-3 leading-relaxed">{source.snippet}</p>
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-green-400 hover:text-green-300 text-sm inline-flex items-center gap-1 transition-colors"
                >
                  <span>View source</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
