'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { ChatHeaderProps } from '@/types/chat.types';
import { signOut, useSession } from 'next-auth/react';
import BackendSelector from '@/components/ui/BackendSelector';
import { getActiveBackend } from '@/lib/backend-config';

export function ChatHeader({ 
  title, 
  onToggleSidebar, 
  onOpenSettings, 
  currentModel = 'gemini', 
  onModelChange 
}: ChatHeaderProps) {
  const t = useTranslations('chat');
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [activeBackend, setActiveBackend] = useState<'n8n' | 'python'>('n8n');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Actualizar el backend activo cuando cambie
  useEffect(() => {
    const backend = getActiveBackend();
    setActiveBackend(backend);
  }, []);

  // Escuchar cambios en localStorage para el backend
  useEffect(() => {
    const handleStorageChange = () => {
      const backend = getActiveBackend();
      setActiveBackend(backend);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // También escuchar cambios en el backend usando un intervalo
    const interval = setInterval(() => {
      const backend = getActiveBackend();
      setActiveBackend(backend);
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  // Handle logout
  const handleLogout = async () => {
    setShowDropdown(false);
    // Use the current locale from the URL for the redirect
    const locale = window.location.pathname.split('/')[1];
    await signOut({ callbackUrl: `/${locale}/login` });
  };

  // Solo mostrar el selector de modelo si el backend es n8n
  const canChangeModel = activeBackend === 'n8n';
  
  return (
    <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm sticky top-0 z-10 shadow-lg shadow-black/50">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-green-400 transition-colors mr-2 lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </button>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          
          {/* Selector de modelo - Solo visible cuando se usa n8n */}
          {onModelChange && canChangeModel && (
            <div className="relative ml-4" ref={modelDropdownRef}>
              <button 
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-colors"
              >
                <span className="mr-1">{currentModel === 'gemini' ? t('settings.modelGemini') : t('settings.modelOpenAI')}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showModelDropdown && (
                <div className="absolute left-0 mt-2 w-32 bg-zinc-800 rounded-lg shadow-xl py-1 z-10 border border-zinc-700">
                  <button
                    onClick={() => {
                      if (onModelChange) onModelChange('gemini');
                      setShowModelDropdown(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      currentModel === 'gemini' 
                        ? 'bg-green-500/20 text-green-400 font-medium' 
                        : 'text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {t('settings.modelGemini')}
                  </button>
                  <button
                    onClick={() => {
                      if (onModelChange) onModelChange('openai');
                      setShowModelDropdown(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      currentModel === 'openai' 
                        ? 'bg-green-500/20 text-green-400 font-medium' 
                        : 'text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {t('settings.modelOpenAI')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selector de modelo deshabilitado cuando se usa Python */}
          {onModelChange && !canChangeModel && (
            <div className="ml-4">
              <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-zinc-800/50 border border-zinc-800 text-zinc-500 cursor-not-allowed opacity-50">
                <span className="mr-1">{currentModel === 'gemini' ? t('settings.modelGemini') : t('settings.modelOpenAI')}</span>
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          )}
          
          {/* Selector de Backend */}
          <div className="ml-4">
            <BackendSelector />
          </div>
        </div>
        
        <div className="flex items-center">
          {session?.user && (
            <div className="mr-4 flex items-center px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-800">
              <User className="h-4 w-4 mr-2 text-green-400" />
              <span className="text-sm font-medium text-zinc-300">
                {session.user.name || session.user.email}
              </span>
            </div>
          )}
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-green-400 transition-colors"
              data-testid="settings-button"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">{t('settings.title')}</span>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-zinc-800 rounded-lg shadow-xl py-1 z-10 border border-zinc-700">
                <button
                  onClick={onOpenSettings}
                  className="block w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-green-400 transition-colors"
                >
                  {t('settings.title')}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-red-400 transition-colors items-center"
                  data-testid="logout-button"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('settings.logout') || 'Cerrar sesión'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
