'use client';

import { useState, useEffect, useRef } from 'react';
import { BackendType, getActiveBackend, setActiveBackend } from '@/lib/backend-config';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

export default function BackendSelector() {
  const [selectedBackend, setSelectedBackend] = useState<BackendType>('n8n');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Cargar el backend seleccionado al iniciar
    const activeBackend = getActiveBackend();
    setSelectedBackend(activeBackend);
    
    console.log('%c🚀 BackendSelector inicializado', 'color: #9C27B0; font-weight: bold; font-size: 12px;');
    console.log(`%cBackend activo: ${activeBackend}`, 'color: #9C27B0; font-size: 12px;');
  }, []);

  // Cerrar dropdown cuando se haga click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBackendChange = (backend: BackendType) => {
    if (backend === selectedBackend) {
      console.log(`%c⚠️  El backend ${backend} ya estaba seleccionado`, 'color: #FF9800; font-weight: bold;');
      setShowDropdown(false);
      return;
    }
    
    setSelectedBackend(backend);
    setActiveBackend(backend);
    setShowDropdown(false);
    
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #FF6B00;');
    console.log(
      `%c🔄 CAMBIO DE BACKEND EN LA UI`,
      'color: #FF6B00; font-weight: bold; font-size: 13px;'
    );
    console.log(`%cNuevo backend seleccionado: ${backend.toUpperCase()}`, 'color: #FFB74D; font-weight: bold; font-size: 12px;');
    console.log(`%cTiempo: ${new Date().toLocaleTimeString()}`, 'color: #0099CC; font-size: 11px;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #FF6B00;');
    
    // Refrescar la página para aplicar los cambios
    router.refresh();
  };

  const getBackendLabel = (backend: BackendType): string => {
    return backend === 'n8n' ? 'n8n' : 'Python';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center px-3 py-1 text-sm font-medium rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors"
      >
        <span className="mr-1">{getBackendLabel(selectedBackend)}</span>
        <ChevronDown className="h-4 w-4" />
      </button>
      
      {showDropdown && (
        <div className="absolute left-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleBackendChange('n8n')}
            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
              selectedBackend === 'n8n' 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            n8n
          </button>
          <button
            onClick={() => handleBackendChange('python')}
            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
              selectedBackend === 'python' 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Python
          </button>
        </div>
      )}
    </div>
  );
}